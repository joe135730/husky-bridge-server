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
export const findUserById = (userId) => model.findById(userId);
export const findUserByEmail = (email) => model.findOne({ email: email });
export const findUserByCredentials = (email, password) => 
    model.findOne({ email, password });
export const updateUser = (userId, user) => 
    model.updateOne({ _id: userId }, { $set: user });
export const deleteUser = (userId) => model.deleteOne({ _id: userId });