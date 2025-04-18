import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    roomId: { type: String, required: true },  // could be postId or user-pair ID
    senderId: { type: String, required: true }, // currentUser._id
    receiverId: { type: String, required: true }, // the user they're chatting with
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, {
    collection: "chat"
});

export default chatSchema;
