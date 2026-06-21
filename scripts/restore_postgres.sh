#!/usr/bin/env bash
set -e
if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_sql_file>"
  exit 1
fi
echo "Starting PostgreSQL restore from $1..."
cat $1 | kubectl exec -i -n aerosphere-prod deploy/postgres-db -- psql -U aerosphere_admin
echo "Restore complete."
