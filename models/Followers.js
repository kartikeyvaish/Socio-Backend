const mongoose = require("mongoose");

const Followers = mongoose.model(
  "Followers",
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
    FollowerOf: {
      type: String,
      required: true,
    },
  })
);

exports.Followers = Followers;
