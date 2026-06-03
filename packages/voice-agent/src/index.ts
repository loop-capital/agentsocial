/**
 * AgentSocial Voice Agent Integration
 * Connects Dograh voice AI to AgentSocial platform
 * 
 * PLEIJ Salon is our first customer — wife's salon.
 */

import express from 'express';
import cors from 'cors';
import { leadRouter } from './routes/leads.js';
import { bookingRouter } from './routes/bookings.js';
import { campaignRouter } from './routes/campaigns.js';
import { analyticsRouter } from './routes/analytics.js';
import { dograhRouter } from './routes/dograh.js';
import { webhookRouter } from './routes/webhooks.js';

const app = express();
const PORT = process.env.VOICE_AGENT_PORT || 3010;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agentsocial-voice-agent', version: '1.0.0' });
});

// Routes
app.use('/api/v1/leads', leadRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/campaigns', campaignRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/dograh', dograhRouter);
app.use('/webhooks', webhookRouter);

app.listen(PORT, () => {
  console.log(`🎙️ AgentSocial Voice Agent running on port ${PORT}`);
});

export default app;