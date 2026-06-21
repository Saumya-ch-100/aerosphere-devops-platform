#!/usr/bin/env bash
set -e
BACKUP_DIR="./backups/k8s"
mkdir -p $BACKUP_DIR
echo "Backing up Kubernetes objects..."
kubectl get all,networkpolicies,roles,rolebindings,serviceaccounts,secrets,configmaps -n aerosphere-prod -o yaml > $BACKUP_DIR/aerosphere-prod-backup-$(date +%Y%m%d).yaml
echo "Kubernetes backup complete."
