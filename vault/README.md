# AeroSphere Vault Integration

AeroSphere uses HashiCorp Vault for secure secrets management, eliminating hardcoded credentials in the repository.

## Getting Started

1. **Deploy Vault**: Deploy Vault to the Kubernetes cluster using the official Helm chart.
2. **Enable KV Engine**: Enable the KV secrets engine v2 at the `secret/` path.
   ```bash
   vault secrets enable -path=secret kv-v2
   ```
3. **Load Secrets**: Load the Postgres credentials into Vault.
   ```bash
   vault kv put secret/aerosphere/postgres POSTGRES_USER=aerosphere_admin POSTGRES_PASSWORD=your_secure_password
   ```
4. **Apply Policies**: Apply the `aerosphere-policy.hcl` to Vault.
   ```bash
   vault policy write aerosphere-policy vault/policies/aerosphere-policy.hcl
   ```
5. **Kubernetes Auth**: Configure Kubernetes authentication so `aerosphere-app-sa` can authenticate and retrieve the secrets.
   ```bash
   vault write auth/kubernetes/role/aerosphere \
        bound_service_account_names=aerosphere-app-sa \
        bound_service_account_namespaces=aerosphere-prod \
        policies=aerosphere-policy \
        ttl=1h
   ```

## Usage
The AeroSphere microservices are configured to fetch these secrets via Vault Agent Sidecar injection, which maps the secrets directly into `/vault/secrets/` inside the pod, or translates them into native Kubernetes Secrets via the External Secrets Operator (replacing `kubernetes/postgres-secret.yaml`).
