// Local Imports 
import users from "../models/users";

// Create Indexes for Models

// Create index for Users
async function CreateIndexes() {
    users.collection.createIndex({
        name: "text",
        username: "text",
    });
}

// export index creation function
export default CreateIndexes;
