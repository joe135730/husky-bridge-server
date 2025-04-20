import express from 'express';
import cors from "cors";
import mongoose from "mongoose";
import * as dotenv from 'dotenv';
import session from 'express-session';

import UserRoutes from './Users/routes.js';
import PostRoutes from './Posts/routes.js';
import ChatRoutes from './Chat/routes.js'; // or adjust path if needed
import ReportRoutes from './Reports/routes.js'; // Import Reports routes

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
  origin: true, // Allow all origins that include credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Set-Cookie',
    'X-Debug-User-Role'  // Add our custom debug header
  ]
}));

// Session configuration - must come before routes
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true only in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax' // 'lax' is more permissive than 'strict' but still secure
    }
  })
);

// Parse JSON request bodies
app.use(express.json());

// Add a middleware to ensure session is available
app.use((req, res, next) => {
  if (!req.session) {
    console.error('Session not initialized');
  }
  next();
});

// Register routes
UserRoutes(app);
PostRoutes(app);
ChatRoutes(app);

// Mount Reports routes with proper path
app.use('/api', ReportRoutes);

const PORT = process.env.PORT || 4000;

//  Add a catch-all for 404s
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});