#!/bin/bash

# Kafka Topic Management Script for Aiven Cluster
# This is a convenience wrapper around create-kafka-topics.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
usage() {
    cat << EOF
Kafka Topic Management for Aiven Cluster

Usage: $0 [COMMAND]

Commands:
  create       Create topics from kafka/topics.yml
  create-dry   Preview topics that would be created (dry run)
  list         List all existing topics on cluster
  delete-all   Delete all topics (DANGEROUS!)
  help         Show this help message

Examples:
  $0 create          # Create topics from configuration
  $0 create-dry      # Preview without creating
  $0 list            # List existing topics
  $0 delete-all      # Delete all topics (use with caution!)

Configuration:
  Topics are defined in: backend/kafka/topics.yml
  Kafka credentials from: backend/.env

Required environment variables in .env:
  KAFKA_BROKERS           Kafka broker addresses
  KAFKA_SSL_CA_PATH       Path to CA certificate
  KAFKA_SSL_CERT_PATH     Path to client certificate
  KAFKA_SSL_KEY_PATH      Path to client key

EOF
}

# Check if node_modules exists
check_dependencies() {
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        error "node_modules not found. Please run 'npm install' first."
        info "Run: cd $BACKEND_DIR && npm install"
        exit 1
    fi
    
    # Check for js-yaml dependency
    if [ ! -d "$BACKEND_DIR/node_modules/js-yaml" ]; then
        warning "js-yaml not found. Installing..."
        cd "$BACKEND_DIR"
        npm install js-yaml
    fi
}

# Check if .env exists
check_env() {
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        error ".env file not found at $BACKEND_DIR/.env"
        info "Create a .env file with KAFKA_BROKERS and SSL certificate paths"
        exit 1
    fi
}

# Check if topics.yml exists
check_topics_config() {
    if [ ! -f "$BACKEND_DIR/kafka/topics.yml" ]; then
        error "topics.yml not found at $BACKEND_DIR/kafka/topics.yml"
        info "This file should contain your topic definitions"
        exit 1
    fi
}

# Main script
main() {
    local command="${1:-help}"
    
    case "$command" in
        create)
            info "Creating Kafka topics from configuration..."
            check_dependencies
            check_env
            check_topics_config
            cd "$BACKEND_DIR"
            node scripts/create-kafka-topics.js
            ;;
        create-dry|dry-run)
            info "Dry run: Showing what topics would be created..."
            check_dependencies
            check_env
            check_topics_config
            cd "$BACKEND_DIR"
            node scripts/create-kafka-topics.js --dry-run
            ;;
        list)
            info "Listing existing topics on Kafka cluster..."
            check_dependencies
            check_env
            cd "$BACKEND_DIR"
            node scripts/create-kafka-topics.js --list
            ;;
        delete-all)
            warning "This will DELETE ALL topics from the Kafka cluster!"
            read -p "Are you sure? Type 'yes' to confirm: " confirm
            if [ "$confirm" = "yes" ]; then
                error "Deleting all topics..."
                check_dependencies
                check_env
                cd "$BACKEND_DIR"
                node scripts/create-kafka-topics.js --delete-all
            else
                info "Cancelled"
            fi
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            error "Unknown command: $command"
            echo ""
            usage
            exit 1
            ;;
    esac
}

main "$@"

