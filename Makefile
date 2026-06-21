.PHONY: help cloud-up cloud-down local-up local-down clean
.DEFAULT_GOAL := help

AWS_REGION := ap-south-1
CLUSTER_NAME := aerosphere-k3s-dev
SERVICES := flight-ops telemetry maintenance weather-intel baggage-ops passenger-ops dashboard

help: ## Show this professional help menu
	@echo "=========================================="
	@echo "🚀 AeroSphere Command Orchestration"
	@echo "=========================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo "=========================================="

cloud-up: ## Deploy the full AWS EC2 Environment
	@echo "=========================================="
	@echo "🚀 Provisioning AWS Infrastructure (Terraform)..."
	cd infrastructure && terraform init && terraform apply -auto-approve
	@echo ">> Waiting for K3s Master to upload Kubeconfig to S3 (approx 90s)..."
	@eval BUCKET_NAME=$$(aws s3api list-buckets --query "Buckets[?contains(Name, 'aerosphere-app-bundle')].Name" --output text | awk '{print $$1}'); \
	aws s3api wait object-exists --bucket $$BUCKET_NAME --key kubeconfig; \
	aws s3 cp s3://$$BUCKET_NAME/kubeconfig kubeconfig.yaml
	@export KUBECONFIG=kubeconfig.yaml; \
	echo ">> Setting up Helm Repositories..."; \
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts; \
	helm repo add elastic https://helm.elastic.co; \
	helm repo add hashicorp https://helm.releases.hashicorp.com; \
	helm repo add jenkinsci https://charts.jenkins.io; \
	helm repo update; \
	echo ">> Installing Observability and CI/CD Stack..."; \
	kubectl create namespace monitoring || true; \
	kubectl create namespace logging || true; \
	kubectl create namespace vault || true; \
	kubectl create namespace jenkins || true; \
	kubectl create namespace aerosphere-prod || true; \
	kubectl apply -f security/rbac/aerosphere-rbac.yaml; \
	kubectl apply -f security/network-policies/; \
	kubectl apply -f kubernetes/postgres-secret.yaml; \
	kubectl apply -f kubernetes/postgres-db.yaml; \
	helm upgrade --install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --wait; \
	helm upgrade --install vault hashicorp/vault -f helm/vault-values.yaml --namespace vault --wait || true; \
	helm upgrade --install elasticsearch elastic/elasticsearch --namespace logging --set replicas=1 --set minimumMasterNodes=1 --set persistence.enabled=false || true; \
	helm upgrade --install kibana elastic/kibana --namespace logging || true; \
	helm upgrade --install jenkins jenkinsci/jenkins --namespace jenkins --set controller.serviceType=LoadBalancer --set persistence.enabled=false --wait
	@echo ">> Building and Deploying Microservices..."
	@eval ACCOUNT_ID=$$(aws sts get-caller-identity --query Account --output text); \
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $$ACCOUNT_ID.dkr.ecr.$(AWS_REGION).amazonaws.com; \
	export KUBECONFIG=kubeconfig.yaml; \
	for svc in $(SERVICES); do \
		echo "Processing $$svc..."; \
		IMAGE_URI="$$ACCOUNT_ID.dkr.ecr.$(AWS_REGION).amazonaws.com/aerosphere-$$svc:latest"; \
		if [ "$$svc" = "dashboard" ]; then \
			docker build --platform linux/amd64 -t $$IMAGE_URI ./$$svc; \
		else \
			docker build --platform linux/amd64 -t $$IMAGE_URI ./services/$$svc; \
		fi; \
		docker push $$IMAGE_URI; \
		helm upgrade --install $$svc ./helm/aerosphere-core \
			--namespace aerosphere-prod \
			--set image.repository=$$ACCOUNT_ID.dkr.ecr.$(AWS_REGION).amazonaws.com/aerosphere-$$svc \
			--set nameOverride=$$svc \
			--wait; \
	done
	@echo ">> Applying Ingress Routing..."
	export KUBECONFIG=kubeconfig.yaml && kubectl apply -f kubernetes/ingress.yaml
	@echo "✅ AeroSphere EC2/K3s Ecosystem Successfully Deployed!"

cloud-down: ## Destroy all AWS EC2 infrastructure to prevent costs
	@echo "=========================================="
	@echo "⚠️ Destroying all AWS resources..."
	@echo ">> Emptying S3 App Bundle Bucket..."
	@eval BUCKET_NAME=$$(aws s3api list-buckets --query "Buckets[?contains(Name, 'aerosphere-app-bundle')].Name" --output text | awk '{print $$1}'); \
	if [ ! -z "$$BUCKET_NAME" ] && [ "$$BUCKET_NAME" != "None" ]; then \
		aws s3 rm s3://$$BUCKET_NAME --recursive; \
	fi
	@echo ">> Destroying AWS Infrastructure (Terraform)..."
	cd infrastructure && terraform destroy -auto-approve
	@echo "✅ AWS Bill reset to $$0. All resources destroyed."

local-up: ## Start local Docker Compose environment
	@echo "🚀 Starting Local Environment..."
	docker compose up --build -d
	@echo "✅ Local Dashboard available at http://localhost:8080"

local-down: ## Stop local Docker Compose environment
	@echo "🛑 Stopping Local Environment..."
	docker compose down

clean: ## Clean local cache and temporary files
	@echo "🧹 Cleaning up local workspace..."
	find . -type d -name "node_modules" -exec rm -rf {} +
	rm -rf infrastructure/.terraform
	rm -f infrastructure/.terraform.lock.hcl
	@echo "✅ Cleanup complete."


