 terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

# --- Security Groups ---
resource "aws_security_group" "alb_sg" {
  name        = "aerosphere-alb-sg-${var.environment}"
  description = "ALB Security Group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ec2_sg" {
  name        = "aerosphere-ec2-sg-${var.environment}"
  description = "EC2 Security Group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "Intra-cluster communication"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  ingress {
    description = "K3s API Access"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Application Load Balancer ---
resource "aws_lb" "main" {
  name               = "aerosphere-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = module.vpc.public_subnet_ids
}

resource "aws_lb_target_group" "app" {
  name     = "aerosphere-tg-${var.environment}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    path                = "/"
    port                = 80
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# --- AMI Data Source ---
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# --- ECR Repositories ---
resource "aws_ecr_repository" "services" {
  for_each = toset(["flight-ops", "telemetry", "maintenance", "weather-intel", "baggage-ops", "passenger-ops", "dashboard"])
  name                 = "aerosphere-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --- K3s EC2 Instances ---
resource "aws_instance" "master" {
  depends_on    = [module.vpc]
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.ec2_instance_type
  subnet_id     = module.vpc.public_subnet_ids[0]
  associate_public_ip_address = true
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  user_data = templatefile("${path.module}/user_data_master.sh", {
    k3s_token = var.k3s_token
  })

  root_block_device {
    volume_size = 50
    volume_type = "gp3"
  }

  tags = {
    Name = "aerosphere-k3s-master-${var.environment}"
  }
}

resource "aws_eip" "master_eip" {
  domain = "vpc"

  tags = {
    Name = "aerosphere-master-eip-${var.environment}"
  }
}

resource "aws_eip_association" "master_eip_assoc" {
  instance_id   = aws_instance.master.id
  allocation_id = aws_eip.master_eip.id
}

resource "aws_instance" "worker" {
  depends_on    = [module.vpc]
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.ec2_instance_type
  subnet_id     = module.vpc.public_subnet_ids[1]
  associate_public_ip_address = true
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  user_data = templatefile("${path.module}/user_data_worker.sh", {
    k3s_token = var.k3s_token
    master_ip = aws_instance.master.private_ip
  })

  root_block_device {
    volume_size = 50
    volume_type = "gp3"
  }

  tags = {
    Name = "aerosphere-k3s-worker-${var.environment}"
  }
}

resource "aws_lb_target_group_attachment" "master" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_instance.master.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "worker" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_instance.worker.id
  port             = 80
}

# --- IAM Role & Instance Profile for EC2 ---
resource "aws_iam_role" "ec2_role" {
  name = "aerosphere-ec2-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "s3_full_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "aerosphere-ec2-profile-${var.environment}"
  role = aws_iam_role.ec2_role.name
}

# --- S3 Bucket for App Bundle ---
resource "aws_s3_bucket" "app_bundle" {
  bucket_prefix = "aerosphere-app-bundle-${var.environment}-"
}

