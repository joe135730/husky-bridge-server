# Docker Guide for Husky Bridge Backend

## What is Docker?

**Docker** is a containerization platform that packages your application and its dependencies into a lightweight, portable container.

### Key Concepts:

1. **Container**: A running instance of a Docker image
2. **Image**: A read-only template for creating containers
3. **Dockerfile**: Instructions for building an image
4. **Multi-stage Build**: Optimized builds that reduce final image size

---

## Our Backend Dockerfile Explained

### Multi-Stage Build Strategy

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
# Install all dependencies

# Stage 2: Production
FROM node:20-alpine AS production
# Only copy production dependencies
```

**Why Multi-Stage?**
- **Smaller Image**: Final image doesn't include devDependencies
- **Security**: Fewer packages = smaller attack surface
- **Performance**: Faster deployments, less storage

### Key Components:

1. **Base Image**: `node:20-alpine`
   - Alpine Linux = minimal size (~5MB vs ~150MB for full Node)
   - Node.js 20 = matches your CI/CD setup

2. **Layer Caching**:
   ```dockerfile
   COPY package*.json ./  # This layer caches if package.json unchanged
   RUN npm ci             # Only runs if package.json changes
   ```
   - Docker caches layers
   - If `package.json` doesn't change, Docker reuses cached layer
   - **Faster builds** in CI/CD!

3. **Security Best Practices**:
   - Non-root user (`nodejs`)
   - Production-only dependencies
   - Health checks

4. **Health Check**:
   ```dockerfile
   HEALTHCHECK --interval=30s ...
   ```
   - Kubernetes/Docker can check if container is healthy
   - Automatically restarts unhealthy containers

---

## Building and Running

### Build the Image:
```bash
cd husky-bridge-server
docker build -t husky-bridge-backend .
```

### Run the Container:
```bash
docker run -p 4000:4000 \
  -e MONGO_CONNECTION_STRING=mongodb://host.docker.internal:27017/husky-bridge \
  -e SESSION_SECRET=your_secret \
  husky-bridge-backend
```

### Test Locally:
```bash
# Build
docker build -t husky-bridge-backend .

# Run with environment variables
docker run -p 4000:4000 \
  -e NODE_ENV=development \
  -e MONGO_CONNECTION_STRING=mongodb://localhost:27017/husky-bridge \
  husky-bridge-backend
```

---

## Docker in CI/CD Context

**Why Docker for CI/CD?**
1. **Consistency**: Same environment in dev, test, and production
2. **Isolation**: No "works on my machine" issues
3. **Scalability**: Easy to deploy multiple instances
4. **Portability**: Run anywhere Docker runs (AWS, GCP, Azure, Kubernetes)

**Next Steps in CI/CD:**
- Build Docker image in CI
- Push to container registry (Docker Hub, GitHub Container Registry)
- Deploy to Kubernetes/cloud platform

