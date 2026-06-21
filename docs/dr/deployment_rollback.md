# Deployment Rollback Procedure

For imperative deployments outside of Helm (e.g. Postgres DB or quick application reverts).

1. **Check Rollout History**
   ```bash
   kubectl rollout history deployment/flight-ops -n aerosphere-prod
   ```
2. **Undo Rollout**
   Revert to the previous state immediately.
   ```bash
   kubectl rollout undo deployment/flight-ops -n aerosphere-prod
   ```
3. **Verify Rollout Status**
   ```bash
   kubectl rollout status deployment/flight-ops -n aerosphere-prod
   ```
