import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Wait for Complete', 'Complete'], default: 'Pending' },
    completedAt: { type: Date, default: null }
}, { _id: false });

const postSchema = new mongoose.Schema({
    userId: { type: String, required: true },  // UUID of the user who created the post
    title: { type: String, required: true },
    postType: { type: String, enum: ['request', 'offer'], required: true },
    category: { type: String, enum: ['general', 'housing', 'tutoring', 'lend-borrow'], required: true },
    location: { type: String, required: true },
    availability: { type: Date, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // The overall status of the post
    status: { type: String, enum: ['Pending', 'In Progress', 'Wait for Complete', 'Complete'], default: 'Pending' },
    // Participants who have expressed interest in the post
    participants: [participantSchema],
    // The selected participant who was chosen by the post owner
    selectedParticipantId: { type: String, default: null },
    // Track completion status for both parties
    ownerCompleted: { type: Boolean, default: false },
    participantCompleted: { type: Boolean, default: false }
}, {
    collection: "posts"
});

export default postSchema; 