/**
 * Shared Constants for AgentSocial
 * Application-wide constants and configuration values
 */
export declare const API_VERSIONS: {
    readonly facebook: "v18.0";
};
export declare const SOCIAL_PLATFORMS: readonly ["facebook", "twitter", "instagram", "linkedin"];
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];
export declare const TASK_STATUSES: readonly ["pending", "assigned", "in_progress", "completed", "failed"];
export type TaskStatus = typeof TASK_STATUSES[number];
export declare const TASK_PRIORITIES: readonly ["low", "medium", "high", "urgent"];
export type TaskPriority = typeof TASK_PRIORITIES[number];
export declare const AGENT_STATUSES: readonly ["active", "inactive", "suspended"];
export type AgentStatus = typeof AGENT_STATUSES[number];
export declare const DEFAULT_PAGINATION: {
    readonly limit: 10;
    readonly offset: 0;
};
export declare const FACEBOOK_PERMISSIONS: readonly ["pages_manage_posts", "pages_read_engagement", "pages_show_list", "instagram_basic", "instagram_manage_insights", "instagram_content_publish"];
export declare const MESSAGE_TEMPLATES: {
    readonly WELCOME: "Welcome to AgentSocial! Your agent has been successfully registered.";
    readonly TASK_ASSIGNED: "You have been assigned a new task: {taskTitle}";
    readonly TASK_COMPLETED: "Task completed: {taskTitle}";
    readonly POST_PUBLISHED: "Your post has been published to {platform}";
    readonly CONNECTION_FAILED: "Failed to connect to {platform}. Please check your credentials.";
};
//# sourceMappingURL=constants.d.ts.map