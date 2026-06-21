# Runbook: Pod Failure

**Scenario:** An application pod crashes repeatedly (CrashLoopBackOff) or becomes unresponsive.

## Mitigation Steps:
1. **Identify Failing Pods:**
   ```bash
   kubectl get pods -n aerosphere-prod | grep -v Running
   ```
2. **Describe Pod for Events:**
   Check for OOMKilled, Liveness probe failures, or image pull errors.
   ```bash
   kubectl describe pod <pod-name> -n aerosphere-prod
   ```
3. **Check Application Logs:**
   Examine structured Pino logs for application-level errors.
   ```bash
   kubectl logs <pod-name> -n aerosphere-prod
   ```
4. **Restart Pod:**
   If a generic deadlock occurs, delete the pod. The Deployment will recreate it.
   ```bash
   kubectl delete pod <pod-name> -n aerosphere-prod
   ```
5. **Scale Up (If Capacity Issue):**
   ```bash
   kubectl scale deployment flight-ops --replicas=5 -n aerosphere-prod
   ```
