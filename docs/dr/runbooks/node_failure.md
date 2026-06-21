# Runbook: Node Failure

**Scenario:** An AWS EC2 Node running K3s crashes or becomes unreachable.

## Mitigation Steps:
1. **Identify Failed Node:**
   ```bash
   kubectl get nodes
   ```
   *Look for `NotReady` status.*
2. **Drain Node (If accessible):**
   ```bash
   kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
   ```
3. **Terminate Instance:**
   Terminate the EC2 instance via AWS Console or CLI. The Auto Scaling Group (ASG) will automatically provision a replacement.
4. **Verify Recovery:**
   Ensure new node joins and pods are re-scheduled.
   ```bash
   kubectl get pods -o wide --field-selector spec.nodeName=<new-node-name>
   ```
