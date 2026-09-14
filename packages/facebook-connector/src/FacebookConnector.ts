/**
 * Facebook Connector for AgentSocial
 * Handles integration with Facebook Graph API for social media management
 */
import { SocialPlatform } from '@agentsocial/shared';

export interface FacebookCredentials {
  accessToken: string;
  appId: string;
  appSecret: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  category: string;
}

export interface FacebookPost {
  id: string;
  message: string;
  createdTime: string;
  updatedTime: string;
}

export interface FacebookInsights {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
}

export class FacebookConnector {
  private platform: SocialPlatform;
  private credentials: FacebookCredentials;
  private apiVersion: string = 'v18.0';
  private baseUrl: string;

  constructor(credentials: FacebookCredentials) {
    this.platform = SocialPlatform.FACEBOOK;
    this.credentials = credentials;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Validate Facebook credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?access_token=${this.credentials.accessToken}`
      );
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return (data as { data: { is_valid: boolean } }).data.is_valid;
    } catch {
      return false;
    }
  }

  /**
   * Get Facebook pages associated with the access token
   */
  async getPages(): Promise<FacebookPage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/accounts?access_token=${this.credentials.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.statusText}`);
      }
      
      const data = await response.json();
      return (data as { data: Array<any> }).data.map((page: any) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to fetch Facebook pages: ${err.message}`);
      } else {
        throw new Error('Failed to fetch Facebook pages: Unknown error');
      }
    }
  }

  /**
   * Create a post on a Facebook page
   */
  async createPost(pageId: string, message: string): Promise<FacebookPost> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}/feed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            access_token: this.credentials.accessToken
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        id: (data as { id: string }).id,
        message: message,
        createdTime: new Date().toISOString(),
        updatedTime: new Date().toISOString()
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to create Facebook post: ${err.message}`);
      } else {
        throw new Error('Failed to create Facebook post: Unknown error');
      }
    }
  }

  /**
   * Get insights for a Facebook post
   */
  async getPostInsights(postId: string): Promise<FacebookInsights> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${postId}/insights?metric=post_impressions,post_reach,post_engaged_users,post_clicks&access_token=${this.credentials.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Initialize defaults
      let impressions = 0;
      let reach = 0;
      let engagement = 0;
      let clicks = 0;
      
      // Extract values from the response
      (data as { data: Array<any> }).data.forEach((metric: any) => {
        switch (metric.name) {
          case 'post_impressions':
            impressions = metric.values[0].value;
            break;
          case 'post_reach':
            reach = metric.values[0].value;
            break;
          case 'post_engaged_users':
            engagement = metric.values[0].value;
            break;
          case 'post_clicks':
            clicks = metric.values[0].value;
            break;
        }
      });
      
      return {
        impressions,
        reach,
        engagement,
        clicks
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to fetch Facebook post insights: ${err.message}`);
      } else {
        throw new Error('Failed to fetch Facebook post insights: Unknown error');
      }
    }
  }

  /**
   * Get posts from a Facebook page
   */
  async getPagePosts(pageId: string, limit: number = 10): Promise<FacebookPost[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}/posts?limit=${limit}&access_token=${this.credentials.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }
      
      const data = await response.json();
      return (data as { data: Array<any> }).data.map((post: any) => ({
        id: post.id,
        message: post.message || '',
        createdTime: post.created_time,
        updatedTime: post.updated_time || post.created_time
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to fetch Facebook page posts: ${err.message}`);
      } else {
        throw new Error('Failed to fetch Facebook page posts: Unknown error');
      }
    }
  }

  /**
   * Get platform name
   */
  getPlatform(): SocialPlatform {
    return this.platform;
  }
}