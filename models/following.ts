// Packages imports
import mongoose from "mongoose";

// Local imports     
import FollowingSchema from "../schemas/following";
import { FollowingSchemaInterface } from "../types/SchemaTypes";

// following Model
const following = mongoose.model<FollowingSchemaInterface>("following", FollowingSchema);

// Exporting the following model
export default following;