/**
 * Shared Constants for AgentSocial
 * Application-wide constants and configuration values
 */

export const API_VERSIONS = {
  facebook: 'v18.0',
  // twitter: '2.0',
  // instagram: 'v18.0',
  // linkedin: 'v1.0'
} as const;

export const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

export const TASK_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'failed'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

export const AGENT_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type AgentStatus = typeof AGENT_STATUSES[number];

export const DEFAULT_PAGINATION = {
  limit: 10,
  offset: 0
} as const;

export const FACEBOOK_PERMISSIONS = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'instagram_basic',
  'instagram_manage_insights',
  'instagram_content_publish'
] as const;

export const MESSAGE_TEMPLATES = {
  WELCOME: 'Welcome to AgentSocial! Your agent has been successfully registered.',
  TASK_ASSIGNED: 'You have been assigned a new task: {taskTitle}',
  TASK_COMPLETED: 'Task completed: {taskTitle}',
  POST_PUBLISHED: 'Your post has been published to {platform}',
  CONNECTION_FAILED: 'Failed to connect to {platform}. Please check your credentials.'
} as const;