#!/bin/bash

echo "📊 Current Docker disk usage:"
docker system df -v

echo -e "\n🧹 Cleaning up Docker resources..."

echo "Stopping all containers..."
docker-compose down

echo "Stopping and removing builder instances..."
docker buildx stop mybuilder || true
docker buildx rm mybuilder || true

echo "Removing specific unused images..."
docker rmi consultation-note-backend:latest \
       consultation-note-frontend:latest \
       localstack/localstack:latest \
       postgres:15-alpine || true

echo "Cleaning buildx cache..."
docker volume rm buildx_buildkit_mybuilder0_state || true

echo "Removing unused volumes..."
docker volume prune -f

echo "Cleaning build cache..."
docker builder prune -f

echo -e "\n📊 New Docker disk usage:"
docker system df -v 