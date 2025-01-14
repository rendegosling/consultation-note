#!/bin/sh

echo "Waiting for postgres..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

echo "Running database migrations..."
npm run db:migrate

echo "Starting production server..."
npm start 