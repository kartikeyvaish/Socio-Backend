// Packages imports
import mongoose from "mongoose";

// Local imports     
import FollowRequestsSchema from "../schemas/followrequests";
import { FollowRequestsSchemaInterface } from "../types/SchemaTypes";

// FollowRequestsModel Model
const followrequests = mongoose.model<FollowRequestsSchemaInterface>("followrequests", FollowRequestsSchema);

// Exporting the FollowRequestsModel model
export default followrequests;