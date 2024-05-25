import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channel id is required ");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "channel doesn't exist");
  }
  const user = req.user;

  if (!user) {
    throw new ApiError(400, "not logged in ");
  }

  if (channelId.toString() == user._id.toString()) {
    throw new ApiError(400, "user can't subscribe to it self");
  }
  const subscribed = await Subscription.findOne({
    subscriber: user._id,
    channel: channelId,
  });

  if (subscribed) {
    await Subscription.findByIdAndDelete(subscribed._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "Unsubscribed success")
      );
  }

  const subscribing = await Subscription.create({
    subscriber: user._id,
    channel: channelId,
  });

  if (!subscribing) {
    throw new ApiError(400, "subscription failed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribing, subscribed: true }, "subscribed")
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "channel id required");
  }
  //6650c010144a40bfc1ca04bb
  const subscriberList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDeltails",
      },
    },
    {
      $addFields: {
        subs: {
          $first: "$subscriberDeltails",
        },
      },
    },
    {
      $group: {
        _id: null,
        Totalsubs: {
          $sum: 1,
        },
        Usenames: {
          $push: "$subs.username",
        },
        Avatar: {
          $push: "$subs.avatar",
        },
      },
    },
    {
      $project: {
        Totalsubs: 1,
        Usenames: 1,
        channel: 1,
        Avatar: 1,
      },
    },
  ]);
  if (!subscriberList) {
    throw new ApiError(400, "not fetched properly");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { subscriberList }, "fetched properly"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) {
    throw new ApiError(400, "subscriber id missing");
  }
  //664edb15cab1f04fcce47647
  const ChannelsSubscribed = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $addFields: {
        channelIndividual: {
          $first: "$result",
        },
      },
    },
    {
      $group: {
        _id: null,
        channels: {
          $push: "$channelIndividual",
        },
        TotalChannels: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        TotalChannels: 1,
        channels: {
          avatar: 1,
          username: 1,
          createdAt: 1,
          _id: 1,
        },
      },
    },
  ]);
  if (!ChannelsSubscribed) {
    throw new ApiError(400, "channels not  fetched ");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { ChannelsSubscribed }, "fetched"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
