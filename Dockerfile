# Multi-stage build for Space Invaders React App with local game server
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application with local game server config
ENV VITE_GAME_SERVER_URL=ws://localhost:9999
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install nginx and required packages
RUN apk add --no-cache nginx curl

# Create necessary directories
RUN mkdir -p /run/nginx /app/server /usr/share/nginx/html

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy game server
COPY server /app/server
WORKDIR /app/server
RUN npm install ws

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80 9999

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start services
CMD ["/docker-entrypoint.sh"]