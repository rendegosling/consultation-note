# Development stage
FROM --platform=$BUILDPLATFORM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"] 