variable "project_id" {
  description = "Google Cloud project ID where the infrastructure will be deployed."
  type        = string
}

variable "region" {
  description = "Google Cloud region for the application and container registry."
  type        = string
  default     = "asia-southeast1"
}

variable "backend_image" {
  description = "Container image used for the backend service."
  type        = string
  default     = "ghcr.io/example/scholarpro-backend:latest"
}

variable "frontend_image" {
  description = "Container image used for the frontend service."
  type        = string
  default     = "ghcr.io/example/scholarpro-frontend:latest"
}

variable "notification_channels" {
  description = "List of Cloud Monitoring notification channel IDs to notify when alerts fire."
  type        = list(string)
  default     = []
}

variable "enable_managed_database" {
  description = "Create an opt-in Cloud SQL PostgreSQL database for the deployment host."
  type        = bool
  default     = false
}

variable "database_instance_name" {
  description = "Cloud SQL instance name."
  type        = string
  default     = "scholarpro-postgres"
}

variable "database_name" {
  description = "Application database name."
  type        = string
  default     = "scholarpro"
}

variable "database_user" {
  description = "Application database user name."
  type        = string
  default     = "scholarpro"
}

variable "database_password" {
  description = "Password for the application database user. Supply through a secure Terraform variable source."
  type        = string
  sensitive   = true
  default     = ""
}

variable "database_authorized_network_cidr" {
  description = "Deployment host public egress CIDR allowed to connect to PostgreSQL; use a single-host /32 where possible."
  type        = string
  default     = ""
}

variable "database_tier" {
  description = "Cloud SQL machine tier, billed while the managed database is enabled."
  type        = string
  default     = "db-custom-1-3840"
}

variable "database_high_availability" {
  description = "Use regional high availability for Cloud SQL, at additional cost."
  type        = bool
  default     = false
}
