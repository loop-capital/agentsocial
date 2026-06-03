// ─── Account Manager Types ───────────────────────────────────────────────────

export type ManagerRole = "senior_manager" | "manager" | "associate";
export type ClientTier = "starter" | "growth" | "pro" | "enterprise";
export type ClientStatus = "active" | "onboarding" | "at_risk" | "churned" | "paused";

export interface AccountManager {
  id: string;
  name: string;
  email: string;
  role: ManagerRole;
  avatarUrl: string | null;
  assignedBrands: string[];
  createdAt: string;
}

export interface ClientAccount {
  brandId: string;
  businessName: string;
  tier: ClientTier;
  managerId: string | null;
  status: ClientStatus;
  metrics: ClientMetrics;
  subscription: {
    plan: string;
    mrr: number;
    startDate: string;
    nextBillingDate: string;
  };
  gbpStatus: {
    connected: boolean;
    averageRating: number;
    totalReviews: number;
    responseRate: number;
  };
  managerNotes: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface ClientMetrics {
  totalFollowers: number;
  followersGrowth: number;
  impressionsThisMonth: number;
  engagementRate: number;
  postsPublished: number;
  avgReachPerPost: number;
}

export interface ManagerDashboard {
  manager: AccountManager;
  summary: ManagerDashboardSummary;
  clients: ClientAccount[];
  recentActivity: ActivityEntry[];
}

export interface ManagerDashboardSummary {
  totalClients: number;
  totalMrr: number;
  avgSatisfaction: number;
  churnRate: number;
  activeClients: number;
  onboardingClients: number;
  atRiskClients: number;
  mrrChange: number;
  satisfactionChange: number;
  churnChange: number;
}

export interface ActivityEntry {
  id: string;
  type: "note" | "status_change" | "tier_change" | "assignment" | "review_alert" | "message";
  description: string;
  brandId: string;
  brandName: string;
  timestamp: string;
}

export interface AssignClientRequest {
  managerId: string;
}

export interface UpdateNotesRequest {
  notes: string;
}