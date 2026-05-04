// Platform connector barrel export — use individual exports for type safety
export { publishToTwitter, getTwitterOAuthUrl, exchangeTwitterCode, refreshTwitterToken, fetchTwitterProfile, getTwitterMetrics, twitterOAuthConfig } from "./twitter.js";
export { publishToLinkedIn, getLinkedInOAuthUrl, exchangeLinkedInCode, refreshLinkedInToken, fetchLinkedInProfile, getLinkedInMetrics, linkedinOAuthConfig } from "./linkedin.js";
export { generatePKCE } from "./pkce.js";
export { publishToInstagram, getInstagramOAuthUrl, exchangeInstagramCode, refreshInstagramToken, getInstagramMetrics, instagramOAuthConfig, exchangeInstagramLongLivedToken, getInstagramFacebookPages, getInstagramBusinessAccountFromPage } from "./instagram.js";
export { publishToFacebook, getFacebookOAuthUrl, exchangeFacebookCode, getFacebookPages, getInstagramBusinessAccount, exchangeLongLivedToken, facebookOAuthConfig } from "./facebook.js";
export { publishToTikTok, getTikTokOAuthUrl, exchangeTikTokCode, tiktokOAuthConfig } from "./tiktok.js";
export { encryptToken, decryptToken, maskToken } from "./token-store.js";

export type { PublishResult, TwitterConfig, PublishOptions as TwitterPublishOptions, TwitterProfile } from "./twitter.js";
export type { PublishResult as LinkedInPublishResult, LinkedInConfig, PublishOptions as LinkedInPublishOptions, LinkedInProfile } from "./linkedin.js";
export type { PublishResult as InstagramPublishResult, InstagramConfig, PublishOptions as InstagramPublishOptions, InstagramBusinessAccount } from "./instagram.js";
export type { PublishResult as FacebookPublishResult, FacebookConfig, PublishOptions as FacebookPublishOptions, FacebookPage } from "./facebook.js";
export type { PublishResult as TikTokPublishResult, TikTokConfig, PublishOptions as TikTokPublishOptions } from "./tiktok.js";