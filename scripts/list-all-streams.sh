#!/bin/bash

# Create or clear the output file
OUTPUT_FILE="streams.txt"
echo "🔄 DynamoDB Streams Export $(date)" > $OUTPUT_FILE

echo "🔍 Getting DynamoDB Stream ARN..."
STREAM_ARN=$(docker compose exec localstack awslocal dynamodb describe-table \
    --table-name dev-consultation-sessions \
    --region ap-southeast-2 \
    --query 'Table.LatestStreamArn' \
    --output text)

echo "📋 Stream ARN: $STREAM_ARN" | tee -a $OUTPUT_FILE

echo -e "\n📄 Getting All Stream Records..." | tee -a $OUTPUT_FILE

# Get all shards
SHARDS=$(docker compose exec localstack awslocal dynamodbstreams describe-stream \
    --stream-arn $STREAM_ARN \
    --region ap-southeast-2 \
    --query 'StreamDescription.Shards[*].ShardId' \
    --output text)

# For each shard
for SHARD_ID in $SHARDS; do
    echo -e "\n🔹 Processing Shard: $SHARD_ID" | tee -a $OUTPUT_FILE
    
    # Get shard iterator
    SHARD_ITERATOR=$(docker compose exec localstack awslocal dynamodbstreams get-shard-iterator \
        --stream-arn $STREAM_ARN \
        --shard-id $SHARD_ID \
        --shard-iterator-type TRIM_HORIZON \
        --region ap-southeast-2 \
        --query 'ShardIterator' \
        --output text)
    
    # Keep getting records until no more are available
    while [ ! -z "$SHARD_ITERATOR" ]; do
        RESULT=$(docker compose exec localstack awslocal dynamodbstreams get-records \
            --shard-iterator $SHARD_ITERATOR \
            --region ap-southeast-2)
        
        # Print and save records
        echo "$RESULT" | jq -r '.Records[]' | tee -a $OUTPUT_FILE
        
        # Get next shard iterator
        SHARD_ITERATOR=$(echo "$RESULT" | jq -r '.NextShardIterator')
        
        # Break if no more records
        if [ "$SHARD_ITERATOR" == "null" ]; then
            break
        fi
    done
done

echo -e "\n✅ Stream records saved to $OUTPUT_FILE" | tee -a $OUTPUT_FILE 