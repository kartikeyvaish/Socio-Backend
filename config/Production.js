const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const express = require("express");

module.exports = function (app) {
  if (process.env.NODE_ENV !== "production") {
    const morgan = require("morgan");
    app.use(morgan("dev"));
  }
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
};
