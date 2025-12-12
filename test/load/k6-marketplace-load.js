/**
 * K6 Load Testing Script - Rentfix Marketplace
 *
 * Tests system performance under load:
 * - 100 concurrent agents searching for contractors
 * - Target: <200ms response time (P95)
 * - Target: 99.9% success rate
 *
 * Run with: k6 run test/load/k6-marketplace-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const searchLatency = new Trend('search_latency', true);
const searchErrors = new Rate('search_errors');
const successfulSearches = new Counter('successful_searches');

// Test configuration
export const options = {
  // Scenario 1: Ramp-up load test
  scenarios: {
    // Gradual ramp-up to 100 concurrent users
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },   // Ramp to 25 users over 30s
        { duration: '30s', target: 50 },   // Ramp to 50 users
        { duration: '30s', target: 100 },  // Ramp to 100 users
        { duration: '2m', target: 100 },   // Sustain 100 users for 2 minutes
        { duration: '30s', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '10s',
    },

    // Scenario 2: Spike test (sudden traffic surge)
    spike: {
      executor: 'ramping-vus',
      startTime: '4m',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 200 },  // Sudden spike to 200 users
        { duration: '30s', target: 200 },  // Sustain spike
        { duration: '10s', target: 0 },    // Drop to 0
      ],
      gracefulRampDown: '5s',
    },

    // Scenario 3: Stress test (find breaking point)
    stress: {
      executor: 'ramping-vus',
      startTime: '5m',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 300 },
        { duration: '1m', target: 400 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 0 },
      ],
    },
  },

  // Performance thresholds (SLA requirements)
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'], // 95th percentile < 200ms
    'http_req_failed': ['rate<0.01'],                // <1% error rate
    'search_latency': ['p(95)<200', 'p(99)<500'],    // Custom search metric
    'search_errors': ['rate<0.01'],                  // <1% search errors
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const API_TOKEN = __ENV.API_TOKEN || 'test-token';

// NYC coordinates for test data (various locations)
const searchLocations = [
  { name: 'Times Square', lat: 40.7580, lng: -73.9855 },
  { name: 'Central Park', lat: 40.7829, lng: -73.9654 },
  { name: 'Financial District', lat: 40.7128, lng: -74.0060 },
  { name: 'Brooklyn', lat: 40.6782, lng: -73.9442 },
  { name: 'Queens', lat: 40.7282, lng: -73.7949 },
  { name: 'Bronx', lat: 40.8448, lng: -73.8648 },
  { name: 'Staten Island', lat: 40.5795, lng: -74.1502 },
  { name: 'Harlem', lat: 40.8075, lng: -73.9626 },
  { name: 'Williamsburg', lat: 40.7081, lng: -73.9571 },
  { name: 'Astoria', lat: 40.7614, lng: -73.9246 },
];

const tradeCategories = [
  'plumbing',
  'electrical',
  'hvac',
  'carpentry',
  'painting',
  'roofing',
  'masonry',
  'locksmith',
];

/**
 * Setup function - runs once per VU
 */
export function setup() {
  console.log('🚀 Starting load test...');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Scenarios: ramp_up, spike, stress`);
  console.log(`SLA: P95 < 200ms, P99 < 500ms, Error rate < 1%`);

  return {
    startTime: Date.now(),
  };
}

/**
 * Main test function - runs for each VU iteration
 */
export default function(data) {
  // Select random search location
  const location = searchLocations[Math.floor(Math.random() * searchLocations.length)];
  const tradeCategory = tradeCategories[Math.floor(Math.random() * tradeCategories.length)];

  // Construct search request
  const payload = JSON.stringify({
    latitude: location.lat,
    longitude: location.lng,
    radiusMiles: 10 + Math.floor(Math.random() * 10), // 10-20 miles
    tradeCategory: tradeCategory,
    minRating: 4.0,
    insuranceRequired: true,
    limit: 20,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    tags: {
      location: location.name,
      trade: tradeCategory,
    },
  };

  // Execute search request
  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/v1/matching/search`, payload, params);
  const duration = Date.now() - startTime;

  // Record custom metrics
  searchLatency.add(duration);

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has contractors array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.contractors);
      } catch {
        return false;
      }
    },
    'returns results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.contractors.length >= 0;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulSearches.add(1);
  } else {
    searchErrors.add(1);
    console.error(`Search failed for ${location.name} (${tradeCategory}): ${response.status}`);
  }

  // Log slow responses
  if (duration > 200) {
    console.warn(`⚠️  Slow response: ${duration}ms for ${location.name}`);
  }

  // Simulate user think time (realistic pause between requests)
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

/**
 * Teardown function - runs once after all VUs complete
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n✅ Load test completed in ${duration.toFixed(2)}s`);
}

/**
 * Custom summary handler - formats test results
 */
export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data),
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-report.html': htmlReport(data),
  };

  return summary;
}

/**
 * Generate text summary
 */
function textSummary(data) {
  const metrics = data.metrics;

  const output = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Rentfix Marketplace Load Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Request Statistics:
  • Total Requests:     ${metrics.http_reqs?.values.count || 0}
  • Successful:         ${metrics.successful_searches?.values.count || 0}
  • Failed:             ${(metrics.http_req_failed?.values.rate * 100).toFixed(2)}%

⏱️  Response Times:
  • Average:            ${metrics.http_req_duration?.values.avg.toFixed(2)}ms
  • Median (P50):       ${metrics.http_req_duration?.values.med.toFixed(2)}ms
  • P95:                ${metrics.http_req_duration?.values['p(95)'].toFixed(2)}ms ${
    metrics.http_req_duration?.values['p(95)'] < 200 ? '✅' : '❌'
  }
  • P99:                ${metrics.http_req_duration?.values['p(99)'].toFixed(2)}ms ${
    metrics.http_req_duration?.values['p(99)'] < 500 ? '✅' : '❌'
  }
  • Max:                ${metrics.http_req_duration?.values.max.toFixed(2)}ms

🔍 Search-Specific Metrics:
  • Search P95:         ${metrics.search_latency?.values['p(95)'].toFixed(2)}ms
  • Search P99:         ${metrics.search_latency?.values['p(99)'].toFixed(2)}ms
  • Search Error Rate:  ${(metrics.search_errors?.values.rate * 100).toFixed(2)}%

🎯 SLA Compliance:
  • P95 < 200ms:        ${metrics.http_req_duration?.values['p(95)'] < 200 ? '✅ PASS' : '❌ FAIL'}
  • P99 < 500ms:        ${metrics.http_req_duration?.values['p(99)'] < 500 ? '✅ PASS' : '❌ FAIL'}
  • Error rate < 1%:    ${metrics.http_req_failed?.values.rate < 0.01 ? '✅ PASS' : '❌ FAIL'}

📈 Throughput:
  • Requests/sec:       ${metrics.http_reqs?.values.rate.toFixed(2)}
  • Data Received:      ${(metrics.data_received?.values.count / 1024 / 1024).toFixed(2)} MB
  • Data Sent:          ${(metrics.data_sent?.values.count / 1024 / 1024).toFixed(2)} MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return output;
}

/**
 * Generate HTML report
 */
function htmlReport(data) {
  const metrics = data.metrics;

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Rentfix Load Test Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 40px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #3498db;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #2c3e50;
    }
    .metric-label {
      font-size: 14px;
      color: #7f8c8d;
      margin-top: 5px;
    }
    .pass {
      color: #27ae60;
    }
    .fail {
      color: #e74c3c;
    }
    .timestamp {
      color: #95a5a6;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Rentfix Marketplace Load Test Report</h1>
    <p class="timestamp">Generated: ${new Date().toISOString()}</p>

    <h2>Performance Metrics</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-value">${metrics.http_reqs?.values.count || 0}</div>
        <div class="metric-label">Total Requests</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.http_req_duration?.values['p(95)'].toFixed(2)}ms</div>
        <div class="metric-label">P95 Latency</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${(metrics.http_req_failed?.values.rate * 100).toFixed(2)}%</div>
        <div class="metric-label">Error Rate</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.http_reqs?.values.rate.toFixed(2)}/s</div>
        <div class="metric-label">Throughput</div>
      </div>
    </div>

    <h2>SLA Compliance</h2>
    <ul>
      <li class="${metrics.http_req_duration?.values['p(95)'] < 200 ? 'pass' : 'fail'}">
        P95 &lt; 200ms: ${metrics.http_req_duration?.values['p(95)'] < 200 ? '✅ PASS' : '❌ FAIL'}
      </li>
      <li class="${metrics.http_req_duration?.values['p(99)'] < 500 ? 'pass' : 'fail'}">
        P99 &lt; 500ms: ${metrics.http_req_duration?.values['p(99)'] < 500 ? '✅ PASS' : '❌ FAIL'}
      </li>
      <li class="${metrics.http_req_failed?.values.rate < 0.01 ? 'pass' : 'fail'}">
        Error Rate &lt; 1%: ${metrics.http_req_failed?.values.rate < 0.01 ? '✅ PASS' : '❌ FAIL'}
      </li>
    </ul>
  </div>
</body>
</html>
`;
}
