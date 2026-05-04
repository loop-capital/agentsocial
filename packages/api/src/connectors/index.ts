// Platform connector barrel export — use individual exports for type safety
export { publishToTwitter, getTwitterOAuthUrl, exchangeTwitterCode, refreshTwitterToken, getTwitterMetrics, twitterOAuthConfig } from "./twitter.js";
export { publishToLinkedIn, getLinkedInOAuthUrl, exchangeLinkedInCode, refreshLinkedInToken, getLinkedInMetrics, linkedinOAuthConfig } from "./linkedin.js";
export { publishToInstagram, getInstagramOAuthUrl, exchangeInstagramCode, refreshInstagramToken, getInstagramMetrics, instagramOAuthConfig } from "./instagram.js";
export { publishToFacebook, getFacebookOAuthUrl, exchangeFacebookCode, getFacebookPages, facebookOAuthConfig } from "./facebook.js";
export { publishToTikTok, getTikTokOAuthUrl, exchangeTikTokCode, tiktokOAuthConfig } from "./tiktok.js";

export type { PublishResult, TwitterConfig, PublishOptions as TwitterPublishOptions } from "./twitter.js";
export type { PublishResult as LinkedInPublishResult, LinkedInConfig, PublishOptions as LinkedInPublishOptions } from "./linkedin.js";
export type { PublishResult as InstagramPublishResult, InstagramConfig, PublishOptions as InstagramPublishOptions } from "./instagram.js";
export type { PublishResult as FacebookPublishResult, FacebookConfig, PublishOptions as FacebookPublishOptions } from "./facebook.js";
export type { PublishResult as TikTokPublishResult, TikTokConfig, PublishOptions as TikTokPublishOptions } from "./tiktok.js";