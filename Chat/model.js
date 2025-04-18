import mongoose from "mongoose";
import chatSchema from "./schema.js";

const model = mongoose.model("Chat", chatSchema);
export default model;
