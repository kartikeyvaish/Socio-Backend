// package and other modules 
import express from "express";

// static imports   
import { createChat, deleteChat, getChats, getMessages, getNewChatUsers, markMessagesAsRead, searchChatUsers, sendMessage } from "../controllers/chats";
import { UserAuth } from "../middlewares/AuthValidator";
import { validateChatIDBody, validateGetMessagesBody, validateNewChatBody, validateSearchPeople, validateSendMessageBody } from "../middlewares/ChatsValidator";
import Multer from "../utils/Multer";

// Chat Messages Upload configs
const ChatMessageConfigs = [
    { name: "message_file", maxCount: 1 },
    { name: "thumbnail_image", maxCount: 1 },
]

// Initialize router
const router = express.Router();

const ChatsRoutes = router;

// get all chats
ChatsRoutes.get("/get-chats", UserAuth, getChats);

// get users whom you have chat with
ChatsRoutes.get("/get-new-chat-users", UserAuth, getNewChatUsers);

// create chat
ChatsRoutes.post("/get-or-create-chat", UserAuth, validateNewChatBody, createChat);

// Delete a chat
ChatsRoutes.delete("/delete-chat", UserAuth, validateChatIDBody, deleteChat);

// get messages
ChatsRoutes.get("/get-messages", UserAuth, validateGetMessagesBody, getMessages);

// Send message to a chat
ChatsRoutes.post("/send-message", Multer.fields(ChatMessageConfigs), UserAuth, validateSendMessageBody, sendMessage);

// Search for chat users
ChatsRoutes.get("/search-chat-users", UserAuth, validateSearchPeople, searchChatUsers);

// mark messages as read
ChatsRoutes.put("/mark-messages-as-read", UserAuth, validateChatIDBody, markMessagesAsRead);

// export router
export default ChatsRoutes;
