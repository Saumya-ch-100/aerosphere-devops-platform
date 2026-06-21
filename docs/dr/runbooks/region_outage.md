# Runbook: Region Outage

**Scenario:** Entire AWS region (`ap-south-1`) goes down, knocking out the primary AeroSphere Command control plane.

## Mitigation Steps:
1. **Declare Regional Failure:**
   Confirm AWS Service Health Dashboard for regional outages.
2. **Initiate Global Traffic Failover:**
   Update Route53/Global Accelerator to point `api.aerosphere.com` to the secondary region (`eu-central-1`).
3. **Promote Secondary Database:**
   If using Aurora Global Database, promote the secondary cluster to primary.
   *Alternatively, run the Postgres Restore script from the latest S3 backup:*
   ```bash
   ./scripts/restore_postgres.sh /backups/postgres/pg_backup_latest.sql
   ```
4. **Scale Up Secondary Region:**
   Ensure the standby Kubernetes cluster is scaled to handle 100% of global traffic.
   ```bash
   kubectl scale deployment --all --replicas=5 -n aerosphere-prod
   ```
