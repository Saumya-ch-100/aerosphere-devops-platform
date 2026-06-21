#!/bin/bash
mkdir -p kubernetes
> kubernetes/microservices.yaml

SERVICES=("flight-ops" "telemetry" "maintenance" "weather-intel" "baggage-ops" "passenger-ops")
PORTS=(8001 8002 8003 8004 8005 8006)

for i in "${!SERVICES[@]}"; do
  SVC="${SERVICES[$i]}"
  PORT="${PORTS[$i]}"
  
  cat << YAML >> kubernetes/microservices.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SVC}-deployment
  namespace: aerosphere-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${SVC}
  template:
    metadata:
      labels:
        app: ${SVC}
    spec:
      containers:
      - name: ${SVC}
        image: IMAGE_PLACEHOLDER_${SVC}
        ports:
        - containerPort: ${PORT}
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: ${SVC}-service
  namespace: aerosphere-prod
spec:
  selector:
    app: ${SVC}
  ports:
    - protocol: TCP
      port: ${PORT}
      targetPort: ${PORT}
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${SVC}-hpa
  namespace: aerosphere-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${SVC}-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
---
YAML
done
