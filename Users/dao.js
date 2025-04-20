import model from "./model.js";
import { v4 as uuidv4 } from 'uuid';

// Create Users
export const createUser = (user) => {
    // Use the provided role or default to "STUDENT"
    const newUser = { 
        ...user, 
        _id: uuidv4(),
        role: user.role || "STUDENT",
        lastActivity: new Date(),
        totalActivity: "0"
    };
    return model.create(newUser);
};
  
export const findAllUsers = () => model.find();

// Updated to handle UUID format
export const findUserById = async (userId) => {
    const user = await model.findOne({ _id: userId });
    return user;
};

export const findUserByEmail = (email) => model.findOne({ email: email });
export const findUserByCredentials = (email, password) => 
    model.findOne({ email, password });
export const updateUser = (userId, userUpdates) =>
  model.findOneAndUpdate({ _id: userId }, { $set: userUpdates }, { new: true });
export const deleteUser = (userId) => model.deleteOne({ _id: userId });