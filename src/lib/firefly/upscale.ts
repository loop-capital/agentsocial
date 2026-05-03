import type { FireflyAuth } from "./auth.js";
import type { UpscaleRequest, UpscaleResponse } from "./types.js";

const DEFAULT_BASE = "https://firefly-api.adobe.io";

export class FireflyUpscale {
  private auth: FireflyAuth;
  private baseUrl: string;

  constructor(auth: FireflyAuth, baseUrl = DEFAULT_BASE) {
    this.auth = auth;
    this.baseUrl = baseUrl;
  }

  async upscale(request: UpscaleRequest): Promise<UpscaleResponse> {
    const headers = this.auth.headers;

    const body: Record<string, unknown> = {
      image: request.image,
      scaleFactor: request.scaleFactor,
    };

    if (request.useCase) body.useCase = request.useCase;

    const res = await fetch(`${this.baseUrl}/v3/images/upscale-async`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upscale failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<UpscaleResponse>;
  }

  async upscaleSync(request: UpscaleRequest): Promise<UpscaleResponse> {
    const job = await this.upscale(request);
    if (!job.jobId) return job;

    const headers = this.auth.headers;
    const start = Date.now();

    while (Date.now() - start < 120_000) {
      const res = await fetch(`${this.baseUrl}/v3/images/jobs/${job.jobId}`, { headers });
      if (!res.ok) throw new Error(`Poll failed (${res.status})`);

      const status: UpscaleResponse = await res.json();
      if (status.status === "succeeded" || status.status === "failed") return status;
      await new Promise((r) => setTimeout(r, 3000));
    }

    throw new Error("Upscale job timed out");
  }
}
