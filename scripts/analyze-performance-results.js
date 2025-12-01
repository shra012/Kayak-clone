import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse JMeter CSV results
function parseJMeterResults(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('timeStamp'));
  
  const results = {
    responseTimes: [],
    successCount: 0,
    errorCount: 0,
    totalRequests: 0
  };
  
  lines.forEach(line => {
    const columns = line.split(',');
    if (columns.length >= 4) {
      const elapsed = parseInt(columns[1]);
      const success = columns[7] === 'true';
      
      results.responseTimes.push(elapsed);
      results.totalRequests++;
      
      if (success) {
        results.successCount++;
      } else {
        results.errorCount++;
      }
    }
  });
  
  // Calculate statistics
  results.responseTimes.sort((a, b) => a - b);
  const len = results.responseTimes.length;
  
  return {
    totalRequests: results.totalRequests,
    successCount: results.successCount,
    errorCount: results.errorCount,
    errorRate: ((results.errorCount / results.totalRequests) * 100).toFixed(2),
    avgResponseTime: (results.responseTimes.reduce((a, b) => a + b, 0) / len).toFixed(2),
    medianResponseTime: results.responseTimes[Math.floor(len / 2)],
    p90: results.responseTimes[Math.floor(len * 0.9)],
    p95: results.responseTimes[Math.floor(len * 0.95)],
    p99: results.responseTimes[Math.floor(len * 0.99)],
    minResponseTime: results.responseTimes[0],
    maxResponseTime: results.responseTimes[len - 1],
    throughput: (results.successCount / 300).toFixed(2) // Assuming 5 minute test
  };
}

// Generate bar chart data for PowerPoint
function generateChartData(scenarios) {
  const charts = {
    avgResponseTime: {
      title: 'Average Response Time Comparison',
      yAxis: 'Response Time (ms)',
      data: scenarios.map(s => ({
        label: s.name,
        value: parseFloat(s.avgResponseTime)
      }))
    },
    throughput: {
      title: 'Throughput Comparison',
      yAxis: 'Requests per Second (RPS)',
      data: scenarios.map(s => ({
        label: s.name,
        value: parseFloat(s.throughput)
      }))
    },
    errorRate: {
      title: 'Error Rate Comparison',
      yAxis: 'Error Rate (%)',
      data: scenarios.map(s => ({
        label: s.name,
        value: parseFloat(s.errorRate)
      }))
    },
    p95ResponseTime: {
      title: '95th Percentile Response Time',
      yAxis: 'Response Time (ms)',
      data: scenarios.map(s => ({
        label: s.name,
        value: s.p95
      }))
    }
  };
  
  return charts;
}

// Generate CSV for Excel/PowerPoint
function generateCSV(charts, outputPath) {
  let csv = 'Metric,Base (B),Base + Cache (B+S),Base + Cache + Kafka (B+S+K),Base + Cache + Kafka + Optimizations (B+S+K+O)\n';
  
  csv += `Average Response Time (ms),${charts.avgResponseTime.data.map(d => d.value).join(',')}\n`;
  csv += `Throughput (RPS),${charts.throughput.data.map(d => d.value).join(',')}\n`;
  csv += `Error Rate (%),${charts.errorRate.data.map(d => d.value).join(',')}\n`;
  csv += `95th Percentile (ms),${charts.p95ResponseTime.data.map(d => d.value).join(',')}\n`;
  
  fs.writeFileSync(outputPath, csv);
  console.log(`✓ Generated CSV: ${outputPath}`);
}

// Generate HTML report
function generateHTMLReport(scenarios, charts, outputPath) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Results</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 800px; height: 400px; margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
    <h1>Performance Test Results - 100 Simultaneous Users</h1>
    
    <h2>Summary Table</h2>
    <table>
        <tr>
            <th>Scenario</th>
            <th>Avg Response Time (ms)</th>
            <th>Throughput (RPS)</th>
            <th>Error Rate (%)</th>
            <th>95th Percentile (ms)</th>
        </tr>
        ${scenarios.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.avgResponseTime}</td>
            <td>${s.throughput}</td>
            <td>${s.errorRate}</td>
            <td>${s.p95}</td>
        </tr>
        `).join('')}
    </table>
    
    <h2>Charts</h2>
    <div class="chart-container">
        <canvas id="chart1"></canvas>
    </div>
    <div class="chart-container">
        <canvas id="chart2"></canvas>
    </div>
    <div class="chart-container">
        <canvas id="chart3"></canvas>
    </div>
    <div class="chart-container">
        <canvas id="chart4"></canvas>
    </div>
    
    <script>
        const scenarios = ${JSON.stringify(charts.avgResponseTime.data.map(d => d.label))};
        
        new Chart(document.getElementById('chart1'), {
            type: 'bar',
            data: {
                labels: scenarios,
                datasets: [{
                    label: 'Average Response Time (ms)',
                    data: ${JSON.stringify(charts.avgResponseTime.data.map(d => d.value))},
                    backgroundColor: 'rgba(75, 192, 192, 0.6)'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
        
        new Chart(document.getElementById('chart2'), {
            type: 'bar',
            data: {
                labels: scenarios,
                datasets: [{
                    label: 'Throughput (RPS)',
                    data: ${JSON.stringify(charts.throughput.data.map(d => d.value))},
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
        
        new Chart(document.getElementById('chart3'), {
            type: 'bar',
            data: {
                labels: scenarios,
                datasets: [{
                    label: 'Error Rate (%)',
                    data: ${JSON.stringify(charts.errorRate.data.map(d => d.value))},
                    backgroundColor: 'rgba(255, 99, 132, 0.6)'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
        
        new Chart(document.getElementById('chart4'), {
            type: 'bar',
            data: {
                labels: scenarios,
                datasets: [{
                    label: '95th Percentile Response Time (ms)',
                    data: ${JSON.stringify(charts.p95ResponseTime.data.map(d => d.value))},
                    backgroundColor: 'rgba(153, 102, 255, 0.6)'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    </script>
</body>
</html>
  `;
  
  fs.writeFileSync(outputPath, html);
  console.log(`✓ Generated HTML report: ${outputPath}`);
}

async function main() {
  const resultsDir = path.join(__dirname, '../jmeter-test-plans/results');
  const reportsDir = path.join(__dirname, '../jmeter-test-plans/reports');
  
  const scenarios = [
    { name: 'Base (B)', file: 'scenario-a-results.csv' },
    { name: 'Base + Cache (B+S)', file: 'scenario-b-results.csv' },
    { name: 'Base + Cache + Kafka (B+S+K)', file: 'scenario-c-results.csv' },
    { name: 'Base + Cache + Kafka + Optimizations (B+S+K+O)', file: 'scenario-d-results.csv' }
  ];
  
  const parsedResults = [];
  
  for (const scenario of scenarios) {
    const filePath = path.join(resultsDir, scenario.file);
    if (fs.existsSync(filePath)) {
      console.log(`Parsing ${scenario.file}...`);
      const result = parseJMeterResults(filePath);
      parsedResults.push({ ...scenario, ...result });
    } else {
      console.warn(`Warning: ${scenario.file} not found. Using placeholder data.`);
      // Placeholder data for demonstration
      parsedResults.push({
        ...scenario,
        avgResponseTime: '500',
        throughput: '50',
        errorRate: '5.0',
        p95: 1000
      });
    }
  }
  
  console.log('\n=== Performance Test Results ===\n');
  parsedResults.forEach(result => {
    console.log(`${result.name}:`);
    console.log(`  Avg Response Time: ${result.avgResponseTime} ms`);
    console.log(`  Throughput: ${result.throughput} RPS`);
    console.log(`  Error Rate: ${result.errorRate}%`);
    console.log(`  95th Percentile: ${result.p95} ms\n`);
  });
  
  const charts = generateChartData(parsedResults);
  generateCSV(charts, path.join(reportsDir, 'performance-results.csv'));
  generateHTMLReport(parsedResults, charts, path.join(reportsDir, 'performance-report.html'));
  
  console.log('\n✓ Analysis complete!');
  console.log(`\nFiles generated:`);
  console.log(`  - CSV: ${path.join(reportsDir, 'performance-results.csv')}`);
  console.log(`  - HTML: ${path.join(reportsDir, 'performance-report.html')}`);
}

main().catch(console.error);

