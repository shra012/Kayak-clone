## JMeter quick start

1) Export your JMeter binary path:
   ```bash
   export JMETER_HOME=/Users/hiruzen/Programming/Projects/DATA-236-Projects/Lab2/tools/jmeter/bin
   ```

2) Run the Kayak flow test headless (results to `/tmp/jmeter-kayak.jtl`):
   ```bash
   "$JMETER_HOME"/jmeter -n -t jmeter/kayak_flights_booking.jmx -l /tmp/jmeter-kayak.jtl
   ```

3) Generate an HTML dashboard from the saved results (writes to `jmeter/results/report-latest`):
   ```bash
   mkdir -p jmeter/results/report-latest
   "$JMETER_HOME"/jmeter -g /tmp/jmeter-kayak.jtl -o jmeter/results/report-latest
   # open jmeter/results/report-latest/index.html
   ```

Notes:
- Ensure the backend and required services are running before executing the test.
- If you want to reuse an existing JTL in `jmeter/results/kayak-results.jtl`, swap the `-l` and `-g` paths accordingly.
