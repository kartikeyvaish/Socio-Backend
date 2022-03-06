// Packages imports
import mongoose from "mongoose";

// Local imports   
import LikesSchema from './../schemas/likes';
import { LikesSchemaInterface } from "../types/SchemaTypes";

// Likes Model
const likes = mongoose.model<LikesSchemaInterface>("likes", LikesSchema);

// Exporting the Likes model
export default likes;