// Packages imports 
import mongoose from "mongoose";

// types imports
import { CommentsSchemaInterface } from "../types/SchemaTypes";

// Create CommentsSchema
const CommentsSchema = new mongoose.Schema<CommentsSchemaInterface>({
    comment: { type: String, required: true },
    commented_by: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    comment_datetime: { type: Date, default: Date.now, required: true },
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: "posts", required: true },
});

// Exports
export default CommentsSchema;