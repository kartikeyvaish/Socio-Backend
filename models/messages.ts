// Packages imports
import mongoose from "mongoose";

// Local imports   
import MessagesSchema from "../schemas/messages";
import { MessagesSchemaInterface } from "../types/SchemaTypes";

// messages Model
const messages = mongoose.model<MessagesSchemaInterface>("messages", MessagesSchema);

// Exporting the messages model
export default messages;