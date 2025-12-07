# Running JMeter Tests with 100 Threads

## Quick Start

The JMeter test plan has been updated to use **100 threads** instead of 10.

### Prerequisites

1. **Backend must be running** on `localhost:3000`
2. **JMeter must be installed** (check with `which jmeter`)
3. **Database should have 10,000+ records** (run `npm run load:kaggle-data` in backend directory)

### Running a Test

#### Option 1: Using the Helper Script

```bash
cd jmeter

# Run test for a specific configuration
./run_performance_tests.sh b          # B (Base)
./run_performance_tests.sh b+s        # B + S (Base + SQL Caching)
./run_performance_tests.sh b+s+k      # B + S + K (Base + SQL Caching + Kafka)
./run_performance_tests.sh b+s+k+o    # B + S + K + O (All optimizations)

# Or run all configurations (you'll need to configure backend between tests)
./run_performance_tests.sh all
```

#### Option 2: Manual JMeter Commands

```bash
cd jmeter

# Set JMeter path (if not in PATH)
export JMETER_HOME=/path/to/jmeter/bin

# Run test (replace {config} with: b, b+s, b+s+k, b+s+k+o)
"$JMETER_HOME"/jmeter -n -t kayak_flights_booking.jmx \
  -l results/kayak-results-{config}-100threads.jtl \
  -e -o results/report-latest-{config}-100threads
```

### Test Configuration

The test plan (`kayak_flights_booking.jmx`) is configured with:
- **100 threads** (simultaneous users)
- **60 second ramp-up** time
- **300 second** test duration
- **2000ms think time** between requests

### Generating Comparison Charts

After running tests for all configurations, generate the comparison charts:

```bash
cd jmeter
python3 generate_comparison_charts.py
```

The script will automatically:
- Look for 100-thread results first
- Fall back to 10-thread results if 100-thread results aren't available
- Generate 4 bar charts comparing all configurations
- Save charts as PNG and PDF in `results/` directory

### Backend Configuration for Each Test

You need to configure your backend differently for each test:

#### B (Base)
- Disable caching: Set `CACHE_ENABLED=false` in backend `.env`
- Disable Kafka: Set `KAFKA_ENABLED=false` in backend `.env`
- Restart backend

#### B + S (Base + SQL Caching)
- Enable caching: Set `CACHE_ENABLED=true` in backend `.env`
- Disable Kafka: Set `KAFKA_ENABLED=false` in backend `.env`
- Restart backend

#### B + S + K (Base + SQL Caching + Kafka)
- Enable caching: Set `CACHE_ENABLED=true` in backend `.env`
- Enable Kafka: Set `KAFKA_ENABLED=true` in backend `.env`
- Restart backend

#### B + S + K + O (Base + SQL Caching + Kafka + Other)
- Enable caching: Set `CACHE_ENABLED=true` in backend `.env`
- Enable Kafka: Set `KAFKA_ENABLED=true` in backend `.env`
- Ensure all optimizations are enabled:
  - Database indexes
  - Connection pooling
  - Query optimization
  - Response compression
- Restart backend

### Expected Test Duration

With 100 threads, 60s ramp-up, and 300s duration:
- **Total time**: ~6-7 minutes per test
- **Ramp-up**: 60 seconds (gradually increasing from 0 to 100 threads)
- **Steady state**: 300 seconds (100 threads running)
- **Cool-down**: A few seconds for final requests

### Results Location

Test results will be saved to:
- JTL files: `jmeter/results/kayak-results-{config}-100threads.jtl`
- HTML reports: `jmeter/results/report-latest-{config}-100threads/index.html`

### Troubleshooting

1. **Backend not responding**: Ensure backend is running on port 3000
2. **Out of memory errors**: Increase JMeter heap size: `export HEAP="-Xms1g -Xmx4g"`
3. **Connection refused**: Check backend is accessible: `curl http://localhost:3000/health/live`
4. **No data in database**: Run data loading script in backend directory

### Next Steps

1. Start your backend with the appropriate configuration
2. Run the test script: `./run_performance_tests.sh b`
3. Wait for test to complete (~6-7 minutes)
4. Configure backend for next test
5. Repeat for all configurations
6. Generate comparison charts: `python3 generate_comparison_charts.py`

