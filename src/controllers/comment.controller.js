import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (!videoId) {
    throw new ApiError(400, "video id not found");
  }
  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const addedComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });
  if (!addedComment) {
    throw new ApiError(500, "Failed to upload the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, addedComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "comment ID required ");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content required ");
  }

  const getComment = await Comment.findById(commentId);
  const comment = getComment.owner.toString();

  const user = req.user._id.toString();
  console.log(content);

  if (user !== comment) {
    throw new ApiError(400, "User is not the owner of this comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );
  if (!updatedComment) {
    throw new ApiError(500, "Failed to update comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedComment,
        "Comment has been updated Successfully"
      )
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "comment id required ");
  }
  const getComment = await Comment.findById(commentId);
  if (!getComment) {
    throw new ApiError(400, "comment doesn't exist");
  }
  const comment = getComment.owner.toString();

  const user = req.user._id.toString();

  if (user !== comment) {
    throw new ApiError(400, "User is not the owner of this comment");
  }
  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw new ApiError(400, "comment wasn't deleted");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedComment, "comment deleted successfully ")
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
