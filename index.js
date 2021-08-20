const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const config = require("./config/Configurations");

const Posts = require("./routes/Posts");
const User = require("./routes/Users");

const db_url = `mongodb://${process.env.host}:${process.env.DB_PORT}/${process.env.DB_Name}`;

mongoose
  .connect(db_url, config.db_config)
  .then(() => console.log(`Connected to ${process.env.DB_Name} Mongo DB...`))
  .catch((error) => console.error(config.messages.serverError, error));

const app = express();
require("./config/Production")(app);
app.use(express.static(path.join(__dirname, "/public")));

app.use(process.env.apiVersion + process.env.auth, User);
app.use(process.env.apiVersion + process.env.posts, Posts);

app.get("*", (req, res) => {
  res.status(404).sendFile(__dirname + "/views/404.html");
});

app.listen(config.Port, () => console.log(`Listening on ${config.Port}..`));
