// an Array that contains all the users
const users = [];

// Join user to chat
export function userJoin(id: string, username: string, chat_id: string) {
    const user = { id, username, chat_id };

    users.push(user);

    return user;
}

// Get current user
export function getCurrentUser(id: string) {
    return users.find((user) => user.id === id);
}

// User leaves chat
export function userLeave(id: string) {
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) return users.splice(index, 1)[0];
}

// Get chat_id users
export function getRoomUsers(chat_id: string) {
    return users.filter((user) => user.chat_id === chat_id);
} 