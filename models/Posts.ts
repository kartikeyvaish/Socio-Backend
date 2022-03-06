// Packages imports
import mongoose from "mongoose";

// Local imports
import PostsSchema from './../schemas/posts';
import { PostSchemaInterface } from "../types/SchemaTypes";

// posts Model
const posts = mongoose.model<PostSchemaInterface>("posts", PostsSchema);

// Exporting the posts model
export default posts;