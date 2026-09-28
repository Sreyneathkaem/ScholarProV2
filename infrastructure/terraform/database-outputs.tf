output "managed_database_public_ip" {
  description = "Cloud SQL public IP. Restrict access to the configured deployment-host CIDR."
  value       = try(google_sql_database_instance.scholarpro[0].ip_address[0].ip_address, null)
}

output "managed_database_connection_name" {
  description = "Cloud SQL connection name for operational reference."
  value       = try(google_sql_database_instance.scholarpro[0].connection_name, null)
}

output "managed_database_name" {
  description = "Application database name."
  value       = var.enable_managed_database ? var.database_name : null
}

output "managed_database_user" {
  description = "Application database username."
  value       = var.enable_managed_database ? var.database_user : null
}