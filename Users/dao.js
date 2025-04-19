import model from "./model.js";
import { v4 as uuidv4 } from 'uuid';

// Create Users
export const createUser = (user) => {
    const newUser = { 
        ...user, 
        _id: uuidv4(),
        role: "STUDENT",
        lastActivity: new Date(),
        totalActivity: "0"
    };
    return model.create(newUser);
};
  
export const findAllUsers = () => model.find();

// Updated to handle UUID format
export const findUserById = async (userId) => {
    console.log("Looking up user with ID:", userId); // Debug log
    const user = await model.findOne({ _id: userId });
    console.log("Found user:", user); // Debug log
    return user;
};

export const findUserByEmail = (email) => model.findOne({ email: email });
export const findUserByCredentials = (email, password) => 
    model.findOne({ email, password });
export const updateUser = (userId, userUpdates) =>
  model.findOneAndUpdate({ _id: userId }, { $set: userUpdates }, { new: true });
export const deleteUser = (userId) => model.deleteOne({ _id: userId });