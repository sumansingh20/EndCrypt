# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME="Finance Encryption App"
ARG VITE_APP_VERSION=1.0.0

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production image, copy all the files and run nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy environment template for runtime configuration
COPY --from=builder /app/.env.example /usr/share/nginx/html/.env.example

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001

# Change ownership of nginx directories
RUN chown -R frontend:nodejs /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

USER frontend

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]