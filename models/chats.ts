// Packages imports
import mongoose from "mongoose";

// Local imports  
import ChatsSchema from "../schemas/chats";
import { ChatsSchemaInterface } from "../types/SchemaTypes";

// chats Model
const chats = mongoose.model<ChatsSchemaInterface>("chats", ChatsSchema);

// Exporting the chats model
export default chats;