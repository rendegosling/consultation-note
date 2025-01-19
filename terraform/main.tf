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
    ecr      = "http://localstack:4566"
    iam      = "http://localstack:4566"
    lambda   = "http://localstack:4566"
    sts      = "http://localstack:4566"
    sqs      = "http://localstack:4566"
  }
}

# S3 bucket for audio storage
resource "aws_s3_bucket" "audio_storage" {
  bucket = "${var.environment}-consultations-audio"
}

# DynamoDB table for consultation sessions
resource "aws_dynamodb_table" "consultation_sessions" {
  name           = "${var.environment}-consultation-sessions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.environment}-process-chunks-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "process_chunks" {
  function_name = "${var.environment}-process-chunks"
  handler       = "lambda.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.lambda_role.arn
  timeout       = 30
  
  s3_bucket = "lambda-artifacts"
  s3_key    = "process-chunks.zip"

  environment {
    variables = {
      AWS_REGION = var.region
      AWS_ENDPOINT = "http://localhost:4566"
      DYNAMODB_TABLE = aws_dynamodb_table.consultation_sessions.name
      S3_BUCKET = aws_s3_bucket.audio_storage.id
      NODE_ENV = var.environment
    }
  }
}

# Event Source Mapping
resource "aws_lambda_event_source_mapping" "process_chunks" {
  event_source_arn  = aws_dynamodb_table.consultation_sessions.stream_arn
  function_name     = aws_lambda_function.process_chunks.arn
  starting_position = "LATEST"
  
  # Simplest possible filter - just MODIFY events
  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName: ["MODIFY"]
      })
    }
  }
}

