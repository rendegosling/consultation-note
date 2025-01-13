FROM --platform=$BUILDPLATFORM node:20-alpine

WORKDIR /app

# Add netcat for postgres healthcheck and install tsx globally
RUN apk add --no-cache netcat-openbsd && \
    npm install -g tsx

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Make start script executable
COPY scripts/start-dev.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start-dev.sh

EXPOSE 3000

CMD ["start-dev.sh"]