# Runbook: Airport Outage (Edge Node Failure)

**Scenario:** An on-premise edge node located at a specific airport loses connectivity to the central AeroSphere cluster.

## Mitigation Steps:
1. **Verify Connectivity:**
   Check telemetry from the airport edge router. If unreachable, it is a localized network failure.
2. **Reroute Passenger Data:**
   Enable fallback routing for passenger apps to connect directly to the central API gateway instead of the localized edge cache.
3. **Queue Telemetry (Offline Mode):**
   Ensure `flight-ops` edge services queue telemetry locally until the VPN/SD-WAN tunnel to AWS is restored.
4. **Resync on Recovery:**
   Once connectivity is restored, monitor the telemetry backlog processing.
   ```bash
   kubectl logs deploy/telemetry -n aerosphere-prod | grep "sync"
   ```
