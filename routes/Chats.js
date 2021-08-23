const express = require("express");
const _ = require("lodash");
const router = express.Router();
const moment = require("moment");

const config = require("../config/Configurations");

const { Helper } = require("../config/Helper");
const { Users } = require("../models/Users");
const { Chats } = require("../models/Chats");
const { Messsages } = require("../models/Message");
const { Followers } = require("../models/Followers");
const { Following } = require("../models/Following");
const { SendPushNotification } = require("../config/PushNotifications");
const { Posts } = require("../models/Posts");

const { CheckAdminAccess, CheckAuthToken } = Helper;
const BaseURL = process.env.BaseURL;

router.get("/get-all-chats", CheckAdminAccess, async (req, res) => {
  try {
    const chats = await Chats.find();
    return res.status(200).send({ ChatsCount: chats.length, Chats: chats });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-new-chat-users", CheckAuthToken, async (req, res) => {
  try {
    const allFollowing = await Following.find({
      FollowingOf: req.body.CalledBy._id.toString(),
    });

    const allFollowers = await Followers.find({
      UserID: req.body.CalledBy._id.toString(),
    });

    const FollowingList = allFollowing.map((item) => item.UserID);
    const FollowersList = allFollowers.map((item) => item.FollowerOf);

    const allUsers = await Users.find(
      {
        $or: [{ _id: { $in: FollowingList } }, { _id: { $in: FollowersList } }],
      },
      {
        Name: 1,
        Username: 1,
        PicURL: 1,
      }
    ).limit(10);
    return res.send(allUsers);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-all-chats-for-user", CheckAuthToken, async (req, res) => {
  try {
    const chats = await Chats.find({
      $or: [
        {
          "UserOne.UserID": req.body.CalledBy._id.toString(),
        },
        {
          "UserTwo.UserID": req.body.CalledBy._id.toString(),
        },
      ],
    });
    return res.status(200).send({ ChatsCount: chats.length, Chats: chats });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/start-chat", CheckAuthToken, async (req, res) => {
  try {
    const UserOne = await Users.findOne({ _id: req.body.CalledBy._id });

    const UserTwo = await Users.findOne({ _id: req.body.Start_With });

    if (!UserTwo) return res.send("User Not Found");

    const checkChat = await Chats.findOne({
      $or: [
        {
          "UserOne.UserID": req.body.CalledBy._id.toString(),
          "UserTwo.UserID": req.body.Start_With.toString(),
        },
        {
          "UserOne.UserID": req.body.Start_With.toString(),
          "UserTwo.UserID": req.body.CalledBy._id.toString(),
        },
      ],
    });
    if (checkChat) return res.send(checkChat);

    const newChat = new Chats({
      UserOne: {
        Name: UserOne.Name,
        Username: UserOne.Username,
        ProfilePicture: UserOne.PicURL,
        UserID: UserOne._id.toString(),
      },
      UserTwo: {
        Name: UserTwo.Name,
        Username: UserTwo.Username,
        ProfilePicture: UserTwo.PicURL,
        UserID: UserTwo._id.toString(),
      },
      LastMessageDetails: null,
    });

    await newChat.save();

    return res.send(newChat);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/send-message", CheckAuthToken, async (req, res) => {
  try {
    const checkChat = await Chats.findOne({
      _id: req.body.RoomID,
    });
    if (!checkChat) return res.status(404).send("Chat Not Found");

    const OtherUser =
      checkChat.UserOne.UserID === req.body.CalledBy._id
        ? checkChat.UserTwo
        : checkChat.UserOne;

    const OwnerUser =
      checkChat.UserOne.UserID === req.body.CalledBy._id
        ? checkChat.UserOne
        : checkChat.UserTwo;

    const newMessage = new Messsages({
      ...req.body,
      MessageOwner: req.body.CalledBy._id,
      DateTime: moment(),
    });

    if (newMessage.MessageType === "File") {
      newMessage.FileURL = `${process.env.apiVersion}/chats/file/${newMessage._id}`;
      newMessage.FilePreviewURL = `${process.env.apiVersion}/chats/preview/${newMessage._id}`;
    }

    await newMessage.save();

    const createdMessage = _.omit(newMessage.toObject(), [
      "File",
      "FilePreview",
    ]);

    checkChat.LastMessageDetails = createdMessage;
    await checkChat.save();

    res.status(200).send(createdMessage);

    if (req.body?.Notify) {
      const sendTo = await Users.findOne({ _id: req.body.MessageReciever });
      if (sendTo) {
        await SendPushNotification({
          PushToken: sendTo.PushToken,
          Data: {
            showInForeGround: "true",
            GoTo: "FollowRequests",
          },
          notification: {
            body:
              req.body.MessageType === "Text"
                ? `${OwnerUser.Username}: ${req.body.Message}`
                : `${OwnerUser.Username} has sent you ${
                    req.body.FileMIME.slice(0, 5) === "image"
                      ? "an image"
                      : "a video"
                  }`,
            title: "Socio",
            image:
              req.body.MessageType === "Text"
                ? null
                : BaseURL + newMessage.FilePreviewURL,
          },
        });
      }
    }
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/send-post-as-message", CheckAuthToken, async (req, res) => {
  try {
    console.log(req.body);

    const post = await Posts.findOne({ _id: req.body.PostID });

    if (!post) return res.status(404).send("Post Not Found");

    let tempPost = _.pick(post.toObject(), [
      "_id",
      "Caption",
      "PreviewURL",
      "ProfilePicture",
      "Username",
      "Name",
    ]);

    const UserOne = await Users.findOne({ _id: req.body.CalledBy._id });

    const UserTwo = await Users.findOne({ _id: req.body.MessageReciever });

    if (!UserTwo) return res.status(404).send("User Not Found");

    let checkChat = await Chats.findOne({
      $or: [
        {
          "UserOne.UserID": req.body.CalledBy._id.toString(),
          "UserTwo.UserID": req.body.MessageReciever.toString(),
        },
        {
          "UserOne.UserID": req.body.MessageReciever.toString(),
          "UserTwo.UserID": req.body.CalledBy._id.toString(),
        },
      ],
    });

    if (checkChat) {
      const newMessage = new Messsages({
        Message: req.body.Message.toString(),
        MessageReciever: req.body.MessageReciever.toString(),
        MessageType: "Post",
        MessageOwner: req.body.CalledBy._id,
        DateTime: moment(),
        RoomID: checkChat._id,
        PostDetails: tempPost,
      });

      await newMessage.save();

      checkChat.LastMessageDetails = newMessage;
      await checkChat.save();

      await SendPushNotification({
        PushToken: UserTwo.PushToken,
        Data: {
          showInForeGround: "true",
          bigPictureUrl: BaseURL + UserOne.PicURL,
          bigLargeIconUrl: BaseURL + UserOne.PicURL,
          largeIconUrl: BaseURL + UserOne.PicURL,
        },
        notification: {
          body: `${UserOne.Username} has sent you a post`,
          title: "Socio",
          image: BaseURL + UserOne.PicURL,
        },
      });

      return res.send(newMessage);
    } else {
      const newChat = new Chats({
        UserOne: {
          Name: UserOne.Name,
          Username: UserOne.Username,
          ProfilePicture: UserOne.PicURL,
          UserID: UserOne._id.toString(),
        },
        UserTwo: {
          Name: UserTwo.Name,
          Username: UserTwo.Username,
          ProfilePicture: UserTwo.PicURL,
          UserID: UserTwo._id.toString(),
        },
        LastMessageDetails: null,
      });

      await newChat.save();

      const newMessage = new Messsages({
        Message: req.body.Message.toString(),
        MessageReciever: req.body.MessageReciever.toString(),
        MessageType: "Post",
        MessageOwner: req.body.CalledBy._id,
        DateTime: moment(),
        RoomID: newChat._id,
        PostDetails: tempPost,
      });

      await newMessage.save();

      newChat.LastMessageDetails = newMessage;
      await newChat.save();

      await SendPushNotification({
        PushToken: UserTwo.PushToken,
        Data: {
          showInForeGround: "true",
          bigPictureUrl: BaseURL + UserOne.PicURL,
          bigLargeIconUrl: BaseURL + UserOne.PicURL,
          largeIconUrl: BaseURL + UserOne.PicURL,
        },
        notification: {
          body: `${UserOne.Username} has sent you a post`,
          title: "Socio",
          image: BaseURL + UserOne.PicURL,
        },
      });

      return res.send(newMessage);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-messages", CheckAuthToken, async (req, res) => {
  try {
    if (!req.query.RoomID) return res.status(404).send("Room ID is required");

    const checkRoom = await Chats.findOne({
      _id: req.query.RoomID,
    });
    if (!checkRoom) return res.status(404).send("Room Not Found");

    let LastMessageFilter = req.query?.LastMessageID
      ? { _id: { $lt: req.query.LastMessageID } }
      : {};

    const allMessages = await Messsages.find(
      {
        ...LastMessageFilter,
        RoomID: req.query.RoomID,
      },
      {
        File: 0,
        FilePreview: 0,
      }
    )
      .sort({ _id: -1 })
      .limit(10);
    return res.send(allMessages);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.delete("/delete-chat", CheckAuthToken, async (req, res) => {
  try {
    if (!req.query?.RoomID) return res.status(404).send("Room ID is required");

    const getChat = await Chats.findOne({ _id: req.query.RoomID });
    if (!getChat) return res.status(404).send("Chat Not Found");

    await Messsages.deleteMany(
      {
        RoomID: req.query.RoomID,
      },
      {},
      async () => await getChat.delete()
    );

    return res.send("Chat Deleted");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/file/:id", async (req, res) => {
  try {
    const post = await Messsages.findById({ _id: req.params.id });

    let toSendPicture = post ? post.File : process.env.defaultProfileImage;

    if (post.FileMIME.slice(0, 5) === "image") {
      const ReplacedBASE = toSendPicture.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const File = Buffer.from(ReplacedBASE, "base64");
      res.writeHead(200, {
        "Content-Type": post.FileMIME,
        "Content-Length": File.length,
      });
      res.end(File);
    } else if (post.FileMIME.slice(0, 5) === "audio") {
      const ReplacedBASE = toSendPicture.replace(
        /^data:audio\/\w+;base64,/,
        ""
      );
      const File = Buffer.from(ReplacedBASE, "base64");
      res.writeHead(200, {
        "Content-Type": post.FileMIME,
        "Content-Length": File.length,
      });
      res.end(File);
    } else if (post.FileMIME.slice(0, 5) === "video") {
      const ReplacedBASE = toSendPicture.replace(
        /^data:video\/\w+;base64,/,
        ""
      );
      const File = Buffer.from(ReplacedBASE, "base64");
      res.writeHead(200, {
        "Content-Type": post.FileMIME,
        "Content-Length": File.length,
      });
      res.end(File);
    }
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/preview/:id", async (req, res) => {
  try {
    const post = await Messsages.findById({ _id: req.params.id });

    let toSendPicture = post
      ? post.FilePreview
      : process.env.defaultProfileImage;

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

router.put("/mark-as-read", CheckAuthToken, async (req, res) => {
  try {
    if (req.query?.RoomID?.length) {
      const chat = await Chats.findOne({ _id: req.query.RoomID });
      if (!chat) return res.status(404).send("Chat Not Found");

      if (
        chat.LastMessageDetails?.MessageReciever.toString() ===
        req.body.CalledBy._id.toString()
      ) {
        chat.LastMessageDetails = { ...chat.LastMessageDetails, Read: true };
        await chat.save();
      }

      Messsages.updateMany(
        {
          MessageReciever: req.body.CalledBy._id,
          Read: false,
        },
        { $set: { Read: true } },
        {},
        () => res.send("You have read all messages in this thread.")
      );
    } else {
      return res.status(404).send("Room ID is required");
    }
  } catch (error) {
    return res.status(500).send("Error");
  }
});

module.exports = router;
