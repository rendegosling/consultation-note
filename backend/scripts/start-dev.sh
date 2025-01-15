#!/bin/sh

echo "Waiting for postgres..."
while ! nc -z postgres 5432; do
  sleep 1
  echo "Still waiting for postgres..."
done
echo "PostgreSQL started"

echo "Running database migrations..."
npm run db:migrate
if [ $? -ne 0 ]; then
  echo "Migration failed!"
  exit 1
fi

echo "Starting development server..."
npm run dev 