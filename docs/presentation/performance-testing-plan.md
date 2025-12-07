# Performance Testing Plan

## Overview

This document outlines the performance testing strategy for comparing different system configurations with 100 simultaneous user threads.

## Test Scenarios

### Scenario A: Base (B)
**Configuration:**
- No caching (Redis disabled)
- No Kafka event streaming
- Direct database queries
- Synchronous processing only
- Basic connection pooling

**Expected Performance:**
- Higher response times
- Lower throughput
- Higher database load

### Scenario B: Base + SQL Caching (B + S)
**Configuration:**
- Redis caching enabled
- Cache TTL: 300s (listings), 600s (users), 60s (searches)
- Cache-aside pattern
- No Kafka
- Synchronous processing

**Expected Performance:**
- Improved response times for cached data
- Reduced database load
- Higher throughput

### Scenario C: Base + SQL Caching + Kafka (B + S + K)
**Configuration:**
- Redis caching enabled
- Kafka event streaming enabled
- Async event processing
- Event-driven architecture
- Consumer groups configured

**Expected Performance:**
- Further improved response times
- Better scalability
- Decoupled services

### Scenario D: Base + SQL Caching + Kafka + Other Techniques (B + S + K + O)
**Configuration:**
- Redis caching enabled
- Kafka event streaming enabled
- Optimized connection pooling
- Database indexes on all foreign keys
- Query optimization (prepared statements)
- Response compression (gzip)
- Request batching where applicable
- Connection pool tuning

**Expected Performance:**
- Best response times
- Highest throughput
- Optimal resource utilization

## Test Data Requirements

### Database Population
- **Users**: 10,000+ user records
- **Flights**: 10,000+ flight listings
- **Hotels**: 10,000+ hotel listings
- **Cars**: 10,000+ car listings
- **Bookings**: 5,000+ booking records
- **Payments**: 5,000+ payment records

### Data Generation Script
See: `backend/scripts/generate-test-data.js`

## JMeter Test Plans

### Test Plan Structure
```
jmeter-test-plans/
├── scenario-a-base.jmx
├── scenario-b-cache.jmx
├── scenario-c-kafka.jmx
├── scenario-d-optimized.jmx
└── results/
    ├── scenario-a-results.csv
    ├── scenario-b-results.csv
    ├── scenario-c-results.csv
    └── scenario-d-results.csv
```

### Test Configuration
- **Threads (Users)**: 100
- **Ramp-up Period**: 10 seconds
- **Loop Count**: 50 (or Duration: 5 minutes)
- **Test Duration**: 5 minutes per scenario

### API Endpoints to Test

1. **Search Flights**
   - `GET /api/v1/flights?from=JFK&to=LAX&departDate=2024-12-01`
   - Expected: 200 OK, JSON response

2. **Search Hotels**
   - `GET /api/v1/hotels?city=New York&checkIn=2024-12-01&checkOut=2024-12-05`
   - Expected: 200 OK, JSON response

3. **Search Cars**
   - `GET /api/v1/cars?city=Los Angeles&pickupDate=2024-12-01`
   - Expected: 200 OK, JSON response

4. **Create Booking**
   - `POST /api/v1/bookings`
   - Body: `{bookingType: "flight", listingId: "...", priceAmount: 299.99}`
   - Expected: 201 Created

5. **Create Payment**
   - `POST /api/v1/payments`
   - Body: `{bookingId: "...", amount: 299.99, currency: "USD"}`
   - Expected: 201 Created

6. **Get User Profile**
   - `GET /api/v1/users/{userId}`
   - Expected: 200 OK

## Metrics to Collect

### 1. Response Time Metrics
- **Average Response Time** (ms)
- **Median Response Time** (ms)
- **90th Percentile** (ms)
- **95th Percentile** (ms)
- **99th Percentile** (ms)
- **Min/Max Response Time** (ms)

### 2. Throughput Metrics
- **Requests per Second** (RPS)
- **Total Requests**
- **Successful Requests**
- **Failed Requests**

### 3. Error Metrics
- **Error Rate** (%)
- **4xx Errors** (Client Errors)
- **5xx Errors** (Server Errors)
- **Timeout Errors**

### 4. Resource Utilization
- **CPU Usage** (%)
- **Memory Usage** (MB)
- **Database Connections** (active/idle)
- **Network I/O** (bytes/sec)

## Bar Chart Specifications

### Chart 1: Average Response Time Comparison
**Y-axis**: Response Time (ms)
**X-axis**: Scenarios (B, B+S, B+S+K, B+S+K+O)
**Bars**: Average response time for each scenario

### Chart 2: Throughput Comparison
**Y-axis**: Requests per Second (RPS)
**X-axis**: Scenarios (B, B+S, B+S+K, B+S+K+O)
**Bars**: Throughput for each scenario

### Chart 3: Error Rate Comparison
**Y-axis**: Error Rate (%)
**X-axis**: Scenarios (B, B+S, B+S+K, B+S+K+O)
**Bars**: Error rate for each scenario

### Chart 4: 95th Percentile Response Time
**Y-axis**: Response Time (ms)
**X-axis**: Scenarios (B, B+S, B+S+K, B+S+K+O)
**Bars**: 95th percentile response time

## Execution Steps

1. **Prepare Test Environment**
   ```bash
   # Start services
   docker-compose up -d
   
   # Generate test data
   cd backend
   node scripts/generate-test-data.js
   ```

2. **Configure Scenario A (Base)**
   ```bash
   # Disable caching
   export CACHE_ENABLED=false
   export KAFKA_ENABLED=false
   
   # Restart backend
   docker-compose restart backend
   ```

3. **Run JMeter Test A**
   ```bash
   jmeter -n -t jmeter-test-plans/scenario-a-base.jmx -l results/scenario-a-results.csv
   ```

4. **Configure Scenario B (B + S)**
   ```bash
   # Enable caching
   export CACHE_ENABLED=true
   export KAFKA_ENABLED=false
   
   # Restart backend
   docker-compose restart backend
   ```

5. **Run JMeter Test B**
   ```bash
   jmeter -n -t jmeter-test-plans/scenario-b-cache.jmx -l results/scenario-b-results.csv
   ```

6. **Configure Scenario C (B + S + K)**
   ```bash
   # Enable caching and Kafka
   export CACHE_ENABLED=true
   export KAFKA_ENABLED=true
   
   # Restart backend
   docker-compose restart backend
   ```

7. **Run JMeter Test C**
   ```bash
   jmeter -n -t jmeter-test-plans/scenario-c-kafka.jmx -l results/scenario-c-results.csv
   ```

8. **Configure Scenario D (B + S + K + O)**
   ```bash
   # Enable all optimizations
   export CACHE_ENABLED=true
   export KAFKA_ENABLED=true
   # Additional optimizations are in code
   
   # Restart backend
   docker-compose restart backend
   ```

9. **Run JMeter Test D**
   ```bash
   jmeter -n -t jmeter-test-plans/scenario-d-optimized.jmx -l results/scenario-d-results.csv
   ```

10. **Generate Reports**
    ```bash
    # Use JMeter's HTML report generator
    jmeter -g results/scenario-a-results.csv -o reports/scenario-a
    jmeter -g results/scenario-b-results.csv -o reports/scenario-b
    jmeter -g results/scenario-c-results.csv -o reports/scenario-c
    jmeter -g results/scenario-d-results.csv -o reports/scenario-d
    ```

## Expected Results Summary

| Metric | B | B+S | B+S+K | B+S+K+O |
|--------|---|-----|-------|---------|
| Avg Response Time (ms) | ~500 | ~200 | ~150 | ~100 |
| Throughput (RPS) | ~50 | ~150 | ~200 | ~300 |
| Error Rate (%) | ~5 | ~2 | ~1 | ~0.5 |
| 95th Percentile (ms) | ~1000 | ~400 | ~300 | ~200 |

## Analysis Script

See: `scripts/analyze-performance-results.js` for automated analysis and chart generation.





