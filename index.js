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

// CORS domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://husky-bridge.netlify.app',
  'https://husky-bridge.netlify.com',
  'https://husky-bridge-app.netlify.app',
  'https://main--husky-bridge.netlify.app' // Add the main Netlify domain
];

// Configure CORS to accept credentials
app.use(cors({
  credentials: true,
  origin: function(origin, callback) {
    console.log("Incoming request from origin:", origin);
    
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow all origins during development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("Origin not in allowed list but allowing:", origin);
      return callback(null, true); // Allow all origins for now to debug
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Set-Cookie',
    'X-Debug-User-Role'
  ],
  exposedHeaders: ['Set-Cookie']
}));

// Debugging middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'Unknown'}`);
  console.log("Cookies:", req.headers.cookie);
  next();
});

// Session configuration - must come before routes
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust the reverse proxy
    cookie: {
      secure: process.env.NODE_ENV === 'production', // True in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
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