import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { error } from "console";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) {
    throw new ApiError(400, "video id required");
  }
  const alreadyLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "Video like removed successfully"
        )
      );
  }

  const likeVideo = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!likeVideo) {
    throw new ApiError(500, "Server error while liking the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeVideo, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId) {
    throw new ApiError(400, "comment id required");
  }
  const alreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "comment like removed successfully"
        )
      );
  }

  const likeComment = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!likeComment) {
    throw new ApiError(500, "Server error while liking the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeComment, "comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId) {
    throw new ApiError(400, "Tweet id required");
  }
  const alreadyLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "Tweet like removed successfully"
        )
      );
  }

  const likeTweet = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!likeTweet) {
    throw new ApiError(500, "Server error while liking the Tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeTweet, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  

});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
