const mongoose = require("mongoose");
const moment = require("moment");

const comments = mongoose.model(
  "comments",
  new mongoose.Schema({
    comment_text: { type: String, required: true },
    user_id: { type: mongoose.Schema.ObjectId, ref: "users", required: true },
    post_id: { type: mongoose.Schema.ObjectId, ref: "posts", required: true },
    commented_on: { type: Date, default: moment() },
  })
);

exports.comments = comments;
