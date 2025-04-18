import model from "./model.js";

// Create a new message
export const createMessage = (message) => model.create(message);

// Find all messages in a room
export const findMessagesByRoomId = (roomId) =>
    model.find({ roomId }).sort({ timestamp: 1 });

// (Optional) Find messages between two users (if needed for DMs)
export const findMessagesBetweenUsers = (user1, user2) =>
    model.find({
        $or: [
            { senderId: user1, receiverId: user2 },
            { senderId: user2, receiverId: user1 }
        ]
    }).sort({ timestamp: 1 });
