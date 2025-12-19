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
} catch (error) {
  console.error("Error loading environment variables:", error);
}

const CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017/husky-bridge";

if (!CONNECTION_STRING) {
  console.error('MONGO_CONNECTION_STRING environment variable is not set!');
}

// MongoDB connection options for better reliability and automatic reconnection
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server (5 seconds)
  socketTimeoutMS: 45000, // How long to wait for a socket operation (45 seconds)
  connectTimeoutMS: 10000, // How long to wait for initial connection (10 seconds)
  maxPoolSize: 10, // Maximum number of connections in the connection pool
  minPoolSize: 2, // Minimum number of connections in the connection pool
  retryWrites: true, // Enable retryable writes
  retryReads: true, // Enable retryable reads
  heartbeatFrequencyMS: 10000, // How often to check connection health (10 seconds)
};

// Function to connect to MongoDB with automatic reconnection
const connectMongoDB = async () => {
  try {
    await mongoose.connect(CONNECTION_STRING, mongooseOptions);
    const maskedConnection = CONNECTION_STRING.replace(/:([^:@]+)@/, ':****@');
    console.log('Successfully connected to MongoDB at:', maskedConnection);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errorLabels: error.errorLabels
    });
    // Retry connection after 5 seconds
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectMongoDB, 5000);
  }
};

// Initial connection
connectMongoDB();

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected - attempting to reconnect...');
  // Automatically reconnect when disconnected
  connectMongoDB();
});

mongoose.connection.on('reconnected', () => {
  const maskedConnection = CONNECTION_STRING.replace(/:([^:@]+)@/, ':****@');
  console.log('MongoDB reconnected successfully at:', maskedConnection);
});

mongoose.connection.on('connecting', () => {
  console.log('MongoDB connecting...');
});

const app = express();

// Trust proxy - important for apps behind a reverse proxy (AWS ALB, etc)
app.set('trust proxy', 1);

// Configure CORS to accept credentials
app.use(cors({
  credentials: true,
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://huskybridge.link',
    'https://husky-bridge-alb-384228871.us-east-2.elb.amazonaws.com',
    /^https:\/\/husky-bridge-alb-.*\.us-east-2\.elb\.amazonaws\.com$/,
    /^https:\/\/.*\.elb\.amazonaws\.com$/  // Support HTTPS ALB
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
let sessionStore;
try {
  sessionStore = MongoStore.create({
    mongoUrl: CONNECTION_STRING,
    dbName: 'husky-bridge',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day in seconds
    autoRemove: 'native', // Use MongoDB's native TTL index
    touchAfter: 24 * 3600, // Lazy session update (only update if session is older than 1 day)
  });
  
  // Handle session store connection errors
  sessionStore.on('error', (error) => {
    console.error('MongoDB session store error:', error);
  });
  
  sessionStore.on('connected', () => {
    console.log('MongoDB session store connected');
  });
  
  sessionStore.on('disconnected', () => {
    console.log('MongoDB session store disconnected');
  });
} catch (error) {
  console.error('Error creating session store:', error);
  // Continue without session store - sessions won't persist but app won't crash
  sessionStore = undefined;
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid', // Explicit session cookie name
    store: sessionStore,
    cookie: {
      // HTTPS enabled - cookies must use secure: true
      secure: true, // Required for HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      // For cross-domain cookies with HTTPS, sameSite must be 'none'
      sameSite: 'none', // Required for cross-domain cookies with HTTPS
      // Don't set domain - let browser use default (current domain)
      // path: '/' is default, which is correct
    }
  })
);

// Parse JSON request bodies with increased size limit for file uploads
// Default is 100kb, increased to 50MB to match nginx client_max_body_size
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple health check endpoint (before session middleware to avoid dependencies)
// This is used by ECS and ALB health checks
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isHealthy = mongoStatus === 1; // Only healthy if actually connected (not just connecting)
  
  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      mongodb: 'connected',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      mongodb: mongoStatus === 0 ? 'disconnected' : mongoStatus === 2 ? 'connecting' : 'disconnecting',
      timestamp: new Date().toISOString()
    });
  }
});

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