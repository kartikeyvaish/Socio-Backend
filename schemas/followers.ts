// Packages imports 
import mongoose from "mongoose";

// types imports
import { FollowersSchemaInterface } from "../types/SchemaTypes";

// Create FollowersSchema
const FollowersSchema = new mongoose.Schema<FollowersSchemaInterface>({
    people: { type: [mongoose.Schema.Types.ObjectId], ref: "users", default: [] },
    follower_of: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, unique: true }
});

// Exports
export default FollowersSchema;