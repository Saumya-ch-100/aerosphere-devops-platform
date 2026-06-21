# AeroSphere K3s AWS Deployment Guide

This guide details the final steps to provision the AWS infrastructure and deploy the AeroSphere platform using your automated deployment script.

## 1. AWS Infrastructure Provisioning

1. **Launch 2 EC2 Instances (Ubuntu 22.04 LTS)**:
   - **Node 1**: K3s Server (Master) - Minimum `t3.medium`.
   - **Node 2**: K3s Agent (Worker) - Minimum `t3.medium`.
   - Configure a Security Group allowing inbound traffic on Ports `80` (HTTP), `443` (HTTPS), and `6443` (Kubernetes API).

2. **Configure AWS Auto Scaling Group (ASG)**:
   - Create an ASG targeting the K3s Agent nodes. 
   - Set policies to scale out when Average CPU Utilization exceeds 75%.

3. **Deploy the AWS Application Load Balancer (ALB)**:
   - Create an internet-facing ALB.
   - Forward all Port 80 and 443 traffic to your 2 EC2 instances.

## 2. Install Kubernetes (K3s)

SSH into **Node 1 (Master)** and install the K3s server:
```bash
curl -sfL https://get.k3s.io | sh -
# Extract the node token
sudo cat /var/lib/rancher/k3s/server/node-token
```

SSH into **Node 2 (Worker)** and join the cluster:
```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<MASTER_PRIVATE_IP>:6443 K3S_TOKEN=<NODE_TOKEN_FROM_MASTER> sh -
```

## 3. Automated Deployment

On your local machine, export your AWS environment variables:
```bash
export AWS_ACCOUNT_ID="123456789012"
export AWS_REGION="us-east-1"
```

Run the automated Cloud Up script:
```bash
make cloud-up
```

### What `make cloud-up` does:
1. Builds all 13 AeroSphere Docker images.
2. Authenticates your local Docker daemon with AWS ECR.
3. Tags and pushes the images to your private ECR registries.
4. Dynamically injects your ECR image URIs into the `kubernetes/` manifests.
5. Executes `kubectl apply -f kubernetes/cloud-deploy/` to deploy the entire stack to your K3s cluster.

## 4. Verification

Visit your AWS Load Balancer DNS name in your browser:
- `http://<ALB-DNS>/` -> AeroSphere React Dashboard
- `http://<ALB-DNS>/grafana` -> Grafana Monitoring
- `http://<ALB-DNS>/prometheus` -> Prometheus UI
