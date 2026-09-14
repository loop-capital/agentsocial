// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// SpamSuit - Web Report Submission
// Accepts spam reports from landing page form

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { 
      sender_phone, 
      message_body, 
      reporter_phone, 
      reporter_email,
      reporter_name,
      screenshot_url 
    } = data

    // Validate required fields
    if (!sender_phone && !message_body) {
      return NextResponse.json(
        { error: 'Sender phone or message body required' },
        { status: 400 }
      )
    }

    // Calculate spam score
    const spamScore = calculateSpamScore(message_body || '')

    // Store report
    const response = await fetch(`${SUPABASE_URL}/rest/v1/spam_reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        sender_phone: sender_phone || 'unknown',
        message_body: message_body || '',
        received_at: new Date().toISOString(),
        reporter_phone: reporter_phone || null,
        reporter_email: reporter_email || null,
        reporter_name: reporter_name || null,
        screenshot_url: screenshot_url || null,
        source: 'web',
        spam_score: spamScore,
        is_tcpa_violation: spamScore >= 50,
        status: spamScore >= 50 ? 'validated' : 'pending',
      }),
    })

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`)
    }

    const reports = await response.json()
    const report = reports[0]

    return NextResponse.json({
      success: true,
      case_number: report.id.slice(0, 8),
      message: 'Report submitted successfully. We\'ll validate this violation and contact you if eligible.',
    })
  } catch (error) {
    console.error('Web report error:', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}

function calculateSpamScore(message: string): number {
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
  
  if (/https?:\/\//i.test(message) || /bit\.ly/i.test(message)) score += 10
  if (/urgent|expires? today|last chance|final notice/i.test(message)) score += 10
  
  return Math.min(score, 100)
}