// Packages imports
import mongoose from "mongoose";

// Local imports   
import ResetRequestSchema from './../schemas/resetrequests';
import { ResetRequestSchemaInterface } from "../types/SchemaTypes";

// ResetRequest Model
const resetrequests = mongoose.model<ResetRequestSchemaInterface>("resetrequests", ResetRequestSchema);

// Exporting the ResetRequest model
export default resetrequests;