# AWS Setup Guide: CodeDeploy + ECS + Fargate

## 📋 Prerequisites

Before setting up, you need:
1. AWS Account
2. AWS CLI installed locally (optional, for testing)
3. GitHub repository secrets configured

---

## 🔧 Step 1: Create ECR Repositories

**ECR (Elastic Container Registry)** = Where Docker images are stored

### Using AWS Console:
1. Go to **ECR** → **Repositories** → **Create repository**
2. Create two repositories:
   - `husky-bridge-backend`
   - `husky-bridge-frontend`
3. Note the repository URIs (format: `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/REPO_NAME`)

### Using AWS CLI:
```bash
aws ecr create-repository --repository-name husky-bridge-backend --region YOUR_REGION
aws ecr create-repository --repository-name husky-bridge-frontend --region YOUR_REGION
```

---

## 🔐 Step 2: Create IAM Roles

### Role 1: ECS Task Execution Role
**Purpose**: Allows ECS to pull images from ECR and write logs

1. Go to **IAM** → **Roles** → **Create role**
2. Select **AWS service** → **Elastic Container Service** → **Elastic Container Service Task**
3. Attach policies:
   - `AmazonECSTaskExecutionRolePolicy`
   - `AmazonEC2ContainerRegistryReadOnly` (to pull images)
4. Name: `ecsTaskExecutionRole`
5. Note the ARN: `arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole`

### Role 2: ECS Task Role
**Purpose**: Allows containers to access AWS services (Secrets Manager, etc.)

1. Go to **IAM** → **Roles** → **Create role**
2. Select **AWS service** → **Elastic Container Service** → **Elastic Container Service Task**
3. Attach policies:
   - `AmazonSecretsManagerReadWrite` (if using Secrets Manager)
   - Custom policies as needed
4. Name: `ecsTaskRole`
5. Note the ARN: `arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole`

### Role 3: GitHub Actions Role (for CI/CD)
**Purpose**: Allows GitHub Actions to push to ECR and deploy

1. Go to **IAM** → **Users** → **Create user** (or use existing)
2. Attach policies:
   - `AmazonEC2ContainerRegistryFullAccess` (push to ECR)
   - `AmazonECS_FullAccess` (deploy to ECS)
   - `AWSCodeDeployRoleForECS` (CodeDeploy permissions)
   - `IAMFullAccess` (to create/update task definitions)
3. Create **Access Key** → Save `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

---

## 🌐 Step 3: Create VPC and Networking

### Create VPC (if you don't have one):
1. Go to **VPC** → **Create VPC**
2. Name: `husky-bridge-vpc`
3. IPv4 CIDR: `10.0.0.0/16`
4. Create **2 public subnets** in different AZs:
   - `subnet-1`: `10.0.1.0/24` (us-east-1a)
   - `subnet-2`: `10.0.2.0/24` (us-east-1b)
5. Create **Internet Gateway** and attach to VPC
6. Create **Route Table** with route to Internet Gateway

### Create Security Group:
1. Go to **EC2** → **Security Groups** → **Create security group**
2. Name: `husky-bridge-sg`
3. Inbound rules:
   - Port 80 (HTTP) from `0.0.0.0/0`
   - Port 4000 (Backend API) from `0.0.0.0/0`
   - Port 443 (HTTPS) from `0.0.0.0/0`
4. Note the Security Group ID: `sg-XXXXXXXX`

---

## ⚖️ Step 4: Create Application Load Balancer (ALB)

**Purpose**: Routes traffic to ECS containers

1. Go to **EC2** → **Load Balancers** → **Create Load Balancer**
2. Type: **Application Load Balancer**
3. Name: `husky-bridge-alb`
4. Scheme: **Internet-facing**
5. IP address type: **IPv4**
6. VPC: Select your VPC
7. Subnets: Select your 2 public subnets
8. Security group: `husky-bridge-sg`
9. Create **Target Groups**:
   - **Backend TG**: Port 4000, Protocol HTTP, Health check: `/api/auth/current`
   - **Frontend TG**: Port 80, Protocol HTTP, Health check: `/`
10. Note the Target Group ARNs

---

## 📦 Step 5: Create ECS Cluster

1. Go to **ECS** → **Clusters** → **Create Cluster**
2. Name: `husky-bridge-cluster`
3. Infrastructure: **AWS Fargate (Serverless)**
4. Create cluster

---

## 🚀 Step 6: Register Task Definitions

### Update Task Definitions:
1. Edit `ecs/task-definition.json` files
2. Replace placeholders:
   - `YOUR_ACCOUNT_ID` → Your AWS Account ID
   - `REGION` → Your AWS region (e.g., `us-east-1`)
   - Update IAM role ARNs
   - Update ECR image URIs

### Register Task Definitions:
```bash
# Backend
aws ecs register-task-definition --cli-input-json file://ecs/task-definition.json

# Frontend
aws ecs register-task-definition --cli-input-json file://ecs/task-definition.json
```

---

## 🎯 Step 7: Create ECS Services

### Update Service Definitions:
1. Edit `ecs/service-definition.json` files
2. Replace placeholders:
   - `subnet-XXXXXXXX` → Your subnet IDs
   - `sg-XXXXXXXX` → Your security group ID
   - Update Target Group ARN

### Create Services:
```bash
# Backend
aws ecs create-service --cli-input-json file://ecs/service-definition.json

# Frontend
aws ecs create-service --cli-input-json file://ecs/service-definition.json
```

---

## 🔄 Step 8: Create CodeDeploy Application

1. Go to **CodeDeploy** → **Applications** → **Create application**
2. Application name: `husky-bridge-backend-app` (and `husky-bridge-frontend-app`)
3. Compute platform: **Amazon ECS**
4. Create **Deployment Group**:
   - Name: `husky-bridge-backend-dg`
   - Service role: Use `AWSCodeDeployRoleForECS` (create if needed)
   - ECS cluster: `husky-bridge-cluster`
   - ECS service: `husky-bridge-backend-service`
   - Load balancer: Select your ALB
   - Target group: Backend target group
   - Deployment configuration: **CodeDeployDefault.ECSAllAtOnce** (or blue/green)

---

## 🔑 Step 9: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:
- `AWS_ACCESS_KEY_ID` → From Step 2
- `AWS_SECRET_ACCESS_KEY` → From Step 2
- `AWS_REGION` → Your AWS region (e.g., `us-east-1`)

---

## 🗄️ Step 10: Set Up Secrets Manager (Optional but Recommended)

**Purpose**: Store sensitive data (MongoDB connection string, session secrets)

1. Go to **Secrets Manager** → **Store a new secret**
2. Create secrets:
   - `husky-bridge/mongodb` → Your MongoDB connection string
   - `husky-bridge/session-secret` → Your session secret
3. Note the ARNs and update task definitions

---

## ✅ Step 11: Update Configuration Files

### Files to Update:

1. **Task Definitions** (`ecs/task-definition.json`):
   - Replace `YOUR_ACCOUNT_ID`
   - Replace `REGION`
   - Update IAM role ARNs
   - Update ECR image URIs
   - Update Secrets Manager ARNs (if using)

2. **Service Definitions** (`ecs/service-definition.json`):
   - Replace subnet IDs
   - Replace security group ID
   - Update Target Group ARN

3. **AppSpec Files** (`codedeploy/appspec.yml`):
   - Replace `YOUR_ACCOUNT_ID`
   - Replace `REGION`
   - Update Lambda function ARNs (if using hooks)

---

## 🧪 Step 12: Test the Pipeline

1. Push code to `main` branch
2. GitHub Actions will:
   - Run tests
   - Build Docker images
   - Push to ECR
   - Deploy to ECS
   - Trigger CodeDeploy

3. Monitor:
   - **GitHub Actions**: Check workflow runs
   - **ECS**: Check service status
   - **CodeDeploy**: Check deployment status
   - **ALB**: Check target health

---

## 📊 Architecture Overview

```
GitHub Actions
    ↓
Build Docker Image
    ↓
Push to ECR
    ↓
Update ECS Task Definition
    ↓
Deploy to ECS Service (Fargate)
    ↓
CodeDeploy (Blue/Green Deployment)
    ↓
Application Load Balancer
    ↓
Users
```

---

## 🎯 What You Need to Provide

1. **AWS Account ID** (12-digit number)
2. **AWS Region** (e.g., `us-east-1`, `us-west-2`)
3. **VPC and Subnet IDs** (or create new ones)
4. **Security Group ID**
5. **Target Group ARNs** (after creating ALB)

Once you provide these, I'll help you update all the configuration files!

---

## 🚨 Common Issues

### Issue: "Access Denied" when pushing to ECR
**Solution**: Check IAM user has `AmazonEC2ContainerRegistryFullAccess`

### Issue: "Task failed to start"
**Solution**: Check task execution role has correct permissions

### Issue: "Service creation failed"
**Solution**: Verify subnet IDs, security group, and target group ARN

### Issue: "CodeDeploy deployment failed"
**Solution**: Check CodeDeploy service role and ECS service name match

---

## 📝 Next Steps

After setup:
1. Update all placeholder values in config files
2. Test deployment manually first
3. Then test via GitHub Actions
4. Monitor CloudWatch logs for debugging

Ready to proceed? Share your AWS details and I'll help you configure everything! 🚀

