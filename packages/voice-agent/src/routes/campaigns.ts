/**
 * Campaign Routes
 * Manages outbound voice campaigns (rebooking, reviews, promos)
 */

import { Router } from 'express';
import { agentsocial } from '../services/agentsocial-client.js';

export const campaignRouter = Router();

// Trigger a campaign
campaignRouter.post('/trigger', async (req, res) => {
  try {
    const result = await agentsocial.triggerCampaign(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule rebooking campaign
campaignRouter.post('/rebooking', async (req, res) => {
  try {
    const { salon_id, lead_id, days_after_appointment } = req.body;
    const result = await agentsocial.triggerCampaign({
      type: 'rebooking',
      salon_id,
      lead_id,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule review request campaign
campaignRouter.post('/review-request', async (req, res) => {
  try {
    const { salon_id, lead_id } = req.body;
    const result = await agentsocial.triggerCampaign({
      type: 'review_request',
      salon_id,
      lead_id,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});