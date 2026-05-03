import type { FireflyAuth } from "./auth.js";
import type { CompositeRequest, GenerateResponse } from "./types.js";

const DEFAULT_BASE = "https://firefly-api.adobe.io";

export class FireflyComposite {
  private auth: FireflyAuth;
  private baseUrl: string;

  constructor(auth: FireflyAuth, baseUrl = DEFAULT_BASE) {
    this.auth = auth;
    this.baseUrl = baseUrl;
  }

  async composite(request: CompositeRequest): Promise<GenerateResponse> {
    const headers = this.auth.headers;

    const body: Record<string, unknown> = {
      image: request.image,
      prompt: request.prompt,
    };

    if (request.placementHint) body.placementHint = request.placementHint;
    if (request.harmonization) body.harmonization = request.harmonization;
    if (request.size) body.size = request.size;

    const res = await fetch(`${this.baseUrl}/v3/images/composite-async`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Composite failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<GenerateResponse>;
  }

  async compositeSync(request: CompositeRequest): Promise<GenerateResponse> {
    const job = await this.composite(request);
    if (!job.jobId) return job;

    const headers = this.auth.headers;
    const start = Date.now();

    while (Date.now() - start < 60_000) {
      const res = await fetch(`${this.baseUrl}/v3/images/jobs/${job.jobId}`, { headers });
      if (!res.ok) throw new Error(`Poll failed (${res.status})`);

      const status: GenerateResponse = await res.json();
      if (status.status === "succeeded" || status.status === "failed") return status;
      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error("Composite job timed out");
  }
}
