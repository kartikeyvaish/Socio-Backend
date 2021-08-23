const express = require("express");
const moment = require("moment");
const router = express.Router();

const config = require("../config/Configurations");

const { Posts } = require("../models/Posts");
const { Helper } = require("../config/Helper");
const { Likes } = require("../models/Likes");
const { Users } = require("../models/Users");
const { Notifications } = require("../models/Notifications");
const { SendPushNotification } = require("../config/PushNotifications");

const { CheckAdminAccess, CheckAuthToken } = Helper;

const BaseURL = process.env.BaseURL;

router.get("/get-all-likes", CheckAdminAccess, async (req, res) => {
  try {
    const likes = await Likes.find();
    return res.status(200).send({ LikesCount: likes.length, Likes: likes });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.put("/like-a-post", CheckAuthToken, async (req, res) => {
  try {
    const checkPost = await Posts.findOne({
      _id: req.body.PostID,
    });
    if (!checkPost) return res.status(404).send(config.messages.postMissing);

    const checkLike = await Likes.findOne({
      PostID: req.body.PostID,
      UserID: req.body.CalledBy._id,
    });
    if (checkLike)
      return res.status(200).send({
        status: config.messages.postAlreadyLiked,
        count: checkPost.Likes,
      });

    const newLikeObject = new Likes({
      UserID: req.body.CalledBy._id,
      Username: req.body.CalledBy.Username,
      PostID: req.body.PostID,
      Name: req.body.CalledBy.Name,
      ProfilePicture: req.body.CalledBy.PicURL,
      DateTime: moment(),
    });

    await newLikeObject.save();

    const likeCounter = await Likes.find({ PostID: req.body.PostID });
    checkPost.Likes = likeCounter.length;
    await checkPost.save();

    if (req.body.CalledBy.Username !== checkPost.Username) {
      const postOwner = await Users.findOne({
        _id: checkPost.UserID,
      });

      if (postOwner) {
        await SendPushNotification({
          PushToken: postOwner.PushToken,
          Data: {
            showInForeGround: "false",
          },
          notification: {
            body: `${req.body.CalledBy.Username} liked your post.`,
            title: "Socio",
            image: BaseURL + checkPost.PreviewURL,
          },
        });
      }

      const newNotify = new Notifications({
        UserID: postOwner._id,
        PrefixPicture: req.body.CalledBy.PicURL,
        SuffixPicture: checkPost.PreviewURL,
        content: `${req.body.CalledBy.Username} liked your post.`,
        notificationType: "PostLiked",
        DateTime: moment(),
        PostID: req.body.PostID,
        OperationOwner: req.body.CalledBy._id,
        OperationID: newLikeObject._id,
        OperationType: "PostLiked",
      });

      await newNotify.save();
    }

    return res.status(200).send({
      status: config.messages.postLiked,
      count: checkPost.Likes,
    });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/unlike-a-post", CheckAuthToken, async (req, res) => {
  try {
    const checkPost = await Posts.findOne({
      _id: req.body.PostID,
    });
    if (!checkPost) return res.status(404).send(config.messages.postMissing);

    const checkLike = await Likes.findOne({
      PostID: req.body.PostID,
      UserID: req.body.CalledBy._id,
    });
    if (!checkLike)
      return res.status(200).send({
        status: config.messages.postAlreadyDisLiked,
        count: checkPost.Likes,
      });

    checkPost.Likes = checkPost.Likes - 1;

    await checkLike.delete();

    const likeCounter = await Likes.find({ PostID: req.body.PostID });
    checkPost.Likes = likeCounter.length;
    await checkPost.save();

    const findNew = await Notifications.findOne({
      OperationOwner: req.body.CalledBy._id,
      OperationID: checkLike._id,
      OperationType: "PostLiked",
    });

    if (findNew) await findNew.delete();

    return res.status(200).send({
      status: config.messages.postDisLiked,
      count: checkPost.Likes,
    });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-all-likes-on-post", CheckAuthToken, async (req, res) => {
  try {
    if (req.query?.PostID) {
      const checkPost = await Posts.findOne({
        _id: req.query?.PostID,
      });
      if (!checkPost) return res.status(404).send(config.messages.postMissing);

      const allLikes = await Likes.find({
        PostID: req.query?.PostID,
      });

      checkPost.Likes = allLikes.length;
      checkPost.save();

      return res.send(allLikes);
    } else {
      return res.status(404).send(config.messages.postNotFound);
    }
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

module.exports = router;
