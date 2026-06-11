terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
  # For local testing we use local state, in prod we would use s3
  # backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

# --- VPC Module ---
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr             = var.vpc_cidr
  environment          = var.environment
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

# --- EKS Cluster Module ---
module "eks" {
  source = "./modules/eks-cluster"

  cluster_name    = "aerosphere-eks-${var.environment}"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  environment     = var.environment
  node_instance_type = var.node_instance_type
  min_capacity    = var.min_capacity
  max_capacity    = var.max_capacity
}

# --- ECR Repositories ---
resource "aws_ecr_repository" "services" {
  for_each = toset(["flight-ops", "telemetry", "maintenance", "weather-intel", "baggage-ops", "passenger-ops"])
  name                 = "aerosphere-${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --- RDS PostgreSQL ---
resource "aws_db_subnet_group" "main" {
  name       = "aerosphere-db-subnet-${var.environment}"
  subnet_ids = module.vpc.private_subnet_ids

  tags = {
    Name = "aerosphere-db-subnet-${var.environment}"
  }
}

resource "aws_db_instance" "main" {
  identifier           = "aerosphere-db-${var.environment}"
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  username             = "aerosphere_admin"
  password             = "super_secret_temporary_password_123!" # In prod, inject via Vault
  db_subnet_group_name = aws_db_subnet_group.main.name
  skip_final_snapshot  = true
  publicly_accessible  = false
}
