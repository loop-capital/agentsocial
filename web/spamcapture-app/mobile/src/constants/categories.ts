/**
 * Categories Constants
 * Spam report categories
 */

export const CATEGORIES = [
  { id: 'spam', label: 'Spam', icon: 'mail' as const },
  { id: 'scam', label: 'Scam', icon: 'warning' as const },
  { id: 'phishing', label: 'Phishing', icon: 'fish' as const },
  { id: 'robocall', label: 'Robocall', icon: 'call' as const },
  { id: 'telemarketing', label: 'Telemarketing', icon: 'megaphone' as const },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' as const },
];

export type CategoryId = typeof CATEGORIES[number]['id'];
