#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Capture logs with timestamp
docker compose logs -f --timestamps > ./logs/docker-compose.log 2>&1 