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
    s3  = "http://localstack:4566"
    ssm = "http://localstack:4566"
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
