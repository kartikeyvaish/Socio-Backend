// Packages imports
import mongoose from "mongoose";

// Local imports    
import StoriesSchema from "./../schemas/stories";
import { StoriesSchemaInterface } from "../types/SchemaTypes";

// stories Model
const stories = mongoose.model<StoriesSchemaInterface>("stories", StoriesSchema);

// Exporting the stories model
export default stories;