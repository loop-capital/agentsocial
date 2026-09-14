declare module '@agentsocial/shared' {
  export enum SocialPlatform {
    FACEBOOK = 'facebook',
    TWITTER = 'twitter',
    INSTAGRAM = 'instagram',
    LINKEDIN = 'linkedin'
  }
  
  export interface SocialPlatformBase {
    id: string;
    name: string;
    platform: SocialPlatform;
    createdAt: string;
    updatedAt: string;
  }
}