output "bucket_name" {
  value       = aws_s3_bucket.audio_storage.id
  description = "Name of the created S3 bucket"
}

output "bucket_arn" {
  value       = aws_s3_bucket.audio_storage.arn
  description = "ARN of the created S3 bucket"
}

output "ssm_parameter_name" {
  value       = aws_ssm_parameter.bucket_name.name
  description = "SSM parameter name for bucket"
} 