// package and other modules
const express = require("express");
const moment = require("moment");
const mongoose = require("mongoose");

// static imports
const { AdminAuth, UserAuth } = require("../schemas/Auth");
const { comments } = require("../models/Comments");
const messages = require("../config/messages");
const { notifications } = require("../models/Notifications");
const { posts } = require("../models/Posts");

// Initialize router
const router = express.Router();

// Get List of all comments in Database
router.get("/get-all-comments-list", AdminAuth, async (req, res) => {
  try {
    const commentsList = await comments.find();

    return res.status(200).send({ Comments: commentsList });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get All Comments of a Post
router.get("/get-all-comments-of-post", UserAuth, async (req, res) => {
  try {
    if (req.query?.post_id) {
      const checkPost = await posts.findOne({
        _id: req.query?.post_id,
      });
      if (!checkPost) return res.status(404).send(messages.postMissing);

      const allComments = await comments.aggregate([
        // Match with post id
        { $match: { post_id: mongoose.Types.ObjectId(req.query?.post_id) } },
        // Join with user details
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            // include only username and prrofile picture
            pipeline: [
              {
                $project: {
                  Name: 1,
                  Username: 1,
                  ProfilePicture: 1,
                },
              },
            ],
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
        // Remove fields not required
        {
          $project: {
            post_id: 0,
            __v: 0,
            user_details: 0,
          },
        },
      ]);

      return res.send({ Comments: allComments });
    } else {
      return res.status(404).send(messages.postNotFound);
    }
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Post a Comment
router.post("/post-comment", UserAuth, async (req, res) => {
  try {
    const { comment_text, post_id } = req.body;

    const checkPost = await posts.findOne({
      _id: req.body.post_id,
    });
    if (!checkPost) return res.status(404).send(messages.postMissing);

    const newComment = new comments({
      comment_text: comment_text,
      user_id: mongoose.Types.ObjectId(req.body.user_details._id),
      post_id: mongoose.Types.ObjectId(post_id),
      commented_on: moment(),
    });

    await newComment.save();

    // Create a Notification for Comment
    const newNotification = new notifications({
      user_id: req.body.user_details._id,
      notification_type: "comment",
      post_id: mongoose.Types.ObjectId(req.body.post_id),
      notify_to: checkPost.user_id,
      operation_type_id: mongoose.Types.ObjectId(newComment._id),
      created_at: moment(),
    });

    await newNotification.save();

    return res.status(200).send(messages.commentedSuccess);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Delete a Comment
router.delete("/delete-comment", UserAuth, async (req, res) => {
  try {
    // Check if body includes a comment id
    if (!req.body?.comment_id)
      return res.status(404).send("Comment ID is required");

    // Find and delete the comment
    await comments.findByIdAndDelete(req.body.comment_id);

    return res.status(200).send(messages.commentedDeleted);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// export router
module.exports = router;
