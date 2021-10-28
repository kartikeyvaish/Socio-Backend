const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const moment = require("moment");

const { AdminAuth, UserAuth } = require("../schemas/Auth");
const messages = require("../config/messages");
const { posts } = require("../models/Posts");
const { likes } = require("../models/Likes");
const { comments } = require("../models/Comments");
const { notifications } = require("../models/Notifications");
const { UploadToCloudinary, cloudinary } = require("../utils/cloudinary");
const { followings } = require("../models/Following");

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });
const new_post_config = [
  {
    name: "file",
    maxCount: 1,
  },
  {
    name: "preview_file",
    maxCount: 1,
  },
];

// get all posts
router.get("/get-posts-list", AdminAuth, async (req, res) => {
  try {
    const postsList = await posts.find();

    return res.status(200).send({ Posts: postsList });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get Feed for a user including Following's posts and own posts
router.get("/get-feed-for-user", UserAuth, async (req, res) => {
  try {
    // Check if request has a last_post_id as query param
    let last_id_query = req.query?.last_post_id
      ? mongoose.Types.ObjectId(req.query.last_post_id)
      : null;

    // Create a filter if last_post_id is present
    let after_this_id_filter = last_id_query
      ? { _id: { $lt: last_id_query } }
      : {};

    // Get the user's following list
    const allFollowing = await followings.find(
      {
        user_id: req.body.user_details._id,
      },
      { following_id: 1 }
    );

    // Get Posts here using aggregate and lookup
    const feedPosts = await posts.aggregate([
      {
        // Match with filter and user_id, also with the people user is following
        $match: {
          ...after_this_id_filter,
          $or: [
            { user_id: req.body.user_details._id },
            {
              user_id: { $in: allFollowing.map((item) => item.following_id) },
            },
          ],
        },
      },
      // sort them in descending order of _id
      {
        $sort: {
          _id: -1,
        },
      },
      // limit to 10
      {
        $limit: 10,
      },
      // lookup the user_id in users collection
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_details",
        },
      },
      // take username and ProfilePicture and add it to the post
      {
        $addFields: {
          Username: {
            $ifNull: [
              {
                $arrayElemAt: ["$user_details.Username", 0],
              },
              [],
            ],
          },
          ProfilePicture: {
            $ifNull: [
              {
                $arrayElemAt: ["$user_details.ProfilePicture", 0],
              },
              [],
            ],
          },
        },
      },
      // Count number of likes for each post
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post_id",
          as: "likes_count",
        },
      },
      // Count number of comments for each post
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post_id",
          as: "comments_count",
        },
      },
      // Check if the user has liked the post
      {
        $addFields: {
          is_liked: {
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: ["$likes_count.user_id", 0],
                  },
                  req.body.user_details._id,
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      // Change likes_count array to the number of likes
      {
        $addFields: {
          likes_count: {
            $size: "$likes_count",
          },
        },
      },
      // Change comments_count array to the number of comments
      {
        $addFields: {
          comments_count: {
            $size: "$comments_count",
          },
        },
      },
      // Remove the user_details field
      {
        $project: {
          user_details: 0,
        },
      },
    ]);

    return res
      .status(200)
      .send({ PostsCount: feedPosts.length, Posts: feedPosts });
  } catch (error) {
    console.log(error);
    return res.status(500).send(messages.serverError);
  }
});

// Create a Post
router.post(
  "/create-a-post",
  upload.fields(new_post_config),
  UserAuth,
  async (req, res) => {
    try {
      if (
        req.files &&
        req.files?.file?.length &&
        req.files?.preview_file?.length
      ) {
        const newPost = new posts({
          user_id: req.body.user_details._id,
          posted_on: moment(),
          location: req.body.location,
          caption: req.body.caption,
          mime_type: req.files?.file?.[0].mimetype,
          dimensions: {
            width: req.body.width || 0,
            height: req.body.height || 0,
          },
          ...req.body,
        });

        const destination = `users/${req.body.user_details._id}/Posts/${newPost._id}/`;

        const fileUploadResponse = await UploadToCloudinary(
          req.files?.file?.[0].buffer,
          destination
        );

        if (fileUploadResponse?.url?.length)
          newPost.file = fileUploadResponse.url;
        else return res.status(500).send(messages.serverError);

        const previewUploadResponse = await UploadToCloudinary(
          req.files?.preview_file?.[0].buffer,
          destination
        );

        if (previewUploadResponse?.url?.length)
          newPost.preview_file = previewUploadResponse.url;
        else return res.status(500).send(messages.serverError);

        await newPost.save();
        return res.status(200).send(newPost);
      }

      return res.status(404).send(messages.fileMissing);
    } catch (error) {
      return res.status(500).send(messages.serverError);
    }
  }
);

// Get posts by user
router.get("/get-posts-by-user", UserAuth, async (req, res) => {
  try {
    const allPosts = await posts.aggregate([
      // Match to find by _id
      { $match: { user_id: req.body.user_details._id } },
      // Lookup user and its details
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_details",
        },
      },
      // take username and ProfilePicture and add it to the post
      {
        $addFields: {
          Username: {
            $ifNull: [
              {
                $arrayElemAt: ["$user_details.Username", 0],
              },
              [],
            ],
          },
          ProfilePicture: {
            $ifNull: [
              {
                $arrayElemAt: ["$user_details.ProfilePicture", 0],
              },
              [],
            ],
          },
        },
      },
      // Lookup likes and its details
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post_id",
          pipeline: [{ $project: { user_id: 1 } }],
          as: "liked_by",
        },
      },
      // Lookup comments and its details
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post_id",
          as: "commented_by",
        },
      },
      // Add likes count
      {
        $addFields: {
          likes_count: {
            $size: "$liked_by",
          },
          // Check if liked by user
          is_liked: {
            $cond: {
              if: {
                $in: [
                  mongoose.Types.ObjectId(req.body.user_details._id),
                  "$liked_by.user_id",
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      // Add comments count
      {
        $addFields: {
          comments_count: {
            $size: "$commented_by",
          },
        },
      },
      // remove unnecessary fields
      { $project: { user_details: 0, __v: 0, liked_by: 0, commented_by: 0 } },
    ]);

    return res.status(200).send({ Posts: allPosts });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get a Post Detail
router.get("/get-post-detail", UserAuth, async (req, res) => {
  try {
    const postDetail = await posts.aggregate([
      // Match to find by _id
      { $match: { _id: mongoose.Types.ObjectId(req.query._id) } },
      // limit to 1
      { $limit: 1 },
      // Lookup user and its details
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_details",
        },
      },
      // take username and ProfilePicture and add it to the post
      {
        $addFields: {
          Username: {
            $ifNull: [
              {
                $arrayElemAt: ["$user_details.Username", 0],
              },
              [],
            ],
          },
          ProfilePicture: {
            $ifNull: [
              {
                $arrayElemAt: ["$user_details.ProfilePicture", 0],
              },
              [],
            ],
          },
        },
      },
      // Count number of likes for each post
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post_id",
          as: "likes_count",
        },
      },
      // Count number of comments for each post
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post_id",
          as: "comments_count",
        },
      },
      // Check if the user has liked the post
      {
        $addFields: {
          is_liked: {
            $cond: {
              if: {
                $eq: [
                  {
                    $arrayElemAt: ["$likes_count.user_id", 0],
                  },
                  req.body.user_details._id,
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      // Change likes_count array to the number of likes
      {
        $addFields: {
          likes_count: {
            $size: "$likes_count",
          },
        },
      },
      // Change comments_count array to the number of comments
      {
        $addFields: {
          comments_count: {
            $size: "$comments_count",
          },
        },
      },
      // Remove the user_details field
      {
        $project: {
          user_details: 0,
        },
      },
    ]);

    if (postDetail.length) return res.status(200).send(postDetail[0]);

    return res.status(404).send(messages.postMissing);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Delete a Post
router.delete("/delete-post", UserAuth, async (req, res) => {
  try {
    const post = await posts.findOne({
      _id: mongoose.Types.ObjectId(req.body._id),
    });
    if (!post) return res.status(404).send(messages.postMissing);

    // Check if user is the owner of the post
    if (post.user_id.toString() !== req.body.user_details._id.toString())
      return res.status(401).send(messages.postDeletionNotAllowed);

    // Delete from cloudinary
    const userFolderDestination = `users/${req.body.user_details.Username}/Posts/${req.body._id}/`;
    cloudinary.api.delete_resources_by_prefix(userFolderDestination);

    // Delete the likes when this post gets deleted
    await likes.deleteMany({ post_id: mongoose.Types.ObjectId(req.body._id) });

    // Delete the comments when this post gets deleted
    await comments.deleteMany({
      post_id: mongoose.Types.ObjectId(req.body._id),
    });

    // Delete all notifications when this post gets deleted
    await notifications.deleteMany({
      post_id: mongoose.Types.ObjectId(req.body._id),
    });

    // Delete the post
    await posts.deleteOne({
      _id: mongoose.Types.ObjectId(req.body._id),
    });

    return res.send(messages.postDeleted);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

module.exports = router;
