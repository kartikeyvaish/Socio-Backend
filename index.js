const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const config = require("./config/Configurations");

const Chats = require("./routes/Chats");
const Comments = require("./routes/Comments");
const Likes = require("./routes/Likes");
const Posts = require("./routes/Posts");
const Profile = require("./routes/Profile");
const User = require("./routes/Users");

mongoose
  .connect(process.env.atlasURL, config.db_config)
  .then(() => console.log(`Connected to ${process.env.DB_Name} Mongo DB...`))
  .catch((error) => console.error(config.messages.serverError, error));

const app = express();
require("./config/Production")(app);
app.use(express.static(path.join(__dirname, "/public")));

app.use(process.env.apiVersion + process.env.auth, User);
app.use(process.env.apiVersion + process.env.chats, Chats);
app.use(process.env.apiVersion + process.env.comments, Comments);
app.use(process.env.apiVersion + process.env.otps, OTP);
app.use(process.env.apiVersion + process.env.likes, Likes);
app.use(process.env.apiVersion + process.env.posts, Posts);
app.use(process.env.apiVersion + process.env.profile, Profile);

app.get("*", (req, res) => {
  res.status(404).sendFile(__dirname + "/views/404.html");
});

server.listen(config.Port, () => console.log(`Listening on ${config.Port}..`));
