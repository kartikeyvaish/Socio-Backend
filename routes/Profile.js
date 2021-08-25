const express = require("express");
const router = express.Router();
const _ = require("lodash");
const jwt = require("jsonwebtoken");

const config = require("../config/Configurations");

const { Helper } = require("../config/Helper");
const { Followers } = require("../models/Followers");
const { Following } = require("../models/Following");
const { Posts } = require("../models/Posts");
const { Requests } = require("../models/Requests");
const { Users } = require("../models/Users");

const { CheckAuthToken } = Helper;

router.get("/get-profile-details", CheckAuthToken, async (req, res) => {
  try {
    if (req.query?.user) {
      const user = await Users.findOne({ _id: req.query.user });
      if (!user) return res.status(404).send(config.messages.accountMissing);

      const CalledBy = await Users.findOne({ _id: req.body.CalledBy._id });
      if (!CalledBy)
        return res.status(404).send(config.messages.accountMissing);

      const followers = await Followers.find({ FollowerOf: req.query.user });

      const following = await Following.find({ FollowingOf: req.query.user });

      const posts = await Posts.find(
        { UserID: req.query.user },
        { File: 0, Preview: 0 }
      ).sort({ DateTime: -1 });

      const checkFollowers = followers.findIndex(
        (item) =>
          item.FollowerOf === req.query.user.toString() &&
          item.UserID.toString() === req.body.CalledBy._id.toString()
      );

      const checkfollowing = following.findIndex(
        (item) =>
          item.FollowingOf.toString() === req.query.user.toString() &&
          item.UserID === req.body.CalledBy._id.toString()
      );

      const checkRequestSent = await Requests.findOne({
        "RequestedBy.UserID": CalledBy._id,
        "RequestedTo.UserID": user._id,
      });

      const checkRequestCame = await Requests.findOne({
        "RequestedTo.UserID": CalledBy._id,
        "RequestedBy.UserID": user._id,
      });

      let showPosts = true;

      if (user.Private) {
        if (checkFollowers < 0) {
          showPosts = false;
        }
      }

      const resultData = {
        _id: req.query.user,
        Name: user.Name,
        Username: user.Username,
        Email: user.Email,
        ProfilePicture: user.PicURL,
        Posts: posts,
        Private: user.Private,
        ShowPosts: showPosts,
        Followers: followers,
        Following: following,
        InFollowers: checkFollowers > -1 ? true : false,
        InFollowing: checkfollowing > -1 ? true : false,
        YouSentRequest: checkRequestSent ? true : false,
        AllPosts: posts,
        YouSentRequestID: checkRequestSent ? checkRequestSent._id : null,
        RequestCame: checkRequestCame ? true : false,
        RequestCameID: checkRequestCame ? checkRequestCame._id : null,
      };

      return res.send(resultData);
    }
    return res.status(404).send("User ID is required");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-user-profile", CheckAuthToken, async (req, res) => {
  try {
    const CalledBy = await Users.findOne({ _id: req.body.CalledBy._id });
    if (!CalledBy) return res.status(404).send(config.messages.accountMissing);

    const followers = await Followers.find({
      FollowerOf: req.body.CalledBy._id,
    });

    const following = await Following.find({
      FollowingOf: req.body.CalledBy._id,
    });

    const posts = await Posts.find(
      { UserID: req.body.CalledBy._id },
      { File: 0, Preview: 0 }
    ).sort({ _id: -1 });

    const resultData = {
      Name: CalledBy.Name,
      Bio: CalledBy.Bio,
      Username: CalledBy.Username,
      Email: CalledBy.Email,
      ProfilePicture: CalledBy.PicURL,
      Posts: posts,
      AllPosts: posts,
      Private: CalledBy.Private,
      ShowPosts: true,
      Followers: followers,
      Following: following,
    };

    return res.send(resultData);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get(
  "/get-edit-profile-details-for-user",
  CheckAuthToken,
  async (req, res) => {
    try {
      const user = await Users.findOne({ _id: req.body.CalledBy._id });
      const responseData = _.pick(user.toObject(), [
        "Name",
        "Email",
        "PicURL",
        "Username",
        "_id",
        "Bio",
      ]);
      return res.send(responseData);
    } catch (error) {
      console.log(error);
      return res.status(500).send(config.messages.serverError);
    }
  }
);

router.post("/edit-profile", CheckAuthToken, async (req, res) => {
  try {
    console.log(req.body.Name);
    console.log(req.body.Bio);
    console.log(req.body.ProfilePicture?.length);
    const user = await Users.findOne({ _id: req.body.CalledBy._id });

    user.Name = req.body.Name;
    user.Bio = req.body.Bio;

    if (req.body.ProfilePicture?.length) {
      user.ProfilePicture = req.body.ProfilePicture;
    }

    const Token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_Key
    );

    user.Token = Token;

    await user.save();

    const decodedUser = _.pick(user.toObject(), [
      "Name",
      "Username",
      "Token",
      "_id",
      "RandomAPI",
      "Email",
      "Bio",
    ]);

    decodedUser.ProfilePicture = user.PicURL;

    const StoreToken = jwt.sign(decodedUser, process.env.JWT_Key);

    return res.status(200).send({ User: decodedUser, StoreToken: StoreToken });
  } catch (error) {
    console.log(error);
    return res.status(500).send(config.messages.serverError);
  }
});

module.exports = router;
