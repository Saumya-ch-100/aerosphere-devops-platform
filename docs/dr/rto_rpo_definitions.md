# AeroSphere RTO & RPO Definitions

## Recovery Time Objective (RTO)
The maximum tolerable length of time that a system can be down after a failure.
- **Tier 1 (Flight Ops, Telemetry):** 15 Minutes
- **Tier 2 (Passenger Ops, Baggage):** 1 Hour
- **Tier 3 (Maintenance, Weather):** 4 Hours

## Recovery Point Objective (RPO)
The maximum acceptable amount of data loss measured in time.
- **Database (Postgres):** 5 Minutes (Achieved via Continuous WAL archiving)
- **Stateful Storage / File Volumes:** 1 Hour
- **Application Config (GitOps):** 0 Minutes (Git repository is the single source of truth)
