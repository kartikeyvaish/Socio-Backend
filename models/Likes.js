const mongoose = require("mongoose");
const moment = require("moment");

const likes = mongoose.model(
  "likes",
  new mongoose.Schema({
    user_id: { type: mongoose.Schema.ObjectId, ref: "users", required: true },
    post_id: { type: mongoose.Schema.ObjectId, ref: "posts", required: true },
    liked_on: {
      type: Date,
      default: moment(),
    },
  })
);

exports.likes = likes;
