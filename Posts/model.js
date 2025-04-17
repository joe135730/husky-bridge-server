import mongoose from "mongoose";
import postSchema from "./schema.js";

const model = mongoose.model("Posts", postSchema);
export default model; 