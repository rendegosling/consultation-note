# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build the application
RUN npm run build

# Production stage
FROM python:3.11-slim

# Install Node.js and netcat
RUN apt-get update && apt-get install -y \
    curl \
    netcat-traditional \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install awslocal
RUN pip3 install awscli-local

# Copy all necessary files
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Install dependencies based on NODE_ENV
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm ci --production; \
    else \
    npm ci; \
    fi && \
    chmod +x ./scripts/start-dev.sh && \
    chmod +x ./scripts/start-prod.sh

# Environment variables
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application based on NODE_ENV
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then ./scripts/start-prod.sh; else ./scripts/start-dev.sh; fi"]