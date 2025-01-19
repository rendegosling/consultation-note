docker compose exec localstack awslocal dynamodb list-tables --region ap-southeast-2

docker compose exec localstack awslocal dynamodb scan \
    --table-name dev-consultation-sessions \
    --region ap-southeast-2 \
    --output json \
    --query 'Items'

docker compose exec localstack awslocal dynamodb get-item \
    --table-name dev-consultation-sessions \
    --key '{"id": {"S": "a34b6bbb-a16e-41a1-b357-12c4175d4c80"}}' \
    --region ap-southeast-2