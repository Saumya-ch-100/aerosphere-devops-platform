pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        SERVICES = 'flight-ops telemetry maintenance weather-intel baggage-ops passenger-ops dashboard'
        // We assume Jenkins has a credential configured with the Kubeconfig, or we use the local K3s context
        // Since Jenkins is running IN the Kubernetes cluster, we can deploy via helm natively!
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Images') {
            steps {
                script {
                    // Get AWS Account ID for ECR
                    def ACCOUNT_ID = sh(script: 'aws sts get-caller-identity --query Account --output text', returnStdout: true).trim()
                    env.ACCOUNT_ID = ACCOUNT_ID
                    env.ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

                    // Login to ECR
                    sh 'aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}'

                    def services = env.SERVICES.split(' ')
                    for (int i = 0; i < services.size(); i++) {
                        def svc = services[i]
                        echo "Building and pushing ${svc}..."
                        def imageUri = "${env.ECR_REGISTRY}/aerosphere-${svc}:latest"
                        
                        // Dashboard has a different path than microservices
                        def buildPath = (svc == 'dashboard') ? './dashboard' : "./services/${svc}"
                        
                        sh "docker build --platform linux/amd64 -t ${imageUri} ${buildPath}"
                        sh "docker push ${imageUri}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes via Helm') {
            steps {
                script {
                    def services = env.SERVICES.split(' ')
                    for (int i = 0; i < services.size(); i++) {
                        def svc = services[i]
                        echo "Deploying ${svc}..."
                        def helmArgs = ""
                        if (svc == 'dashboard') {
                            helmArgs = "--set service.targetPort=80 --set probes.liveness.path=/ --set probes.readiness.path=/"
                        }
                        
                        sh """
                        helm upgrade --install ${svc} ./helm/aerosphere-core \\
                            --namespace aerosphere-prod \\
                            --set image.repository=${env.ECR_REGISTRY}/aerosphere-${svc} \\
                            --set nameOverride=${svc} \\
                            ${helmArgs} \\
                            --wait
                        """
                    }
                    
                    echo "Applying Ingress Routing..."
                    sh "kubectl apply -f kubernetes/ingress.yaml"
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline successfully deployed all services!"
        }
        failure {
            echo "❌ Pipeline failed during execution."
        }
    }
}
