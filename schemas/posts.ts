// Packages imports 
import mongoose from "mongoose";

// types imports
import { PostSchemaInterface } from "../types/SchemaTypes";

// Create PostsSchema
const PostsSchema = new mongoose.Schema<PostSchemaInterface>({
    caption: { type: String, default: "" },
    post_owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    file: {
        type: {
            _id: { type: String },
            uri: { type: String },
            mimeType: { type: String },
            width: { type: Number },
            height: { type: Number },
            public_id: { type: String },
            duration: { type: Number, default: 0 },
        },
        required: true
    },
    thumbnail_image: {
        type: {
            _id: { type: String },
            uri: { type: String },
            mimeType: { type: String },
            width: { type: Number },
            height: { type: Number },
            public_id: { type: String },
        },
    },
    location: { type: String, default: "" },
    post_datetime: { type: Date, default: Date.now },
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
});

// Exports
export default PostsSchema;