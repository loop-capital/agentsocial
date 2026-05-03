import type { FireflyAuth } from "./auth.js";
import type { GenerateRequest, GenerateResponse } from "./types.js";

const DEFAULT_BASE = "https://firefly-api.adobe.io";

export class FireflyGenerate {
  private auth: FireflyAuth;
  private baseUrl: string;

  constructor(auth: FireflyAuth, baseUrl = DEFAULT_BASE) {
    this.auth = auth;
    this.baseUrl = baseUrl;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const token = await this.auth.getToken();
    const headers = this.auth.headers;

    const body: Record<string, unknown> = {
      prompt: request.prompt,
    };

    if (request.numVariations) body.numVariations = request.numVariations;
    if (request.contentClass) body.contentClass = request.contentClass;
    if (request.size) {
      body.size = {
        width: request.size.width,
        height: request.size.height,
      };
    }
    if (request.style) {
      body.style = request.style;
    }

    const res = await fetch(`${this.baseUrl}/v3/images/generate-async`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Generate failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<GenerateResponse>;
  }

  async pollJob(jobUrl: string, maxWaitMs = 60_000): Promise<GenerateResponse> {
    const headers = this.auth.headers;
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      const res = await fetch(jobUrl, { headers });

      if (!res.ok) {
        throw new Error(`Poll failed (${res.status})`);
      }

      const job: GenerateResponse = await res.json();

      if (job.status === "succeeded" || job.status === "failed") {
        return job;
      }

      // Wait 2 seconds before polling again
      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error(`Job timed out after ${maxWaitMs}ms`);
  }

  async generateSync(request: GenerateRequest): Promise<GenerateResponse> {
    const job = await this.generate(request);
    if (!job.jobId) return job;
    return this.pollJob(`${this.baseUrl}/v3/images/jobs/${job.jobId}`);
  }
}
