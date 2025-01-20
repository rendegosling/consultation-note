#!/bin/bash

echo "Listing S3 buckets in ap-southeast-2..."
docker compose exec localstack awslocal --region ap-southeast-2 s3 ls

echo "Listing contents of dev-consultations-audio bucket..."
docker compose exec localstack awslocal --region ap-southeast-2 s3 ls s3://dev-consultations-audio/

echo "Listing sessions..."
docker compose exec localstack awslocal --region ap-southeast-2 s3 ls s3://dev-consultations-audio/sessions/

# Optional: List specific session
# SESSION_ID="your-session-id"
# docker compose exec localstack awslocal --region ap-southeast-2 s3 ls s3://dev-consultations-audio/sessions/${SESSION_ID}/chunks/

