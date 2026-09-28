resource "google_project_service" "sqladmin" {
  count = var.enable_managed_database ? 1 : 0

  project            = var.project_id
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_sql_database_instance" "scholarpro" {
  count = var.enable_managed_database ? 1 : 0

  name                = var.database_instance_name
  region              = var.region
  database_version    = "POSTGRES_16"
  deletion_protection = true

  settings {
    tier              = var.database_tier
    availability_type = var.database_high_availability ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 20
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
    }

    ip_configuration {
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"

      authorized_networks {
        name  = "scholarpro-deployment-host"
        value = var.database_authorized_network_cidr
      }
    }
  }

  depends_on = [google_project_service.sqladmin]

  lifecycle {
    precondition {
      condition     = can(cidrhost(var.database_authorized_network_cidr, 0)) && try(split("/", var.database_authorized_network_cidr)[1] == "32", false) && length(var.database_password) >= 16
      error_message = "When enabled, set a single-host IPv4 /32 allowlist and a database password of at least 16 characters."
    }
  }
}

resource "google_sql_database" "scholarpro" {
  count = var.enable_managed_database ? 1 : 0

  name      = var.database_name
  instance  = google_sql_database_instance.scholarpro[0].name
  charset   = "UTF8"
  collation = "en_US.UTF8"
}

resource "google_sql_user" "scholarpro" {
  count = var.enable_managed_database ? 1 : 0

  name     = var.database_user
  instance = google_sql_database_instance.scholarpro[0].name
  password = var.database_password
}