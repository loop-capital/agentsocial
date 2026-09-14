/**
 * Models Lab API Wrapper
 * Fallback image generation service.
 *
 * Prefix: /api/modelslab
 * Docs: https://developers.modelslab.com/
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const MODELSLAB_BASE = 'https://api.modelslab.com';
const MAX_RETRIES = 3;
const QUEUE_POLL_INTERVAL = 5000; // 5 seconds

const queueStatus = {}; // In-memory queue tracking (use Redis in production)

/**
 * Sleep helper
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Models Lab API call with retry logic.
 */
async function modelsLabRequest(endpoint, data, attempt = 1) {
  const apiKey = process.env.MODELSLAB_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'MODELSLAB_API_KEY not configured' };
  }

  try {
    const response = await axios.post(`${MODELSLAB_BASE}${endpoint}`, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60s timeout for generation requests
    });

    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    const status = error.response?.status;
    const msg = error.response?.data?.error || error.message;

    // Queue-based rate limit — poll for result
    if (status === 202) {
      return { success: true, data: error.response.data, status: 202, queued: true };
    }

    // Rate limit — retry
    if (status === 429 && attempt < MAX_RETRIES) {
      const delay = (error.response?.headers?.['retry-after'] || 30) * 1000;
      console.log(`[ModelsLab] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
      await sleep(delay);
      return modelsLabRequest(endpoint, data, attempt + 1);
    }

    // Server error — retry
    if (status >= 500 && status < 600 && attempt < MAX_RETRIES) {
      const delay = 2000 * Math.pow(2, attempt - 1);
      console.log(`[ModelsLab] Server error ${status}. Retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
      await sleep(delay);
      return modelsLabRequest(endpoint, data, attempt + 1);
    }

    return { success: false, error: msg, status: status || 0 };
  }
}

/**
 * Poll a queued job until complete or max attempts reached.
 */
async function pollQueueResult(jobId, maxPolls = 20) {
  for (let i = 0; i < maxPolls; i++) {
    await sleep(QUEUE_POLL_INTERVAL);
    try {
      const response = await axios.get(`${MODELSLAB_BASE}/v1/job/${jobId}`, {
        headers: { Authorization: `Bearer ${process.env.MODELSLAB_API_KEY}` },
        timeout: 10000,
      });
      const job = response.data;
      if (job.status === 'completed') {
        return { success: true, data: job };
      }
      if (job.status === 'failed') {
        return { success: false, error: 'Job failed', data: job };
      }
      // Still processing — continue polling
      queueStatus[jobId] = { status: 'processing', attempt: i + 1 };
    } catch (err) {
      if (i === maxPolls - 1) {
        return { success: false, error: err.message };
      }
    }
  }
  return { success: false, error: 'Max poll attempts reached' };
}

/**
 * POST /api/modelslab/imagine
 * Generate an image from a text prompt.
 *
 * Body: { prompt, negative_prompt, width, height, num_images, style }
 */
router.post('/imagine', async (req, res) => {
  const { prompt, negative_prompt, width = 1024, height = 1024, num_images = 1, style } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const payload = {
    prompt,
    negative_prompt: negative_prompt || 'blurry, low quality, watermark',
    width: Math.min(width, 1024),
    height: Math.min(height, 1024),
    num_images: Math.min(num_images, 4),
    style: style || 'realistic',
  };

  const result = await modelsLabRequest('/v1/imagine', payload);

  if (!result.success) {
    return res.status(result.status || 500).json({ error: result.error });
  }

  // If queued, start polling
  if (result.queued) {
    const jobId = result.data.job_id;
    queueStatus[jobId] = { status: 'queued', submittedAt: Date.now() };
    res.status(202).json({
      status: 'queued',
      jobId,
      message: 'Job submitted. Poll GET /api/modelslab/job/:jobId for results.',
      estimatedWait: '30-60s',
    });
    return;
  }

  res.json({
    images: result.data.output_urls || result.data.output || [],
    status: 'completed',
    jobId: result.data.job_id,
  });
});

/**
 * GET /api/modelslab/job/:jobId
 * Poll status of a queued image generation job.
 */
router.get('/job/:jobId', async (req, res) => {
  const { jobId } = req.params;

  // Check in-memory status first
  if (queueStatus[jobId]?.status === 'processing') {
    const pollResult = await pollQueueResult(jobId, 1);
    if (pollResult.success) {
      delete queueStatus[jobId];
      return res.json({ status: 'completed', images: pollResult.data.output_urls });
    }
  }

  // Fetch fresh status from API
  try {
    const response = await axios.get(`${MODELSLAB_BASE}/v1/job/${jobId}`, {
      headers: { Authorization: `Bearer ${process.env.MODELSLAB_API_KEY}` },
      timeout: 10000,
    });
    const job = response.data;
    res.json({
      status: job.status,
      images: job.output_urls || [],
      progress: job.progress || null,
      message: job.message || null,
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

/**
 * GET /api/modelslab/health
 * Check Models Lab API connectivity.
 */
router.get('/health', async (req, res) => {
  const apiKeySet = !!process.env.MODELSLAB_API_KEY;
  if (!apiKeySet) {
    return res.json({ status: 'not_configured', message: 'MODELSLAB_API_KEY not set' });
  }
  try {
    const response = await axios.get(`${MODELSLAB_BASE}/v1/models`, {
      headers: { Authorization: `Bearer ${process.env.MODELSLAB_API_KEY}` },
      timeout: 10000,
    });
    res.json({ status: 'connected', modelsAvailable: response.data?.models?.length || 0 });
  } catch (err) {
    res.json({ status: 'error', message: err.message });
  }
});

module.exports = router;
