#!/bin/bash
set -e

echo "=========================================="
echo "🚀 AeroSphere Spin-Up Script (AWS EKS)"
echo "=========================================="

# 1. Provision Infrastructure
echo ">> [1/5] Provisioning AWS Infrastructure (Terraform)..."
cd infrastructure
terraform init
terraform apply -auto-approve
cd ..

# Get AWS Account info and EKS Cluster name
AWS_REGION="us-east-1"
CLUSTER_NAME="aerosphere-eks-dev"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 2. Configure Kubectl
echo ">> [2/5] Configuring Kubectl..."
aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME

# 3. Setup Helm Repositories
echo ">> [3/5] Setting up Helm Repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add elastic https://helm.elastic.co
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo add jenkinsci https://charts.jenkins.io
helm repo update

# 4. Install Enterprise Stack (Monitoring, Security, CI/CD)
echo ">> [4/5] Installing Observability and CI/CD Stack..."
kubectl create namespace monitoring || true
kubectl create namespace logging || true
kubectl create namespace vault || true
kubectl create namespace jenkins || true

echo "Installing Kube-Prometheus-Stack (Grafana + Prometheus)..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --wait

echo "Installing HashiCorp Vault..."
helm upgrade --install vault hashicorp/vault --namespace vault --wait

echo "Installing Jenkins..."
helm upgrade --install jenkins jenkinsci/jenkins --namespace jenkins --set controller.serviceType=LoadBalancer --wait

# 5. Build and Deploy Microservices
echo ">> [5/5] Building and Deploying Microservices..."
kubectl create namespace aerosphere-prod || true

SERVICES=("flight-ops" "telemetry" "maintenance" "weather-intel" "baggage-ops" "passenger-ops")

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

for svc in "${SERVICES[@]}"; do
    echo "Processing $svc..."
    IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aerosphere-$svc:latest"
    
    # Build & Push
    docker build -t $IMAGE_URI ./services/$svc
    docker push $IMAGE_URI

    # Deploy via Helm
    helm upgrade --install $svc ./helm/aerosphere-core \
        --namespace aerosphere-prod \
        --set image.repository=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aerosphere-$svc \
        --set nameOverride=$svc \
        --wait
done

echo "=========================================="
echo "✅ AeroSphere Ecosystem Successfully Deployed!"
echo "Get Jenkins URL: kubectl get svc -n jenkins"
echo "Get Grafana URL: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo "=========================================="
