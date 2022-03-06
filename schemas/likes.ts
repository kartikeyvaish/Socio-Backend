// Packages imports 
import mongoose from "mongoose";

// types imports
import { LikesSchemaInterface } from "../types/SchemaTypes";

// Create LikesSchema
const LikesSchema = new mongoose.Schema<LikesSchemaInterface>({
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: "posts", required: true },
    liked_by: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    like_datetime: { type: Date, default: Date.now },
});

// Exports
export default LikesSchema;