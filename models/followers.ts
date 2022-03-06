// Packages imports
import mongoose from "mongoose";

// Local imports    
import FollowersSchema from "../schemas/followers";
import { FollowersSchemaInterface } from "../types/SchemaTypes";

// followers Model
const followers = mongoose.model<FollowersSchemaInterface>("followers", FollowersSchema);

// Exporting the followers model
export default followers;