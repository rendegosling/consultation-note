# Configure AWS Provider for LocalStack
provider "aws" {
  region = var.region
  
  # LocalStack configuration
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style          = true

  endpoints {
    s3       = "http://localstack:4566"
    ssm      = "http://localstack:4566"
    dynamodb = "http://localstack:4566"
  }
}

# S3 bucket for audio storage
resource "aws_s3_bucket" "audio_storage" {
  bucket = "${var.environment}-${var.bucket_name}"
}

# SSM parameters
resource "aws_ssm_parameter" "bucket_name" {
  name  = "/${var.environment}/storage/bucket"
  type  = "String"
  value = aws_s3_bucket.audio_storage.id
}

# DynamoDB table for consultation sessions
resource "aws_dynamodb_table" "consultation_sessions" {
  name           = "${var.environment}-consultation-sessions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name               = "StatusIndex"
    hash_key          = "status"
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
  }
}

# Add SSM parameter for DynamoDB table name
resource "aws_ssm_parameter" "dynamodb_table" {
  name  = "/${var.environment}/storage/dynamodb-table"
  type  = "String"
  value = aws_dynamodb_table.consultation_sessions.name
}
