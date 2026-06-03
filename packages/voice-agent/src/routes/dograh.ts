/**
 * Dograh Proxy Routes
 * Proxies requests to Dograh API for agent management
 */

import { Router } from 'express';
import { dograh } from '../services/dograh-client.js';

export const dograhRouter = Router();

// List all agents
dograhRouter.get('/agents', async (_req, res) => {
  try {
    const agents = await dograh.listAgents();
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent details
dograhRouter.get('/agents/:id', async (req, res) => {
  try {
    const agent = await dograh.getAgent(req.params.id);
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start test call
dograhRouter.post('/agents/:id/test-call', async (req, res) => {
  try {
    const result = await dograh.startTestCall(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recordings
dograhRouter.get('/agents/:id/recordings', async (req, res) => {
  try {
    const recordings = await dograh.getRecordings(req.params.id, req.query as any);
    res.json(recordings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});