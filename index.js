import express from 'express';
import cors from "cors";
import mongoose from "mongoose";
import * as dotenv from 'dotenv';
import session from 'express-session';

import UserRoutes from './Users/routes.js';

// Load environment variables
try {
  dotenv.config();
  console.log("Environment variables loaded successfully");
} catch (error) {
  console.error("Error loading environment variables:", error);
}

const CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017/husky-bridge";

// MongoDB connection with logging
mongoose.connect(CONNECTION_STRING)
  .then(() => {
    console.log('Successfully connected to MongoDB at:', CONNECTION_STRING);
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Add MongoDB connection error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

const app = express();

// Configure CORS to accept credentials
app.use(cors({
  credentials: true,
  origin: ['http://localhost:5173', 'http://localhost:3000'] // Add your frontend URLs
}));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

app.use(express.json());

UserRoutes(app);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});