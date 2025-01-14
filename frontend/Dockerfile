FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and scripts
COPY . .

# Make start scripts executable
RUN chmod +x ./scripts/start-dev.sh && \
    chmod +x ./scripts/start-prod.sh

EXPOSE 3000

# Start the application based on NODE_ENV
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then ./scripts/start-prod.sh; else ./scripts/start-dev.sh; fi"]