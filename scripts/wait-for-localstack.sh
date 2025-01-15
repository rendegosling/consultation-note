#!/bin/bash
echo "Waiting for LocalStack to be ready..."
until curl -s http://localhost:4566/_localstack/health | grep -q '"s3":"available"'; do
    echo "LocalStack not ready yet..."
    sleep 2
done
echo "LocalStack is ready!" 