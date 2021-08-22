const mongoose = require("mongoose");

const Comments = mongoose.model(
  "Comments",
  new mongoose.Schema({
    UserID: {
      type: String,
      required: true,
    },
    Username: {
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
    PostOwnerID: {
      type: String,
      required: true,
    },
    Comment: {
      type: String,
      required: true,
    },
    LikedBy: {
      type: Array,
      default: [],
    },
    DateTime: {
      type: Date,
      default: new Date(),
    },
  })
);

exports.Comments = Comments;
