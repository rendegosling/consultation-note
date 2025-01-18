variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for audio storage"
  type        = string
  default     = "consultations-audio"
}

variable "table_name" {
  description = "Name of the DynamoDB table for consultation sessions"
  type        = string
  default     = "consultation-sessions"
}