provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------------------
# 1. Amazon S3 Bucket (Storage)
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "erp_bucket" {
  bucket = "onesystemserp-storage-${var.environment}-${random_id.bucket_suffix.hex}"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_ownership_controls" "erp_bucket_ownership" {
  bucket = aws_s3_bucket.erp_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "erp_bucket_public_access" {
  bucket = aws_s3_bucket.erp_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "erp_bucket_acl" {
  depends_on = [
    aws_s3_bucket_ownership_controls.erp_bucket_ownership,
    aws_s3_bucket_public_access_block.erp_bucket_public_access,
  ]

  bucket = aws_s3_bucket.erp_bucket.id
  acl    = "public-read"
}

resource "aws_s3_bucket_cors_configuration" "erp_bucket_cors" {
  bucket = aws_s3_bucket.erp_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ------------------------------------------------------------------------------
# 2. Amazon RDS (PostgreSQL Database)
# ------------------------------------------------------------------------------
resource "aws_security_group" "erp_db_sg" {
  name        = "onesystemserp-db-sg-${var.environment}"
  description = "Allow inbound PostgreSQL traffic"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "erp_database" {
  identifier           = "onesystemserp-db-${var.environment}"
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.7"
  instance_class       = "db.t3.micro"
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
  publicly_accessible  = true
  vpc_security_group_ids = [aws_security_group.erp_db_sg.id]
}

# ------------------------------------------------------------------------------
# 3. Amazon Cognito (Authentication)
# ------------------------------------------------------------------------------
resource "aws_cognito_user_pool" "erp_pool" {
  name = "onesystemserp-pool-${var.environment}"

  password_policy {
    minimum_length    = 8
    require_lowercase = false
    require_numbers   = false
    require_symbols   = false
    require_uppercase = false
  }

  auto_verified_attributes = ["email"]
}

resource "aws_cognito_user_pool_client" "erp_pool_client" {
  name         = "onesystemserp-app-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.erp_pool.id
  
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

# ------------------------------------------------------------------------------
# 4. AWS Amplify (Hosting)
# ------------------------------------------------------------------------------
resource "aws_amplify_app" "erp_amplify_app" {
  name         = "OneSystemsERP-${var.environment}"
  repository   = var.github_repository
  access_token = var.github_access_token

  build_spec = file("../amplify.yml")

  environment_variables = {
    DATABASE_URL      = "postgresql://${aws_db_instance.erp_database.username}:${aws_db_instance.erp_database.password}@${aws_db_instance.erp_database.endpoint}/${aws_db_instance.erp_database.db_name}"
    COGNITO_CLIENT_ID = aws_cognito_user_pool_client.erp_pool_client.id
  }
}

resource "aws_amplify_branch" "main_branch" {
  app_id      = aws_amplify_app.erp_amplify_app.id
  branch_name = "main"
}

# ------------------------------------------------------------------------------
# 5. AWS Elastic Beanstalk (Node.js Backend)
# ------------------------------------------------------------------------------
resource "aws_iam_instance_profile" "eb_instance_profile" {
  name = "onesystemserp-eb-profile-${var.environment}"
  role = aws_iam_role.eb_role.name
}

resource "aws_iam_role" "eb_role" {
  name = "onesystemserp-eb-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eb_web_tier" {
  role       = aws_iam_role.eb_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_elastic_beanstalk_application" "erp_backend" {
  name        = "OneSystemsERP-Backend-${var.environment}"
  description = "Node.js Express Backend for OneSystemsERP"
}

resource "aws_elastic_beanstalk_environment" "erp_backend_env" {
  name                = "onesystemserp-backend-env-${var.environment}"
  application         = aws_elastic_beanstalk_application.erp_backend.name
  solution_stack_name = "64bit Amazon Linux 2023 v6.1.6 running Node.js 20"

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.eb_instance_profile.name
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DATABASE_URL"
    value     = "postgresql://${aws_db_instance.erp_database.username}:${aws_db_instance.erp_database.password}@${aws_db_instance.erp_database.endpoint}/${aws_db_instance.erp_database.db_name}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment:proxy"
    name      = "ProxyServer"
    value     = "nginx"
  }
}
