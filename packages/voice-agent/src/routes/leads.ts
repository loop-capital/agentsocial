/**
 * Lead Routes
 * Manages leads captured from voice calls
 */

import { Router } from 'express';
import { agentsocial } from '../services/agentsocial-client.js';

export const leadRouter = Router();

// Create lead from voice call
leadRouter.post('/', async (req, res) => {
  try {
    const lead = await agentsocial.createLead(req.body);
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get lead
leadRouter.get('/:id', async (req, res) => {
  try {
    const lead = await agentsocial.getLead(req.params.id);
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update lead
leadRouter.patch('/:id', async (req, res) => {
  try {
    const lead = await agentsocial.updateLead(req.params.id, req.body);
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});