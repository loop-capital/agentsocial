// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// SpamSuit - Twilio SMS Webhook
// Receives forwarded spam texts and stores them in Supabase

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract Twilio SMS data
    const from = formData.get('From') as string      // Victim's phone (forwarder)
    const body = formData.get('Body') as string        // Message content
    const to = formData.get('To') as string            // Our Twilio number
    const messageSid = formData.get('MessageSid') as string
    const numMedia = parseInt(formData.get('NumMedia') as string || '0')
    
    // Parse forwarded message
    // When someone forwards a text, it typically contains the original sender info
    const parsed = parseForwardedMessage(body, from)
    
    // Store in Supabase
    const report = await storeReport({
      sender_phone: parsed.senderPhone,
      message_body: parsed.messageBody,
      received_at: new Date().toISOString(),
      reporter_phone: from,
      twilio_message_sid: messageSid,
      source: 'sms',
      spam_score: await calculateSpamScore(parsed.messageBody),
    })

    // Auto-reply to victim
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks for reporting! Your case #${report.id.slice(0,8)} has been recorded. We'll validate this violation and match you with an attorney if eligible. No action needed from you.</Message>
</Response>`

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('SMS webhook error:', error)
    
    // Return TwiML even on error to prevent Twilio retries
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks for your report. We'll review it shortly.</Message>
</Response>`
    
    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

// Parse forwarded message to extract original sender
function parseForwardedMessage(body: string, fromPhone: string) {
  let senderPhone = 'unknown'
  let messageBody = body
  
  // Common forwarding formats:
  // "Fwd: +1234567890: Hey, want to save on health insurance?"
  // "Forwarded from +1234567890: Message content"
  // "> +1234567890 wrote: Message"
  
  const phoneRegex = /\+?1?(\d{10})/g
  const matches = body.match(phoneRegex)
  
  if (matches && matches.length > 0) {
    // The first phone number that isn't the forwarder's number is likely the spammer
    for (const match of matches) {
      const cleaned = match.replace(/\D/g, '').slice(-10)
      const fromCleaned = fromPhone.replace(/\D/g, '').slice(-10)
      if (cleaned !== fromCleaned) {
        senderPhone = match
        break
      }
    }
  }
  
  // Try to extract just the message content (remove forwarding headers)
  messageBody = body
    .replace(/^Fwd?:\s*/i, '')
    .replace(/^Forwarded\s+from\s+[\d+]+:\s*/i, '')
    .replace(/^>\s*[\d+]+\s+wrote:\s*/i, '')
    .replace(/^\+?1?\d{10}:\s*/, '')
  
  return {
    senderPhone,
    messageBody,
  }
}

// Calculate initial spam score based on content
async function calculateSpamScore(message: string): Promise<number> {
  let score = 0
  
  // Known spam keywords
  const spamKeywords = [
    'health insurance', 'medicare', 'obamacare', 'affordable care',
    'auto warranty', 'extended warranty', 'car warranty',
    'free quote', 'click here', 'reply yes', 'reply stop',
    'cash offer', 'we buy', 'sell your', 'pre-qualified',
    'no obligation', 'limited time', 'act now',
    'congratulations', 'you have been selected', 'you qualify',
    'loan approved', 'credit score', 'debt relief',
    'work from home', 'earn money', 'make money',
  ]
  
  const lowerMessage = message.toLowerCase()
  for (const keyword of spamKeywords) {
    if (lowerMessage.includes(keyword)) {
      score += 15
    }
  }
  
  // URL in message (common in spam)
  if (/https?:\/\//i.test(message) || /bit\.ly/i.test(message)) {
    score += 10
  }
  
  // Urgency language
  if (/urgent|expires? today|last chance|final notice/i.test(message)) {
    score += 10
  }
  
  // Short codes (5-6 digit numbers often used for spam)
  if (/^\d{5,6}$/.test(message.split('\n')[0])) {
    score += 20
  }
  
  return Math.min(score, 100)
}

// Store report in Supabase
async function storeReport(data: {
  sender_phone: string
  message_body: string
  received_at: string
  reporter_phone: string
  twilio_message_sid: string
  source: string
  spam_score: number
}) {
  // Generate content hash for pattern matching
  const contentHash = await generateHash(data.message_body)
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/spam_reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      ...data,
      content_hash: contentHash,
      is_tcpa_violation: data.spam_score >= 50,
      status: data.spam_score >= 50 ? 'validated' : 'pending',
    }),
  })

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`)
  }

  const reports = await response.json()
  const report = reports[0]

  // Check for existing pattern group or create new one
  await matchOrCreatePattern(report)

  // Create or update victim record
  await upsertVictim(data.reporter_phone)

  return report
}

// Generate simple hash for content matching
async function generateHash(content: string): Promise<string> {
  // Normalize content for matching
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Use a simple hash (replace with crypto.subtle.digest in production)
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

// Match report to existing pattern or create new pattern group
async function matchOrCreatePattern(report: any) {
  // Find reports with same content hash
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/spam_reports?content_hash=eq.${report.content_hash}&select=id,pattern_group_id`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  )

  const existing = await response.json()

  if (existing.length > 0 && existing[0].pattern_group_id) {
    // Add to existing pattern group
    await fetch(`${SUPABASE_URL}/rest/v1/spam_reports?id=eq.${report.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ pattern_group_id: existing[0].pattern_group_id }),
    })

    // Increment pattern group count
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_pattern_count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ group_id: existing[0].pattern_group_id }),
    })
  } else {
    // Create new pattern group
    const groupResponse = await fetch(`${SUPABASE_URL}/rest/v1/pattern_groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        sender_phone: report.sender_phone,
        content_signature: report.content_hash,
        first_seen_at: report.received_at,
        last_seen_at: report.received_at,
      }),
    })

    const groups = await groupResponse.json()
    if (groups[0]) {
      // Link report to new pattern group
      await fetch(`${SUPABASE_URL}/rest/v1/spam_reports?id=eq.${report.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ pattern_group_id: groups[0].id }),
      })
    }
  }
}

// Create or update victim record
async function upsertVictim(phone: string) {
  // Check if victim exists
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/victims?phone=eq.${phone}&select=id`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  )

  const existing = await response.json()

  if (existing.length === 0) {
    // Create new victim
    await fetch(`${SUPABASE_URL}/rest/v1/victims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        phone,
        report_count: 1,
        opted_in_settlement: true,
      }),
    })
  }
  // If exists, trigger will increment report_count
}