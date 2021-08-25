const moment = require("moment");
const mongoose = require("mongoose");

const OTP = mongoose.model(
  "OTP",
  new mongoose.Schema({
    Verification: {
      type: Object,
      required: true,
    },
    CreatedAt: {
      type: Date,
      default: moment(),
      required: true,
    },
    ValidTill: {
      type: Date,
      default: moment(),
      required: true,
    },
    OTP: {
      type: String,
      required: true,
    },
  })
);

exports.OTP = OTP;
