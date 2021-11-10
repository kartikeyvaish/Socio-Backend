// package and other modules
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { pick } = require("lodash");

// static imports
const { followings } = require("../models/Following");
const { followers } = require("../models/Followers");
const messages = require("../config/messages");
const { posts } = require("../models/Posts");
const { requests } = require("../models/Requests");
const { users } = require("../models/Users");
const { UploadToCloudinary } = require("../utils/cloudinary");
const { UserAuth } = require("../schemas/Auth");
const { ValidateEditProfileBody } = require("../schemas/Profile");

// Initialize router
const router = express.Router();

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });

// Change user's profile Privateness
router.patch("/toggle-profile-private", UserAuth, async (req, res) => {
  try {
    const user = await users.findById(req.body.user_details._id);
    if (!user) return res.status(404).send(messages.accountMissing);

    user.Private = !user.Private;

    await user.save();

    return res.send({ private: user.Private });
  } catch (error) {
    return res.status(500).send("Error");
  }
});

// get a user's profile data
// If the user who requested, follows the other user or the account is public then the profile data is sent
// Profile data includes these below listed fields
// - Posts
// - Followers
// - Following
// Use $lookup to get the posts of the user.
// Perform a check for follow/not follow and private profile.
// This request can give data of won profile as well as other user's profile
router.get("/get-profile", UserAuth, async (req, res) => {
  try {
    // Getting queires
    const target_user_id = req.query.user_id;
    const user_id = req.body.user_details._id;

    // Check if target user_id has been provided
    if (!target_user_id)
      return res.status(400).send("Provide a User ID to query");

    // Check if target user exists
    const target_user = await users.findById(target_user_id);
    if (!target_user) return res.status(404).send(messages.accountMissing);

    // Variables to be sent after query
    let posts_by_target_user = [];
    let allowed_to_see_posts = true;
    let getting_own_profile = target_user_id.toString() === user_id.toString();
    let user_follows_target = false;
    let target_follows_user = false;
    let target_sent_request = false;
    let target_recieve_request = false;

    // Count the number of followers of the target user
    const followers_count_target_user = await followers.countDocuments({
      user_id: mongoose.Types.ObjectId(target_user_id),
    });

    // Count the number of following of the target user
    const following_count_target_user = await followings.countDocuments({
      user_id: mongoose.Types.ObjectId(target_user_id),
    });

    // Get Posts Count of the target user
    const posts_count_target_user = await posts.countDocuments({
      user_id: mongoose.Types.ObjectId(target_user_id),
    });

    // Perform these queries only if the user is not requesting his own profile
    if (!getting_own_profile) {
      // Check if the user who requested follows the target user
      user_follows_target = await followers.findOne({
        user_id: mongoose.Types.ObjectId(target_user_id),
        follower_id: user_id,
      });

      // Check if target_user follows the user who requested
      target_follows_user = await followers.findOne({
        user_id: user_id,
        follower_id: mongoose.Types.ObjectId(target_user_id),
      });

      // Check whether the user who requested has sent a request to the target user
      target_sent_request = await requests.findOne({
        user_id: mongoose.Types.ObjectId(target_user_id),
        request_sent_to: user_id,
      });

      if (!target_sent_request) {
        // Check whether the target user has received a request from the user who requested
        target_recieve_request = await requests.findOne({
          user_id: user_id,
          request_sent_to: mongoose.Types.ObjectId(target_user_id),
        });
      }
    }

    if (
      getting_own_profile ||
      user_follows_target ||
      target_user.Private === false
    ) {
      // Either the user who requested is the target user or the target user is public. And also,
      // This means the requested user follows the target user or the target user's account is public
      // So we will show the posts of the target user
      posts_by_target_user = await posts.aggregate([
        // Match with the target user
        {
          $match: {
            user_id: mongoose.Types.ObjectId(target_user_id),
          },
        },
        // Sort by posted_on
        {
          $sort: {
            posted_on: -1,
          },
        },
        // Lookup for user_details of the post
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_details",
          },
        },
        // Unwind the user_details
        {
          $unwind: {
            path: "$user_details",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Get only preview_file, _id, and mime_type
        {
          $project: {
            preview_file: 1,
            _id: 1,
            mime_type: 1,
          },
        },
      ]);
    } else {
      allowed_to_see_posts = false;
    }

    let profile_data = {
      Name: target_user.Name,
      Username: target_user.Username,
      ProfilePicture: target_user.ProfilePicture,
      Posts: posts_by_target_user,
      PostsCount: posts_count_target_user,
      FollowersCount: followers_count_target_user,
      FollowingCount: following_count_target_user,
      Private: target_user.Private,
      Bio: target_user.Bio,
      allowed_to_see_posts: allowed_to_see_posts,
      // conditionally render these two fields as when getting own profile, these two fields are not needed
      ...(!getting_own_profile && {
        requested_follows_target: user_follows_target ? true : false,
      }),
      ...(!getting_own_profile && {
        target_follows_requested: target_follows_user ? true : false,
      }),
      // Pending requests
      ...(!getting_own_profile && {
        target_sent_request: target_sent_request ? true : false,
      }),
      ...(target_sent_request && {
        request_id: target_sent_request._id,
      }),
      ...(!getting_own_profile && {
        target_recieve_request: target_recieve_request ? true : false,
      }),
      ...(target_recieve_request && {
        request_id: target_recieve_request._id,
      }),
    };

    return res.status(200).send(profile_data);
  } catch (error) {
    return res.status(500).send("Error");
  }
});

// Edit Profile Endpoint
// This endpoint is used to edit the profile of the user
// The user can edit his profile by uploading a new profile picture
// The user can also edit his profile by changing his name, username and Bio
router.patch(
  "/edit-profile",
  upload.single("ProfilePicture"),
  UserAuth,
  ValidateEditProfileBody,
  async (req, res) => {
    try {
      // Get user
      const user = await users.findById(req.body.user_id);
      if (!user) return res.status(404).send(messages.accountMissing);

      // Update Name if provided
      if (req.body.Name && user.Name !== req.body.Name)
        user.Name = req.body.Name;

      // Update Bio if provided
      if (req.body.Bio && user.Bio !== req.body.Bio) user.Bio = req.body.Bio;

      // Update Username if provided
      if (req.body.Username && req.body.Username !== user.Username) {
        // Check if the username is already taken
        const user_with_same_username = await users.findOne({
          Username: req.body.Username,
        });

        // Return the error if the username is already taken
        if (user_with_same_username)
          return res.status(400).send("Username already taken");
        else user.Username = req.body.Username;
      }

      // Update Profile Picture if provided
      if (req.body.ProfilePicture) {
        // Upload to cloudinary first
        const destination = `users/${user._id}/ProfilePicture`;

        const uploadResponse = await UploadToCloudinary(
          req.body.ProfilePicture,
          destination
        );

        if (uploadResponse?.url?.length)
          user.ProfilePicture = uploadResponse.url;
        else return res.status(500).send(messages.serverError);
      }

      // Save the user
      await user.save();

      const decodedUser = pick(user.toObject(), [
        "Name",
        "Username",
        "Token",
        "_id",
        "Email",
        "Bio",
        "ProfilePicture",
      ]);

      return res.status(200).send({ User: decodedUser });
    } catch (error) {
      return res.status(500).send("Error");
    }
  }
);

// export router
module.exports = router;
