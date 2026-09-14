// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, case_number, settlement_amount, attorney_name } = await request.json()

    const emailContent = {
      to: email,
      subject: 'Settlement reached in your case! — SpamSuit',
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;">
          <div style="background:#2A9D8F;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">SpamSuit</h1>
          </div>
          <div style="padding:32px;background:white;border:1px solid #e5e5e5;border-radius:0 0 12px 12px;">
            <h2 style="color:#2A9D8F;margin-top:0;">💰 Settlement Reached</h2>
            <p style="color:#666;font-size:16px;line-height:1.6;">
              Great news! A settlement has been reached in your case <strong>#${case_number}</strong>.
            </p>
            <div style="background:#f0fdf9;padding:24px;border-radius:8px;margin:20px 0;text-align:center;">
              <p style="margin:0;color:#999;font-size:14px;">Your Settlement</p>
              <p style="margin:4px 0 0;color:#2A9D8F;font-size:40px;font-weight:bold;">$${settlement_amount?.toLocaleString()}</p>
            </div>
            <p style="color:#666;font-size:16px;">
              Your attorney ${attorney_name ? `<strong>${attorney_name}</strong>` : ''} will provide details on the payout timeline and next steps.
            </p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:20px 0;">
              <p style="margin:0;color:#666;font-size:14px;">
                <strong>Remember:</strong> Keep forwarding spam to report@spamsuit.co. Each one could be worth $500–$1,500.
              </p>
            </div>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
            <p style="color:#999;font-size:12px;">
              SpamSuit — Report spam. Get paid. No cost to you.
            </p>
          </div>
        </div>
      `,
    }

    console.log('[EMAIL] Settlement email:', JSON.stringify(emailContent, null, 2))
    return NextResponse.json({ success: true, message: 'Settlement email queued' })
  } catch (error) {
    console.error('Settlement email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}