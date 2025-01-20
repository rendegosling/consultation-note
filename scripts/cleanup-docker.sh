#!/bin/bash

echo "Stopping all containers..."
docker compose down

echo "Removing all containers..."
docker compose rm -f

echo "Removing all volumes..."
docker volume prune -f

echo "Removing all unused networks..."
docker network prune -f

echo "Removing unused images..."
docker image prune -f

echo "Current status:"
echo "Containers:"
docker ps -a
echo -e "\nVolumes:"
docker volume ls
echo -e "\nNetworks:"
docker network ls
echo -e "\nImages:"
docker images 