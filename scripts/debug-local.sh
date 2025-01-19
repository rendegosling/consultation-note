#!/bin/bash

export AWS_DEFAULT_REGION=ap-southeast-2

# Wait for terraform to complete
echo "⏳ Waiting for resources to be ready..."
sleep 5

echo "🔍 Checking Lambda function status..."
docker compose exec localstack awslocal lambda get-function --function-name dev-process-chunks --region ap-southeast-2

echo "🔍 Checking DynamoDB Stream Event Source Mapping..."
docker compose exec localstack awslocal lambda list-event-source-mappings \
    --function-name dev-process-chunks \
    --region ap-southeast-2

echo -e "\n📊 Checking DynamoDB Streams..."
STREAM_ARN=$(docker compose exec localstack awslocal dynamodb describe-table --table-name dev-consultation-sessions --query 'Table.LatestStreamArn' --output text --region ap-southeast-2)

if [ ! -z "$STREAM_ARN" ] && [ "$STREAM_ARN" != "None" ]; then
    echo "Stream ARN: $STREAM_ARN"
    
    echo -e "\n🔄 Checking Event Source Mapping..."
    docker compose exec localstack awslocal lambda list-event-source-mappings \
        --function-name dev-process-chunks \
        --event-source-arn "$STREAM_ARN" \
        --region ap-southeast-2
    
    echo -e "\n📝 Getting Stream Records..."
    docker compose exec localstack awslocal dynamodbstreams describe-stream \
        --stream-arn "$STREAM_ARN" \
        --region ap-southeast-2
fi

echo -e "\n🔨 Testing Lambda with sample event..."
docker compose exec localstack awslocal lambda invoke \
    --function-name dev-process-chunks \
    --payload '{"Records":[{"eventID":"1","eventName":"MODIFY","dynamodb":{"NewImage":{"id":{"S":"test-id"},"status":{"S":"processing"}}}}]}' \
    /dev/stdout \
    --region ap-southeast-2

echo -e "\n📝 Checking Lambda logs..."
docker compose exec localstack awslocal logs get-log-events \
    --log-group-name "/aws/lambda/dev-process-chunks" \
    --log-stream-name "$(date +%Y/%m/%d)/[LATEST]" \
    --region ap-southeast-2
