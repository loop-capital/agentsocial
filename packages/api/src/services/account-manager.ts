import type {
  ManagerDashboard,
  ManagerDashboardSummary,
  ClientAccount,
  ActivityEntry,
  ClientTier,
  ClientStatus,
} from "@agentsocial/shared";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MANAGER = {
  id: "mgr-001",
  name: "Sarah Mitchell",
  email: "sarah@agentsocial.com",
  role: "senior_manager" as const,
  avatarUrl: null,
  assignedBrands: [
    "brand-001", "brand-002", "brand-003", "brand-004",
    "brand-005", "brand-006", "brand-007", "brand-008",
  ],
  createdAt: "2024-06-15T10:00:00Z",
};

const MOCK_CLIENTS: ClientAccount[] = [
  {
    brandId: "brand-001",
    businessName: "Luxe Hair Studio",
    tier: "pro",
    managerId: "mgr-001",
    status: "active",
    metrics: {
      totalFollowers: 12450,
      followersGrowth: 8.2,
      impressionsThisMonth: 48200,
      engagementRate: 4.7,
      postsPublished: 18,
      avgReachPerPost: 2678,
    },
    subscription: {
      plan: "Pro",
      mrr: 9900,
      startDate: "2024-07-01T00:00:00Z",
      nextBillingDate: "2025-06-01T00:00:00Z",
    },
    gbpStatus: {
      connected: true,
      averageRating: 4.8,
      totalReviews: 234,
      responseRate: 0.96,
    },
    managerNotes: "Top performer. Strong engagement across all platforms. Up for renewal in June — discuss upgrade to Enterprise.",
    lastActivityAt: "2025-05-11T14:30:00Z",
    createdAt: "2024-07-01T00:00:00Z",
  },
  {
    brandId: "brand-002",
    businessName: "Serenity Day Spa",
    tier: "growth",
    managerId: "mgr-001",
    status: "active",
    metrics: {
      totalFollowers: 8930,
      followersGrowth: 5.4,
      impressionsThisMonth: 32100,
      engagementRate: 3.9,
      postsPublished: 14,
      avgReachPerPost: 2293,
    },
    subscription: {
      plan: "Growth",
      mrr: 4900,
      startDate: "2024-09-15T00:00:00Z",
      nextBillingDate: "2025-06-15T00:00:00Z",
    },
    gbpStatus: {
      connected: true,
      averageRating: 4.6,
      totalReviews: 189,
      responseRate: 0.91,
    },
    managerNotes: "Doing well with review solicitation. Need to boost Instagram engagement.",
    lastActivityAt: "2025-05-11T09:15:00Z",
    createdAt: "2024-09-15T00:00:00Z",
  },
  {
    brandId: "brand-003",
    businessName: "Glow Aesthetics & Skin",
    tier: "pro",
    managerId: "mgr-001",
    status: "active",
    metrics: {
      totalFollowers: 15680,
      followersGrowth: 12.1,
      impressionsThisMonth: 67300,
      engagementRate: 5.3,
      postsPublished: 22,
      avgReachPerPost: 3059,
    },
    subscription: {
      plan: "Pro",
      mrr: 9900,
      startDate: "2024-04-01T00:00:00Z",
      nextBillingDate: "2025-06-01T00:00:00Z",
    },
    gbpStatus: {
      connected: true,
      averageRating: 4.9,
      totalReviews: 342,
      responseRate: 0.98,
    },
    managerNotes: "Our showcase client. Highest engagement rate on the roster. Potential case study.",
    lastActivityAt: "2025-05-10T16:45:00Z",
    createdAt: "2024-04-01T00:00:00Z",
  },
  {
    brandId: "brand-004",
    businessName: "The Polish Nail Bar",
    tier: "starter",
    managerId: "mgr-001",
    status: "onboarding",
    metrics: {
      totalFollowers: 1240,
      followersGrowth: 2.1,
      impressionsThisMonth: 4500,
      engagementRate: 2.8,
      postsPublished: 4,
      avgReachPerPost: 1125,
    },
    subscription: {
      plan: "Starter",
      mrr: 0,
      startDate: "2025-05-01T00:00:00Z",
      nextBillingDate: "2025-06-01T00:00:00Z",
    },
    gbpStatus: {
      connected: false,
      averageRating: 0,
      totalReviews: 0,
      responseRate: 0,
    },
    managerNotes: "New client — onboarding in progress. Needs GBP setup and content calendar kickoff.",
    lastActivityAt: "2025-05-11T11:00:00Z",
    createdAt: "2025-05-01T00:00:00Z",
  },
  {
    brandId: "brand-005",
    businessName: "Bronze & Beauty Tanning",
    tier: "growth",
    managerId: "mgr-001",
    status: "at_risk",
    metrics: {
      totalFollowers: 5670,
      followersGrowth: -1.2,
      impressionsThisMonth: 18200,
      engagementRate: 2.1,
      postsPublished: 6,
      avgReachPerPost: 3033,
    },
    subscription: {
      plan: "Growth",
      mrr: 4900,
      startDate: "2024-11-01T00:00:00Z",
      nextBillingDate: "2025-06-01T00:00:00Z",
    },
    gbpStatus: {
      connected: true,
      averageRating: 3.9,
      totalReviews: 78,
      responseRate: 0.62,
    },
    managerNotes: "⚠️ At risk — declining engagement, low review response rate. Schedule retention call ASAP. Offer discount or extra services.",
    lastActivityAt: "2025-05-08T10:30:00Z",
    createdAt: "2024-11-01T00:00:00Z",
  },
  {
    brandId: "brand-006",
    businessName: "Velvet Rose Wellness",
    tier: "pro",
    managerId: "mgr-001",
    status: "active",
    metrics: {
      totalFollowers: 9340,
      followersGrowth: 6.8,
      impressionsThisMonth: 39800,
      engagementRate: 4.2,
      postsPublished: 16,
      avgReachPerPost: 2488,
    },
    subscription: {
      plan: "Pro",
      mrr: 9900,
      startDate: "2024-08-01T00:00:00Z",
      nextBillingDate: "2025-06-01T00:00:00Z",
    },
    gbpStatus: {
      connected: true,
      averageRating: 4.7,
      totalReviews: 201,
      responseRate: 0.93,
    },
    managerNotes: "Solid performer. Recently started using booking widget — tracking conversion rates.",
    lastActivityAt: "2025-05-11T08:20:00Z",
    createdAt: "2024-08-01T00:00:00Z",
  },
  {
    brandId: "brand-007",
    businessName: "Bella Lash & Brow Studio",
    tier: "growth",
    managerId: null,
    status: "active",
    metrics: {
      totalFollowers: 4210,
      followersGrowth: 3.7,
      impressionsThisMonth: 15600,
      engagementRate: 3.4,
      postsPublished: 10,
      avgReachPerPost: 1560,
    },
    subscription: {
      plan: "Growth",
      mrr: 4900,
      startDate: "2025-01-15T00:00:00Z",
      nextBillingDate: "2025-06-15T00:00:00Z",
    },
    gbpStatus: {
      connected: true,
      averageRating: 4.4,
      totalReviews: 112,
      responseRate: 0.85,
    },
    managerNotes: "",
    lastActivityAt: "2025-05-09T15:00:00Z",
    createdAt: "2025-01-15T00:00:00Z",
  },
  {
    brandId: "brand-008",
    businessName: "Omni Wellness & Recovery",
    tier: "enterprise",
    managerId: "mgr-001",
    status: "active",
    metrics: {
      totalFollowers: 22100,
      followersGrowth: 9.5,
      impressionsThisMonth: 95400,
      engagementRate: 4.9,
      postsPublished: 28,
      avgReachPerPost: 3407,
    },
    subscription: {
      plan: "Enterprise",
      mrr: 24900,
      startDate: "2024-03-01T00:00:00Z",
      nextBillingDate: "2025-06-01T00:00:00Z",
    },
    gbpStatus: {
      connected: true,
      averageRating: 4.8,
      totalReviews: 456,
      responseRate: 0.97,
    },
    managerNotes: "Enterprise client — 3 locations. Multi-location GBP management. Priority support SLA.",
    lastActivityAt: "2025-05-11T12:00:00Z",
    createdAt: "2024-03-01T00:00:00Z",
  },
];

const MOCK_ACTIVITY: ActivityEntry[] = [
  {
    id: "act-001",
    type: "review_alert",
    description: "New 1-star review on Glow Aesthetics & Skin — needs response",
    brandId: "brand-003",
    brandName: "Glow Aesthetics & Skin",
    timestamp: "2025-05-11T14:30:00Z",
  },
  {
    id: "act-002",
    type: "assignment",
    description: "Bella Lash & Brow Studio assigned to you",
    brandId: "brand-007",
    brandName: "Bella Lash & Brow Studio",
    timestamp: "2025-05-11T11:00:00Z",
  },
  {
    id: "act-003",
    type: "note",
    description: "Added onboarding checklist for The Polish Nail Bar",
    brandId: "brand-004",
    brandName: "The Polish Nail Bar",
    timestamp: "2025-05-11T10:45:00Z",
  },
  {
    id: "act-004",
    type: "tier_change",
    description: "Bronze & Beauty Tanning downgraded to Growth plan",
    brandId: "brand-005",
    brandName: "Bronze & Beauty Tanning",
    timestamp: "2025-05-08T16:20:00Z",
  },
  {
    id: "act-005",
    type: "message",
    description: "Luxe Hair Studio sent message: \"Can we discuss Q3 content strategy?\"",
    brandId: "brand-001",
    brandName: "Luxe Hair Studio",
    timestamp: "2025-05-08T09:30:00Z",
  },
  {
    id: "act-006",
    type: "status_change",
    description: "Omni Wellness & Recovery renewed annual Enterprise subscription",
    brandId: "brand-008",
    brandName: "Omni Wellness & Recovery",
    timestamp: "2025-05-07T15:10:00Z",
  },
  {
    id: "act-007",
    type: "review_alert",
    description: "Serenity Day Spa hit 4.6★ average rating milestone",
    brandId: "brand-002",
    brandName: "Serenity Day Spa",
    timestamp: "2025-05-07T10:00:00Z",
  },
  {
    id: "act-008",
    type: "note",
    description: "Updated retention strategy for Bronze & Beauty Tanning",
    brandId: "brand-005",
    brandName: "Bronze & Beauty Tanning",
    timestamp: "2025-05-06T14:30:00Z",
  },
];

const MOCK_SUMMARY: ManagerDashboardSummary = {
  totalClients: 8,
  totalMrr: 73300,
  avgSatisfaction: 4.6,
  churnRate: 0.125,
  activeClients: 6,
  onboardingClients: 1,
  atRiskClients: 1,
  mrrChange: 8.3,
  satisfactionChange: 0.2,
  churnChange: -0.05,
};

// ─── Service Functions ────────────────────────────────────────────────────────

export async function getManagerDashboard(managerId: string): Promise<ManagerDashboard> {
  // In production, query database for real data
  void managerId; // will be used for real DB queries

  return {
    manager: MOCK_MANAGER,
    summary: MOCK_SUMMARY,
    clients: MOCK_CLIENTS,
    recentActivity: MOCK_ACTIVITY,
  };
}

export async function getClients(
  managerId: string,
  filters?: { tier?: ClientTier; status?: ClientStatus; search?: string },
): Promise<ClientAccount[]> {
  void managerId;

  let results = [...MOCK_CLIENTS];

  if (filters?.tier) {
    results = results.filter((c) => c.tier === filters.tier);
  }
  if (filters?.status) {
    results = results.filter((c) => c.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter((c) => c.businessName.toLowerCase().includes(q));
  }

  return results;
}

export async function getClientDetail(brandId: string): Promise<ClientAccount> {
  const client = MOCK_CLIENTS.find((c) => c.brandId === brandId);
  if (!client) throw new Error(`Client not found: ${brandId}`);
  return client;
}

export async function assignClient(brandId: string, managerId: string): Promise<ClientAccount> {
  const client = MOCK_CLIENTS.find((c) => c.brandId === brandId);
  if (!client) throw new Error(`Client not found: ${brandId}`);

  // In production, update DB
  client.managerId = managerId;
  return client;
}

export async function updateClientNotes(brandId: string, notes: string): Promise<ClientAccount> {
  const client = MOCK_CLIENTS.find((c) => c.brandId === brandId);
  if (!client) throw new Error(`Client not found: ${brandId}`);

  // In production, update DB
  client.managerNotes = notes;
  return client;
}