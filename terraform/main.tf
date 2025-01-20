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
    s3       = var.aws_endpoint
    ssm      = var.aws_endpoint
    dynamodb = var.aws_endpoint
    ecr      = var.aws_endpoint
    iam      = var.aws_endpoint
    lambda   = var.aws_endpoint
    sts      = var.aws_endpoint
    sqs      = var.aws_endpoint
  }
}

# S3 bucket for audio storage
resource "aws_s3_bucket" "audio_storage" {
  bucket = "${var.environment}-consultations-audio"
}

# S3 bucket for consultation reports/summaries
resource "aws_s3_bucket" "report_storage" {
  bucket = "${var.environment}-consultations-reports"
}

# CORS configuration for reports bucket
resource "aws_s3_bucket_cors_configuration" "report_storage" {
  bucket = aws_s3_bucket.report_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]  # Reports only need GET access
    allowed_origins = ["*"]  # In production, this should be restricted
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
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

# SQS Queue for audio chunks
resource "aws_sqs_queue" "audio_chunks_queue" {
  name                      = "${var.environment}-audio-chunks-queue"
  delay_seconds             = 0
  max_message_size         = 262144  # 256 KB
  message_retention_seconds = 86400   # 24 hours
  receive_wait_time_seconds = 0
  visibility_timeout_seconds = 180  # 6 * 30 seconds Lambda timeout

  # Enable dead letter queue if needed
  # redrive_policy = jsonencode({
  #   deadLetterTargetArn = aws_sqs_queue.audio_chunks_dlq.arn
  #   maxReceiveCount     = 3
  # })

  tags = {
    Environment = var.environment
  }
}

# SQS Queue for summary generation
resource "aws_sqs_queue" "summary_generation_queue" {
  name                      = "${var.environment}-summary-generation"
  delay_seconds             = 0
  max_message_size         = 262144  # 256 KB
  message_retention_seconds = 86400   # 24 hours
  receive_wait_time_seconds = 0
  visibility_timeout_seconds = 180  # 3 minutes timeout

  tags = {
    Environment = var.environment
  }
}

# Add SQS permissions to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_sqs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

# Add custom policy for SQS access
resource "aws_iam_role_policy" "lambda_sqs_policy" {
  name = "${var.environment}-lambda-sqs-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "s3:PutObject",
          "s3:GetObject",
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_dynamodb_table.consultation_sessions.arn,
          "${aws_s3_bucket.audio_storage.arn}/*",
          "${aws_s3_bucket.report_storage.arn}/*",
          aws_sqs_queue.audio_chunks_queue.arn,
          aws_sqs_queue.summary_generation_queue.arn
        ]
      }
    ]
  })
}

# DynamoDB Streams to SQS Lambda
resource "aws_lambda_function" "dynamo_streams_to_sqs" {
  function_name = "${var.environment}-dynamo-streams-to-sqs"
  handler       = "lambda.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.lambda_role.arn
  timeout       = 30
  
  s3_bucket = "lambda-artifacts"
  s3_key    = "dynamo-db-streams-to-sqs.zip"

  environment {
    variables = {
      AWS_REGION = var.region
      AWS_ENDPOINT = var.aws_endpoint
      SQS_AUDIO_CHUNKS = aws_sqs_queue.audio_chunks_queue.url
      NODE_ENV = var.environment
    }
  }
}

# Event Source Mapping for DynamoDB Streams to SQS Lambda
resource "aws_lambda_event_source_mapping" "dynamo_streams_to_sqs" {
  event_source_arn  = aws_dynamodb_table.consultation_sessions.stream_arn
  function_name     = aws_lambda_function.dynamo_streams_to_sqs.arn
  starting_position = "LATEST"
  
  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName: ["MODIFY"]
      })
    }
  }
}

# Process Audio Chunk Lambda (SQS Worker)
resource "aws_lambda_function" "process_audio_chunk" {
  function_name = "${var.environment}-process-audio-chunk"
  handler       = "lambda.handler"
  runtime       = "nodejs20.x"
  role         = aws_iam_role.lambda_role.arn
  timeout      = 30
  
  s3_bucket = "lambda-artifacts"
  s3_key    = "process-audio-chunk.zip"

  environment {
    variables = {
      AWS_REGION = var.region
      AWS_ENDPOINT = var.aws_endpoint
      NODE_ENV = var.environment
    }
  }
}

# SQS Event Source Mapping
resource "aws_lambda_event_source_mapping" "sqs_to_process_audio" {
  event_source_arn = aws_sqs_queue.audio_chunks_queue.arn
  function_name    = aws_lambda_function.process_audio_chunk.arn
  
  batch_size       = 1  // Process one message at a time
  enabled          = true

  // Optional: Configure scaling and error handling
  scaling_config {
    maximum_concurrency = 2  // Max concurrent Lambda invocations
  }

  // Optional: Configure DLQ behavior
  // maximum_retry_attempts = 2
  // destination_config {
  //   on_failure {
  //     destination_arn = aws_sqs_queue.audio_chunks_dlq.arn
  //   }
  // }
}

# Add Lambda permission for SQS
resource "aws_lambda_permission" "allow_sqs_to_invoke_process_audio" {
  statement_id  = "AllowSQSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_audio_chunk.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.audio_chunks_queue.arn
}

