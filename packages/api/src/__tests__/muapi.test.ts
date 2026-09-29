import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGenerationService, MuapiError } from "../services/generation.js";

const service = createGenerationService({ defaultProvider: "muapi", muapiApiKey: "test", muapiBaseUrl: "https://muapi.test" });

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

async function submitError(res: Response): Promise<MuapiError> {
  fetchMock.mockResolvedValueOnce(res);
  try {
    await service.submitMuapi("veo3.1-lite-text-to-video", { prompt: "x" });
  } catch (err) {
    return err as MuapiError;
  }
  throw new Error("expected submitMuapi to throw");
}

describe("muapi errors", () => {
  it("maps 402 insufficient credits", async () => {
    const err = await submitError(json(402, { error: { code: "INSUFFICIENT_CREDITS", message: "Insufficient credit balance" } }));
    expect(err).toBeInstanceOf(MuapiError);
    expect(err.code).toBe("provider_insufficient_credits");
    expect(err.upstreamStatus).toBe(402);
    expect(err.message).toContain("Insufficient credit balance");
  });

  it("names each invalid field on 422", async () => {
    const err = await submitError(json(422, {
      detail: [{ type: "literal_error", loc: ["body", "duration"], msg: "Input should be 8", input: 5 }],
    }));
    expect(err.code).toBe("invalid_generation_params");
    expect(err.message).toContain("duration: Input should be 8");
  });

  it("maps auth, not-found and rate-limit statuses", async () => {
    expect((await submitError(json(401, { detail: "bad key" }))).code).toBe("provider_auth_error");
    expect((await submitError(json(404, { detail: "Not Found" }))).code).toBe("model_not_found");
    expect((await submitError(json(429, { detail: "slow down" }))).code).toBe("provider_rate_limited");
    expect((await submitError(json(500, { detail: "boom" }))).code).toBe("provider_upstream_error");
  });
});

describe("muapi submit and poll", () => {
  it("returns the request id and cost from submit", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { request_id: "req_1", cost: { amount_usd: 0.3 } }));
    const r = await service.submitMuapi("veo3.1-lite-text-to-video", { prompt: "x" });
    expect(r).toMatchObject({ requestId: "req_1", costUsd: 0.3 });
    expect(fetchMock.mock.calls[0][0]).toBe("https://muapi.test/api/v1/veo3.1-lite-text-to-video");
  });

  it("reads outputs and cost from a completed prediction", async () => {
    fetchMock.mockResolvedValueOnce(json(200, {
      status: "completed", outputs: ["https://cdn.muapi.ai/a.mp4"], cost: { amount_usd: 0.2875 },
    }));
    const r = await service.pollMuapi("req_1");
    expect(fetchMock.mock.calls[0][0]).toBe("https://muapi.test/api/v1/predictions/req_1/result");
    expect(r.status).toBe("completed");
    expect(r.outputs).toEqual([{ url: "https://cdn.muapi.ai/a.mp4", mimeType: "video/mp4" }]);
    expect(r.costUsd).toBe(0.2875);
  });

  it("falls back to the cost header", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { status: "processing" }, { "X-MuAPI-Cost-USD": "0.03" }));
    expect((await service.pollMuapi("req_2")).costUsd).toBe(0.03);
  });

  it("reports a failed prediction's reason", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { status: "failed", error: "content policy" }));
    const r = await service.pollMuapi("req_3");
    expect(r.status).toBe("failed");
    expect(r.error).toBe("content policy");
  });

  it("lowercases resolution for muapi", () => {
    expect(service.muapiVideoBody({ prompt: "x", resolution: "4K", brandId: "b", userId: "u" }).resolution).toBe("4k");
  });
});
