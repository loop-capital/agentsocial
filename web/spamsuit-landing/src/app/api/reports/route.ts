// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// SpamSuit - Reports Dashboard API
// Returns spam reports for admin/attorney review and victim lookups

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

// Mock data for demonstration
const mockReports: any[] = [
  {
    id: 'rep_12345678abcd',
    sender_phone: '+1-555-234-5678',
    message_body: 'Congratulations! You have been selected for a $5000 loan. Reply YES to claim now!',
    received_at: '2026-04-10T14:30:00Z',
    reporter_phone: '+1-555-123-4567',
    reporter_email: 'user@example.com',
    status: 'settled',
    spam_score: 75,
    is_tcpa_violation: true,
    case: {
      id: 'case_98765432',
      attorney_name: 'Sarah Johnson',
      attorney_firm: 'Johnson TCPA Law Group',
      status: 'settled',
      settlement_amount: 1500,
      created_at: '2026-04-12T10:00:00Z',
    },
  },
  {
    id: 'rep_87654321efgh',
    sender_phone: '+1-555-999-8888',
    message_body: 'Your auto warranty is expiring! Click here to renew: bit.ly/fake-link',
    received_at: '2026-04-08T09:15:00Z',
    reporter_phone: '+1-555-123-4567',
    reporter_email: 'user@example.com',
    status: 'matched',
    spam_score: 65,
    is_tcpa_violation: true,
    case: {
      id: 'case_12345678',
      attorney_name: 'Michael Chen',
      attorney_firm: 'Chen Consumer Protection',
      status: 'active',
      settlement_amount: null,
      created_at: '2026-04-09T11:00:00Z',
    },
  },
  {
    id: 'rep_abcdef123456',
    sender_phone: '+1-555-777-6666',
    message_body: 'URGENT: Your Medicare benefits need verification. Call now!',
    received_at: '2026-04-05T16:45:00Z',
    reporter_phone: '+1-555-123-4567',
    reporter_email: 'user@example.com',
    status: 'validated',
    spam_score: 80,
    is_tcpa_violation: true,
    case: null,
  },
  {
    id: 'rep_987xyz654321',
    sender_phone: '+1-555-111-2222',
    message_body: 'Hi this is from your bank...',
    received_at: '2026-04-01T08:00:00Z',
    reporter_phone: '+1-555-123-4567',
    reporter_email: 'user@example.com',
    status: 'pending',
    spam_score: 25,
    is_tcpa_violation: false,
    case: null,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const reporterPhone = searchParams.get('reporter_phone')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Victim lookup by phone number
    if (reporterPhone) {
      // Normalize phone number for comparison
      const normalizedPhone = reporterPhone.replace(/\D/g, '')
      
      try {
        // Try to fetch from Supabase
        const query = `${SUPABASE_URL}/rest/v1/spam_reports?select=*,case:case_id(*)&reporter_phone=ilike.*${encodeURIComponent(reporterPhone)}*&order=created_at.desc`
        
        const response = await fetch(query, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        })

        if (response.ok) {
          const reports = await response.json()
          if (reports.length > 0) {
            return NextResponse.json({ reports })
          }
        }
      } catch (dbError) {
        console.log('Supabase query failed, falling back to mock data:', dbError)
      }

      // Fallback to mock data if no real data or DB error
      // Check if the normalized phone matches our mock reporter
      const normalizedMockPhone = '+1-555-123-4567'.replace(/\D/g, '')
      if (normalizedPhone === normalizedMockPhone || reporterPhone.includes('555-123') || reporterPhone.includes('555123')) {
        return NextResponse.json({ reports: mockReports })
      }

      return NextResponse.json({ reports: [] })
    }

    // Admin/attorney dashboard query
    let query = `${SUPABASE_URL}/rest/v1/spam_reports?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`

    if (status !== 'all') {
      query += `&status=eq.${status}`
    }

    const response = await fetch(query, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`)
    }

    const reports = await response.json()

    // Get counts by status
    const countsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_report_counts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    let counts = null
    if (countsResponse.ok) {
      counts = await countsResponse.json()
    }

    return NextResponse.json({
      reports,
      counts,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}