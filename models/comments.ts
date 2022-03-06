// Packages imports
import mongoose from "mongoose";

// Local imports   
import CommentsSchema from './../schemas/comments';
import { CommentsSchemaInterface } from "../types/SchemaTypes";

// Commnents Model
const comments = mongoose.model<CommentsSchemaInterface>("comments", CommentsSchema);

// Exporting the Commnents model
export default comments;