#!/bin/sh
sleep 5
echo "Initializing Vault with secrets..."
curl --header "X-Vault-Token: root" \
     --request POST \
     --data '{"data": {"postgres_password": "secure_password_from_vault"}}' \
     http://localhost:8200/v1/secret/data/database
echo "Vault initialized!"
