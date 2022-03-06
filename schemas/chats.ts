// Packages imports
import mongoose from "mongoose";

// types imports
import { ChatsSchemaInterface } from "../types/SchemaTypes";

// Chats Schema
const ChatsSchema = new mongoose.Schema<ChatsSchemaInterface>({
    active_participants: { type: [mongoose.Schema.Types.ObjectId], ref: "users", required: true },
    members: { type: [mongoose.Schema.Types.ObjectId], ref: "users", required: true },
    last_message: { type: Object, default: null },
    created_at: { type: Date },
    updated_at: { type: Date },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// exports
export default ChatsSchema;
