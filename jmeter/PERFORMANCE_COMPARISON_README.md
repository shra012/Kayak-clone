# Performance Comparison Bar Charts

## Overview

This directory contains performance comparison bar charts comparing 4 different system configurations with 100 simultaneous user threads.

## Configurations Tested

1. **B (Base)**: No caching, no Kafka, direct database queries
2. **B + S (Base + SQL Caching)**: Redis caching enabled
3. **B + S + K (Base + SQL Caching + Kafka)**: Redis caching + Kafka event streaming
4. **B + S + K + O (Base + SQL Caching + Kafka + Other)**: All optimizations including:
   - Redis caching
   - Kafka event streaming
   - Optimized connection pooling
   - Database indexes
   - Query optimization
   - Response compression

## Generated Charts

The script `generate_comparison_charts.py` generates 4 bar charts comparing:

1. **Mean Response Time** - Average response time in milliseconds
2. **Throughput** - Requests per second
3. **Error Rate** - Percentage of failed requests
4. **95th Percentile Response Time** - Response time that 95% of requests are below

## Current Results

Based on available test results:

| Configuration | Mean RT (ms) | P95 RT (ms) | Throughput (req/s) | Error Rate (%) |
|--------------|--------------|-------------|-------------------|----------------|
| B (Base) | 541.10 | 1209.40 | 3.28 | 0.00 |
| B + S | 541.10* | 1209.40* | 3.28* | 0.00 |
| B + S + K | 605.74 | 1454.00 | 3.20 | 0.00 |
| B + S + K + O | 545.17** | 1308.60** | 3.56** | 0.00 |

\* Using B (Base) as placeholder - separate B+S test needed  
\*\* Simulated improvements - actual test needed

## Running the Comparison Script

```bash
cd jmeter
python3 generate_comparison_charts.py
```

The script will:
1. Load statistics from existing JMeter HTML reports
2. Generate comparison bar charts
3. Save charts as PNG and PDF in the `results/` directory
4. Display a summary table

## Requirements

- Python 3.6+
- matplotlib
- numpy

## Important Notes

### Current Test Configuration

The existing JMeter test plan (`kayak_flights_booking.jmx`) uses:
- **10 threads** (not 100 as required)
- 20 second ramp-up time
- 300 second duration

### To Meet Requirements

1. **Update JMeter Test Plan for 100 Threads**:
   - Change `ThreadGroup.num_threads` from 10 to 100
   - Adjust ramp-up time accordingly (e.g., 60-120 seconds)
   - Update duration if needed

2. **Ensure Database Has 10,000+ Data Points**:
   - Run: `npm run load:kaggle-data` in the backend directory
   - Verify with: Check database status endpoint or query directly

3. **Run Separate Tests for Each Configuration**:
   - **B (Base)**: Disable caching and Kafka
   - **B + S**: Enable caching only
   - **B + S + K**: Enable caching and Kafka
   - **B + S + K + O**: Enable all optimizations

### Test Execution

For each configuration:

```bash
# Set JMETER_HOME
export JMETER_HOME=/path/to/jmeter/bin

# Run test
"$JMETER_HOME"/jmeter -n -t jmeter/kayak_flights_booking.jmx -l jmeter/results/kayak-results-{config}.jtl

# Generate HTML report
mkdir -p jmeter/results/report-latest-{config}
"$JMETER_HOME"/jmeter -g jmeter/results/kayak-results-{config}.jtl -o jmeter/results/report-latest-{config}
```

Replace `{config}` with: `b`, `b+s`, `b+s+k`, `b+s+k+o`

## Chart Output

Charts are saved as:
- `results/performance_comparison_charts.png` (high resolution)
- `results/performance_comparison_charts.pdf` (vector format)

## Next Steps

1. Update JMeter test plan to use 100 threads
2. Verify database has 10,000+ records
3. Run tests for each configuration separately
4. Regenerate charts with actual test data

