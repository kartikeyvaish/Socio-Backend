const mongoose = require("mongoose");

const Posts = mongoose.model(
  "Posts",
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
    Location: {
      type: String,
      default: "",
    },
    Caption: {
      type: String,
      default: "",
    },
    File: {
      type: String,
      required: true,
    },
    FileURL: {
      type: String,
      required: true,
    },
    Preview: {
      type: String,
      default: "",
    },
    Width: {
      type: Number,
      default: 0,
    },
    Height: {
      type: Number,
      default: 0,
    },
    PreviewURL: {
      type: String,
      default: "",
    },
    ProfilePicture: {
      type: String,
      default: "",
    },
    FileType: {
      type: String,
      required: true,
    },
    Likes: {
      type: Number,
      default: 0,
    },
    Comments: {
      type: Number,
      default: 0,
    },
    Mime: {
      type: String,
      default: "",
    },
    DateTime: {
      type: Date,
      default: new Date(),
    },
  })
);

exports.Posts = Posts;
