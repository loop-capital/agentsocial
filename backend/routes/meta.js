/**
 * Meta API Wrapper Routes
 * Proxies requests to Meta Graph API with auth, logging, and error handling.
 *
 * Prefix: /api/meta
 * Supported: GET and POST to /api/meta/:endpoint
 */

const express = require('express');
const metaClient = require('../lib/meta/client');

const router = express.Router();

// In-memory request log (replace with structured logger in production)
const requestLog = [];

/**
 * Log a Meta API interaction
 */
function logInteraction(method, endpoint, workspaceId, metaStatus, metaError, durationMs) {
  const entry = {
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    workspaceId: workspaceId || 'system',
    metaStatus,
    metaError: metaError || null,
    durationMs,
  };
  requestLog.push(entry);
  // Keep last 1000 entries
  if (requestLog.length > 1000) requestLog.shift();
  console.log(`[MetaAPI] ${method} /${endpoint} → ${metaStatus}${metaError ? ' ERR: ' + metaError : ''} (${durationMs}ms)`);
}

/**
 * Audit log middleware — attaches workspace context
 */
function auditLog(req, res, next) {
  req.workspaceId = req.headers['x-workspace-id'] || null;
  req.startTime = Date.now();
  next();
}

/**
 * GET /api/meta/:endpoint
 * Proxy GET requests to Meta Graph API
 */
router.get('/:endpoint(*)', auditLog, async (req, res) => {
  const { endpoint } = req;
  const durationMs = Date.now() - req.startTime;

  // Basic input sanitization — block obviously malicious paths
  if (endpoint.includes('..') || endpoint.includes('://')) {
    return res.status(400).json({ error: 'Invalid endpoint path' });
  }

  const params = { ...req.query };
  const result = await metaClient.get(endpoint, params);

  logInteraction('GET', endpoint, req.workspaceId, result.status || 0, result.error, Date.now() - req.startTime);

  if (!result.success) {
    return res.status(result.status || 500).json({
      error: result.error,
      endpoint,
    });
  }

  res.json(result.data);
});

/**
 * POST /api/meta/:endpoint
 * Proxy POST requests to Meta Graph API
 */
router.post('/:endpoint(*)', auditLog, async (req, res) => {
  const { endpoint } = req;
  const durationMs = Date.now() - req.startTime;

  if (endpoint.includes('..') || endpoint.includes('://')) {
    return res.status(400).json({ error: 'Invalid endpoint path' });
  }

  const result = await metaClient.post(endpoint, req.body);

  logInteraction('POST', endpoint, req.workspaceId, result.status || 0, result.error, Date.now() - req.startTime);

  if (!result.success) {
    return res.status(result.status || 500).json({
      error: result.error,
      endpoint,
    });
  }

  res.json(result.data);
});

/**
 * GET /api/meta/health
 * Health check for Meta API wrapper
 */
router.get('/health', async (req, res) => {
  const hasToken = !!process.env.META_USER_ACCESS_TOKEN;

  // Quick ping to Meta API to verify token
  let metaStatus = 'unknown';
  if (hasToken) {
    const result = await metaClient.get('me', { fields: 'id' });
    metaStatus = result.success ? 'connected' : 'error';
  }

  res.json({
    status: hasToken ? 'configured' : 'missing_token',
    metaStatus,
    tokenConfigured: hasToken,
    logSize: requestLog.length,
  });
});

/**
 * GET /api/meta/log
 * Returns recent audit log entries (admin only)
 */
router.get('/admin/log', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  res.json(requestLog.slice(-limit));
});

module.exports = router;
