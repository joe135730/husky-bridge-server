import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    userId: { type: String, required: true },  // UUID of the user who created the post
    title: { type: String, required: true },
    postType: { type: String, enum: ['request', 'offer'], required: true },
    category: { type: String, enum: ['general', 'housing', 'tutoring', 'lend-borrow'], required: true },
    location: { type: String, required: true },
    availability: { type: Date, required: true },
    description: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    acceptedBy: { type: String, default: null },  // UUID of the user who accepted the post
    status: { type: String, enum: ['active', 'pending', 'completed'], default: 'active' }
}, {
    collection: "posts"
});

export default postSchema; 