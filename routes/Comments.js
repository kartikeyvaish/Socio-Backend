const express = require("express");
const moment = require("moment");
const router = express.Router();

const config = require("../config/Configurations");

const { Posts } = require("../models/Posts");
const { Helper } = require("../config/Helper");
const { Comments } = require("../models/Comments");
const { Users } = require("../models/Users");
const { Notifications } = require("../models/Notifications");
const { SendPushNotification } = require("../config/PushNotifications");

const { CheckAdminAccess, CheckAuthToken } = Helper;

const BaseURL = process.env.BaseURL;

router.get("/get-all-comments", CheckAdminAccess, async (req, res) => {
  try {
    const comments = await Comments.find();
    return res
      .status(200)
      .send({ CommentsCount: comments.length, Comments: comments });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/add-a-comment", CheckAuthToken, async (req, res) => {
  try {
    const checkPost = await Posts.findOne({
      _id: req.body.PostID,
    });
    if (!checkPost) return res.status(404).send(config.messages.postMissing);

    const newCommentObject = new Comments({
      UserID: req.body.CalledBy._id,
      Username: req.body.CalledBy.Username,
      PostID: req.body.PostID,
      Name: req.body.CalledBy.Name,
      ProfilePicture: req.body.CalledBy.PicURL,
      Comment: req.body.Comment,
      DateTime: moment(),
      PostOwnerID: checkPost.UserID,
    });

    checkPost.Comments = checkPost.Comments + 1;
    await checkPost.save();
    await newCommentObject.save();

    if (req.body.CalledBy.Username !== checkPost.Username) {
      const postOwner = await Users.findOne({
        _id: checkPost.UserID,
      });

      if (postOwner) {
        const newNotify = new Notifications({
          UserID: postOwner._id,
          PrefixPicture: req.body.CalledBy.PicURL,
          SuffixPicture: checkPost.PreviewURL,
          content: `${req.body.CalledBy.Username} commented on your post.`,
          notificationType: "PostLiked",
          DateTime: moment(),
          PostID: req.body.PostID,
          OperationOwner: req.body.CalledBy._id,
          OperationID: newCommentObject._id,
          OperationType: "Commneted",
        });

        await newNotify.save();

        if (postOwner.PushToken) {
          await SendPushNotification({
            PushToken: postOwner.PushToken,
            Data: {
              showInForeGround: "false",
            },
            notification: {
              body: `${req.body.CalledBy.Username} commented your post : ${req.body.Comment}`,
              title: "Socio",
              image: BaseURL + checkPost.PreviewURL,
            },
          });
        }
      }
    }

    return res.status(200).send(config.messages.commentedSuccess);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.delete("/delete-a-comment", CheckAuthToken, async (req, res) => {
  try {
    const checkPost = await Posts.findOne({
      _id: req.query.PostID,
    });
    if (!checkPost) return res.status(404).send(config.messages.postMissing);

    const checkComment = await Comments.findOne({
      _id: req.query.CommentID,
    });

    if (!checkComment)
      return res.status(404).send(config.messages.commentMissing);

    checkPost.Comments = checkPost.Comments - 1;
    await checkPost.save();
    await checkComment.delete();

    const findNew = await Notifications.findOne({
      OperationOwner: req.body.CalledBy._id,
      OperationID: checkComment._id,
      OperationType: "Commneted",
    });

    if (findNew) await findNew.delete();

    return res.status(200).send(config.messages.commentedDeleted);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.put("/like-a-comment", CheckAuthToken, async (req, res) => {
  try {
    const checkPost = await Posts.findOne({
      _id: req.body.PostID,
    });
    if (!checkPost) return res.status(404).send(config.messages.postMissing);

    const checkComment = await Comments.findOne({
      _id: req.body.CommentID,
    });
    if (!checkComment) return res.status(404).send("Comment Not Found");

    let temp = [...checkComment.LikedBy];

    if (temp.indexOf(req.body.CalledBy._id.toString()) >= 0) {
      return res.send("Comment Already Liked");
    }
    temp.push(req.body.CalledBy._id.toString());

    checkComment.LikedBy = temp;
    await checkComment.save();
    return res.send("Liked a Comment");
  } catch (error) {}
});

router.put("/unlike-a-comment", CheckAuthToken, async (req, res) => {
  try {
    const checkPost = await Posts.findOne({
      _id: req.body.PostID,
    });
    if (!checkPost) return res.status(404).send(config.messages.postMissing);

    const checkComment = await Comments.findOne({
      _id: req.body.CommentID,
    });
    if (!checkComment) return res.status(404).send("Comment Not Found");

    let temp = [...checkComment.LikedBy];

    if (temp.indexOf(req.body.CalledBy._id.toString()) < 0) {
      return res.send(
        "You have not liked the comment so you cannot dislike it."
      );
    }

    temp.splice(temp.indexOf(req.body.CalledBy._id.toString()), 1);

    checkComment.LikedBy = temp;
    await checkComment.save();
    return res.send("Unliked a Comment");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-all-comments-on-post", CheckAuthToken, async (req, res) => {
  try {
    if (req.query?.PostID) {
      const checkPost = await Posts.findOne({
        _id: req.query?.PostID,
      });
      if (!checkPost) return res.status(404).send(config.messages.postMissing);

      const allComments = await Comments.find({
        PostID: req.query?.PostID,
      });

      checkPost.Comments = allComments.length;
      checkPost.save();

      return res.send(allComments);
    } else {
      return res.status(404).send(config.messages.postNotFound);
    }
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-all-likes-on-comment", CheckAuthToken, async (req, res) => {
  try {
    if (req.query?.CommentID) {
      const checkComment = await Comments.findOne({
        _id: req.query.CommentID,
      });
      if (!checkComment) return res.status(404).send("Comment Not Found");

      const getUsers = await Users.find(
        {
          _id: { $in: checkComment.LikedBy },
        },
        {
          Name: 1,
          PicURL: 1,
          Username: 1,
        }
      );

      return res.send(getUsers);
    } else {
      return res.status(404).send("Comment Not Found");
    }
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

module.exports = router;
