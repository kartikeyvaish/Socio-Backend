// Importing Packages
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// Importing files
const config = require("./config/config");
const messages = require("./config/messages");

// Socket Setup
const http = require("http");
const socketio = require("socket.io");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/chat_socket_users");

// Importing routes
const Chats = require("./routes/Chats");
const Comments = require("./routes/Comments");
const Likes = require("./routes/Likes");
const Notifications = require("./routes/Notifications");
const OTP = require("./routes/OTP");
const People = require("./routes/People");
const Posts = require("./routes/Posts");
const Profile = require("./routes/Profile");
const User = require("./routes/Users");

// Connect to MongoDB
mongoose
  .connect(config.db_url, config.db_config)
  .then(() => console.log(`Connected to ${process.env.DB_Name} Mongo DB...`))
  .catch((error) => console.error(messages.serverError, error));

// Express app initialization
const app = express();
// Configuring Express app for production
require("./config/Production")(app);
// Configuring Express to use static files
app.use(express.static(path.join(__dirname, "/public")));

// Wrapping Express app with Socket.io
const server = http.createServer(app);
const io = socketio(server);

// Socket listeners
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", msg);
  });

  socket.on("type-update", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("type-update-emitter", msg);
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

// Use these routes below
app.use(process.env.apiVersion + process.env.chats, Chats);
app.use(process.env.apiVersion + process.env.comments, Comments);
app.use(process.env.apiVersion + process.env.likes, Likes);
app.use(process.env.apiVersion + process.env.notifications, Notifications);
app.use(process.env.apiVersion + process.env.otp, OTP);
app.use(process.env.apiVersion + process.env.people, People);
app.use(process.env.apiVersion + process.env.posts, Posts);
app.use(process.env.apiVersion + process.env.profile, Profile);
app.use(process.env.apiVersion + process.env.auth, User);

// Server listening on port
server.listen(config.Port, () =>
  console.log(
    `Mode = ${process.env.NODE_ENV} and Listening on ${config.Port}..`
  )
);
