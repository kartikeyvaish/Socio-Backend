const mongoose = require("mongoose");
const moment = require("moment");

const Likes = mongoose.model(
  "Likes",
  new mongoose.Schema({
    UserID: {
      type: String,
      required: true,
    },
    Username: {
      type: String,
      required: true,
    },
    Name: {
      type: String,
      required: true,
    },
    ProfilePicture: {
      type: String,
      required: true,
    },
    PostID: {
      type: String,
      required: true,
    },
    DateTime: {
      type: Date,
      default: moment(),
    },
  })
);

exports.Likes = Likes;
