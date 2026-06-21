# Helm Rollback Procedure

If a Helm deployment fails or introduces critical bugs, execute an immediate rollback.

1. **Identify the Release and History**
   ```bash
   helm history aerosphere-core -n aerosphere-prod
   ```
2. **Execute Rollback**
   Rollback to the previous stable revision (e.g., Revision 5).
   ```bash
   helm rollback aerosphere-core 5 -n aerosphere-prod
   ```
3. **Verify Rollback**
   ```bash
   helm status aerosphere-core -n aerosphere-prod
   kubectl get pods -n aerosphere-prod
   ```
