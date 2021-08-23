const mongoose = require("mongoose");

const Following = mongoose.model(
  "Following",
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
    FollowingOf: {
      type: String,
      required: true,
    },
  })
);

exports.Following = Following;
