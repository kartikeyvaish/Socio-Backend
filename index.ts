// Importing Packages
import express from "express";
import mongoose from "mongoose";
import path from "path";
import * as dotenv from 'dotenv';
dotenv.config()

// Socket Setup
import { createServer } from "http";
import { Server } from "socket.io";
import { userJoin, getCurrentUser, userLeave, getRoomUsers } from "./utils/Socket";

// Importing files
import CreateIndexes from "./config/modelndexes";
import db_configs from "./config/db_configs";
import messages from "./config/messages";
import production from "./config/production";

// Importing routes 
import ChatsRoutes from "./routes/chats";
import OTPRoutes from "./routes/otp";
import PeopleRoutes from "./routes/people";
import PostsRoute from "./routes/posts";
import ProfileRoutes from "./routes/profile";
import StoriesRouter from "./routes/stories";
import UserRoutes from "./routes/users";

// Connect to MongoDB
mongoose
    .connect(db_configs.db_url)
    .then(() => {
        console.log(`Connected to ${process.env.DB_Name} Mongo DB...`)
        CreateIndexes();
    })
    .catch((error) => console.error(messages.serverError, error));

// Express app initialization
const app = express();

// Configuring Express to use static files
app.use(express.static(path.join(__dirname, "")));

// Configuring Express app for production
production(app);

// Wrapping Express app with Socket.io 
const server = createServer(app);
const io = new Server(server);

// Socket listeners
io.on("connection", socket => {
    socket.on("joinRoom", ({ username, chat_id }) => {
        const user = userJoin(socket.id, username, chat_id);

        socket.join(user.chat_id);

        io.to(user.chat_id).emit("roomUsers", {
            chat_id: user.chat_id,
            users: getRoomUsers(user.chat_id),
        });
    });

    socket.on("chatMessage", msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.chat_id).emit("message", msg);
    });

    socket.on("type-update", msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.chat_id).emit("type-update-emitter", msg);
    });

    socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.chat_id).emit("roomUsers", {
                chat_id: user.chat_id,
                users: getRoomUsers(user.chat_id),
            });
        }
    });
});

// Add Routes
app.use(process.env.apiVersion + process.env.chats, ChatsRoutes);
app.use(process.env.apiVersion + process.env.otp, OTPRoutes);
app.use(process.env.apiVersion + process.env.posts, PostsRoute);
app.use(process.env.apiVersion + process.env.people, PeopleRoutes);
app.use(process.env.apiVersion + process.env.profile, ProfileRoutes);
app.use(process.env.apiVersion + process.env.stories, StoriesRouter);
app.use(process.env.apiVersion + process.env.auth, UserRoutes);

// Add a 404 error handler
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname + "/views/404.html"));
});

// Server listening on port
server.listen(db_configs.Port, () =>
    console.log(`Mode = ${process.env.NODE_ENV} and Listening on ${db_configs.Port}..`)
);