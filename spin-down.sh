#!/bin/bash
set -e

echo "=========================================="
echo "⚠️ AeroSphere Spin-Down Script (AWS EKS)"
echo "=========================================="
echo "This will destroy all AWS resources to save costs."
echo "Waiting 5 seconds before proceeding... (Ctrl+C to abort)"
sleep 5

AWS_REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
SERVICES=("flight-ops" "telemetry" "maintenance" "weather-intel" "baggage-ops" "passenger-ops")

# 1. Empty ECR Repositories
echo ">> [1/2] Emptying ECR Repositories to allow Terraform destruction..."
for svc in "${SERVICES[@]}"; do
    REPO_NAME="aerosphere-$svc"
    echo "Emptying $REPO_NAME..."
    
    # List all image digests
    IMAGES=$(aws ecr list-images --repository-name $REPO_NAME --region $AWS_REGION --query 'imageIds[*]' --output json || echo "[]")
    
    if [ "$IMAGES" != "[]" ] && [ ! -z "$IMAGES" ]; then
        aws ecr batch-delete-image --repository-name $REPO_NAME --region $AWS_REGION --image-ids "$IMAGES" > /dev/null || true
    fi
done

# 2. Terraform Destroy
echo ">> [2/2] Destroying AWS Infrastructure (Terraform)..."
cd infrastructure
terraform destroy -auto-approve
cd ..

echo "=========================================="
echo "✅ AWS Bill reset to $0. All resources destroyed."
echo "=========================================="
