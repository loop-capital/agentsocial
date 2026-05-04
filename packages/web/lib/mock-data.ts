"use client";

// ─── Mock Data for AgentSocial Buffer-Style Dashboard ───────────────

export interface MockChannel {
  id: string;
  platform: string;
  name: string;
  followers: number;
  status: "connected" | "disconnected";
}

export interface MockEngagement {
  likes: number;
  comments: number;
  shares: number;
  impressions?: number;
}

export interface MockPost {
  id: string;
  content: string;
  status: "published" | "scheduled" | "draft" | "failed";
  platforms: string[];
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  engagement?: MockEngagement | null;
  mediaThumbnail?: string;
}

export interface MockAnalyticsDataPoint {
  date: string;
  impressions: number;
  engagements: number;
}

// ─── Channels ───────────────────────────────────────────────────────
export const MOCK_CHANNELS: MockChannel[] = [
  { id: "ch1", platform: "instagram", name: "@che.lace.beauty", followers: 2847, status: "connected" },
  { id: "ch2", platform: "twitter", name: "@che_lace", followers: 1523, status: "connected" },
  { id: "ch3", platform: "facebook", name: "Che Lace Beauty", followers: 4231, status: "connected" },
  { id: "ch4", platform: "linkedin", name: "Che Lace Inc.", followers: 892, status: "connected" },
  { id: "ch5", platform: "tiktok", name: "@chelace", followers: 9204, status: "connected" },
  { id: "ch6", platform: "pinterest", name: "chelace", followers: 1102, status: "connected" },
  { id: "ch7", platform: "youtube", name: "Che Lace Beauty", followers: 634, status: "connected" },
  { id: "ch8", platform: "threads", name: "@chelace", followers: 1103, status: "connected" },
];

// ─── Posts ─────────────────────────────────────────────────────────
export const MOCK_POSTS: MockPost[] = [
  {
    id: "p1",
    content: "💫 NEW ARRIVAL: Our Signature Lace Front Collection just dropped! Featuring heat-resistant fibers and a seamless hairline designed for all-day confidence. Swipe through to see the styles — which one is your favorite? #wigs #lacefront #hairbeauty",
    status: "published",
    platforms: ["instagram", "tiktok"],
    publishedAt: "2026-04-23T14:30:00Z",
    createdAt: "2026-04-22T10:00:00Z",
    engagement: { likes: 1247, comments: 89, shares: 42, impressions: 18420 },
    mediaThumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  },
  {
    id: "p2",
    content: "Behind every great style is a talented stylist. Our team at Pleij Salon specializes in wig customization, coloring, and styling. Book your consultation today and let us bring your vision to life. Link in bio! 💇‍♀️ #pleijsalon #wigs #hairgoals",
    status: "published",
    platforms: ["facebook", "instagram"],
    publishedAt: "2026-04-22T10:00:00Z",
    createdAt: "2026-04-21T08:00:00Z",
    engagement: { likes: 834, comments: 67, shares: 28, impressions: 12340 },
    mediaThumbnail: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
  },
  {
    id: "p3",
    content: "✨ COLOR CRUSH: Caramel Balayage is having a MOMENT this season. Our colorists are certified in the latest techniques to give you that sun-kissed, effortless look. DM us to book your color appointment! #haircolor #balayage #pleijsalon",
    status: "published",
    platforms: ["instagram", "twitter", "pinterest"],
    publishedAt: "2026-04-21T15:00:00Z",
    createdAt: "2026-04-20T09:30:00Z",
    engagement: { likes: 2103, comments: 134, shares: 56, impressions: 28100 },
    mediaThumbnail: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
  },
  {
    id: "p4",
    content: "📅 Mark your calendars! We're launching our Spring Wig Collection on May 5th. Early access for email subscribers — sign up at chelace.com to get 48-hour access before the public drop. Limited quantities available.",
    status: "scheduled",
    platforms: ["instagram", "facebook", "twitter"],
    scheduledAt: "2026-04-28T09:00:00Z",
    createdAt: "2026-04-23T11:00:00Z",
    engagement: null,
  },
  {
    id: "p5",
    content: "🔥 SIZZLE REEL coming this Friday! Get a behind-the-scenes look at how our lace fronts are hand-tied for that ultra-natural look. You won't want to miss this peek into the craft. #behindthescenes #lacefrontwigs",
    status: "scheduled",
    platforms: ["tiktok", "instagram"],
    scheduledAt: "2026-04-30T16:00:00Z",
    createdAt: "2026-04-23T14:00:00Z",
    engagement: null,
    mediaThumbnail: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=400&h=300&fit=crop",
  },
  {
    id: "p6",
    content: "Your lace front game is about to go to the NEXT level. Our comprehensive guide covers everything from customization to maintenance. Link in bio! 📖 #wigcare #lacefront #hairtutorial",
    status: "scheduled",
    platforms: ["pinterest", "linkedin", "facebook"],
    scheduledAt: "2026-05-02T12:00:00Z",
    createdAt: "2026-04-24T08:00:00Z",
    engagement: null,
  },
  {
    id: "p7",
    content: "Join us for a LIVE Q&A with our lead stylist Tiché this Thursday at 6PM EST. Ask us anything about wig customization, styling tips, and what's coming next for Che Lace. Drop your questions below! 👇",
    status: "draft",
    platforms: ["instagram", "facebook"],
    createdAt: "2026-04-24T07:00:00Z",
    engagement: null,
  },
  {
    id: "p8",
    content: "Introducing our NEW Ombre Collection — from natural roots to vibrant tips, these wigs blend seamlessly with any look. Pre-orders start Monday. DM for exclusive subscriber pricing. 💜",
    status: "draft",
    platforms: ["instagram", "twitter"],
    createdAt: "2026-04-24T06:00:00Z",
    engagement: null,
  },
  {
    id: "p9",
    content: "Client showcase 💕: Before and after her transformation with our Honey Blonde lace front. Our colorist matched her natural hair perfectly — zero visible lace, maximum slay. Book your consult via the link!",
    status: "published",
    platforms: ["instagram", "facebook", "tiktok"],
    publishedAt: "2026-04-19T12:00:00Z",
    createdAt: "2026-04-18T10:00:00Z",
    engagement: { likes: 3421, comments: 203, shares: 87, impressions: 42300 },
    mediaThumbnail: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop",
  },
  {
    id: "p10",
    content: "Maintenance Monday 💅: How often should you wash your lace front? The answer might surprise you. Our styling team shares the definitive guide to keeping your wig looking fresh for months.",
    status: "published",
    platforms: ["instagram", "pinterest"],
    publishedAt: "2026-04-20T09:00:00Z",
    createdAt: "2026-04-19T16:00:00Z",
    engagement: { likes: 876, comments: 45, shares: 23, impressions: 9840 },
  },
  {
    id: "p11",
    content: "Something went wrong with our scheduled post about the holiday sale. Our team is looking into it — the promo is still on, head to chelace.com to shop now!",
    status: "failed",
    platforms: ["facebook"],
    createdAt: "2026-04-23T08:00:00Z",
    engagement: null,
  },
  {
    id: "p12",
    content: "Pro tip: always store your wigs on a mannequin head to maintain their shape and style. Shop our collection of satin-lined mannequin heads in the online store — ships free on orders over $75! 💕",
    status: "published",
    platforms: ["instagram", "facebook", "pinterest"],
    publishedAt: "2026-04-18T14:00:00Z",
    createdAt: "2026-04-17T11:00:00Z",
    engagement: { likes: 1098, comments: 72, shares: 31, impressions: 15600 },
    mediaThumbnail: "https://images.unsplash.com/photo-1527799820-19571f56865d?w=400&h=300&fit=crop",
  },
];

// ─── Analytics Time Series ─────────────────────────────────────────
function generateTimeSeriesData(days: number): MockAnalyticsDataPoint[] {
  const data: MockAnalyticsDataPoint[] = [];
  const now = new Date("2026-04-24");

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseImpressions = isWeekend ? 1800 : 1200;
    const baseEngagements = isWeekend ? 140 : 95;
    const randomVariance = () => Math.floor(Math.random() * 600) - 300;

    data.push({
      date: d.toISOString().split("T")[0],
      impressions: Math.max(200, baseImpressions + randomVariance()),
      engagements: Math.max(20, baseEngagements + Math.floor(randomVariance() / 3)),
    });
  }
  return data;
}

export const MOCK_TIME_SERIES = generateTimeSeriesData(30);

// ─── Dashboard Stats ──────────────────────────────────────────────
export const MOCK_DASHBOARD_STATS = {
  totalPosts: 24,
  postsChange: "+3 this week",
  impressions: "48.2K",
  impressionsChange: "+15.3%",
  engagements: "3,841",
  engagementsChange: "+22.1%",
  followers: "19,513",
  followersChange: "+412",
};

// ─── Platform Breakdown ────────────────────────────────────────────
export interface MockPlatformStat {
  platform: string;
  impressions: number;
  engagements: number;
  followers: number;
  color: string;
}

export const MOCK_PLATFORM_STATS: MockPlatformStat[] = [
  { platform: "instagram", impressions: 22100, engagements: 1842, followers: 2847, color: "#E4405F" },
  { platform: "tiktok", impressions: 14200, engagements: 1204, followers: 9204, color: "#000000" },
  { platform: "facebook", impressions: 8300, engagements: 498, followers: 4231, color: "#1877F2" },
  { platform: "twitter", impressions: 4200, engagements: 312, followers: 1523, color: "#1DA1F2" },
  { platform: "pinterest", impressions: 1800, engagements: 156, followers: 1102, color: "#BD081C" },
  { platform: "linkedin", impressions: 1100, engagements: 87, followers: 892, color: "#0A66C2" },
];

// ─── Upcoming Scheduled Posts ─────────────────────────────────────
export const MOCK_UPCOMING_POSTS = MOCK_POSTS.filter((p) => p.status === "scheduled");

// ─── Top Posts ────────────────────────────────────────────────────
export const MOCK_TOP_POSTS = [...MOCK_POSTS]
  .filter((p) => p.engagement?.impressions)
  .sort((a, b) => (b.engagement?.impressions ?? 0) - (a.engagement?.impressions ?? 0))
  .slice(0, 5);

// ─── Calendar Events ─────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  postId: string;
  date: string;
  platform: string;
  content: string;
  status: string;
}

function generateCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const platforms = ["instagram", "facebook", "twitter", "tiktok", "pinterest", "linkedin"];
  const contents = [
    "Spring Collection Launch 🚀",
    "Color Tutorial: Honey Blonde 💛",
    "Client Transformation Showcase ✨",
    "Maintenance Monday 💅",
    "Behind the Scenes 🎬",
    "Pro Tip Tuesday 💡",
  ];

  for (let i = 0; i < 20; i++) {
    const date = new Date("2026-04-24");
    date.setDate(date.getDate() - 5 + Math.floor(Math.random() * 25));
    const dateStr = date.toISOString().split("T")[0];
    const status = Math.random() > 0.4 ? "published" : "scheduled";

    events.push({
      id: `ev${i}`,
      postId: `cal${i}`,
      date: dateStr,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      content: contents[Math.floor(Math.random() * contents.length)],
      status,
    });
  }
  return events;
}

export const MOCK_CALENDAR_EVENTS = generateCalendarEvents();

// ─── Comments (Inbox) ────────────────────────────────────────────
export interface CommentData {
  id: string;
  postId: string;
  platform: string;
  author_name: string;
  author_username: string;
  author_avatar_url?: string;
  author_is_verified?: boolean;
  author_follower_count?: number;
  content: string;
  status: "unread" | "read" | "replied" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  sentiment: "positive" | "neutral" | "negative" | "spam";
  received_at: string;
  createdAt: string;
}

export const MOCK_COMMENTS: CommentData[] = [
  { id: "c1", postId: "p1", platform: "instagram", author_name: "Beauty Lover", author_username: "beautylover23", author_avatar_url: "https://i.pravatar.cc/40?img=1", author_is_verified: false, author_follower_count: 342, content: "OMG I need the caramel one! 😍", status: "unread", priority: "low", sentiment: "positive", received_at: "2026-04-24T10:30:00Z", createdAt: "2026-04-24T10:30:00Z" },
  { id: "c2", postId: "p3", platform: "instagram", author_name: "Hair Queen J", author_username: "hairqueen_j", author_avatar_url: "https://i.pravatar.cc/40?img=2", author_is_verified: true, author_follower_count: 12400, content: "Can you do custom colors?", status: "unread", priority: "medium", sentiment: "neutral", received_at: "2026-04-24T09:15:00Z", createdAt: "2026-04-24T09:15:00Z" },
  { id: "c3", postId: "p9", platform: "facebook", author_name: "Sarah M.", author_username: "sarah.m", author_avatar_url: "https://i.pravatar.cc/40?img=3", content: "How much for a consultation?", status: "read", priority: "high", sentiment: "positive", received_at: "2026-04-23T16:45:00Z", createdAt: "2026-04-23T16:45:00Z" },
  { id: "c4", postId: "p2", platform: "instagram", author_name: "Naturalista", author_username: "naturalista", author_avatar_url: "https://i.pravatar.cc/40?img=4", content: "Do you ship internationally?", status: "read", priority: "medium", sentiment: "neutral", received_at: "2026-04-23T14:20:00Z", createdAt: "2026-04-23T14:20:00Z" },
  { id: "c5", postId: "p1", platform: "tiktok", author_name: "Wig Snatcher", author_username: "wigsnatcher", author_is_verified: true, author_follower_count: 89000, content: "Yaaas dropping my coins rn 🔥", status: "replied", priority: "low", sentiment: "positive", received_at: "2026-04-23T11:00:00Z", createdAt: "2026-04-23T11:00:00Z" },
  { id: "c6", postId: "p10", platform: "instagram", author_name: "Skeptical Girl", author_username: "skepticalgirl", content: "These look fake in person", status: "unread", priority: "high", sentiment: "negative", received_at: "2026-04-22T08:30:00Z", createdAt: "2026-04-22T08:30:00Z" },
];
