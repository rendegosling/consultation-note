output "bucket_name" {
  value       = aws_s3_bucket.audio_storage.id
  description = "Name of the created S3 bucket"
}

output "bucket_arn" {
  value       = aws_s3_bucket.audio_storage.arn
  description = "ARN of the created S3 bucket"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.consultation_sessions.name
  description = "Name of the created DynamoDB table"
}

output "dynamodb_table_arn" {
  value       = aws_dynamodb_table.consultation_sessions.arn
  description = "ARN of the created DynamoDB table"
}
