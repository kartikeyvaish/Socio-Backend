const mongoose = require("mongoose");

const users = mongoose.model(
  "users",
  new mongoose.Schema({
    Name: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      required: true,
      unique: true,
    },
    Username: {
      type: String,
      required: true,
      unique: true,
    },
    ProfilePicture: {
      type: String,
      default: process.env.default_profile_picture || "",
    },
    Token: {
      type: String,
      default: "",
    },
    PushNotificationToken: {
      type: String,
      default: "",
    },
    Password: {
      type: String,
      required: true,
    },
    Bio: {
      type: String,
      default: "",
    },
    EmailVerified: {
      type: Boolean,
      default: false,
    },
    AccountVerified: {
      type: Boolean,
      default: false,
    },
    Private: {
      type: Boolean,
      default: false,
    },
    Admin: {
      type: Boolean,
      default: false,
    },
  })
);

exports.users = users;
