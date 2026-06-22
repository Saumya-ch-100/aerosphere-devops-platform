# AeroSphere Command – Global Autonomous Aviation Operations Platform

AeroSphere Command manages a worldwide aviation operations platform supporting commercial airlines, cargo operators, private aviation services, airports, maintenance organizations, and air traffic management agencies. 

This repository contains the cloud-native modernization initiative focused on infrastructure automation, continuous deployment, observability, and resilience.

## 🚀 Live Demo

You can view the live AWS deployment of the AeroSphere Platform here:
**[http://aerosphere-alb-dev-1534496399.ap-south-1.elb.amazonaws.com/](http://aerosphere-alb-dev-1534496399.ap-south-1.elb.amazonaws.com/)**

> **Note:** The platform includes paths for `/grafana/` (Observability), `/prometheus/` (Metrics), and the main React Dashboard.

## 🏗 System Architecture

The AeroSphere ecosystem is an advanced, highly-available DevOps platform. The following diagram illustrates the complete CI/CD, deployment, and observability architecture:

```mermaid
graph TD
    %% Developers & Code
    subgraph "Source Control & CI/CD"
        Dev[Developers] -->|git push| GitHub[GitHub Repository]
        GitHub -->|Webhook| ALB[AWS ALB]
        ALB -->|/jenkins| Jenkins[Jenkins CI/CD]
        Jenkins -->|docker build & push| ECR[(AWS ECR)]
        Jenkins -->|helm upgrade| K3S[Kubernetes Cluster]
    end

    %% Kubernetes Cluster Architecture
    subgraph "AWS EC2 K3s Cluster (aerosphere-prod)"
        Traefik[Traefik Ingress Controller]
        ALB -->|HTTP 80| Traefik
        
        %% API Gateway
        Traefik -->|/| Dashboard[Dashboard NGINX Proxy + React]
        
        %% Microservices
        subgraph "Backend Services"
            Dashboard -->|/api/flight-ops| FlightOps[Flight Ops NodeJS]
            Dashboard -->|/api/telemetry| Telemetry[Telemetry NodeJS]
            Dashboard -->|/api/maintenance| Maintenance[Maintenance NodeJS]
            Dashboard -->|/api/weather-intel| Weather[Weather NodeJS]
            Dashboard -->|/api/passenger-ops| Passenger[Passenger NodeJS]
            Dashboard -->|/api/baggage-ops| Baggage[Baggage NodeJS]
            
            FlightOps --> DB[(PostgreSQL Database)]
        end
        
        %% Security & Observability
        subgraph "Security & Monitoring"
            Vault[HashiCorp Vault]
            Prometheus[Prometheus Server]
            Grafana[Grafana Dashboard]
            Prometheus -.->|scrapes metrics| FlightOps
            Prometheus -.->|scrapes metrics| Telemetry
            Dashboard -->|/api/vault| Vault
        end
    end
    
    classDef infra fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:black;
    classDef k8s fill:#326ce5,stroke:#fff,stroke-width:2px,color:white;
    classDef db fill:#336791,stroke:#fff,stroke-width:2px,color:white;
    
    class ALB,ECR aws;
    class K3S,Traefik k8s;
    class DB db;
```

## 🛠 Technology Stack

This project implements a highly available DevOps ecosystem designed to satisfy strict aviation authority requirements:

- **Infrastructure Automation**: AWS Provisioned via HashiCorp Terraform (`infrastructure/`)
- **Containerization**: 6 distinct microservices containerized via Docker (`services/`)
- **Orchestration**: Kubernetes / K3s with Helm package management (`helm/`, `kubernetes/`)
- **CI/CD Pipeline**: Jenkins declarative pipelines with automatic GitOps webhook triggers (`Jenkinsfile`)
- **Observability**: Prometheus & Grafana stack configured via Helm (`monitoring/`)
- **Centralized Logging**: Elasticsearch & Kibana (ELK Stack) (`logging/`)
- **Security & Secrets**: HashiCorp Vault Integration (`vault/`)
- **Resilience**: Disaster recovery simulations using Kubernetes Chaos testing (`security/`)

## ✈️ Core Capabilities
* **Automated Rollouts:** Commits to `main` trigger a zero-downtime deployment pipeline.
* **Flight Operations Center:** Track real-time aviation telemetry, manage flight routes, and execute flight delays.
* **Disaster Recovery Controls:** Simulate high-level infrastructure failure (such as Telemetry server outages) to demonstrate Kubernetes Self-Healing mechanisms and graceful degradation.

## ⚙️ How to Deploy Locally
1. Ensure `aws-cli`, `terraform`, `docker`, and `kubectl` are installed.
2. Run `make cloud-up` to automatically provision AWS EC2, bootstrap the K3s cluster, and deploy all Helm charts.
3. Access the dashboard via the load balancer URL provided in your CLI output.
4. Run `make cloud-down` to safely tear down all infrastructure and prevent further AWS charges.
