# Policy for AeroSphere applications
# Read access to application secrets
path "secret/data/aerosphere/*" {
  capabilities = ["read", "list"]
}

# Read access to dynamically generated database credentials
path "database/creds/aerosphere-role" {
  capabilities = ["read"]
}
