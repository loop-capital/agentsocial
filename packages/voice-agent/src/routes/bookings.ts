/**
 * Booking Routes
 * Manages appointments booked through voice calls
 */

import { Router } from 'express';
import { agentsocial } from '../services/agentsocial-client.js';

export const bookingRouter = Router();

// Create booking from voice call
bookingRouter.post('/', async (req, res) => {
  try {
    const booking = await agentsocial.createBooking(req.body);
    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking
bookingRouter.get('/:id', async (req, res) => {
  try {
    const booking = await agentsocial.getBooking(req.params.id);
    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});