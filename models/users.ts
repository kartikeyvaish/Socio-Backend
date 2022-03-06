// Packages imports
import mongoose from "mongoose";

// Local imports 
import UsersSchema from "../schemas/users";
import { UserSchemaInterface } from "../types/SchemaTypes";

// Create Model
const users = mongoose.model<UserSchemaInterface>("users", UsersSchema);

// Exports
export default users;