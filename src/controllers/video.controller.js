import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  //TODO: get all videos based on query, sort, pagination
  const pipelineStr = [];

  if (!userId) {
    throw new ApiError(400, "User Id not provided");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  if (userId) {
    pipelineStr.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }
  if (query) {
    pipelineStr.push({
      $match: {
        title: {
          $regex: query,
          $options: "i",
        },
      },
    });
  }

  pipelineStr.push({
    $match: {
      isPublished: true,
    },
  });

  if (sortBy && sortType) {
    pipelineStr.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipelineStr.push({ $sort: { createdAt: -1 } });
  }

  pipelineStr.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$ownerDetails" }
  );
  const videoAgg = await Video.aggregate(pipelineStr);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAgg, options);
  console.log(video);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched successfully"));

  // {{server}}/videos?page=2&limit=6&query=cats&sortBy=views&sortType=desc&userId=6641a51fc596d975eef655cc
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const user = req.user;
  console.log(req.params);

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  if (!title || !description) {
    throw new ApiError(400, "title or description missing");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "either video or thumbnail path missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!thumbnail || !videoFile) {
    throw new ApiError(400, "video or thumbnail in cloudniary missing ");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: user._id,
  });
  return res.status(200).json(new ApiResponse(200, video, "video published"));

  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video field empty");
  }

  const videoCheck = await Video.findById(videoId);

  if (!videoCheck) {
    throw new ApiError(400, "video id not found");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(500, "failed to fetch video");
  }

  // increment views if video fetched successfully
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  // add this video to user watch history
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { video },
        "video details fetched properly fetched success"
      )
    );
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "title or description missing");
  }

  if (!videoId) {
    throw new ApiError(400, "video id missing");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video missing");
  }

  const delVideo = await Video.findById(videoId);
  await deleteFromCloudinary(delVideo.thumbnail);

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail file is missing");
  }

  const thumbnailNew = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnailNew) {
    throw new ApiError(400, "not uploaded on cloud");
  }

  const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { title, description, thumbnail: thumbnailNew.url },
    },
    { new: true }
  );
  if (!updateVideo) {
    throw new ApiError(404, "Failed To Update Video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "success update"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "videoId missing");
  }

  const delVideo = await Video.findById(videoId);
  if (!delVideo) {
    throw new ApiError("already deleted or not received ");
  }
  await deleteFromCloudinary(delVideo.videoFile);
  await deleteFromCloudinary(delVideo.thumbnail);
  const video = await Video.findOneAndDelete(videoId);

  if (!video) {
    throw new ApiError(400, "failed to delete");
  }

  return res.status(200).json(new ApiResponse(200, { video }, "deleted "));
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError("videoId not provided");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError("video doesn;t exist");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video isPublished changed"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
