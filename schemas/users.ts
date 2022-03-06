// Packages imports
import mongoose from "mongoose";

// types imports
import { UserSchemaInterface } from "../types/SchemaTypes";

// Create UsersSchema
const UsersSchema = new mongoose.Schema<UserSchemaInterface>({
    name: {
        type: String,
        required: true,
    },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    profile_picture: {
        type: String,
        default: process.env.default_profile_picture || "",
    },
    phone: {
        type: String,
        default: "",
    },
    two_factor_enabled: {
        type: Boolean,
        default: false,
    },
    push_notification_token: {
        type: String,
        default: "",
    },
    allow_push_notification: {
        type: Boolean,
        default: true,
    },
    password: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        default: "",
    },
    account_verified: {
        type: Boolean,
        default: false,
    },
    private_profile: {
        type: Boolean,
        default: false,
    },
    account_created_at: {
        type: Date,
        default: Date.now,
    },
    last_updated_at: {
        type: Date,
        default: Date.now,
    },
});

// Exports
export default UsersSchema;