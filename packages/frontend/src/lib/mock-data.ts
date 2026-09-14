"use client";

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

export interface CalendarEvent {
  id: string;
  content: string;
  platform: string;
  date: string;
  status: "scheduled" | "published";
}

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

export const MOCK_POSTS: MockPost[] = [
  {
    id: "p1",
    content: "💫 NEW ARRIVAL: Our Signature Lace Front Collection just dropped! Featuring heat-resistant fibers and a seamless hairline designed for all-day confidence. #wigs #lacefront #hairbeauty",
    status: "published",
    platforms: ["instagram", "tiktok"],
    publishedAt: "2026-04-23T14:30:00Z",
    createdAt: "2026-04-22T10:00:00Z",
    engagement: { likes: 1247, comments: 89, shares: 42, impressions: 18420 },
    mediaThumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  },
  {
    id: "p2",
    content: "Behind every great style is a talented stylist. Our team at Pleij Salon specializes in wig customization, coloring, and styling. Book your consultation today!",
    status: "published",
    platforms: ["facebook", "instagram"],
    publishedAt: "2026-04-22T10:00:00Z",
    createdAt: "2026-04-21T08:00:00Z",
    engagement: { likes: 834, comments: 67, shares: 28, impressions: 12340 },
    mediaThumbnail: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
  },
  {
    id: "p3",
    content: "✨ COLOR CRUSH: Caramel Balayage is having a MOMENT this season. Our colorists are certified in the latest techniques to give you that sun-kissed, effortless look.",
    status: "published",
    platforms: ["instagram", "twitter", "pinterest"],
    publishedAt: "2026-04-21T15:00:00Z",
    createdAt: "2026-04-20T09:30:00Z",
    engagement: { likes: 2103, comments: 134, shares: 56, impressions: 28100 },
    mediaThumbnail: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
  },
  {
    id: "p4",
    content: "🎉 GIVEAWAY ALERT! We're celebrating 5K followers with a FREE wig of your choice. Enter by following us and tagging 2 friends. Winners announced Friday!",
    status: "scheduled",
    platforms: ["instagram", "facebook", "twitter"],
    scheduledAt: "2026-04-27T10:00:00Z",
    createdAt: "2026-04-23T12:00:00Z",
    engagement: null,
    mediaThumbnail: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop",
  },
  {
    id: "p5",
    content: "Our stylists share their top 5 wig care tips — save this post for later! 1. Use a wide-tooth comb 2. Wash with sulfate-free products 3. Store on a wig stand...",
    status: "scheduled",
    platforms: ["instagram", "pinterest"],
    scheduledAt: "2026-04-29T14:00:00Z",
    createdAt: "2026-04-23T15:00:00Z",
    engagement: null,
    mediaThumbnail: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=300&fit=crop",
  },
  {
    id: "p6",
    content: "Customer Spotlight: 'I've never felt more confident!' — Sarah M. Thank you for sharing your beautiful photos with us. You look stunning! 💕",
    status: "draft",
    platforms: ["instagram", "facebook"],
    scheduledAt: null,
    createdAt: "2026-04-23T16:00:00Z",
    engagement: null,
    mediaThumbnail: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop",
  },
  {
    id: "p7",
    content: "Wig Maintenance 101: How to extend the life of your lace front wig",
    status: "failed",
    platforms: ["instagram"],
    scheduledAt: "2026-04-20T09:00:00Z",
    createdAt: "2026-04-19T11:00:00Z",
    engagement: null,
  },
];

export const MOCK_TIME_SERIES: MockAnalyticsDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date("2026-03-25");
  date.setDate(date.getDate() + i);
  return {
    date: date.toISOString().split("T")[0],
    impressions: 12000 + Math.floor(Math.random() * 8000) + i * 150,
    engagements: 800 + Math.floor(Math.random() * 500) + i * 20,
  };
});

export const MOCK_PLATFORM_STATS = [
  { platform: "instagram", impressions: 48200, engagements: 3840, followers: 2847, color: "#E4405F" },
  { platform: "tiktok", impressions: 73100, engagements: 12450, followers: 9204, color: "#000000" },
  { platform: "facebook", impressions: 29500, engagements: 1820, followers: 4231, color: "#1877F2" },
  { platform: "twitter", impressions: 18200, engagements: 960, followers: 1523, color: "#1DA1F2" },
  { platform: "pinterest", impressions: 12800, engagements: 890, followers: 1102, color: "#BD081C" },
  { platform: "linkedin", impressions: 8400, engagements: 420, followers: 892, color: "#0A66C2" },
  { platform: "youtube", impressions: 15600, engagements: 1340, followers: 634, color: "#FF0000" },
  { platform: "threads", impressions: 9200, engagements: 710, followers: 1103, color: "#000000" },
];

export const MOCK_TOP_POSTS = MOCK_POSTS.filter((p) => p.status === "published").map((p) => ({
  ...p,
  engagement: p.engagement ?? { likes: Math.floor(Math.random() * 2000), comments: Math.floor(Math.random() * 200), shares: Math.floor(Math.random() * 100), impressions: Math.floor(Math.random() * 30000) },
}));

export const MOCK_UPCOMING_POSTS = MOCK_POSTS.filter((p) => p.status === "scheduled");

export const MOCK_DASHBOARD_STATS = {
  totalPosts: 142,
  postsChange: "+12 this month",
  impressions: "208.4K",
  impressionsChange: "+15.3% vs last month",
  engagements: "20.8K",
  engagementsChange: "+22.1% vs last month",
  followers: "21.5K",
  followersChange: "+412 this month",
};

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "ev1", content: "Spring collection launch post", platform: "instagram", date: "2026-04-27", status: "scheduled" },
  { id: "ev2", content: "Stylist testimonial video", platform: "tiktok", date: "2026-04-28", status: "scheduled" },
  { id: "ev3", content: "Customer spotlight carousel", platform: "facebook", date: "2026-04-29", status: "scheduled" },
  { id: "ev4", content: "Behind the scenes reel", platform: "instagram", date: "2026-05-01", status: "scheduled" },
  { id: "ev5", content: "Weekly tip #12", platform: "pinterest", date: "2026-05-02", status: "scheduled" },
  { id: "ev6", content: "New arrivals announcement", platform: "instagram", date: "2026-05-03", status: "scheduled" },
];
