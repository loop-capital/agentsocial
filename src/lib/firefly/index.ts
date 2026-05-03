import { FireflyAuth } from "./auth.js";
import { FireflyGenerate } from "./generate.js";
import { FireflyComposite } from "./composite.js";
import { FireflyUpscale } from "./upscale.js";
import type { FireflyConfig } from "./types.js";

export class Firefly {
  readonly auth: FireflyAuth;
  readonly generate: FireflyGenerate;
  readonly composite: FireflyComposite;
  readonly upscale: FireflyUpscale;

  constructor(config: FireflyConfig) {
    this.auth = new FireflyAuth(config);
    this.generate = new FireflyGenerate(this.auth);
    this.composite = new FireflyComposite(this.auth);
    this.upscale = new FireflyUpscale(this.auth);
  }

  static fromEnv(): Firefly {
    const clientId = process.env.FIREFLY_CLIENT_ID;
    const clientSecret = process.env.FIREFLY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing FIREFLY_CLIENT_ID or FIREFLY_CLIENT_SECRET environment variables"
      );
    }

    return new Firefly({ clientId, clientSecret });
  }

  async testConnection(): Promise<boolean> {
    try {
      const token = await this.auth.getToken();
      return !!token;
    } catch {
      return false;
    }
  }
}

export { FireflyAuth } from "./auth.js";
export { FireflyGenerate } from "./generate.js";
export { FireflyComposite } from "./composite.js";
export { FireflyUpscale } from "./upscale.js";
export type * from "./types.js";
