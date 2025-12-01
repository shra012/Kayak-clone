#!/bin/bash

# Performance Testing Script
# Runs all 4 JMeter scenarios with appropriate backend configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
JMETER_DIR="$PROJECT_ROOT/jmeter-test-plans"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DATABASE_URL="postgresql://kayak:kayak@localhost:5432/kayak"
MONGODB_URI="mongodb://kayak:kayak@localhost:27018/?authSource=admin"
BACKEND_PORT=3000
BACKEND_PID=""

# Function to check if backend is ready
wait_for_backend() {
    echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:$BACKEND_PORT/health/live > /dev/null 2>&1; then
            echo -e "${GREEN}Backend is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}Backend failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to start backend with specific config
start_backend() {
    local cache_enabled=$1
    local kafka_enabled=$2
    local scenario_name=$3
    
    echo -e "\n${GREEN}=== Starting backend for $scenario_name ===${NC}"
    echo -e "Cache: $cache_enabled, Kafka: $kafka_enabled"
    
    cd "$BACKEND_DIR"
    
    # Kill any existing backend process
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi
    
    # Start backend in background
    export DATABASE_URL="$DATABASE_URL"
    export MONGODB_URI="$MONGODB_URI"
    export POSTGRES_SSL=false
    export CACHE_ENABLED=$cache_enabled
    export KAFKA_ENABLED=$kafka_enabled
    export PORT=$BACKEND_PORT
    export DISABLE_RATE_LIMIT=true
    
    npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo -e "${YELLOW}Backend started with PID: $BACKEND_PID${NC}"
    
    # Wait for backend to be ready
    if ! wait_for_backend; then
        echo -e "${RED}Failed to start backend. Check /tmp/backend.log${NC}"
        cat /tmp/backend.log
        exit 1
    fi
    
    sleep 3  # Give it a bit more time to fully initialize
}

# Function to stop backend
stop_backend() {
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
        BACKEND_PID=""
        sleep 2
    fi
}

# Function to run JMeter test
run_jmeter_test() {
    local scenario_file=$1
    local results_file=$2
    local scenario_name=$3
    
    echo -e "\n${GREEN}=== Running JMeter test: $scenario_name ===${NC}"
    echo -e "Test plan: $scenario_file"
    echo -e "Results: $results_file"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f "$JMETER_DIR/$scenario_file" ]; then
        echo -e "${RED}JMeter test plan not found: $JMETER_DIR/$scenario_file${NC}"
        return 1
    fi
    
    # Create results directory if it doesn't exist
    mkdir -p "$JMETER_DIR/results"
    
    # Run JMeter in non-GUI mode
    # Remove existing report directory if it exists
    rm -rf "$JMETER_DIR/reports/$scenario_name"
    
    jmeter -n \
        -t "$JMETER_DIR/$scenario_file" \
        -l "$JMETER_DIR/results/$results_file" 2>&1 | tee /tmp/jmeter-$scenario_name.log
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✓ JMeter test completed: $scenario_name${NC}"
        return 0
    else
        echo -e "${RED}✗ JMeter test failed: $scenario_name${NC}"
        return 1
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    stop_backend
    exit 0
}

# Trap to ensure cleanup on exit
trap cleanup EXIT INT TERM

# Main execution
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Performance Testing Suite${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}JMeter is not installed. Please install it first.${NC}"
    echo -e "Install with: brew install jmeter"
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd "$BACKEND_DIR"
    npm install
fi

# Scenario A: Base (B)
start_backend "false" "false" "Base (B)"
run_jmeter_test "scenario-base.jmx" "scenario-a-results.csv" "scenario-a"
stop_backend

# Scenario B: Base + Cache (B+S)
start_backend "true" "false" "Base + Cache (B+S)"
run_jmeter_test "scenario-b-cache.jmx" "scenario-b-results.csv" "scenario-b"
stop_backend

# Scenario C: Base + Cache + Kafka (B+S+K)
start_backend "true" "true" "Base + Cache + Kafka (B+S+K)"
run_jmeter_test "scenario-c-kafka.jmx" "scenario-c-results.csv" "scenario-c"
stop_backend

# Scenario D: Base + Cache + Kafka + Optimizations (B+S+K+O)
start_backend "true" "true" "Base + Cache + Kafka + Optimizations (B+S+K+O)"
run_jmeter_test "scenario-d-optimized.jmx" "scenario-d-results.csv" "scenario-d"
stop_backend

# Generate final report
echo -e "\n${GREEN}=== Generating performance report ===${NC}"
cd "$PROJECT_ROOT"
node scripts/analyze-performance-results.js

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}All performance tests completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nView results:"
echo -e "  CSV: $JMETER_DIR/reports/performance-results.csv"
echo -e "  HTML: $JMETER_DIR/reports/performance-report.html"
echo -e "\nOpen report: open $JMETER_DIR/reports/performance-report.html"

