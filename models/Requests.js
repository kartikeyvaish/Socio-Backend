const mongoose = require("mongoose");

const Requests = mongoose.model(
  "Requests",
  new mongoose.Schema({
    RequestedBy: {
      type: Object,
      required: true,
    },
    RequestedTo: {
      type: Object,
      required: true,
    },
  })
);

exports.Requests = Requests;
