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
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Session cookie settings:", {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
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

// Trust proxy - important for apps behind a reverse proxy (Render, Heroku, etc)
app.set('trust proxy', 1);

// Configure CORS to accept credentials
app.use(cors({
  credentials: true,
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://husky-bridge.netlify.app',
    'https://husky-bridge.netlify.com'
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
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // In production, force secure to true when sameSite is 'none'
      // This is critical for cross-domain cookies to work
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (increased from 1 day)
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      // Add domain setting if in production
      ...(process.env.NODE_ENV === 'production' && {
        domain: process.env.COOKIE_DOMAIN || '.onrender.com'
      })
    },
    rolling: true, // Refresh the cookie on each response
  })
);

// Parse JSON request bodies
app.use(express.json());

// Add more detailed middleware to debug session issues
app.use((req, res, next) => {
  // Only log once per minute per session to avoid excessive logging
  const now = Date.now();
  const sessionLastLogged = req.session._lastLogged || 0;
  
  if (now - sessionLastLogged > 60000) { // 1 minute
    console.log(`Session debug [${req.method} ${req.path}]:`, {
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      userExists: !!req.session?.currentUser,
      userID: req.session?.currentUser?._id,
      role: req.session?.currentUser?.role || 'none',
      cookieSettings: req.session?.cookie?._expires ? {
        expires: req.session.cookie._expires,
        maxAge: req.session.cookie.maxAge,
        secure: req.session.cookie.secure,
        httpOnly: req.session.cookie.httpOnly,
        sameSite: req.session.cookie.sameSite,
        domain: req.session.cookie.domain
      } : 'No cookie info'
    });
    
    // Update last logged timestamp
    req.session._lastLogged = now;
  }
  
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