#!/bin/bash

# Check Kafka broker access through SSH tunnel

set -e

LOCAL_PORT="9098"

echo "Kafka Broker Access Check"
echo "========================"
echo ""

# Check tunnel
echo "1. SSH Tunnel Status:"
if lsof -ti:${LOCAL_PORT} > /dev/null 2>&1; then
    TUNNEL_PID=$(lsof -ti:${LOCAL_PORT} | head -1)
    echo "   [OK] Tunnel is running (PID: ${TUNNEL_PID})"
else
    echo "   [FAIL] Tunnel is not running"
    echo ""
    echo "   Start tunnel with:"
    echo "     cd backend/scripts && ./msk-tunnel.sh"
    exit 1
fi

# Check port
echo ""
echo "2. Port Accessibility:"
if nc -zv localhost ${LOCAL_PORT} 2>&1 | grep -q "succeeded"; then
    echo "   [OK] Port ${LOCAL_PORT} is accessible"
else
    echo "   [FAIL] Port ${LOCAL_PORT} is not accessible"
    exit 1
fi

# Check AWS credentials
echo ""
echo "3. AWS Credentials:"
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "   [OK] AWS credentials configured"
    IDENTITY=$(aws sts get-caller-identity --output json 2>/dev/null)
    ACCOUNT=$(echo $IDENTITY | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
    USER=$(echo $IDENTITY | grep -o '"Arn": "[^"]*' | cut -d'"' -f4)
    echo "     Account: ${ACCOUNT}"
    echo "     Identity: ${USER}"
else
    echo "   [FAIL] AWS credentials not found"
    echo "   Configure with: aws configure"
    exit 1
fi

# Get MSK broker info
echo ""
echo "4. MSK Cluster Info:"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra/aws"

if [ ! -d "$INFRA_DIR" ]; then
    echo "   [WARN] Could not find infra/aws directory at: $INFRA_DIR"
    exit 1
fi

cd "$INFRA_DIR"

MSK_BROKERS=$(terraform output -raw msk_bootstrap_brokers_sasl_iam 2>/dev/null || echo "")
if [ -n "$MSK_BROKERS" ]; then
    echo "   [OK] MSK Bootstrap Brokers:"
    echo "$MSK_BROKERS" | tr ',' '\n' | sed 's/^/     /'
else
    echo "   [WARN] Could not get MSK broker endpoint"
fi

CLUSTER_NAME=$(terraform output -raw msk_cluster_name 2>/dev/null || echo "")
if [ -n "$CLUSTER_NAME" ]; then
    echo "   Cluster Name: ${CLUSTER_NAME}"
fi

echo ""
echo "=================================="
echo "[OK] All checks passed!"
echo ""
echo "Kafka brokers are accessible at:"
echo "  localhost:${LOCAL_PORT}"
echo ""
echo "Configure your backend .env:"
echo "  KAFKA_BROKERS=localhost:${LOCAL_PORT}"
echo ""
echo "Note: MSK uses IAM authentication. Make sure your AWS credentials"
echo "have permissions to access MSK cluster."

