/**
 * Analytics Routes
 * Call metrics and performance data
 */

import { Router } from 'express';
import { agentsocial } from '../services/agentsocial-client.js';

export const analyticsRouter = Router();

// Log call event
analyticsRouter.post('/call', async (req, res) => {
  try {
    const result = await agentsocial.logCallEvent(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});