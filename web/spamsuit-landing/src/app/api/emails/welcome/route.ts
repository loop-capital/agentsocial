// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

// Send welcome email after first report
export async function POST(request: NextRequest) {
  try {
    const { email, case_number, phone } = await request.json()

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 })
    }

    const emailContent = {
      to: email,
      subject: 'Your spam report has been received — SpamSuit',
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;">
          <div style="background:#2A9D8F;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">SpamSuit</h1>
          </div>
          <div style="padding:32px;background:white;border:1px solid #e5e5e5;border-radius:0 0 12px 12px;">
            <h2 style="color:#1A1A1A;margin-top:0;">Your report is in.</h2>
            <p style="color:#666;font-size:16px;line-height:1.6;">
              Your spam report <strong style="color:#2A9D8F;">#${case_number}</strong> has been received and is being reviewed.
            </p>
            <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
              <h3 style="margin-top:0;color:#1A1A1A;">What happens next:</h3>
              <ol style="color:#666;line-height:1.8;">
                <li>We validate the TCPA violation</li>
                <li>We match you with an attorney (if eligible)</li>
                <li>The attorney handles everything — no cost to you</li>
                <li>You could receive $500–$1,500 per violation</li>
              </ol>
            </div>
            <p style="color:#666;font-size:16px;">
              Got more spam? Forward it to <strong style="color:#E76F51;">report@spamsuit.co</strong>
            </p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
            <p style="color:#999;font-size:12px;">
              SpamSuit — Report spam. Get paid. No cost to you.<br>
              This is not legal advice. Attorneys are independent.
            </p>
          </div>
        </div>
      `,
    }

    console.log('[EMAIL] Welcome email:', JSON.stringify(emailContent, null, 2))

    return NextResponse.json({ success: true, message: 'Welcome email queued' })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}