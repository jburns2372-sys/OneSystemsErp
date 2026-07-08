variable "aws_region" {
  description = "The AWS region to deploy the infrastructure in."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "db_username" {
  description = "The master username for the RDS PostgreSQL database."
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "The master password for the RDS PostgreSQL database."
  type        = string
  sensitive   = true
}

variable "github_repository" {
  description = "The URL of your GitHub repository for Amplify to connect to."
  type        = string
  default     = "https://github.com/your-username/OneSystemsErp"
}

variable "github_access_token" {
  description = "A Personal Access Token for GitHub to authorize Amplify."
  type        = string
  sensitive   = true
}
