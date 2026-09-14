// Adobe Stock API Types (aligned with official docs at developer.adobe.com/stock)

export interface StockConfig {
  apiKey: string;          // x-api-key from Adobe Developer Console
  accessToken?: string;    // Bearer token for licensed operations
  product?: string;        // X-Product header, defaults to "AgentSocial/1.0"
  base?: string;           // API base, defaults to https://stock.adobe.io/Rest
}

// --- Search ---

export interface StockSearchRequest {
  query: string;
  limit?: number;          // default 25, max 100
  offset?: number;         // default 0
  locale?: string;         // e.g. "en_US"
  filters?: {
    orientation?: 'horizontal' | 'vertical' | 'square';
    content_type?: ('photo' | 'illustration' | 'vector' | 'video')[];
    premium?: boolean;
    safe_search?: boolean;
    colors?: string[];     // hex color codes
    age?: '1d' | '7d' | '30d' | '3m' | '6m' | '1y';
    price?: 'free' | 'low' | 'medium' | 'high';
    offensive?: boolean;   // exclude offensive content
  };
  order?: 'relevance' | 'creation' | 'popularity' | 'nb_downloads' | 'undetermined';
  sort?: 'asc' | 'desc';
}

export interface StockSearchResponse {
  files: StockAsset[];
  nb_results: number;
  current_offset: number;
  limit: number;
}

export interface StockAsset {
  id: number;
  title: string;
  creator_name: string;
  creator_id: string;
  thumbnail_url: string;
  thumbnail_html_tag: string;
  preview_url: string;
  preview_html_tag: string;
  url: string;
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical' | 'square';
  media_type_id: number;
  category: { id: number; name: string };
  keywords?: string[];
  premium_level_id: number;
  is_premium: boolean;
  stock_id: number;
  comp_url: string;
  details_url: string;
  licensing?: {
    standard: { url: string; available: boolean };
    extended: { url: string; available: boolean };
  };
}

// --- Licensing ---

export interface StockLicenseRequest {
  contentId: number;
  license: 'Standard' | 'Extended';
  memberGuid?: string;
}

export interface StockLicenseResponse {
  purchase_id: string;
  download_url: string;
  content_id: number;
  member_guid: string;
  purchase_state: 'available' | 'processing' | 'blocked';
  purchase_date: string;
  license: string;
}

// --- Member Profile (for licensing eligibility) ---

export interface StockMemberProfile {
  member: {
    member_id: string;
    stock_id: number;
    full_license: boolean;
    license_owner: boolean;
    can_license: boolean;
    has_purchase_history: boolean;
  };
  entitlement: {
    has_entitlement: boolean;
    license_type: string;
    full_license: boolean;
    remaining_credits?: number;
  };
}

// --- Category Tree ---

export interface StockCategory {
  id: number;
  name: string;
  categories?: StockCategory[];
}