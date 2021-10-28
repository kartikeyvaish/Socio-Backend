const Morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const express = require("express");

module.exports = function (app) {
  if (process.env.NODE_ENV === "development") app.use(Morgan("dev"));
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "50mb" }));
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
};
