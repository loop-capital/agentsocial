import type { FireflyConfig, TokenResponse } from "./types.js";

const DEFAULT_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const FIREFOX_SCOPES = "openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis";

export class FireflyAuth {
  private config: FireflyConfig;
  private token: string | null = null;
  private expiresAt: number = 0;

  constructor(config: FireflyConfig) {
    this.config = config;
  }

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt - 60_000) {
      return this.token;
    }
    return this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    const url = this.config.tokenUrl ?? DEFAULT_TOKEN_URL;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: FIREFOX_SCOPES,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Auth failed (${res.status}): ${text}`);
    }

    const data: TokenResponse = await res.json();
    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
    return this.token;
  }

  get headers(): Record<string, string> {
    if (!this.token) throw new Error("No token — call getToken() first");
    return {
      "Authorization": `Bearer ${this.token}`,
      "x-api-key": this.config.clientId,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }
}
