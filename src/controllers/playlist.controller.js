import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  console.log(name);

  if (!description) {
    throw new ApiError(400, "all fields 2 required");
  }
  if (!name) {
    throw new ApiError(400, "all fields required");
  }
  const user = req.user;

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const newPlaylist = await Playlist.create({
    name,
    description,
    owner: user._id,
  });
  if (!newPlaylist) {
    throw new ApiError(500, "Server error while creating playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { newPlaylist }, "playlist created successfully")
    );

  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) {
    throw new ApiError(400, "user id required");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(400, "user not found");
  }
  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$playlistVideos",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        playlistVideos: 1,
        updatedAt: 1,
      },
    },
  ]);
  if (!playlist) {
    throw new ApiError(400, "something went worng");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "all playlist fetched "));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "No such playlist exist");
  }

  const playlistVideos = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $match: {
        "videos.isPublished": true,
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
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          "video.url": 1,
          "thumbnail.url": 1,
          title: 1,
          description: 1,
          createdAt: 1,
          duration: 1,
          views: 1,
        },
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);

  if (!playlistVideos) {
    throw new ApiError(500, "Server error while aggregating playlist videos");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlistVideos, "playlist fetched "));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "missing playlist or videoid");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlist non exist");
  }

  const playlistOwner = playlist.owner.toString();
  const userId = req.user._id.toString();

  if (playlistOwner !== userId) {
    throw new ApiError(400, "only owner can add video");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(400, "video was't added");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "added video"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!playlistId || !videoId) {
    throw new ApiError(400, "missing playlist or videoid");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlist non exist");
  }

  console.log(typeof req.user._id);
  console.log(typeof playlist.owner);
  const playlistOwner = playlist.owner.toString();
  const userId = req.user._id.toString();

  if (playlistOwner !== userId) {
    throw new ApiError(400, "only owner can remove video");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(400, "video was't removed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "removed video"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!playlistId) {
    throw new ApiError(400, "playlistid required");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "no such playlist exist ");
  }

  const deleted = await Playlist.findByIdAndDelete(playlistId);

  return res.status(200).json(new ApiResponse(200, deleted, "deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId) {
    throw new ApiError(400, "playlistid required");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "no such playlist exist ");
  }

  if (!description) {
    throw new ApiError(400, "all fields 2 required");
  }
  if (!name) {
    throw new ApiError(400, "all fields required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
    $set: {
      name,
      description,
    },
  });
  if (!updatedPlaylist) {
    throw new ApiError(400, "not updated ");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "updated "));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
