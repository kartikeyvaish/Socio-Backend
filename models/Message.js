const mongoose = require("mongoose");
const moment = require("moment");

const Messsages = mongoose.model(
  "Messsages",
  new mongoose.Schema({
    RoomID: {
      type: String,
      default: "",
    },
    Message: {
      type: String,
      default: "",
    },
    MessageOwner: {
      type: String,
      required: true,
    },
    MessageReciever: {
      type: String,
      required: true,
    },
    MessageType: {
      type: String,
      default: "",
    },
    File: {
      type: String,
      default: "",
    },
    FilePreview: {
      type: String,
      default: "",
    },
    FileURL: {
      type: String,
      default: "",
    },
    FilePreviewURL: {
      type: String,
      default: "",
    },
    FileMIME: {
      type: String,
      default: "",
    },
    DateTime: {
      type: Date,
      default: moment(),
    },
    Read: {
      type: Boolean,
      default: false,
    },
    PostDetails: {
      type: Object,
      default: null,
    },
  })
);

exports.Messsages = Messsages;
