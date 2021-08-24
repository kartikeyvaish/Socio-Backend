const mongoose = require("mongoose");
const moment = require("moment");

const NotificationTypes = [
  {
    name: "PostLiked",
    navigateTo: "PostDetails",
  },
  {
    name: "Commneted",
    navigateTo: "Comments",
  },
];

const Notifications = mongoose.model(
  "Notifications",
  new mongoose.Schema({
    UserID: {
      type: String,
      required: true,
    },
    PrefixPicture: {
      type: String,
      required: true,
    },
    SuffixPicture: {
      type: String,
      default: null,
    },
    content: {
      type: String,
      required: true,
    },
    notificationType: {
      type: Object,
      default: null,
    },
    DateTime: {
      type: Date,
      default: moment(),
    },
    OperationID: {
      type: String,
      required: true,
    },
    PostID: {
      type: String,
      required: true,
    },
    OperationType: {
      type: String,
      required: true,
    },
    OperationOwner: {
      type: String,
      required: true,
    },
  })
);

exports.Notifications = Notifications;
exports.NotificationTypes = NotificationTypes;
