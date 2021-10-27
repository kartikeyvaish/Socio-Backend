const mongoose = require("mongoose");

const chats = mongoose.model(
  "chats",
  new mongoose.Schema({
    participants: {
      type: [mongoose.Schema.ObjectId],
      required: true,
    },
    present: {
      type: [mongoose.Schema.ObjectId],
      required: true,
    },
    last_message_details: {
      type: Object,
      default: null,
    },
  })
);

exports.chats = chats;
