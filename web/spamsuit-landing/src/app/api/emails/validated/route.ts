// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, case_number, spam_score, potential_value } = await request.json()

    const emailContent = {
      to: email,
      subject: 'Your TCPA violation has been validated! — SpamSuit',
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;">
          <div style="background:#2A9D8F;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">SpamSuit</h1>
          </div>
          <div style="padding:32px;background:white;border:1px solid #e5e5e5;border-radius:0 0 12px 12px;">
            <h2 style="color:#2A9D8F;margin-top:0;">✓ Violation Validated</h2>
            <p style="color:#666;font-size:16px;line-height:1.6;">
              Your report <strong>#${case_number}</strong> has been reviewed and confirmed as a TCPA violation.
            </p>
            <div style="background:#f0fdf9;padding:20px;border-radius:8px;margin:20px 0;text-align:center;">
              <p style="margin:0;color:#999;font-size:14px;">Potential Value</p>
              <p style="margin:4px 0 0;color:#2A9D8F;font-size:32px;font-weight:bold;">$${potential_value || '500–1,500'}</p>
            </div>
            <p style="color:#666;font-size:16px;">
              We're now matching you with a TCPA attorney. You'll hear from us soon.
            </p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
            <p style="color:#999;font-size:12px;">
              SpamSuit — Report spam. Get paid. No cost to you.
            </p>
          </div>
        </div>
      `,
    }

    console.log('[EMAIL] Validated email:', JSON.stringify(emailContent, null, 2))
    return NextResponse.json({ success: true, message: 'Validation email queued' })
  } catch (error) {
    console.error('Validated email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}