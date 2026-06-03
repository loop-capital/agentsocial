/**
 * Webhook Routes
 * Handles callbacks from Dograh (call ended, transcription complete, etc.)
 */

import { Router } from 'express';
import { agentsocial } from '../services/agentsocial-client.js';

export const webhookRouter = Router();

// Dograh call ended webhook
webhookRouter.post('/dograh/call-ended', async (req, res) => {
  try {
    const {
      call_id,
      agent_id,
      direction, // 'inbound' | 'outbound'
      duration_seconds,
      transcript,
      recording_url,
      outcome, // 'completed' | 'transferred' | 'voicemail' | 'no_answer'
      metadata,
    } = req.body;

    console.log(`📞 Call ended: ${call_id} | Duration: ${duration_seconds}s | Outcome: ${outcome}`);

    // Log the call event to AgentSocial
    await agentsocial.logCallEvent({
      salon_id: metadata?.salon_id || 'pleij-salon',
      call_type: direction,
      duration_seconds,
      outcome: mapOutcome(outcome),
      lead_id: metadata?.lead_id,
      recording_url,
      transcript,
    });

    // If call resulted in a booking attempt, create/update lead
    if (metadata?.booking && outcome === 'completed') {
      await agentsocial.createLead({
        name: metadata.booking.name,
        phone: metadata.booking.phone,
        source: direction === 'inbound' ? 'voice_inbound' : 'voice_outbound',
        service_interest: metadata.booking.service,
        preferred_stylist: metadata.booking.stylist,
        preferred_date: metadata.booking.date,
        preferred_time: metadata.booking.time,
        salon_id: metadata.salon_id || 'pleij-salon',
        call_duration_seconds: duration_seconds,
        call_recording_url: recording_url,
        call_transcript: transcript,
      });
    }

    // Trigger follow-up campaign based on outcome
    if (outcome === 'completed' && metadata?.lead_id) {
      if (direction === 'inbound' && metadata.booking) {
        // Schedule rebooking reminder for 21 days from now
        await agentsocial.triggerCampaign({
          type: 'rebooking',
          salon_id: metadata.salon_id || 'pleij-salon',
          lead_id: metadata.lead_id,
        });
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Twilio webhook (for incoming calls)
webhookRouter.post('/twilio/voice', (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${process.env.DOGRAH_API_URL || 'localhost:8000'}/ws/connect" />
  </Connect>
</Response>`;
  
  res.type('text/xml');
  res.send(twiml);
});

// Twilio status callback
webhookRouter.post('/twilio/status', (req, res) => {
  console.log('📞 Twilio status:', req.body.CallStatus, req.body.CallSid);
  res.json({ status: 'ok' });
});

function mapOutcome(outcome: string): 'booked' | 'no_answer' | 'transferred' | 'voicemail' | 'info_only' {
  const mapping: Record<string, 'booked' | 'no_answer' | 'transferred' | 'voicemail' | 'info_only'> = {
    completed: 'booked',
    transferred: 'transferred',
    no_answer: 'no_answer',
    voicemail: 'voicemail',
    info_only: 'info_only',
  };
  return mapping[outcome] || 'info_only';
}