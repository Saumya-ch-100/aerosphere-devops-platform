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

# Install K3s Worker
curl -sfL https://get.k3s.io | K3S_TOKEN="${k3s_token}" K3S_URL="https://${master_ip}:6443" sh -
