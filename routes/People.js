// package and other modules
const express = require("express");
const mongoose = require("mongoose");

// static imports
const { AdminAuth, UserAuth } = require("../schemas/Auth");
const { followers } = require("../models/Followers");
const { followings } = require("../models/Following");
const messages = require("../config/messages");
const { requests } = require("../models/Requests");
const { users } = require("../models/Users");

// Initialize router
const router = express.Router();

// Get List of all followers in Database
router.get("/get-all-followers-list", AdminAuth, async (req, res) => {
  try {
    const followersList = await followers.find();

    return res.status(200).send({ FollowersList: followersList });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get List of all following in Database
router.get("/get-all-following-list", AdminAuth, async (req, res) => {
  try {
    const followersList = await followings.find();

    return res.status(200).send({ FollowingList: followersList });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get List of all requests in Database
router.get("/get-all-requests-list", AdminAuth, async (req, res) => {
  try {
    const requestsList = await requests.find();
    return res.status(200).send({ Requests: requestsList });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Send a Follow Request to a User
router.post("/send-follow-request", UserAuth, async (req, res) => {
  try {
    const request_sent_to = mongoose.Types.ObjectId(req.body.request_sent_to);
    const user_id = req.body.user_details._id;

    if (request_sent_to.toString() === user_id.toString())
      return res.status(400).send("Cannot request to self");

    const checkUser = await users.findOne({ _id: request_sent_to });
    if (!checkUser) return res.status(404).send("User Not Found");

    // If user's account is not private, then just directly follow the user without sending a request
    if (checkUser.Private === true) {
      // Check if already following
      const checkFollowing = await followings.findOne({
        user_id: user_id,
        following_id: request_sent_to,
      });
      if (checkFollowing)
        return res
          .status(403)
          .send(`You are now already following ${checkUser.Username}`);

      // Check if already requested
      const request = await requests.findOne({
        $or: [
          { user_id: user_id, request_sent_to: request_sent_to },
          { user_id: request_sent_to, request_sent_to: user_id },
        ],
      });
      if (request)
        return res
          .status(200)
          .send("There's a request already pending at this person from you");

      // Create a new request
      const newRequest = new requests({
        user_id: user_id,
        request_sent_to: request_sent_to,
      });
      await newRequest.save();

      return res
        .status(200)
        .send(`Follow Request Sent to ${checkUser.Username}`);
    } else {
      // Else,  just directly follow the user without sending a request
      const check_following = await followings.findOne({
        user_id: user_id,
        following_id: request_sent_to,
      });

      if (!check_following) {
        const newFollowing = new followings({
          user_id: user_id,
          following_id: request_sent_to,
        });

        await newFollowing.save();
      }

      const check_followers = await followers.findOne({
        user_id: request_sent_to,
        follower_id: user_id,
      });

      if (!check_followers) {
        const newFollower = new followers({
          user_id: request_sent_to,
          follower_id: user_id,
        });

        await newFollower.save();
      }

      return res
        .status(200)
        .send(`You are now following ${checkUser.Username}`);
    }
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Accept Follow request and add to following collection
router.post("/accept-follow-request", UserAuth, async (req, res) => {
  try {
    const request = await requests.findOne({ _id: req.body.request_id });
    if (!request) return res.status(200).send("Request Not Found");

    const user_id = request.user_id; // user who sent the request  (a8)
    const request_sent_to = request.request_sent_to; // user who received the request (11)

    if (request_sent_to.toString() !== req.body.user_details._id.toString())
      return res
        .status(403)
        .send("You are not authorized to accept this request");

    const check_following = await followings.findOne({
      user_id: user_id,
      following_id: request_sent_to,
    });

    if (!check_following) {
      const newFollowing = new followings({
        user_id: user_id,
        following_id: request_sent_to,
      });

      await newFollowing.save();
    }

    const check_followers = await followers.findOne({
      user_id: request_sent_to,
      follower_id: user_id,
    });

    if (!check_followers) {
      const newFollower = new followers({
        user_id: request_sent_to,
        follower_id: user_id,
      });

      await newFollower.save();
    }

    await request.delete();

    return res.status(200).send("Follow Request Accepted");
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Delete Follow request and delete request
router.delete("/reject-follow-request", UserAuth, async (req, res) => {
  try {
    const request = await requests.findOne({ _id: req.body.request_id });
    if (!request) return res.status(200).send("Request Not Found");

    if (
      request.user_id.toString() === req.body.user_details._id.toString() ||
      request.request_sent_to.toString() ===
        req.body.user_details._id.toString()
    )
      await request.delete();
    else return res.status(403).send("You are not authorized to do this");

    return res.status(200).send("Follow Request Deleted");
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get all follow requests for a user
router.get("/get-all-requests-user", UserAuth, async (req, res) => {
  try {
    const requestsList = await requests.aggregate([
      // Match the _id of whose list you want to get
      {
        $match: {
          request_sent_to: req.body.user_details._id,
        },
      },
      // Get the user details of the user who sent the request
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          // Get only Name, Username and ProfilePicture
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
      // Unwind the user details
      {
        $unwind: {
          path: "$user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unnecessary fields
      {
        $project: {
          user_id: 0,
          request_sent_to: 0,
          __v: 0,
        },
      },
    ]);

    return res.status(200).send({ Requests: requestsList });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Unfollow a user
router.delete("/unfollow-a-user", UserAuth, async (req, res) => {
  try {
    const checkFollowers = await followers.findOne({
      user_id: req.body.request_id,
      follower_id: req.body.user_details._id,
    });

    if (checkFollowers) await checkFollowers.delete();

    const checkFollowing = await followings.findOne({
      user_id: req.body.user_details._id,
      follower_id: req.body.request_id,
    });

    if (checkFollowing) await checkFollowing.delete();

    return res.send(`You have unfollowed a person from your list`);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Remove from followers list
router.delete("/remove-from-followers", UserAuth, async (req, res) => {
  try {
    const checkFollowers = await followers.findOne({
      user_id: req.body.user_details._id,
      follower_id: req.body.request_id,
    });

    if (checkFollowers) await checkFollowers.delete();

    const checkFollowing = await followings.findOne({
      user_id: req.body.request_id,
      follower_id: req.body.user_details._id,
    });

    if (checkFollowing) await checkFollowing.delete();

    return res.send(`You have removed a person from your followers list`);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get People list i.e., Followers and Following for a specific user
router.get("/get-people-list", UserAuth, async (req, res) => {
  try {
    const myFollowers = await followers.aggregate([
      // Match the _id of whose list you want to get
      {
        $match: {
          user_id: req.body.user_details._id,
        },
      },
      // Get the user details of the user who sent the request
      {
        $lookup: {
          from: "users",
          localField: "follower_id",
          foreignField: "_id",
          // Get only Name, Username and ProfilePicture
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
      // Unwind the user details
      {
        $unwind: {
          path: "$user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unnecessary fields
      {
        $project: {
          user_id: 0,
          follower_id: 0,
          __v: 0,
        },
      },
    ]);

    const myFollowing = await followings.aggregate([
      // Match the _id of whose list you want to get
      {
        $match: {
          user_id: req.body.user_details._id,
        },
      },
      // Get the user details of the user who sent the request
      {
        $lookup: {
          from: "users",
          localField: "following_id",
          foreignField: "_id",
          // Get only Name, Username and ProfilePicture
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
      // Unwind the user details
      {
        $unwind: {
          path: "$user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unnecessary fields
      {
        $project: {
          user_id: 0,
          following_id: 0,
          __v: 0,
        },
      },
    ]);

    return res.status(200).send({
      Followers: myFollowers,
      Following: myFollowing,
    });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get all followers for a user
router.get("/get-followers-list", UserAuth, async (req, res) => {
  try {
    const myFollowers = await followers.aggregate([
      // Match the _id of whose list you want to get
      {
        $match: {
          user_id: req.body.user_details._id,
        },
      },
      // Get the user details of the user who sent the request
      {
        $lookup: {
          from: "users",
          localField: "follower_id",
          foreignField: "_id",
          // Get only Name, Username and ProfilePicture
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
      // Unwind the user details
      {
        $unwind: {
          path: "$user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unnecessary fields
      {
        $project: {
          user_id: 0,
          follower_id: 0,
          __v: 0,
        },
      },
    ]);

    return res.status(200).send({
      Followers: myFollowers,
    });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get all following for a user
router.get("/get-following-list", UserAuth, async (req, res) => {
  try {
    const myFollowing = await followings.aggregate([
      // Match the _id of whose list you want to get
      {
        $match: {
          user_id: req.body.user_details._id,
        },
      },
      // Get the user details of the user who sent the request
      {
        $lookup: {
          from: "users",
          localField: "following_id",
          foreignField: "_id",
          // Get only Name, Username and ProfilePicture
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
      // Unwind the user details
      {
        $unwind: {
          path: "$user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unnecessary fields
      {
        $project: {
          user_id: 0,
          following_id: 0,
          __v: 0,
        },
      },
    ]);

    return res.status(200).send({
      Following: myFollowing,
    });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// export router
module.exports = router;
