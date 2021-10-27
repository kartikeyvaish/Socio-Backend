const mongoose = require("mongoose");
const moment = require("moment");

const notifications = mongoose.model(
  "notifications",
  new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    operation_type_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    notification_type: {
      type: String,
      enum: ["like", "comment"],
      default: "like",
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
    },
    notify_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    created_at: {
      type: Date,
      default: moment(),
    },
  })
);

exports.notifications = notifications;
