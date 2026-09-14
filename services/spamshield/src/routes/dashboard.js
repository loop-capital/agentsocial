/**
 * Dashboard routes
 * Simple HTML UI for monitoring and administration
 */

const express = require('express');
const router = express.Router();
const path = require('path');

const { getStatistics, getTopOffenders } = require('../utils/database');
const { getRefreshStatus } = require('../services/intelligenceRefresh');

/**
 * GET /
 * Main dashboard page
 */
router.get('/', async (req, res) => {
  try {
    const [stats, topOffenders, refreshStatus] = await Promise.all([
      getStatistics(),
      getTopOffenders(10, 7),
      Promise.resolve(getRefreshStatus()),
    ]);

    const html = generateDashboardHTML({
      stats,
      topOffenders,
      refreshStatus,
    });

    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <html><body>
        <h1>Dashboard Error</h1>
        <p>Failed to load dashboard data. Please check database connection.</p>
        <pre>${error.message}</pre>
      </body></html>
    `);
  }
});

/**
 * Generate dashboard HTML
 */
function generateDashboardHTML(data) {
  const { stats, topOffenders, refreshStatus } = data;

  const topOffendersRows = topOffenders.map((o, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code>${o.sender_phone}</code></td>
      <td>${o.report_count}</td>
      <td>${o.victim_count}</td>
      <td>${new Date(o.last_report).toLocaleDateString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpamShield Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    :root {
      --primary-color: #2A9D8F;
      --danger-color: #E76F51;
      --warning-color: #F4A261;
      --dark-color: #1A1A1A;
    }
    body { background-color: #f8f9fa; }
    .navbar { background-color: var(--dark-color) !important; }
    .navbar-brand { color: var(--primary-color) !important; font-weight: bold; }
    .stat-card { 
      background: white; 
      border-radius: 8px; 
      padding: 1.5rem; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
    }
    .stat-value { 
      font-size: 2rem; 
      font-weight: bold; 
      color: var(--primary-color);
    }
    .stat-label { 
      color: #666; 
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-critical { background-color: var(--danger-color); }
    .badge-high { background-color: var(--warning-color); color: #000; }
    .badge-safe { background-color: var(--primary-color); }
    .api-section {
      background: #f1f3f5;
      border-radius: 8px;
      padding: 1.5rem;
    }
    code {
      background: #e9ecef;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <nav class="navbar navbar-dark">
    <div class="container">
      <span class="navbar-brand">🛡️ SpamShield</span>
      <span class="navbar-text text-white">Real-time Spam & Fraud Protection</span>
    </div>
  </nav>

  <div class="container mt-4">
    <div class="row">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-value">${stats.total_numbers.toLocaleString()}</div>
          <div class="stat-label">Spam Numbers</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-value">${stats.total_reports.toLocaleString()}</div>
          <div class="stat-label">Total Reports</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-value">${stats.reports_today.toLocaleString()}</div>
          <div class="stat-label">Reports Today</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-value">${stats.active_cases.toLocaleString()}</div>
          <div class="stat-label">Active Cases</div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">🔥 Top Offenders (Last 7 Days)</h5>
            <a href="/api/v1/stats/top-offenders?limit=50" class="btn btn-sm btn-outline-primary">View All</a>
          </div>
          <div class="card-body">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Phone Number</th>
                  <th>Reports</th>
                  <th>Victims</th>
                  <th>Last Report</th>
                </tr>
              </thead>
              <tbody>
                ${topOffendersRows || '<tr><td colspan="5" class="text-center">No data available</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h5>📊 System Status</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between">
                <span>Database</span>
                <span class="badge bg-success">Connected</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>Cache</span>
                <span class="badge bg-success">Active</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>Last Refresh</span>
                <span>${refreshStatus.lastRefresh ? new Date(refreshStatus.lastRefresh).toLocaleString() : 'Never'}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>Refresh Schedule</span>
                <code>${refreshStatus.schedule}</code>
              </li>
            </ul>
          </div>
        </div>

        <div class="card mt-3">
          <div class="card-header">
            <h5>🚀 Quick Test</h5>
          </div>
          <div class="card-body">
            <form id="testForm" class="mb-3">
              <div class="mb-3">
                <input type="text" class="form-control" id="testPhone" placeholder="Enter phone number (+1...)">
              </div>
              <button type="submit" class="btn btn-primary w-100">Check Number</button>
            </form>
            <div id="testResult"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-12">
        <div class="api-section">
          <h5>📖 API Documentation</h5>
          <div class="row mt-3">
            <div class="col-md-6">
              <h6>Check a Number</h6>
              <pre><code>POST /api/v1/check
Content-Type: application/json
X-API-Key: your_api_key

{
  "phoneNumber": "+1234567890",
  "context": "call"
}</code></pre>
            </div>
            <div class="col-md-6">
              <h6>Response</h6>
              <pre><code>{
  "success": true,
  "data": {
    "phoneNumber": "+1234567890",
    "score": 85,
    "level": "high",
    "recommendation": "LIKELY_BLOCK",
    "action": "screen_call"
  }
}</code></pre>
            </div>
          </div>
          <p class="mt-3">
            <strong>Endpoints:</strong><br>
            <code>GET  /api/v1/stats</code> - Get statistics<br>
            <code>GET  /api/v1/stats/top-offenders</code> - Top spam numbers<br>
            <code>POST /api/v1/check</code> - Check a phone number<br>
            <code>GET  /api/v1/check/:number</code> - Check via URL<br>
            <code>GET  /health</code> - Health check
          </p>
        </div>
      </div>
    </div>
  </div>

  <footer class="mt-5 py-4 text-center text-muted">
    <div class="container">
      <small>SpamShield MVP | Powered by SpamCapture Intelligence</small>
    </div>
  </footer>

  <script>
    document.getElementById('testForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('testPhone').value;
      const resultDiv = document.getElementById('testResult');
      
      resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
      
      try {
        const response = await fetch('/api/v1/check/' + encodeURIComponent(phone));
        const data = await response.json();
        
        if (data.success) {
          const levelClass = {
            'safe': 'success',
            'low': 'info',
            'medium': 'warning',
            'high': 'orange',
            'critical': 'danger'
          }[data.data.level] || 'secondary';
          
          resultDiv.innerHTML = \`
            <div class="alert alert-\${levelClass === 'orange' ? 'warning' : levelClass}">
              <strong>Risk Score: \${data.data.score}/100</strong><br>
              Level: \${data.data.level}<br>
              Recommendation: \${data.data.recommendation}<br>
              Action: \${data.data.action}
              \${data.data.override ? '<br><em>(Manual Override)</em>' : ''}
            </div>
          \`;
        } else {
          resultDiv.innerHTML = '\u003cdiv class="alert alert-danger">Error: ' + (data.error || 'Unknown error') + '\u003c/div\u003e';
        }
      } catch (err) {
        resultDiv.innerHTML = '\u003cdiv class="alert alert-danger">Error: ' + err.message + '\u003c/div\u003e';
      }
    });
  </script>
</body>
</html>
  `;
}

module.exports = router;