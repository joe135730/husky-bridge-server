import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    reportedBy: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "Inappropriate Content",
        "Spam or Scam",
        "False or Misleading Information",
        "Other",
      ],
    },
    comments: {
      type: String,
    },
    reportedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Deleted"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema); 