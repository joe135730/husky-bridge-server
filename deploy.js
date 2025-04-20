#!/usr/bin/env node

/**
 * Production startup script for the husky-bridge server
 * This script ensures we load the production environment variables
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load production environment variables
try {
  const envPath = join(__dirname, '.env.production');
  
  // Check if the production env file exists
  if (fs.existsSync(envPath)) {
    console.log(`Loading production environment from ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    // Fallback to regular .env
    console.log('Production environment file not found, using default .env');
    dotenv.config();
  }
  
  console.log('Environment loaded successfully');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
} catch (error) {
  console.error('Error loading environment:', error);
}

// Import and run the server
import './index.js'; 