// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, case_number, attorney_name, attorney_firm } = await request.json()

    const emailContent = {
      to: email,
      subject: 'You\'ve been matched with a TCPA attorney — SpamSuit',
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;">
          <div style="background:#2A9D8F;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">SpamSuit</h1>
          </div>
          <div style="padding:32px;background:white;border:1px solid #e5e5e5;border-radius:0 0 12px 12px;">
            <h2 style="color:#1A1A1A;margin-top:0;">⚖️ Attorney Matched</h2>
            <p style="color:#666;font-size:16px;line-height:1.6;">
              Your case <strong>#${case_number}</strong> has been matched with a TCPA attorney.
            </p>
            <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
              <p style="margin:0;color:#999;font-size:14px;">Your Attorney</p>
              <p style="margin:4px 0 0;color:#1A1A1A;font-size:20px;font-weight:bold;">${attorney_name}</p>
              <p style="margin:4px 0 0;color:#666;">${attorney_firm}</p>
            </div>
            <div style="background:#fff5f2;padding:16px;border-radius:8px;margin:20px 0;">
              <p style="margin:0;color:#E76F51;font-size:14px;">
                <strong>No cost to you.</strong> Your attorney works on contingency — they only get paid if you win.
              </p>
            </div>
            <p style="color:#666;font-size:16px;">
              Your attorney will contact you directly. No action needed from you.
            </p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
            <p style="color:#999;font-size:12px;">
              SpamSuit — Report spam. Get paid. No cost to you.
            </p>
          </div>
        </div>
      `,
    }

    console.log('[EMAIL] Attorney match email:', JSON.stringify(emailContent, null, 2))
    return NextResponse.json({ success: true, message: 'Attorney match email queued' })
  } catch (error) {
    console.error('Attorney match email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}