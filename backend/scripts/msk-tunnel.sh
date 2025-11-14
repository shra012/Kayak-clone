#!/bin/bash

# Simple SSH Tunnel to MSK
# Forwards localhost:9098 to MSK broker:9098 through bastion

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra/aws"
REGION="us-east-1"
LOCAL_PORT="9098"
MSK_PORT="9098"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}MSK SSH Tunnel${NC}"
echo "=============="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

cd "$INFRA_DIR"

# Get bastion instance ID
INSTANCE_ID=$(terraform output -raw bastion_instance_id 2>/dev/null || echo "")

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "null" ]; then
    echo -e "${RED}Error: Bastion instance not found${NC}"
    echo "Run 'terraform apply' in $INFRA_DIR first"
    exit 1
fi

# Get bastion IP
BASTION_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text 2>/dev/null || echo "")

if [ -z "$BASTION_IP" ]; then
    echo -e "${RED}Error: Could not get bastion IP${NC}"
    exit 1
fi

# Get MSK broker endpoint
MSK_BROKER=$(terraform output -raw msk_bootstrap_brokers_sasl_iam 2>/dev/null | cut -d',' -f1 | cut -d':' -f1 || echo "")

if [ -z "$MSK_BROKER" ]; then
    MSK_BROKER="b-1.kayakdev.0bkbrv.c8.kafka.us-east-1.amazonaws.com"
fi

# Check for SSH key
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
if [ ! -f "$SSH_KEY" ] && [ ! -f "${SSH_KEY}.pem" ]; then
    echo -e "${YELLOW}Warning: SSH key not found at $SSH_KEY${NC}"
    echo ""
    echo "Options:"
    echo "  1. Set SSH_KEY environment variable: export SSH_KEY=/path/to/your/key.pem"
    echo "  2. Use default key: ~/.ssh/id_rsa or ~/.ssh/id_rsa.pem"
    echo ""
    echo "If bastion doesn't have a key pair, add one via Terraform:"
    echo "  1. Create/import key pair in AWS EC2"
    echo "  2. Add to terraform.tfvars: bastion_key_name = \"your-key-name\""
    echo "  3. Run: terraform apply"
    echo ""
    read -p "Continue without key? (will use default SSH key) [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Bastion IP: $BASTION_IP"
echo "MSK Broker: $MSK_BROKER:$MSK_PORT"
echo "Local port: $LOCAL_PORT"
echo ""

# Build SSH command
SSH_CMD="ssh -N -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -L ${LOCAL_PORT}:${MSK_BROKER}:${MSK_PORT}"

# Add key if specified
if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
    SSH_CMD="$SSH_CMD -i $SSH_KEY"
elif [ -n "$SSH_KEY" ] && [ -f "${SSH_KEY}.pem" ]; then
    SSH_CMD="$SSH_CMD -i ${SSH_KEY}.pem"
fi

SSH_CMD="$SSH_CMD ec2-user@${BASTION_IP}"

echo -e "${GREEN}Starting SSH tunnel...${NC}"
echo ""
echo "Command: $SSH_CMD"
echo ""
echo "Once connected, configure your backend .env:"
echo "  KAFKA_BROKERS=localhost:$LOCAL_PORT"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
echo ""

# Start SSH tunnel
eval "$SSH_CMD"
