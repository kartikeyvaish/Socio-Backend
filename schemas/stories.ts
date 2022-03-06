// Packages imports
import mongoose from "mongoose";

// types imports
import { StoriesSchemaInterface } from "../types/SchemaTypes";

// time limit for an Story
// 24 hours in seconds
const STORY_TIME_LIMIT = 86400;

// Story Schema Schema
const StoriesSchema = new mongoose.Schema<StoriesSchemaInterface>({
    file: {
        type: {
            _id: { type: String },
            uri: { type: String },
            mimeType: { type: String },
            width: { type: Number },
            height: { type: Number },
            public_id: { type: String },
            duration: { type: Number, default: 0 },
            datetime: { type: Date, default: Date.now, expires: STORY_TIME_LIMIT, },
        },
        required: true,
    },
    story_owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    viewed_by: { type: [mongoose.Schema.Types.ObjectId], ref: "users", default: [] },
});

// exports
export default StoriesSchema;
