// package and other modules
const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");

// static imports
const messages = require("../config/messages");
const { AdminAuth, UserAuth } = require("../schemas/Auth");
const { likes } = require("../models/Likes");
const { posts } = require("../models/Posts");
const { notifications } = require("../models/Notifications");

// Initialize router
const router = express.Router();

// Get List of all likes in Database
router.get("/get-all-likes-list", AdminAuth, async (req, res) => {
  try {
    const all_likes = await likes.find();

    return res.status(200).send({ Likes: all_likes });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Like a Post
router.put("/like-a-post", UserAuth, async (req, res) => {
  try {
    const checkPost = await posts.findOne({
      _id: req.body.post_id,
    });
    if (!checkPost) return res.status(404).send(messages.postMissing);

    const checkLike = await likes.findOne({
      user_id: req.body.user_details._id,
      post_id: mongoose.Types.ObjectId(req.body.post_id),
    });
    if (checkLike) return res.status(200).send(messages.postLiked);

    const newLike = new likes({
      user_id: req.body.user_details._id,
      post_id: req.body.post_id,
      liked_on: moment(),
    });
    await newLike.save();

    // check if post owner is not the same as the user who liked the post
    if (checkPost.user_id.toString() !== req.body.user_details._id.toString()) {
      // Create a Notification for Like
      const newNotification = new notifications({
        user_id: req.body.user_details._id,
        notification_type: "like",
        post_id: mongoose.Types.ObjectId(req.body.post_id),
        notify_to: checkPost.user_id,
        operation_type_id: mongoose.Types.ObjectId(newLike._id),
        created_at: moment(),
      });

      await newNotification.save();
    }

    // Count No. of likes for this post
    const countLikes = await likes.countDocuments({
      post_id: mongoose.Types.ObjectId(req.body.post_id),
    });

    return res
      .status(200)
      .send({ likes_count: countLikes, response: messages.postLiked });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Unlike a Post
router.delete("/unlike-a-post", UserAuth, async (req, res) => {
  try {
    const checkPost = await posts.findOne({
      _id: req.body.post_id,
    });
    if (!checkPost) return res.status(404).send(messages.postMissing);

    const checkLike = await likes.findOne({
      user_id: req.body.user_details._id,
      post_id: mongoose.Types.ObjectId(req.body.post_id),
    });
    if (!checkLike) return res.status(200).send(messages.postDisLiked);

    await checkLike.delete();

    // Delete a Notification for Like
    const checkNotification = await notifications.findOne({
      user_id: req.body.user_details._id,
      notification_type: "like",
      post_id: mongoose.Types.ObjectId(req.body.post_id),
    });
    if (checkNotification) await checkNotification.delete();

    // Count No. of likes for this post
    const countLikes = await likes.countDocuments({
      post_id: mongoose.Types.ObjectId(req.body.post_id),
    });

    return res
      .status(200)
      .send({ likes_count: countLikes, response: messages.postDisLiked });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

router.get("/get-all-likes-on-post", UserAuth, async (req, res) => {
  try {
    if (req.query?.post_id) {
      const checkPost = await posts.findOne({
        _id: req.query?.post_id,
      });
      if (!checkPost) return res.status(404).send(messages.postMissing);

      const allLikes = await likes.aggregate([
        // Match with post id
        { $match: { post_id: mongoose.Types.ObjectId(req.query?.post_id) } },
        // Join with user details
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_details",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$user_details", 0] }, "$$ROOT"],
            },
          },
        },
        // Keep fields only required
        {
          $project: {
            _id: 1,
            Name: 1,
            Username: 1,
            ProfilePicture: 1,
            user_id: 1,
          },
        },
      ]);

      return res.send({ Likes: allLikes });
    } else {
      return res.status(404).send(messages.postNotFound);
    }
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// export router
module.exports = router;
