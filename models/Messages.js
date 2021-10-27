const mongoose = require("mongoose");
const moment = require("moment");

const messages = mongoose.model(
  "messages",
  new mongoose.Schema({
    room_id: {
      type: mongoose.Schema.ObjectId,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    user_id: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    reciever_id: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    message_type: {
      type: String,
      enum: ["text", "file", "post"],
      default: "text",
    },
    file: {
      type: String,
    },
    preview_file: {
      type: String,
    },
    mime_type: {
      type: String,
    },
    message_datetime: {
      type: Date,
      default: moment(),
    },
    read: {
      type: Boolean,
      default: false,
    },
    post_id: {
      type: mongoose.Schema.ObjectId,
    },
  })
);

exports.messages = messages;
