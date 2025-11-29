# ============================================
# BACKEND DOCKERFILE
# ============================================
# Multi-stage build for optimized production image
# Stage 1: Build stage (optional for Node.js, but good practice)
# Stage 2: Production stage

# Stage 1: Dependencies installation
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files first (Docker layer caching optimization)
# This layer only rebuilds if package.json changes
COPY package*.json ./

# Install all dependencies (including devDependencies for now)
RUN npm ci

# Stage 2: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (smaller image)
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Create non-root user for security (best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose the port the app runs on
EXPOSE 4000

# Health check to ensure container is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/auth/current', (r) => {process.exit(r.statusCode === 200 || r.statusCode === 401 ? 0 : 1)})"

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "index.js"]

