const mongoose = require("mongoose");

const requests = mongoose.model(
  "requests",
  new mongoose.Schema({
    user_id: { type: mongoose.Schema.ObjectId, ref: "users", required: true },
    request_sent_to: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: true,
    },
  })
);

exports.requests = requests;
