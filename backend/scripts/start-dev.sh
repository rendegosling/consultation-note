#!/bin/sh

echo "Waiting for postgres..."
while ! nc -z postgres 5432; do
  sleep 0.1
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