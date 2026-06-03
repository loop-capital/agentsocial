/**
 * Zernio Service — Social publishing + inbox + CRM bridge (ADR-013)
 *
 * Full social management platform: publishing, inbox, broadcasts,
 * sequences, automations, contacts, analytics across 14 platforms.
 *
 * Temporary bridge for GBP until direct Google API access (July 22 reapply).
 * Zernio stays long-term for non-GBP platforms (Instagram, TikTok, etc.)
 *
 * API docs: https://docs.zernio.com
 * CLI: npm i -g @zernio/cli
 * MCP: https://mcp.zernio.com/mcp
 */

// ─── Configuration ──────────────────────────────────────────────────────────

function getBaseUrl(): string {
  return process.env.ZERNIO_BASE_URL || "https://zernio.com/api/v1";
}

function getApiKey(): string {
  const key = process.env.ZERNIO_API_KEY;
  if (!key) {
    throw new Error("ZERNIO_API_KEY is not set in environment");
  }
  return key;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ZernioPlatform =
  | "twitter"
  | "instagram"
  | "facebook"
  | "youtube"
  | "linkedin"
  | "threads"
  | "tiktok"
  | "pinterest"
  | "reddit"
  | "bluesky"
  | "whatsapp"
  | "telegram"
  | "discord"
  | "snapchat"
  | "googlebusiness";

export interface ZernioProfile {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ZernioAccount {
  _id: string;
  platform: string;
  profileId: string;
  username: string;
  displayName: string;
  isActive: boolean;
}

export interface ZernioPost {
  _id: string;
  title?: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor?: string;
  timezone?: string;
  platforms: Array<{
    platform: string;
    accountId: string;
    status: string;
  }>;
  mediaItems?: Array<{ type: string; url: string }>;
  tags?: string[];
  hashtags?: string[];
  visibility?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZernioPostCreate {
  content: string;
  platforms: Array<{
    platform: ZernioPlatform | string;
    accountId: string;
    customContent?: string;
    platformSpecificData?: Record<string, unknown>;
  }>;
  profileId?: string;
  scheduledFor?: string;
  publishNow?: boolean;
  isDraft?: boolean;
  timezone?: string;
  mediaItems?: Array<{ type: string; url: string }>;
  title?: string;
  tags?: string[];
  hashtags?: string[];
  visibility?: string;
}

export interface ZernioConnectResult {
  authUrl: string;
  state: string;
}

export interface ZernioUsageStats {
  planName: string;
  billingPeriod: string;
  limits: { uploads: number; profiles: number };
  usage: {
    connectedAccounts: number;
    [key: string]: unknown;
  };
  spend: {
    currentPeriodCents: number;
    creditsRemainingCents: number;
  };
}

export interface ZernioConversation {
  _id: string;
  platform: string;
  accountId: string;
  participantName?: string;
  participantImage?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZernioMessage {
  _id: string;
  conversationId: string;
  text: string;
  sender: "contact" | "business";
  createdAt: string;
}

export interface ZernioComment {
  _id: string;
  postId: string;
  platform: string;
  accountId: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface ZernioReview {
  _id: string;
  platform: string;
  accountId: string;
  rating: number;
  text: string;
  authorName: string;
  reply?: string;
  createdAt: string;
}

export interface ZernioContact {
  _id: string;
  name: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  channels?: Array<{
    platform: string;
    platformIdentifier: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ZernioBroadcast {
  _id: string;
  name: string;
  message: string;
  platform: string;
  status: string;
  profileId: string;
  accountId: string;
  createdAt: string;
}

export interface ZernioSequence {
  _id: string;
  name: string;
  platform: string;
  status: string;
  steps: Array<{
    order: number;
    delayMinutes: number;
    message: { text: string };
  }>;
  createdAt: string;
}

export interface ZernioAutomation {
  _id: string;
  name: string;
  platformPostId: string;
  keywords?: string[];
  dmMessage: string;
  commentReply?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ZernioAnalyticsPost {
  postId: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
}

export interface ZernioAnalyticsDaily {
  date: string;
  followers: number;
  impressions: number;
  engagement: number;
}

export interface ZernioBestTime {
  dayOfWeek: string;
  hour: number;
  score: number;
}

// ─── API Client ──────────────────────────────────────────────────────────────

async function zernioFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error");
    throw new Error(`Zernio API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Profile Operations ──────────────────────────────────────────────────────

export async function listProfiles(): Promise<ZernioProfile[]> {
  const res = await zernioFetch<{ profiles: ZernioProfile[] }>("/profiles");
  return res.profiles;
}

export async function createProfile(data: {
  name: string;
  description?: string;
  color?: string;
}): Promise<ZernioProfile> {
  return zernioFetch<ZernioProfile>("/profiles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProfile(profileId: string): Promise<ZernioProfile> {
  return zernioFetch<ZernioProfile>(`/profiles/${profileId}`);
}

export async function deleteProfile(profileId: string): Promise<void> {
  await zernioFetch(`/profiles/${profileId}`, { method: "DELETE" });
}

// ─── Account Operations ─────────────────────────────────────────────────────

export async function listAccounts(profileId?: string): Promise<ZernioAccount[]> {
  const query = profileId ? `?profileId=${profileId}` : "";
  const res = await zernioFetch<{ accounts: ZernioAccount[] }>(`/accounts${query}`);
  return res.accounts;
}

export async function getAccount(accountId: string): Promise<ZernioAccount> {
  return zernioFetch<ZernioAccount>(`/accounts/${accountId}`);
}

export async function accountHealth(accountId: string): Promise<Record<string, unknown>> {
  return zernioFetch<Record<string, unknown>>(`/accounts/${accountId}/health`);
}

export async function disconnectAccount(accountId: string): Promise<void> {
  await zernioFetch(`/accounts/${accountId}`, { method: "DELETE" });
}

// ─── OAuth Connection ────────────────────────────────────────────────────────

export async function getConnectLink(
  platform: ZernioPlatform | string,
  profileId: string,
  redirectUrl?: string,
): Promise<ZernioConnectResult> {
  let path = `/connect/${platform}?profileId=${profileId}`;
  if (redirectUrl) {
    path += `&redirect_url=${encodeURIComponent(redirectUrl)}`;
  }
  return zernioFetch<ZernioConnectResult>(path);
}

export async function completeOAuth(
  platform: ZernioPlatform | string,
  code: string,
  state: string,
  profileId: string,
): Promise<ZernioAccount> {
  return zernioFetch<ZernioAccount>(`/connect/${platform}`, {
    method: "POST",
    body: JSON.stringify({ code, state, profileId }),
  });
}

// ─── Post Operations ─────────────────────────────────────────────────────────

export async function listPosts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  platform?: string;
  profileId?: string;
}): Promise<{ posts: ZernioPost[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.platform) query.set("platform", params.platform);
  if (params?.profileId) query.set("profileId", params.profileId);
  const qs = query.toString();
  return zernioFetch(`/posts${qs ? `?${qs}` : ""}`);
}

export async function createPost(data: ZernioPostCreate): Promise<ZernioPost> {
  return zernioFetch<ZernioPost>("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPost(postId: string): Promise<ZernioPost> {
  return zernioFetch<ZernioPost>(`/posts/${postId}`);
}

export async function updatePost(postId: string, data: Partial<ZernioPostCreate>): Promise<ZernioPost> {
  return zernioFetch<ZernioPost>(`/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(postId: string): Promise<void> {
  await zernioFetch(`/posts/${postId}`, { method: "DELETE" });
}

export async function retryPost(postId: string): Promise<ZernioPost> {
  return zernioFetch<ZernioPost>(`/posts/${postId}/retry`, { method: "POST" });
}

// ─── Inbox ───────────────────────────────────────────────────────────────────

export async function listConversations(params?: {
  platform?: string;
  accountId?: string;
  page?: number;
  limit?: number;
}): Promise<{ conversations: ZernioConversation[]; pagination: Record<string, unknown> }> {
  const query = new URLSearchParams();
  if (params?.platform) query.set("platform", params.platform);
  if (params?.accountId) query.set("accountId", params.accountId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return zernioFetch(`/inbox/conversations${qs ? `?${qs}` : ""}`);
}

export async function getConversation(conversationId: string): Promise<ZernioConversation> {
  return zernioFetch<ZernioConversation>(`/inbox/conversations/${conversationId}`);
}

export async function listMessages(conversationId: string, params?: {
  page?: number;
  limit?: number;
}): Promise<{ messages: ZernioMessage[]; pagination: Record<string, unknown> }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return zernioFetch(`/inbox/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`);
}

export async function sendMessage(conversationId: string, data: {
  accountId: string;
  message: string;
}): Promise<ZernioMessage> {
  return zernioFetch<ZernioMessage>(`/inbox/conversations/${conversationId}/send`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listComments(params?: {
  platform?: string;
  accountId?: string;
  page?: number;
  limit?: number;
}): Promise<{ comments: ZernioComment[]; pagination: Record<string, unknown> }> {
  const query = new URLSearchParams();
  if (params?.platform) query.set("platform", params.platform);
  if (params?.accountId) query.set("accountId", params.accountId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return zernioFetch(`/inbox/comments${qs ? `?${qs}` : ""}`);
}

export async function getPostComments(postId: string): Promise<{ comments: ZernioComment[] }> {
  return zernioFetch(`/inbox/posts/${postId}/comments`);
}

export async function replyToComment(postId: string, data: {
  accountId: string;
  message: string;
  commentId?: string;
}): Promise<ZernioComment> {
  return zernioFetch<ZernioComment>(`/inbox/posts/${postId}/reply`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listReviews(params?: {
  platform?: string;
  accountId?: string;
  page?: number;
  limit?: number;
}): Promise<{ reviews: ZernioReview[]; pagination: Record<string, unknown> }> {
  const query = new URLSearchParams();
  if (params?.platform) query.set("platform", params.platform);
  if (params?.accountId) query.set("accountId", params.accountId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return zernioFetch(`/inbox/reviews${qs ? `?${qs}` : ""}`);
}

export async function replyToReview(reviewId: string, data: {
  accountId: string;
  message: string;
}): Promise<ZernioReview> {
  return zernioFetch<ZernioReview>(`/inbox/reviews/${reviewId}/reply`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function listContacts(params?: {
  profileId?: string;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}): Promise<{ contacts: ZernioContact[]; pagination: Record<string, unknown> }> {
  const query = new URLSearchParams();
  if (params?.profileId) query.set("profileId", params.profileId);
  if (params?.search) query.set("search", params.search);
  if (params?.tag) query.set("tag", params.tag);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return zernioFetch(`/contacts${qs ? `?${qs}` : ""}`);
}

export async function createContact(data: {
  profileId: string;
  name: string;
  accountId?: string;
  platform?: string;
  platformIdentifier?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}): Promise<ZernioContact> {
  return zernioFetch<ZernioContact>("/contacts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getContact(contactId: string): Promise<ZernioContact> {
  return zernioFetch<ZernioContact>(`/contacts/${contactId}`);
}

export async function updateContact(contactId: string, data: Record<string, unknown>): Promise<ZernioContact> {
  return zernioFetch<ZernioContact>(`/contacts/${contactId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteContact(contactId: string): Promise<void> {
  await zernioFetch(`/contacts/${contactId}`, { method: "DELETE" });
}

export async function bulkCreateContacts(data: {
  profileId: string;
  accountId: string;
  platform: string;
  contacts: Array<{ name: string; platformIdentifier: string }>;
}): Promise<{ created: number; errors: unknown[] }> {
  return zernioFetch("/contacts/bulk-create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Broadcasts ──────────────────────────────────────────────────────────────

export async function listBroadcasts(params?: {
  profileId?: string;
  page?: number;
  limit?: number;
}): Promise<{ broadcasts: ZernioBroadcast[]; pagination: Record<string, unknown> }> {
  const query = new URLSearchParams();
  if (params?.profileId) query.set("profileId", params.profileId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return zernioFetch(`/broadcasts${qs ? `?${qs}` : ""}`);
}

export async function createBroadcast(data: {
  profileId: string;
  accountId: string;
  platform: string;
  name: string;
  message: string;
  templateName?: string;
}): Promise<ZernioBroadcast> {
  return zernioFetch<ZernioBroadcast>("/broadcasts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendBroadcast(broadcastId: string): Promise<ZernioBroadcast> {
  return zernioFetch<ZernioBroadcast>(`/broadcasts/${broadcastId}/send`, { method: "POST" });
}

export async function scheduleBroadcast(broadcastId: string, scheduledAt: string): Promise<ZernioBroadcast> {
  return zernioFetch<ZernioBroadcast>(`/broadcasts/${broadcastId}/schedule`, {
    method: "POST",
    body: JSON.stringify({ scheduledAt }),
  });
}

export async function addBroadcastRecipients(broadcastId: string, data: {
  contactIds?: string[];
  useSegment?: boolean;
}): Promise<Record<string, unknown>> {
  return zernioFetch(`/broadcasts/${broadcastId}/add-recipients`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Sequences ───────────────────────────────────────────────────────────────

export async function listSequences(profileId?: string): Promise<{ sequences: ZernioSequence[] }> {
  const query = profileId ? `?profileId=${profileId}` : "";
  return zernioFetch(`/sequences${query}`);
}

export async function createSequence(data: {
  profileId: string;
  accountId: string;
  platform: string;
  name: string;
  steps: Array<{ order: number; delayMinutes: number; message: { text: string } }>;
}): Promise<ZernioSequence> {
  return zernioFetch<ZernioSequence>("/sequences", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function activateSequence(sequenceId: string): Promise<ZernioSequence> {
  return zernioFetch<ZernioSequence>(`/sequences/${sequenceId}/activate`, { method: "POST" });
}

export async function enrollInSequence(sequenceId: string, contactIds: string[]): Promise<Record<string, unknown>> {
  return zernioFetch(`/sequences/${sequenceId}/enroll`, {
    method: "POST",
    body: JSON.stringify({ contactIds }),
  });
}

// ─── Automations ─────────────────────────────────────────────────────────────

export async function listAutomations(params?: {
  profileId?: string;
  page?: number;
  limit?: number;
}): Promise<{ automations: ZernioAutomation[]; pagination: Record<string, unknown> }> {
  const query = new URLSearchParams();
  if (params?.profileId) query.set("profileId", params.profileId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return zernioFetch(`/automations${qs ? `?${qs}` : ""}`);
}

export async function createAutomation(data: {
  profileId: string;
  accountId: string;
  platformPostId: string;
  name: string;
  keywords?: string[];
  dmMessage: string;
  commentReply?: string;
}): Promise<ZernioAutomation> {
  return zernioFetch<ZernioAutomation>("/automations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAutomation(automationId: string, data: Record<string, unknown>): Promise<ZernioAutomation> {
  return zernioFetch<ZernioAutomation>(`/automations/${automationId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getPostAnalytics(params?: {
  profileId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ analytics: ZernioAnalyticsPost[] }> {
  const query = new URLSearchParams();
  if (params?.profileId) query.set("profileId", params.profileId);
  if (params?.accountId) query.set("accountId", params.accountId);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  const qs = query.toString();
  return zernioFetch(`/analytics/posts${qs ? `?${qs}` : ""}`);
}

export async function getDailyAnalytics(params?: {
  profileId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ analytics: ZernioAnalyticsDaily[] }> {
  const query = new URLSearchParams();
  if (params?.profileId) query.set("profileId", params.profileId);
  if (params?.accountId) query.set("accountId", params.accountId);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  const qs = query.toString();
  return zernioFetch(`/analytics/daily${qs ? `?${qs}` : ""}`);
}

export async function getBestTimes(profileId?: string, accountId?: string): Promise<{ bestTimes: ZernioBestTime[] }> {
  const query = new URLSearchParams();
  if (profileId) query.set("profileId", profileId);
  if (accountId) query.set("accountId", accountId);
  const qs = query.toString();
  return zernioFetch(`/analytics/best-time${qs ? `?${qs}` : ""}`);
}

// ─── Media Upload ────────────────────────────────────────────────────────────

export interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  type: string;
}

export async function presignMedia(filename: string, contentType: string): Promise<PresignResult> {
  return zernioFetch<PresignResult>("/media/presign", {
    method: "POST",
    body: JSON.stringify({ filename, contentType }),
  });
}

// ─── Usage Stats ─────────────────────────────────────────────────────────────

export async function getUsageStats(): Promise<ZernioUsageStats> {
  return zernioFetch<ZernioUsageStats>("/usage-stats");
}

// ─── Platform mapping ────────────────────────────────────────────────────────

/** Maps our internal platform names to Zernio platform identifiers */
export const PLATFORM_TO_ZERNIO: Record<string, string> = {
  twitter: "twitter",
  instagram: "instagram",
  facebook: "facebook",
  youtube: "youtube",
  linkedin: "linkedin",
  threads: "threads",
  tiktok: "tiktok",
  pinterest: "pinterest",
  reddit: "reddit",
  bluesky: "bluesky",
  whatsapp: "whatsapp",
  telegram: "telegram",
  discord: "discord",
  snapchat: "snapchat",
  gbp: "googlebusiness",
};

/** All platforms Zernio supports */
export const ZERNIO_PLATFORMS = Object.keys(PLATFORM_TO_ZERNIO);