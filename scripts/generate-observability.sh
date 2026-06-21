#!/bin/bash
> kubernetes/observability.yaml

SERVICES=("prometheus" "grafana" "vault" "elasticsearch" "logstash" "kibana")
IMAGES=("prom/prometheus:latest" "grafana/grafana:latest" "hashicorp/vault:1.15" "docker.elastic.co/elasticsearch/elasticsearch:8.10.2" "docker.elastic.co/logstash/logstash:8.10.2" "docker.elastic.co/kibana/kibana:8.10.2")
PORTS=(9090 3000 8200 9200 5044 5601)

for i in "${!SERVICES[@]}"; do
  SVC="${SERVICES[$i]}"
  IMG="${IMAGES[$i]}"
  PORT="${PORTS[$i]}"
  
  # Set special env vars for Vault and Elasticsearch
  ENV_VARS=""
  if [ "$SVC" == "vault" ]; then
    ENV_VARS="env:
        - name: VAULT_DEV_ROOT_TOKEN_ID
          value: \"root\"
        - name: VAULT_DEV_LISTEN_ADDRESS
          value: \"0.0.0.0:8200\""
  fi
  if [ "$SVC" == "elasticsearch" ]; then
    ENV_VARS="env:
        - name: discovery.type
          value: \"single-node\"
        - name: xpack.security.enabled
          value: \"false\""
  fi
  
  cat << YAML >> kubernetes/observability.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SVC}-deployment
  namespace: aerosphere-prod
spec:
  replicas: 1
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
        image: ${IMG}
        ports:
        - containerPort: ${PORT}
        ${ENV_VARS}
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
YAML
done
