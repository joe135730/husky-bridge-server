import express from 'express';
import cors from "cors";
import mongoose from "mongoose";
import * as dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import UserRoutes from './Users/routes.js';
import PostRoutes from './Posts/routes.js';
import ChatRoutes from './Chat/routes.js'; // or adjust path if needed
import ReportRoutes from './Reports/routes.js'; // Import Reports routes

// Load environment variables
try {
  dotenv.config();
  console.log("Environment variables loaded successfully");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Session cookie settings:", {
    secure: false, // HTTP (not HTTPS) - cookies won't work with secure: true
    sameSite: 'lax' // Works with HTTP, use 'none' only with HTTPS
  });
} catch (error) {
  console.error("Error loading environment variables:", error);
}

const CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017/husky-bridge";

// Diagnostic logging (without exposing password)
if (CONNECTION_STRING) {
  const maskedConnection = CONNECTION_STRING.replace(/:([^:@]+)@/, ':****@'); // Mask password
  console.log('MongoDB connection string configured:', maskedConnection);
  console.log('Connection string length:', CONNECTION_STRING.length);
  console.log('Connection string starts with mongodb:', CONNECTION_STRING.startsWith('mongodb'));
} else {
  console.error('MONGO_CONNECTION_STRING environment variable is not set!');
}

// MongoDB connection with logging
mongoose.connect(CONNECTION_STRING)
  .then(() => {
    const maskedConnection = CONNECTION_STRING.replace(/:([^:@]+)@/, ':****@');
    console.log('Successfully connected to MongoDB at:', maskedConnection);
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errorLabels: error.errorLabels
    });
  });

// Add MongoDB connection error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

const app = express();

// Trust proxy - important for apps behind a reverse proxy (Render, Heroku, etc)
app.set('trust proxy', 1);

// Configure CORS to accept credentials
app.use(cors({
  credentials: true,
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://husky-bridge-alb-384228871.us-east-2.elb.amazonaws.com',
    /^http:\/\/husky-bridge-alb-.*\.us-east-2\.elb\.amazonaws\.com$/,
    /^https:\/\/.*\.elb\.amazonaws\.com$/  // Support HTTPS ALB if configured
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Set-Cookie',
    'X-Debug-User-Role'  // Add our custom debug header
  ]
}));

// Session configuration - must come before routes
// Use MongoDB session store to persist sessions across server restarts and multiple ECS tasks
// This is critical for AWS ECS where multiple tasks might handle requests
const sessionStore = MongoStore.create({
  mongoUrl: CONNECTION_STRING,
  dbName: 'husky-bridge',
  collectionName: 'sessions',
  ttl: 24 * 60 * 60, // 1 day in seconds
  autoRemove: 'native', // Use MongoDB's native TTL index
  touchAfter: 24 * 3600, // Lazy session update (only update if session is older than 1 day)
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid', // Explicit session cookie name
    store: sessionStore,
    cookie: {
      // Note: secure should be true only when using HTTPS
      // Since ALB is using HTTP (port 80), we set secure to false
      // If you enable HTTPS on ALB later, change this to true
      secure: false, // Set to false for HTTP, true for HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      // For cross-domain (frontend and backend on different domains/ports)
      // Use 'none' with secure: true for HTTPS, or 'lax' for same-origin
      // Since we're on HTTP, 'lax' should work if same domain, but for cross-domain we need 'none'
      // However, 'none' requires secure: true, so we'll use 'lax' and ensure proper CORS
      sameSite: 'lax', // Use 'lax' for HTTP same-origin, 'none' for HTTPS cross-domain
      // Don't set domain - let browser use default (current domain)
      // path: '/' is default, which is correct
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