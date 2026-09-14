const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/humans', require('./routes/humans'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/meta', require('./routes/meta'));
app.use('/api/manus', require('./routes/manus'));
app.use('/api/modelslab', require('./routes/modelslab'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Background job: reset Manus daily counters at midnight UTC
const { resetDailyCounters, cleanExpiredCache } = require('./lib/manus/db');
let resetTimer = null;

function scheduleMidnightReset() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setUTCHours(24, 0, 0, 0);
  const msUntilMidnight = nextMidnight - now;

  clearTimeout(resetTimer);
  resetTimer = setTimeout(async () => {
    try {
      await resetDailyCounters();
      await cleanExpiredCache();
      console.log('[Cron] Manus daily counters reset and cache cleaned at midnight UTC');
    } catch (err) {
      console.error('[Cron] Error during midnight reset:', err.message);
    }
    scheduleMidnightReset(); // Reschedule for next midnight
  }, msUntilMidnight);

  console.log(`[Cron] Next Manus reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
}

// Start background job if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  scheduleMidnightReset();
  // Also run cache cleanup every 6 hours as a safety net
  setInterval(cleanExpiredCache, 6 * 60 * 60 * 1000);
}

app.listen(PORT, () => {
  console.log('TaskLinkr API running on port ' + PORT);
});

module.exports = app;
