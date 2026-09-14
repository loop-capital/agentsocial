// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// SpamSuit - SendGrid Inbound Parse Webhook
// Receives spam emails forwarded to report@spamsuit.co and stores them in Supabase

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    // SendGrid Inbound Parse sends multipart/form-data
    const formData = await request.formData()
    
    // Extract SendGrid email data
    const from = formData.get('From') as string      // Sender's email address
    const subject = formData.get('Subject') as string // Email subject
    const text = formData.get('text') as string        // Plain text body
    const html = formData.get('html') as string        // HTML body (fallback if text empty)
    const spamReport = formData.get('spam_report') as string // SendGrid's spam score (0-1, or empty if not enabled)
    const dkim = formData.get('dkim') as string        // DKIM result
    const spf = formData.get('spf') as string          // SPF result
    
    // Use text body, fallback to HTML stripped of tags if text is empty
    let messageBody = text || ''
    if (!messageBody && html) {
      // Simple HTML to text conversion (remove tags, keep content)
      messageBody = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[\/\!]*?[^<>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }
    
    // Combine subject and body for spam scoring (subject often contains spammy content)
    const fullMessage = `${subject}\n\n${messageBody}`.trim()
    
    // Store in Supabase
    const report = await storeReport({
      sender_phone: null, // We don't extract phone from email for now
      message_body: fullMessage,
      received_at: new Date().toISOString(),
      reporter_email: from, // User's email address (if they want to be contacted via email)
      reporter_name: null, // Not available from email headers
      source: 'email',
      spam_score: await calculateSpamScore(fullMessage),
      // Additional email-specific fields we could store if we extend the schema:
      // email_subject: subject,
      // email_from: from,
      // email_dkim: dkim,
      // email_spf: spf,
      // sendgrid_spam_score: spamReport
    })

    // SendGrid expects a 200 OK response to stop retries
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Email webhook error:', error)
    
    // Still return 200 to SendGrid to prevent retries (but log error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 200 })
  }
}

// Calculate spam score based on content (same logic as SMS and web routes)
async function calculateSpamScore(message: string): Promise<number> {
  let score = 0
  
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
  
  return Math.min(score, 100)
}

// Store report in Supabase (similar to SMS route)
async function storeReport(data: {
  sender_phone: string | null
  message_body: string
  received_at: string
  reporter_email: string | null
  reporter_name: string | null
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

  // Create or update victim record (if reporter_email provided)
  if (data.reporter_email) {
    await upsertVictimByEmail(data.reporter_email)
  }

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

// Create or update victim record by email (similar to upsertVictim by phone)
async function upsertVictimByEmail(email: string) {
  // Check if victim exists by email
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/victims?email=eq.${email}&select=id`,
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
        email,
        report_count: 1,
        opted_in_settlement: true,
      }),
    })
  }
  // If exists, we would need a trigger to increment report_count (similar to phone victims)
  // For now, we rely on the phone-based victim system; email victims would need separate handling
  // In a full implementation, we'd have a unified victims table with phone OR email
}