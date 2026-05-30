# Multi-stage Dockerfile for Zetech Event System
# Builds both frontend (React/Vite) and backend (Express/Node.js)

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy frontend source (excluding node_modules via .dockerignore)
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY backend/ ./

# Stage 3: Production Image
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling and ca-certificates for HTTPS
RUN apk add --no-cache dumb-init ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories
RUN mkdir -p backend/public/uploads dist

# Copy backend dependencies and source from backend-builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend

# Copy frontend build from frontend-builder
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Copy backend env example
COPY backend/.env.example ./backend/.env.example

# Switch to non-root user
USER nodejs

# Expose backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start backend server (which also serves frontend static files)
CMD ["node", "backend/server.js"]
