// packages imports 
import { Request, Response } from "express";
import mongoose from "mongoose";

// Local imports   
import chats from "../models/chats";
import messages from "../models/messages";
import MESSAGES from "../config/messages";
import following from "../models/following";
import users from "../models/users";
import { UploadChatFile } from "../helper/Chats";
import { send_push_to_user } from "../helper/PushNotifications";

// function to get chats
export async function getChats(req: Request, res: Response) {
    try {
        const user_id = req.body.user_details._id;
        // Get all chats of the user
        // Get objects in which the user_id is in active_participants array
        const allChats = await chats.aggregate([
            {
                $match: {
                    active_participants: { $all: [user_id] },
                    last_message: { $ne: null }
                },
            },
            // Sort by last_modified
            {
                $sort: {
                    last_modified: -1,
                },
            },
            {
                $addFields: {
                    other_user: {
                        $filter: {
                            input: "$members",
                            as: "participant",
                            cond: { $ne: ["$$participant", user_id] },
                        },
                    },
                },
            },
            // Change other_user to user_details
            {
                $lookup: {
                    from: "users",
                    localField: "other_user",
                    foreignField: "_id",
                    as: "chatting_with",
                },
            },
            // change chatting_with array to object
            {
                $unwind: {
                    path: "$chatting_with",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Remove unnecessary fields from chatting_with object
            {
                $project: {
                    _id: 1,
                    last_message: 1,
                    chatting_with: {
                        _id: "$chatting_with._id",
                        name: "$chatting_with.name",
                        username: "$chatting_with.username",
                        profile_picture: "$chatting_with.profile_picture",
                    },
                    updated_at: 1,
                },
            },
        ]);

        return res.send({ chats: allChats, message: "List of all chats" });
    } catch (error) {
        return res.status(500).send({ message: MESSAGES.serverError });
    }
}

// get users whom you can chat with
export async function getNewChatUsers(req: Request, res: Response) {
    try {
        const current_user = req.body.user_details._id;

        // get list of people whom I follow
        const followingList = await following.findOne({ following_of: current_user });

        if (!followingList)
            return res.status(400).send({ message: "You are not following anyone. Follow someone to start a conversation", people: [] });

        // Get users who are in followingList

        const people = await users.find({ _id: { $in: followingList.people } }, {
            _id: 1,
            name: 1,
            username: 1,
            profile_picture: 1,
        }).sort({
            name: 1,
        });

        return res.send({ people, message: "List of people whom you can chat with" });
    } catch (error) {
        return res.status(500).send({ message: MESSAGES.serverError });
    }
}

// get search results for new chat users
export async function searchChatUsers(req: Request, res: Response) {
    try {
        // get user id
        const user_id = req.body.user_details._id;

        // get search query
        const search_query = req.body.query;

        // get list of people whom I follow
        const followingList = await following.findOne({ following_of: user_id });

        const peopleList = await users.aggregate([
            // Match the query
            {
                $match: {
                    name: { $regex: search_query, $options: "i" },
                    username: { $regex: search_query, $options: "i" },

                    $or: [
                        { _id: { $in: followingList.people } },
                        { private_profile: false }
                    ],
                    _id: { $ne: user_id },
                },
            },
            // Keep only required fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    username: 1,
                    profile_picture: 1,
                }
            }
        ]);

        // return filtered users
        return res.send({ users: peopleList });
    } catch (error) {
        return res.status(500).send({ message: MESSAGES.serverError });
    }
}

// create new chat
export async function createChat(req: Request, res: Response) {
    try {
        // Current user
        const current_user = req.body.user_details._id;
        // Called user
        const called_user_id = req.body.user_id;

        // Check if chat already exists
        // which has current user and called user together in members array
        const chat = await chats.findOne({
            members: {
                $all: [current_user, called_user_id]
            }
        });

        // If chat exists
        if (chat) {
            // If chat exists then check if current_user is in active_participants array
            // if not then add it
            if (chat.active_participants.findIndex(item => item.toString() === current_user.toString()) === -1) {
                chat.active_participants.push(current_user);
                await chat.save();
            }

            return res.send({ chat: chat, message: "Chat already exists" });
        }

        // Create new chat
        const newChat = new chats({
            members: [current_user, called_user_id],
            active_participants: [current_user, called_user_id],
            last_message: null,
        });

        // save chat
        await newChat.save();

        // return chat
        return res.send({ chat: newChat, message: "Chat created successfully" });
    } catch (error) {
        // return error
        return res.status(500).send({ message: MESSAGES.serverError });
    }
}

// function to delete chat
export async function deleteChat(req: Request, res: Response) {
    try {
        // get chat id
        const chat_id = req.body.chat_id;
        // get user id
        const user_id = req.body.user_details._id;

        // find chat
        const chat = await chats.findById(chat_id);

        // if chat not found
        if (!chat)
            return res.status(404).send({ message: "Chat Not Found" });

        // if user is not in chat
        if (!chat.members.includes(user_id))
            return res.status(403).send({ message: MESSAGES.unauthorized });

        // if user is not in active participants
        if (!chat.active_participants.includes(user_id))
            return res.status(403).send({ message: MESSAGES.unauthorized });

        // remove user from active participants
        chat.active_participants = chat.active_participants.filter(
            (user) => user.toString() !== user_id.toString()
        );

        // add current user to all the messages document's deleted_for array
        await messages.updateMany(
            { chat_id: chat_id },
            { $push: { deleted_for: user_id } }
        );

        // if active participants is empty then delete chat
        // else update chat
        if (chat.active_participants.length === 0)
            await chat.delete();
        else
            await chat.save();

        // return chat
        return res.send({ message: "Chat deleted successfully" });
    } catch (error) {
        // return error
        return res.status(500).send({ message: MESSAGES.serverError });
    }
}

// function to get messages for a chat
export async function getMessages(req: Request, res: Response) {
    try {
        // Check if chat room id is provided
        if (!req.body.chat_id)
            return res.status(400).send({ message: "Chat room id is required" });

        const validID = mongoose.isValidObjectId(req.body.chat_id);
        if (!validID) return res.status(400).json({ message: "Invalid Chat ID" });

        // get the _id and convert it to objectID
        const chat_id = new mongoose.Types.ObjectId(req.body.chat_id);

        const chatRoom = await chats.findById(chat_id);
        if (!chatRoom) return res.status(400).send({ message: "Chat Missing" });

        // count of messages to be returned
        const count = req.body.count ? parseInt(req.body.count) : 10;

        // no of messages to be skipped
        const skip = req.body.skip ? parseInt(req.body.skip) : 0;

        // Write the same query using aggregation pipeline
        // Match the chat_id
        // Get only those messages in whose deleted_for array does not contain current user
        const messages_list = await messages.aggregate([
            {
                $match: {
                    chat_id: chat_id,
                    deleted_for: { $nin: [req.body.user_details._id] },
                },
            },
            {
                $sort: { _id: -1 },
            },
            {
                $skip: skip ? skip : 0,
            },
            {
                $limit: count ? count : 10,
            },
            // remove some fields
            {
                $project: {
                    __v: 0,
                    deleted_for: 0
                }
            }
        ]);

        return res
            .status(200)
            .send({ messages_count: messages_list.length, messages: messages_list });
    } catch (error) {
        return res.status(500).send({ message: MESSAGES.serverError });
    }
}

// fucntion to send messages
export async function sendMessage(req: Request, res: Response) {
    try {
        // constants
        const chat_id = req.body.chat_id;
        const user_id = req.body.user_details._id;

        // check if chat exists
        const chat = await chats.findById(chat_id);
        if (!chat) return res.status(400).send({ message: "Chat Missing" });

        // check if user is in chat
        if (!chat.members.includes(user_id))
            return res.status(403).send({ message: MESSAGES.unauthorized });

        // reciever id
        const reciever_id_index = chat.members.findIndex(item => item.toString() !== user_id.toString());
        const reciever_id = chat.members[reciever_id_index];

        // create new message
        const newMessage = new messages({
            chat_id: chat_id,
            message: req.body.message,
            message_type: req.body.message_type,
            sender_id: user_id,
            read: req.body.read ? req.body.read : false,
        });

        if (req.body.message_type !== "text") {
            const destination = `Socio/chats/${chat_id}/`;

            const uploaded_file = await UploadChatFile(
                destination,
                req.body.message_file,
                req.body.mimeType
            );

            if (uploaded_file.ok) {
                newMessage.message_file = uploaded_file.file;
            } else return res.status(500).send({ message: MESSAGES.serverError });

            if (req.body.message_type === "video") {
                const thumb_upload = await UploadChatFile(
                    destination,
                    req.body.thumbnail_image,
                    req.body.thumbnail_mimeType
                );

                if (thumb_upload.ok) {
                    newMessage.thumbnail_image = thumb_upload.file;
                } else return res.status(500).send({ message: MESSAGES.serverError });
            }
        }

        // Send Notification
        if (newMessage.read === false) {
            let notification_payload = {
                title: req.body.user_details.name,
                body: `${req.body.user_details.name} has sent a message - ${req.body.message}`,
                imageUrl: req.body.user_details.profile_picture,
            };
            await send_push_to_user(reciever_id, notification_payload);
        }

        await newMessage.save();
        // update chat last message
        chat.last_message = newMessage;

        // update chat active participants
        // if user is not in active participants then add it
        if (!chat.active_participants.includes(user_id))
            chat.active_participants.push(user_id);

        // save chat
        await chat.save();

        return res.send({ new_message: newMessage, message: "Message sent successfully" });
    } catch (error) {
        return res.status(500).send({ message: MESSAGES.serverError });
    }
}

// mark messages as read
export async function markMessagesAsRead(req: Request, res: Response) {
    try {
        let current_user = req.body.user_details._id;
        let chat_id = req.body.chat_id;

        // check if chat exists
        const chat = await chats.findById(chat_id);
        if (!chat) return res.status(400).send({ message: "Chat Missing" });

        // check if user is in chat
        if (!chat.members.includes(current_user))
            return res.status(403).send({ message: MESSAGES.unauthorized });

        // mark all messages as read
        const response = await messages.updateMany(
            { chat_id: chat_id, read: false, sender_id: { $ne: current_user } },
            { $set: { read: true } }
        );

        // update the last message to read as well if sender_id is not current user
        if (chat.last_message.sender_id.toString() !== current_user.toString()) {
            chat.last_message = { ...chat.last_message, read: true };
            await chat.save();
        }

        return res.send({ message: "Messages marked as read" });
    } catch (error) {
        return res.status(500).send({ message: MESSAGES.serverError });
    }
}