const mongoose = require("mongoose");

const posts = mongoose.model(
  "posts",
  new mongoose.Schema({
    user_id: { type: mongoose.Schema.ObjectId, ref: "users" },
    location: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      default: "",
    },
    file: {
      type: String,
      required: true,
    },
    preview_file: {
      type: String,
      default: "",
    },
    dimensions: {
      type: Object,
      default: {
        width: 0,
        height: 0,
      },
    },
    mime_type: {
      type: String,
      default: "",
    },
    posted_on: {
      type: Date,
      default: new Date(),
    },
  })
);

exports.posts = posts;
