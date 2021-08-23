const mongoose = require("mongoose");

const Chats = mongoose.model(
  "Chats",
  new mongoose.Schema({
    UserOne: {
      type: Object,
      required: true,
      unique: true,
    },
    UserTwo: {
      type: Object,
      required: true,
      unique: true,
    },
    LastMessageDetails: {
      type: Object,
      default: {},
    },
  })
);

exports.Chats = Chats;
