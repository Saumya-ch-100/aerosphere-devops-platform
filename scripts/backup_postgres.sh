#!/usr/bin/env bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/postgres"
mkdir -p $BACKUP_DIR
echo "Starting PostgreSQL backup..."
kubectl exec -t -n aerosphere-prod deploy/postgres-db -- pg_dumpall -U aerosphere_admin > $BACKUP_DIR/pg_backup_$TIMESTAMP.sql
echo "Backup saved to $BACKUP_DIR/pg_backup_$TIMESTAMP.sql"
