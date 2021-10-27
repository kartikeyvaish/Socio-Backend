const mongoose = require("mongoose");

const followings = mongoose.model(
  "followings",
  new mongoose.Schema({
    user_id: { type: mongoose.Schema.ObjectId, ref: "users", required: true },
    following_id: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: true,
    },
  })
);

exports.followings = followings;
