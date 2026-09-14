// Mock data for admin dashboard when Supabase is not configured

export interface Report {
  id: string;
  sender_phone: string;
  message_body: string;
  received_at: string;
  reporter_phone: string | null;
  reporter_email: string | null;
  reporter_name: string | null;
  spam_score: number;
  is_tcpa_violation: boolean;
  status: 'pending' | 'validated' | 'dismissed' | 'matched' | 'settled';
  pattern_group_id: string | null;
  screenshot_url: string | null;
  source: 'web' | 'sms';
  created_at: string;
  attorney_id: string | null;
}

export interface Attorney {
  id: string;
  name: string;
  email: string;
  phone: string;
  firm_name: string;
  status: 'active' | 'inactive' | 'suspended';
  case_count: number;
  win_rate: number;
  joined_at: string;
  specialization: string[];
}

export interface Case {
  id: string;
  case_number: string;
  status: 'open' | 'in_progress' | 'settlement' | 'settled';
  attorney_id: string;
  report_ids: string[];
  victim_count: number;
  estimated_value: number;
  settlement_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface PatternGroup {
  id: string;
  message_template: string;
  report_count: number;
  first_seen: string;
  last_seen: string;
  sender_numbers: string[];
  potential_class_action: boolean;
}

// Generate mock reports
export const mockReports: Report[] = [
  {
    id: 'rep-001',
    sender_phone: '+1-555-0123',
    message_body: 'URGENT: Your auto warranty is expiring. Reply YES for a free quote or call 1-800-SCAM-NOW. Limited time offer!',
    received_at: '2026-04-13T14:30:00Z',
    reporter_phone: '+1-555-9876',
    reporter_email: 'john.doe@example.com',
    reporter_name: 'John Doe',
    spam_score: 85,
    is_tcpa_violation: true,
    status: 'validated',
    pattern_group_id: 'pat-001',
    screenshot_url: null,
    source: 'sms',
    created_at: '2026-04-13T14:35:00Z',
    attorney_id: null,
  },
  {
    id: 'rep-002',
    sender_phone: '+1-555-0456',
    message_body: 'Congratulations! You qualify for health insurance subsidies under the Affordable Care Act. Click here: bit.ly/health-scam',
    received_at: '2026-04-13T10:15:00Z',
    reporter_phone: '+1-555-8765',
    reporter_email: 'jane.smith@example.com',
    reporter_name: 'Jane Smith',
    spam_score: 92,
    is_tcpa_violation: true,
    status: 'matched',
    pattern_group_id: 'pat-002',
    screenshot_url: null,
    source: 'web',
    created_at: '2026-04-13T10:20:00Z',
    attorney_id: 'att-001',
  },
  {
    id: 'rep-003',
    sender_phone: '+1-555-0789',
    message_body: 'Your car warranty is about to expire! This is your final notice. Call now to extend coverage. No obligation free quote.',
    received_at: '2026-04-12T16:45:00Z',
    reporter_phone: '+1-555-6543',
    reporter_email: 'bob.wilson@example.com',
    reporter_name: 'Bob Wilson',
    spam_score: 78,
    is_tcpa_violation: true,
    status: 'pending',
    pattern_group_id: 'pat-001',
    screenshot_url: null,
    source: 'sms',
    created_at: '2026-04-12T16:50:00Z',
    attorney_id: null,
  },
  {
    id: 'rep-004',
    sender_phone: '+1-555-0321',
    message_body: 'You have been selected for a cash offer on your home. We buy any condition. Reply YES for offer within 24 hours.',
    received_at: '2026-04-12T09:30:00Z',
    reporter_phone: '+1-555-4321',
    reporter_email: 'alice.brown@example.com',
    reporter_name: 'Alice Brown',
    spam_score: 65,
    is_tcpa_violation: true,
    status: 'validated',
    pattern_group_id: null,
    screenshot_url: null,
    source: 'web',
    created_at: '2026-04-12T09:35:00Z',
    attorney_id: null,
  },
  {
    id: 'rep-005',
    sender_phone: '+1-555-0654',
    message_body: 'URGENT: Your auto warranty is expiring. Reply YES for a free quote or call 1-800-SCAM-NOW. Limited time offer!',
    received_at: '2026-04-11T13:20:00Z',
    reporter_phone: '+1-555-3210',
    reporter_email: 'charlie.davis@example.com',
    reporter_name: 'Charlie Davis',
    spam_score: 85,
    is_tcpa_violation: true,
    status: 'settled',
    pattern_group_id: 'pat-001',
    screenshot_url: null,
    source: 'sms',
    created_at: '2026-04-11T13:25:00Z',
    attorney_id: 'att-001',
  },
  {
    id: 'rep-006',
    sender_phone: '+1-555-0987',
    message_body: 'Medicare enrollment is open! Get your free health insurance quote today. Pre-qualified, no obligation. Act now!',
    received_at: '2026-04-11T11:00:00Z',
    reporter_phone: '+1-555-2109',
    reporter_email: 'diana.miller@example.com',
    reporter_name: 'Diana Miller',
    spam_score: 88,
    is_tcpa_violation: true,
    status: 'matched',
    pattern_group_id: 'pat-003',
    screenshot_url: null,
    source: 'sms',
    created_at: '2026-04-11T11:05:00Z',
    attorney_id: 'att-002',
  },
  {
    id: 'rep-007',
    sender_phone: '+1-555-0145',
    message_body: 'Your loan has been pre-approved! Credit score not a problem. Click to claim your cash now.',
    received_at: '2026-04-10T15:30:00Z',
    reporter_phone: '+1-555-1098',
    reporter_email: 'eve.johnson@example.com',
    reporter_name: 'Eve Johnson',
    spam_score: 70,
    is_tcpa_violation: true,
    status: 'pending',
    pattern_group_id: null,
    screenshot_url: null,
    source: 'web',
    created_at: '2026-04-10T15:35:00Z',
    attorney_id: null,
  },
  {
    id: 'rep-008',
    sender_phone: '+1-555-0278',
    message_body: 'Congratulations! You qualify for health insurance subsidies. Click here to enroll now before it expires!',
    received_at: '2026-04-10T08:45:00Z',
    reporter_phone: '+1-555-9870',
    reporter_email: 'frank.lee@example.com',
    reporter_name: 'Frank Lee',
    spam_score: 90,
    is_tcpa_violation: true,
    status: 'validated',
    pattern_group_id: 'pat-002',
    screenshot_url: null,
    source: 'sms',
    created_at: '2026-04-10T08:50:00Z',
    attorney_id: null,
  },
  {
    id: 'rep-009',
    sender_phone: '+1-555-0567',
    message_body: 'Work from home and earn $500/day! No experience needed. Reply INFO to learn more.',
    received_at: '2026-04-09T14:00:00Z',
    reporter_phone: '+1-555-7654',
    reporter_email: 'grace.wang@example.com',
    reporter_name: 'Grace Wang',
    spam_score: 55,
    is_tcpa_violation: false,
    status: 'dismissed',
    pattern_group_id: null,
    screenshot_url: null,
    source: 'sms',
    created_at: '2026-04-09T14:05:00Z',
    attorney_id: null,
  },
  {
    id: 'rep-010',
    sender_phone: '+1-555-0890',
    message_body: 'Your auto warranty expires today! Final notice. Call immediately to extend. Free quote, no obligation.',
    received_at: '2026-04-09T10:30:00Z',
    reporter_phone: '+1-555-5432',
    reporter_email: 'henry.clark@example.com',
    reporter_name: 'Henry Clark',
    spam_score: 82,
    is_tcpa_violation: true,
    status: 'pending',
    pattern_group_id: 'pat-001',
    screenshot_url: null,
    source: 'web',
    created_at: '2026-04-09T10:35:00Z',
    attorney_id: null,
  },
];

// Generate more reports to have a larger dataset
for (let i = 11; i <= 50; i++) {
  const statuses: Report['status'][] = ['pending', 'validated', 'dismissed', 'matched', 'settled'];
  const sources: ('web' | 'sms')[] = ['web', 'sms'];
  const patternIds = ['pat-001', 'pat-002', 'pat-003', null];
  
  mockReports.push({
    id: `rep-${String(i).padStart(3, '0')}`,
    sender_phone: `+1-555-${String(1000 + i).slice(-4)}`,
    message_body: `Sample spam message ${i}. This is a mock message for testing the admin dashboard. ${i % 3 === 0 ? 'Auto warranty expiring!' : i % 3 === 1 ? 'Health insurance offer!' : 'Cash offer for your home!'}`,
    received_at: new Date(Date.now() - i * 86400000).toISOString(),
    reporter_phone: `+1-555-${String(2000 + i).slice(-4)}`,
    reporter_email: `reporter${i}@example.com`,
    reporter_name: `Reporter ${i}`,
    spam_score: 50 + Math.floor(Math.random() * 50),
    is_tcpa_violation: Math.random() > 0.3,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    pattern_group_id: patternIds[Math.floor(Math.random() * patternIds.length)],
    screenshot_url: null,
    source: sources[Math.floor(Math.random() * sources.length)],
    created_at: new Date(Date.now() - i * 86400000 + 300000).toISOString(),
    attorney_id: Math.random() > 0.7 ? ['att-001', 'att-002', 'att-003'][Math.floor(Math.random() * 3)] : null,
  });
}

// Mock attorneys
export const mockAttorneys: Attorney[] = [
  {
    id: 'att-001',
    name: 'Sarah Chen',
    email: 's.chen@tcpafirm.com',
    phone: '+1-555-LAWYER',
    firm_name: 'Chen & Associates TCPA Law',
    status: 'active',
    case_count: 47,
    win_rate: 0.89,
    joined_at: '2025-08-15T00:00:00Z',
    specialization: ['TCPA', 'Consumer Protection', 'Class Action'],
  },
  {
    id: 'att-002',
    name: 'Michael Rodriguez',
    email: 'm.rodriguez@consumerlaw.com',
    phone: '+1-555-LEGAL-1',
    firm_name: 'Rodriguez Consumer Law Group',
    status: 'active',
    case_count: 32,
    win_rate: 0.84,
    joined_at: '2025-10-22T00:00:00Z',
    specialization: ['TCPA', 'FDCPA', 'Telemarketing Fraud'],
  },
  {
    id: 'att-003',
    name: 'Jennifer Park',
    email: 'j.park@parklegal.com',
    phone: '+1-555-JUSTICE',
    firm_name: 'Park Legal Partners',
    status: 'active',
    case_count: 28,
    win_rate: 0.91,
    joined_at: '2025-12-01T00:00:00Z',
    specialization: ['TCPA', 'Privacy Law', 'Data Breach'],
  },
  {
    id: 'att-004',
    name: 'David Thompson',
    email: 'd.thompson@thompsonlaw.com',
    phone: '+1-555-CALL-DT',
    firm_name: 'Thompson Law Offices',
    status: 'inactive',
    case_count: 15,
    win_rate: 0.75,
    joined_at: '2025-06-10T00:00:00Z',
    specialization: ['TCPA', 'Insurance Claims'],
  },
  {
    id: 'att-005',
    name: 'Amanda Foster',
    email: 'a.foster@fosterdefense.com',
    phone: '+1-555-LAW-HELP',
    firm_name: 'Foster Defense Group',
    status: 'active',
    case_count: 41,
    win_rate: 0.87,
    joined_at: '2025-09-05T00:00:00Z',
    specialization: ['TCPA', 'Consumer Protection', 'Securities Fraud'],
  },
];

// Mock cases
export const mockCases: Case[] = [
  {
    id: 'case-001',
    case_number: 'SS-2026-0001',
    status: 'in_progress',
    attorney_id: 'att-001',
    report_ids: ['rep-002', 'rep-008'],
    victim_count: 2,
    estimated_value: 3000,
    settlement_amount: null,
    created_at: '2026-04-10T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
  {
    id: 'case-002',
    case_number: 'SS-2026-0002',
    status: 'settled',
    attorney_id: 'att-001',
    report_ids: ['rep-005'],
    victim_count: 1,
    estimated_value: 1500,
    settlement_amount: 1200,
    created_at: '2026-04-08T00:00:00Z',
    updated_at: '2026-04-12T00:00:00Z',
  },
  {
    id: 'case-003',
    case_number: 'SS-2026-0003',
    status: 'settlement',
    attorney_id: 'att-002',
    report_ids: ['rep-006'],
    victim_count: 1,
    estimated_value: 1500,
    settlement_amount: null,
    created_at: '2026-04-11T00:00:00Z',
    updated_at: '2026-04-14T00:00:00Z',
  },
  {
    id: 'case-004',
    case_number: 'SS-2026-0004',
    status: 'open',
    attorney_id: 'att-003',
    report_ids: [],
    victim_count: 0,
    estimated_value: 0,
    settlement_amount: null,
    created_at: '2026-04-14T00:00:00Z',
    updated_at: '2026-04-14T00:00:00Z',
  },
  {
    id: 'case-005',
    case_number: 'SS-2026-0005',
    status: 'in_progress',
    attorney_id: 'att-005',
    report_ids: ['rep-015', 'rep-016', 'rep-017', 'rep-018'],
    victim_count: 4,
    estimated_value: 6000,
    settlement_amount: null,
    created_at: '2026-04-05T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
];

// Mock pattern groups
export const mockPatternGroups: PatternGroup[] = [
  {
    id: 'pat-001',
    message_template: 'Your auto warranty is expiring. Reply YES for a free quote.',
    report_count: 12,
    first_seen: '2026-04-01T00:00:00Z',
    last_seen: '2026-04-13T14:30:00Z',
    sender_numbers: ['+1-555-0123', '+1-555-0789', '+1-555-0654', '+1-555-0890'],
    potential_class_action: true,
  },
  {
    id: 'pat-002',
    message_template: 'Congratulations! You qualify for health insurance subsidies under the Affordable Care Act.',
    report_count: 8,
    first_seen: '2026-04-02T00:00:00Z',
    last_seen: '2026-04-10T08:45:00Z',
    sender_numbers: ['+1-555-0456', '+1-555-0278'],
    potential_class_action: true,
  },
  {
    id: 'pat-003',
    message_template: 'Medicare enrollment is open! Get your free health insurance quote today.',
    report_count: 6,
    first_seen: '2026-04-05T00:00:00Z',
    last_seen: '2026-04-11T11:00:00Z',
    sender_numbers: ['+1-555-0987'],
    potential_class_action: false,
  },
];

// Helper functions
export function getReportStats() {
  const total = mockReports.length;
  const pending = mockReports.filter(r => r.status === 'pending').length;
  const validated = mockReports.filter(r => r.status === 'validated').length;
  const matched = mockReports.filter(r => r.status === 'matched').length;
  const settled = mockReports.filter(r => r.status === 'settled').length;
  const dismissed = mockReports.filter(r => r.status === 'dismissed').length;
  
  return {
    total,
    pending,
    validated,
    matched,
    settled,
    dismissed,
    potential_class_action: mockPatternGroups.filter(p => p.potential_class_action).length,
  };
}

export function getReportById(id: string): Report | undefined {
  return mockReports.find(r => r.id === id);
}

export function getReportsByPatternGroup(patternGroupId: string): Report[] {
  return mockReports.filter(r => r.pattern_group_id === patternGroupId);
}

export function getAttorneyById(id: string): Attorney | undefined {
  return mockAttorneys.find(a => a.id === id);
}

export function getCaseById(id: string): Case | undefined {
  return mockCases.find(c => c.id === id);
}

export function getCasesByAttorney(attorneyId: string): Case[] {
  return mockCases.filter(c => c.attorney_id === attorneyId);
}
