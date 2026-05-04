/**
 * Shared Constants for AgentSocial
 * Application-wide constants and configuration values
 */
export const API_VERSIONS = {
    facebook: 'v18.0',
    // twitter: '2.0',
    // instagram: 'v18.0',
    // linkedin: 'v1.0'
};
export const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'linkedin'];
export const TASK_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'failed'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const AGENT_STATUSES = ['active', 'inactive', 'suspended'];
export const DEFAULT_PAGINATION = {
    limit: 10,
    offset: 0
};
export const FACEBOOK_PERMISSIONS = [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'instagram_basic',
    'instagram_manage_insights',
    'instagram_content_publish'
];
export const MESSAGE_TEMPLATES = {
    WELCOME: 'Welcome to AgentSocial! Your agent has been successfully registered.',
    TASK_ASSIGNED: 'You have been assigned a new task: {taskTitle}',
    TASK_COMPLETED: 'Task completed: {taskTitle}',
    POST_PUBLISHED: 'Your post has been published to {platform}',
    CONNECTION_FAILED: 'Failed to connect to {platform}. Please check your credentials.'
};
