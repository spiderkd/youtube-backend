import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(400, "user not found");
  }
  console.log(userId);

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        subscribersCount: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        subscribersCount: 1,
      },
    },
  ]);

  const videoStats = await Video.aggregate([
    [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
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
        $project: {
          totalLikes: {
            $size: "$likes",
          },
          totalViews: "$views",
          totalVideos: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalLikes: {
            $sum: "$totalLikes",
          },
          totalViews: {
            $sum: "$totalViews",
          },
          totalVideos: {
            $sum: 1,
          },
        },
      },
    ],
  ]);

  if (!videoStats) {
    throw new ApiError(400, "videostats not fetched properly");
  }
  const channelStats = {
    totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
    totalLikes: videoStats[0]?.totalLikes || 0,
    totalViews: videoStats[0]?.totalViews || 0,
    totalVideos: videoStats[0]?.totalVideos || 0,
  };
  console.log(channelStats);
  return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "stats fetched properly"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(400, "user not found");
  }
  console.log(userId);

  const videos = await Video.aggregate([
    [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
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
        $addFields: {
          totalLikes: {
            $size: "$likes",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $addFields: {
          Owner: {
            $first: "$owner",
          },
        },
      },
      {
        $project: {
          thumbnail: 1,
          duration: 1,
          _id: 1,
          description: 1,
          views: 1,
          isPublished: 1,
          totalLikes: 1,
          Owner: {
            username: 1,
            email: 1,
            avatar: 1,
            _id: 1,
          },
          title: 1,
          createdAt: 1,
        },
      },
    ],
  ]);
  console.log(videos);
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
//6641a51fc596d975eef655cc
