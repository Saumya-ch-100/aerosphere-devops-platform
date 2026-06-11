# Disaster Recovery Runbook
## Scenario 1: Total Region Failure
1. Update Route53 to point to secondary region.
2. Trigger Jenkins Jenkinsfile.deploy to secondary cluster.
3. Restore RDS from latest cross-region snapshot.
