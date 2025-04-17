import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    _id: String,
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["STUDENT", "ADMIN"],
      required: true,
    },
    dob: Date,
    loginId: String,
    lastActivity: Date,
    totalActivity: String,
  },
  { collection: "users" }
);
export default userSchema;
