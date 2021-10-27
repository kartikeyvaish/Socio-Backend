const mongoose = require("mongoose");

const followers = mongoose.model(
  "followers",
  new mongoose.Schema({
    user_id: { type: mongoose.Schema.ObjectId, ref: "users", required: true },
    follower_id: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: true,
    },
  })
);

exports.followers = followers;
