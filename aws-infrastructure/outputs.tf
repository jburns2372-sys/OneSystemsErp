output "s3_bucket_name" {
  description = "The name of the S3 bucket created for uploads."
  value       = aws_s3_bucket.erp_bucket.id
}

output "database_url" {
  description = "The connection string to be used for Prisma DATABASE_URL."
  value       = "postgresql://${aws_db_instance.erp_database.username}:${aws_db_instance.erp_database.password}@${aws_db_instance.erp_database.endpoint}/${aws_db_instance.erp_database.db_name}"
  sensitive   = true
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool."
  value       = aws_cognito_user_pool.erp_pool.id
}

output "cognito_client_id" {
  description = "The Client ID of the Cognito App Client."
  value       = aws_cognito_user_pool_client.erp_pool_client.id
}

output "amplify_app_id" {
  description = "The ID of the deployed AWS Amplify app."
  value       = aws_amplify_app.erp_amplify_app.id
}

output "backend_api_url" {
  description = "The URL of the deployed Elastic Beanstalk Backend API."
  value       = "http://${aws_elastic_beanstalk_environment.erp_backend_env.cname}"
}
