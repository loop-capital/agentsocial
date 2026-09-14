import {
  StockConfig,
  StockSearchRequest,
  StockSearchResponse,
  StockAsset,
  StockLicenseRequest,
  StockLicenseResponse,
  StockMemberProfile,
  StockCategory,
} from './types';

const STOCK_BASE = 'https://stock.adobe.io/Rest/Media/1';

export class StockClient {
  private apiKey: string;
  private accessToken?: string;
  private product: string;
  private base: string;

  constructor(config: StockConfig) {
    this.apiKey = config.apiKey;
    this.accessToken = config.accessToken;
    this.product = config.product || 'AgentSocial/1.0';
    this.base = config.base || STOCK_BASE;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'X-Product': this.product,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.base}${endpoint}`, {
      ...options,
      headers,
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(
        `Stock API Error (${response.status}): ${data.message || data.error?.message || JSON.stringify(data)}`
      );
    }

    return data as T;
  }

  // ── Search ────────────────────────────────────────────────────────

  /** Search Adobe Stock for assets. */
  async search(params: StockSearchRequest): Promise<StockSearchResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('search_parameters[words]', params.query);
    queryParams.append('search_parameters[limit]', String(params.limit || 25));
    queryParams.append('search_parameters[offset]', String(params.offset || 0));

    if (params.locale) {
      queryParams.append('search_parameters[locale]', params.locale);
    }

    if (params.order) {
      queryParams.append('search_parameters[order]', params.order);
    }

    if (params.sort) {
      queryParams.append('search_parameters[sort]', params.sort);
    }

    // Filters
    if (params.filters?.orientation) {
      queryParams.append(
        'search_parameters[orientation]',
        params.filters.orientation
      );
    }

    if (params.filters?.content_type) {
      for (const ct of params.filters.content_type) {
        if (ct === 'photo')
          queryParams.append('search_parameters[content_type:photo]', '1');
        if (ct === 'illustration')
          queryParams.append('search_parameters[content_type:illustration]', '1');
        if (ct === 'vector')
          queryParams.append('search_parameters[content_type:vector]', '1');
        if (ct === 'video')
          queryParams.append('search_parameters[content_type:video]', '1');
      }
    }

    if (params.filters?.premium !== undefined) {
      queryParams.append(
        'search_parameters[premium]',
        params.filters.premium ? '1' : '0'
      );
    }

    if (params.filters?.safe_search !== undefined) {
      queryParams.append(
        'search_parameters[safe_search]',
        params.filters.safe_search ? '1' : '0'
      );
    }

    if (params.filters?.offensive !== undefined) {
      queryParams.append(
        'search_parameters[offensive]',
        params.filters.offensive ? '1' : '0'
      );
    }

    if (params.filters?.colors) {
      for (const color of params.filters.colors) {
        queryParams.append('search_parameters[colors]', color);
      }
    }

    if (params.filters?.age) {
      queryParams.append('search_parameters[age]', params.filters.age);
    }

    return this.request<StockSearchResponse>(
      `/Search/Files?${queryParams.toString()}`
    );
  }

  // ── Asset Details ────────────────────────────────────────────────

  /** Get metadata for a single asset. */
  async getAsset(assetId: number): Promise<{ file: StockAsset }> {
    return this.request<{ file: StockAsset }>(`/Search/Files/${assetId}`);
  }

  /** Get metadata for multiple assets in bulk. */
  async getAssets(ids: number[]): Promise<{ files: StockAsset[] }> {
    return this.request<{ files: StockAsset[] }>(
      `/Files?ids=${ids.join(',')}`
    );
  }

  // ── Categories ────────────────────────────────────────────────────

  /** Get the category tree for browsing. */
  async getCategoryTree(
    locale?: string
  ): Promise<{ categories: StockCategory[] }> {
    const params = locale ? `?locale=${locale}` : '';
    return this.request<{ categories: StockCategory[] }>(
      `/Search/CategoryTree${params}`
    );
  }

  // ── Licensing ─────────────────────────────────────────────────────

  /** Get member profile and licensing eligibility. Requires auth token. */
  async getMemberProfile(
    contentId: number,
    license: 'Standard' | 'Extended' = 'Standard'
  ): Promise<StockMemberProfile> {
    if (!this.accessToken) {
      throw new Error('Authentication required for member profile');
    }

    return this.request<StockMemberProfile>(
      `/Libraries/1/Member/Profile?content_id=${contentId}&license=${license}`
    );
  }

  /** Get licensing status for an asset. Requires auth token. */
  async getLicenseStatus(
    contentId: number
  ): Promise<{ content_id: number; purchase_state: string }> {
    if (!this.accessToken) {
      throw new Error('Authentication required for license status');
    }

    return this.request(
      `/Libraries/1/Content/Info?content_id=${contentId}`
    );
  }

  /** License an asset. Requires auth token. */
  async licenseAsset(
    request: StockLicenseRequest
  ): Promise<StockLicenseResponse> {
    if (!this.accessToken) {
      throw new Error('Authentication required for licensing');
    }

    return this.request<StockLicenseResponse>('/Libraries/1/Content/License', {
      method: 'POST',
      body: JSON.stringify({
        content_id: request.contentId,
        license: request.license,
        ...(request.memberGuid && { member_guid: request.memberGuid }),
      }),
    });
  }

  /** Download a licensed asset. Requires auth token. */
  async downloadAsset(contentId: number): Promise<ArrayBuffer> {
    if (!this.accessToken) {
      throw new Error('Authentication required for download');
    }

    const response = await fetch(
      `${this.base}/Libraries/1/Download?content_id=${contentId}`,
      {
        headers: {
          'x-api-key': this.apiKey,
          'X-Product': this.product,
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }

    return response.arrayBuffer();
  }

  /** Get a preview/comp URL from an asset (no auth required). */
  getPreviewUrl(
    asset: StockAsset,
    size: 'thumb' | 'preview' | 'comp' = 'comp'
  ): string {
    switch (size) {
      case 'thumb':
        return asset.thumbnail_url;
      case 'preview':
        return asset.preview_url;
      case 'comp':
        return asset.comp_url || asset.preview_url;
    }
  }
}

export default StockClient;