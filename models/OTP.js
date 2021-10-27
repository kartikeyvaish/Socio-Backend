const moment = require("moment");
const mongoose = require("mongoose");

const OTP_TIME_LIMIT = 600; // 10 minutes

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
      expires: OTP_TIME_LIMIT,
    },
    OTP: {
      type: String,
      required: true,
    },
  })
);

exports.OTP = OTP;
