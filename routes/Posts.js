const express = require("express");
const moment = require("moment");
const router = express.Router();

const config = require("../config/Configurations");

const { Posts } = require("../models/Posts");
const { Helper } = require("../config/Helper");
const { Likes } = require("../models/Likes");
const { Followers } = require("../models/Followers");
const { Comments } = require("../models/Comments");
const { Notifications } = require("../models/Notifications");

const { CheckAdminAccess, CheckAuthToken } = Helper;

router.get("/get-all-posts", CheckAdminAccess, async (req, res) => {
  try {
    const posts = await Posts.find({}, { UserID: 1, Username: 1, FileType: 1 });
    return res.status(200).send({ PostsCount: posts.length, Posts: posts });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-feed-for-user*", CheckAuthToken, async (req, res) => {
  try {
    let newID = req.query?.lastID ? req.query.lastID : null;

    let DateFilter = newID ? { _id: { $lt: newID } } : {};

    const allFollowing = await Followers.find(
      {
        UserID: req.body.CalledBy._id,
      },
      { FollowerOf: 1 }
    );

    const tempFollow = allFollowing.map((s) => s.FollowerOf.toString());

    const feedPosts = await Posts.find(
      {
        ...DateFilter,
        $or: [
          { UserID: { $in: tempFollow } },
          { UserID: req.body.CalledBy._id },
        ],
      },
      {
        File: 0,
        Preview: 0,
      }
    )
      .sort({ DateTime: -1 })
      .limit(10);

    let finalResult = feedPosts.map((item) => item.toObject());
    for (let index = 0; index < finalResult.length; index++) {
      const findLike = await Likes.findOne({
        UserID: req.body.CalledBy._id,
        PostID: finalResult[index]._id.toString(),
      });

      if (findLike) {
        finalResult[index].LikedByUser = true;
      } else {
        finalResult[index].LikedByUser = false;
      }
    }

    return res.status(200).send(finalResult);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/get-all-posts-for-user", CheckAuthToken, async (req, res) => {
  try {
    const posts = await Posts.find(
      { UserID: req.body.UserID },
      { UserID: 1, Username: 1, FileType: 1, Likes: 1, Comments: 1 }
    );
    return res.status(200).send({ PostsCount: posts.length, Posts: posts });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/create-new-post", CheckAuthToken, async (req, res) => {
  try {
    if (req.body?.File?.length && req.body?.FileType?.length) {
      const newPost = new Posts({
        UserID: req.body.CalledBy._id,
        Username: req.body.CalledBy.Username,
        Name: req.body.CalledBy.Name,
        DateTime: moment(),
        ProfilePicture: `${process.env.apiVersion}/auth/users/${req.body.CalledBy._id}`,
        ...req.body,
        Location: req.body.Location,
        Caption: req.body.Caption,
      });

      newPost.FileURL = `${process.env.apiVersion}/posts/file/${newPost._id}`;
      newPost.PreviewURL = `${process.env.apiVersion}/posts/preview/${newPost._id}`;

      await newPost.save();
      return res.status(200).send("Post Created");
    }
    return res.status(404).send(config.messages.fileMissing);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.delete("/delete-post", CheckAuthToken, async (req, res) => {
  try {
    if (req.query?.PostID) {
      const checkPost = await Posts.findOne({ _id: req.query.PostID });
      if (checkPost.UserID.toString() === req.body.CalledBy._id.toString()) {
        if (!checkPost) return res.status(404).send("Post Not Found");

        await Likes.deleteMany({ PostID: req.query.PostID });
        await Comments.deleteMany({ PostID: req.query.PostID });
        await Notifications.deleteMany({ PostID: req.query.PostID });

        await checkPost.delete();

        return res.status(200).send("Post Removed");
      }
      return res
        .status(401)
        .send("You are not the owner of post hence you cannot remove it.");
    }
    return res.status(404).send("Post Not Found");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-post-details", CheckAuthToken, async (req, res) => {
  try {
    const post = await Posts.findOne(
      { _id: req.query.postID },
      { File: 0, Preview: 0 }
    );
    if (!post) return res.status(404).send("Post Not Found");

    let result = post.toObject();
    result.LikedByUser = false;

    const checkLikes = await Likes.findOne({
      UserID: req.body.CalledBy._id,
      PostID: req.query.postID,
    });

    if (checkLikes) result.LikedByUser = true;

    return res.send(result);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/preview/:id", async (req, res) => {
  try {
    const post = await Posts.findById({ _id: req.params.id });

    let toSendPicture = "";
    if (post) {
      toSendPicture = post.Preview;
    } else {
      toSendPicture = process.env.defaultProfileImage;
    }

    const ReplacedBASE = toSendPicture.replace(/^data:image\/\w+;base64,/, "");
    const Preview = Buffer.from(ReplacedBASE, "base64");
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": Preview.length,
    });
    res.end(Preview);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/file/:id", async (req, res) => {
  try {
    const post = await Posts.findById({ _id: req.params.id });

    let toSendPicture = "";
    if (post) {
      toSendPicture = post.File;
    } else {
      toSendPicture = process.env.defaultProfileImage;
    }

    if (post.FileType === "image") {
      const ReplacedBASE = toSendPicture.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const File = Buffer.from(ReplacedBASE, "base64");
      res.writeHead(200, {
        "Content-Type": post.Mime,
        "Content-Length": File.length,
      });
      res.end(File);
    } else {
      const ReplacedBASE = toSendPicture.replace(
        /^data:video\/\w+;base64,/,
        ""
      );
      const File = Buffer.from(ReplacedBASE, "base64");
      res.writeHead(200, {
        "Content-Type": post.Mime,
        "Content-Length": File.length,
      });
      res.end(File);
    }
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

module.exports = router;
