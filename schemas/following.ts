// Packages imports 
import mongoose from "mongoose";

// types imports
import { FollowingSchemaInterface } from "../types/SchemaTypes";

// Create FollowingSchema
const FollowingSchema = new mongoose.Schema<FollowingSchemaInterface>({
    people: { type: [mongoose.Schema.Types.ObjectId], ref: "users", default: [] },
    following_of: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, unique: true }
});

// Exports
export default FollowingSchema;