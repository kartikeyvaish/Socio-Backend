const Morgan = require("morgan"); // Delete this line while deployement
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const express = require("express");

module.exports = function (app) {
  app.use(Morgan("dev")); // Delete this line while deployement
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
};
