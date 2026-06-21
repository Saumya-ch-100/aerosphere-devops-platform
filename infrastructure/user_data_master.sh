#!/bin/bash
set -e

# Update and install dependencies
apt-get update -y
apt-get install -y apt-transport-https ca-certificates curl software-properties-common awscli unzip

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update -y
apt-get install -y docker-ce docker-compose-plugin

TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
PUBLIC_IP=$(curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)
if echo "$PUBLIC_IP" | grep -q "404"; then PUBLIC_IP=$(curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4); fi

# Install K3s Master with TLS SAN for the public IP
curl -sfL https://get.k3s.io | K3S_TOKEN="${k3s_token}" sh -s - server --cluster-init --tls-san "$PUBLIC_IP"

# Upload Kubeconfig to S3 so local Makefile can fetch it
BUCKET_NAME=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'aerosphere-app-bundle')].Name" --output text | awk '{print $1}')
if [ ! -z "$BUCKET_NAME" ] && [ "$BUCKET_NAME" != "None" ]; then
    # Wait for k3s.yaml to be generated
    while [ ! -f /etc/rancher/k3s/k3s.yaml ]; do
      sleep 2
    done

    cp /etc/rancher/k3s/k3s.yaml /tmp/kubeconfig
    sed -i "s|127.0.0.1|$PUBLIC_IP|g" /tmp/kubeconfig
    aws s3 cp /tmp/kubeconfig s3://$BUCKET_NAME/kubeconfig --region ap-south-1
fi
