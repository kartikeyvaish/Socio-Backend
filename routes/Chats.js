// package and other modules
const express = require("express");
const moment = require("moment");
const mongoose = require("mongoose");
const multer = require("multer");

// static imports
const { AdminAuth, UserAuth } = require("../schemas/Auth");
const { chats } = require("../models/Chats");
const MESSAGES = require("../config/messages");
const { messages } = require("../models/Messages");
const {
  MessageSchema,
  ValidateMessageReqBody,
} = require("../schemas/Messages");
const { UploadToCloudinary } = require("../utils/cloudinary");
const { users } = require("../models/Users");

// Initialize router
const router = express.Router();

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });
const file_message_config = [
  {
    name: "file",
    maxCount: 1,
  },
  {
    name: "preview_file",
    maxCount: 1,
  },
];

// Get List of all Chats in Database
router.get("/get-all-chats-list", AdminAuth, async (req, res) => {
  try {
    const chats_list = await chats.find();

    return res.status(200).send({ Chats: chats_list });
  } catch (error) {
    return res.status(500).send(MESSAGES.serverError);
  }
});

// Create a chatRoom
router.post("/create-chat", UserAuth, async (req, res) => {
  try {
    if (req.body.user_details._id.toString() === req.body.user_id)
      return res.status(400).send(MESSAGES.invalidChatCreation);

    const otherPerson = await users.findOne({ _id: req.body.user_id });
    if (!otherPerson) return res.status(400).send(MESSAGES.invalidChatCreation);

    // Check if chatRoom already exists, i.e., req.body.user_details._id and req.body.user_id are  in a participants array in any document in chats collection
    const chatRoomExists = await chats.findOne({
      participants: {
        $all: [req.body.user_details._id, req.body.user_id],
      },
    });

    const participants = [
      req.body.user_details._id,
      mongoose.Types.ObjectId(req.body.user_id),
    ];

    if (chatRoomExists) {
      let responseData = {
        _id: chatRoomExists._id,
        last_message_details: chatRoomExists.last_message_details,
        chatting_with: {
          _id: req.body.user_id,
          Name: otherPerson.Name,
          Username: otherPerson.Username,
          ProfilePicture: otherPerson.ProfilePicture,
        },
      };

      return res.status(200).send({ Room: responseData });
    }

    const chat_room = new chats({
      participants: participants,
      present: participants,
    });

    await chat_room.save();

    let responseData = {
      _id: chat_room._id,
      last_message_details: chat_room.last_message_details,
      chatting_with: {
        _id: req.body.user_id,
        Name: otherPerson.Name,
        Username: otherPerson.Username,
        ProfilePicture: otherPerson.ProfilePicture,
      },
    };

    return res.status(200).send({ Room: responseData });
  } catch (error) {
    return res.status(500).send(MESSAGES.serverError);
  }
});

// Get chats for a user who is present in present array in a document in chats collection
router.get("/get-chats-for-user", UserAuth, async (req, res) => {
  try {
    const chats_list = await chats.aggregate([
      {
        $match: {
          present: { $all: [req.body.user_details._id] },
        },
      },
      {
        $addFields: {
          other_user: {
            $filter: {
              input: "$participants",
              as: "participant",
              cond: { $ne: ["$$participant", req.body.user_details._id] },
            },
          },
        },
      },
      // Change other_user to user_details
      {
        $lookup: {
          from: "users",
          localField: "other_user",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                Name: 1,
                Username: 1,
                ProfilePicture: 1,
              },
            },
          ],
          as: "chatting_with",
        },
      },
      // change chatting_with array to object
      {
        $unwind: {
          path: "$chatting_with",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unnecessary fields
      {
        $project: {
          participants: 0,
          present: 0,
          other_user: 0,
          __v: 0,
        },
      },
    ]);

    return res.status(200).send({ Chats: chats_list });
  } catch (error) {
    return res.status(500).send(MESSAGES.serverError);
  }
});

// Delete chatRoom for a user, i.e, remove that user from present array in a document in chats collection, also delete the chat Document if the present array is empty
router.delete("/delete-chat", UserAuth, async (req, res) => {
  try {
    const chatRoom = await chats.findOne({ _id: req.body._id });
    if (!chatRoom) return res.status(200).send(MESSAGES.chatMissing);

    const index = chatRoom.present.indexOf(req.body.user_details._id);
    if (index > -1) chatRoom.present.splice(index, 1);

    if (chatRoom.present.length === 0) await chatRoom.delete();
    else await chatRoom.save();

    return res.status(200).send(MESSAGES.chatDeleted);
  } catch (error) {
    return res.status(500).send(MESSAGES.serverError);
  }
});

// Create a message.
router.post(
  "/send-message",
  upload.fields(file_message_config),
  UserAuth,
  ValidateMessageReqBody,
  async (req, res) => {
    try {
      // Check if room exists
      let chatRoom = await chats.findOne({ _id: req.body.room_id });
      if (!chatRoom) return res.status(400).send(MESSAGES.chatMissing);

      // create newMessage object
      const newMessage = new messages({
        room_id: mongoose.Types.ObjectId(req.body.room_id),
        user_id: mongoose.Types.ObjectId(req.body.user_id),
        reciever_id: mongoose.Types.ObjectId(
          chatRoom.participants[0].toString() === req.body.user_id.toString()
            ? chatRoom.participants[1]
            : chatRoom.participants[0]
        ),
        message_type: req.body.message_type,
        mime_type: req.body.mime_type || "",
        message: req.body.message,
        read: req.body.read || false,
        message_datetime: moment(),
      });

      // Update the last_message_details field in the chatRoom document
      chatRoom.last_message_details = {
        _id: newMessage._id,
        message_type: newMessage.message_type,
        message_datetime: newMessage.message_datetime,
        message: newMessage.message,
        read: req.body.read || false,
        user_id: mongoose.Types.ObjectId(req.body.user_id),
        reciever_id: mongoose.Types.ObjectId(
          chatRoom.participants[0].toString() === req.body.user_id.toString()
            ? chatRoom.participants[1]
            : chatRoom.participants[0]
        ),
      };

      // If the message is a file, then save the file in the server and save the file name in the message
      if (req.body.message_type === "file") {
        const destination = `chats/${req.body.room_id}/`;
        const fileUploadResponse = await UploadToCloudinary(
          req.body.file,
          destination
        );

        if (fileUploadResponse?.url?.length)
          newMessage.file = fileUploadResponse.url;
        else return res.status(500).send(MESSAGES.serverError);

        const previewUploadResponse = await UploadToCloudinary(
          req.body.preview_file,
          destination
        );
        if (previewUploadResponse?.url?.length)
          newMessage.preview_file = previewUploadResponse.url;
        else return res.status(500).send(MESSAGES.serverError);
      }
      // If message is post
      else if (req.body.message_type === "post")
        newMessage.post_id = mongoose.Types.ObjectId(req.body.post_id);

      await newMessage.save();

      // Save the ChatRoom document
      await chatRoom.save();

      return res.status(200).send(newMessage);
    } catch (error) {
      return res.status(500).send(MESSAGES.serverError);
    }
  }
);

// Get messages from a chatRoom in batches of 10 messages in descending order of _id, i.e, from the latest message to the oldest message
router.get("/get-messages", UserAuth, async (req, res) => {
  try {
    const chatRoom = await chats.findOne({ _id: req.query.room_id });
    if (!chatRoom) return res.status(400).send(MESSAGES.chatMissing);

    // const messages_list = await messages
    //   .find({
    //     room_id: mongoose.Types.ObjectId(req.query.room_id),
    //   })
    //   .sort({ _id: -1 })
    //   .skip(parseInt(req.query.skip))
    //   .limit(parseInt(req.query.limit || 10));

    // Write the same query using aggregation pipeline
    const messages_list = await messages.aggregate([
      {
        $match: {
          room_id: mongoose.Types.ObjectId(req.query.room_id),
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $skip: parseInt(req.query.skip),
      },
      {
        $limit: parseInt(req.query.limit || 10),
      },
      // if message_type is post, then include post_details field in the response
      {
        $lookup: {
          from: "posts",
          localField: "post_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                caption: 1,
                preview_file: 1,
                user_id: 1,
              },
            },
          ],
          as: "post_details",
        },
      },
      // Change post_details array to an object
      {
        $unwind: {
          path: "$post_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Add Name, Username and ProfilePicture fields to the post_details object
      {
        $lookup: {
          from: "users",
          localField: "post_details.user_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                Name: 1,
                Username: 1,
                ProfilePicture: 1,
              },
            },
          ],
          as: "post_details.user_details",
        },
      },
      // Change post_details.user_details array to an object
      {
        $unwind: {
          path: "$post_details.user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unnecessary fields
      {
        $project: {
          room_id: 0,
          __v: 0,
        },
      },
    ]);

    return res
      .status(200)
      .send({ MessagesCount: messages_list.length, Messages: messages_list });
  } catch (error) {
    return res.status(500).send(MESSAGES.serverError);
  }
});

// Update all messages where reciever_id is equal to req.body.user_details._id as read, and chatRoom _id is req.body.room_id
router.put("/mark-as-read", UserAuth, async (req, res) => {
  try {
    const chatRoom = await chats.findOne({ _id: req.body.room_id });
    if (!chatRoom) return res.status(400).send(MESSAGES.chatMissing);

    await messages.updateMany(
      {
        room_id: mongoose.Types.ObjectId(req.body.room_id),
        reciever_id: mongoose.Types.ObjectId(req.body.user_details._id),
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    // Update the last_message_details.read to true field in the chatRoom document if user is the reciever

    if (
      chatRoom.last_message_details.reciever_id.toString() ===
      req.body.user_details._id.toString()
    ) {
      chatRoom.last_message_details = {
        ...chatRoom.last_message_details,
        read: true,
      };
      await chatRoom.save();
    }

    return res.status(200).send("Marked as Read");
  } catch (error) {
    return res.status(500).send(MESSAGES.serverError);
  }
});

// export router
module.exports = router;
