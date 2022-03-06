// Packages imports
import mongoose from "mongoose";

// types imports
import { MessagesSchemaInterface } from "../types/SchemaTypes";

// Messages Schema
const MessagesSchema = new mongoose.Schema<MessagesSchemaInterface>({
    message: { type: String },
    chat_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    message_type: {
        type: String, required: true,
        enum: ["text", "image", "video", "audio"]
    },
    read: { type: Boolean, default: false },
    message_file: {
        _id: { type: String },
        uri: { type: String },
        mimeType: { type: String },
        width: { type: Number },
        height: { type: Number },
        public_id: { type: String },
        duration: { type: Number }
    },
    thumbnail_image: {
        _id: { type: String },
        uri: { type: String },
        mimeType: { type: String },
        width: { type: Number },
        height: { type: Number },
        public_id: { type: String },
    },
    deleted_for: { type: [mongoose.Schema.Types.ObjectId], required: true },
    message_datetime: { type: Date, default: Date.now }
});

// exports
export default MessagesSchema;
