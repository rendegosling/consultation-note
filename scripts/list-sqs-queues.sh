#!/bin/bash

echo "Listing SQS queues in ap-southeast-2..."
docker compose exec localstack awslocal --region ap-southeast-2 sqs list-queues

echo -e "\nChecking queue attributes..."
docker compose exec localstack awslocal --region ap-southeast-2 sqs get-queue-attributes \
    --queue-url http://localhost:4566/000000000000/dev-audio-chunks-queue \
    --attribute-names All

echo -e "\nReceiving messages (without deleting)..."
docker compose exec localstack awslocal --region ap-southeast-2 sqs receive-message \
    --queue-url http://localhost:4566/000000000000/dev-audio-chunks-queue \
    --attribute-names All \
    --message-attribute-names All \
    --max-number-of-messages 10

# Optional: Get more details about specific queue
# docker compose exec localstack awslocal --region ap-southeast-2 sqs get-queue-attributes --queue-url http://localhost:4566/000000000000/dev-audio-chunks-queue --attribute-names All
