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
import { error } from "console";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
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

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video id not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { video }, "video fetched success"));
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
