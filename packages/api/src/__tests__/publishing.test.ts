import { describe, it, expect, vi, beforeEach } from "vitest";

const executeAction = vi.fn();
const createPost = vi.fn();
vi.mock("../services/composio.js", () => ({ executeAction: (...a: unknown[]) => executeAction(...a) }));
vi.mock("../services/zernio.js", () => ({ createPost: (...a: unknown[]) => createPost(...a) }));

import {
  providerFor,
  usesProviderRouter,
  validateForPlatform,
  publishToChannel,
  PublishValidationError,
} from "../services/publishing/index.js";
import { dig } from "../services/publishing/composio-publisher.js";

const chan = (platform: string, settings: Record<string, unknown> = {}) => ({
  id: "ch1", platform, name: "n", accountId: "acct", settings,
});
const input = (platform: string, settings: Record<string, unknown>, content = "hi", media: any[] = []) => ({
  brandId: "brand1", channel: chan(platform, settings), content, media,
});

beforeEach(() => {
  executeAction.mockReset();
  createPost.mockReset();
  delete process.env.PUBLISH_PROVIDER_TIKTOK;
});

describe("provider routing", () => {
  it("sends GBP to Zernio and everything else to Composio by default", () => {
    expect(providerFor("gbp")).toBe("zernio");
    for (const p of ["instagram", "facebook", "linkedin", "twitter", "tiktok", "youtube"]) {
      expect(providerFor(p)).toBe("composio");
    }
  });

  it("honours env and per-channel overrides (channel wins)", () => {
    process.env.PUBLISH_PROVIDER_TIKTOK = "zernio";
    expect(providerFor("tiktok")).toBe("zernio");
    expect(providerFor("tiktok", { provider: "composio" })).toBe("composio");
  });

  it("only uses the router when the channel has the provider's account id", () => {
    expect(usesProviderRouter("instagram", {})).toBe(false);
    expect(usesProviderRouter("instagram", { composio_account_id: "ca_1" })).toBe(true);
    expect(usesProviderRouter("gbp", { composio_account_id: "ca_1" })).toBe(false);
    expect(usesProviderRouter("gbp", { zernio_account_id: "z1" })).toBe(true);
  });
});

describe("validateForPlatform", () => {
  it("flags X posts over 280 chars", () => {
    expect(validateForPlatform("twitter", "x".repeat(281), 0)).toHaveLength(1);
    expect(validateForPlatform("twitter", "x".repeat(280), 0)).toHaveLength(0);
  });
  it("requires media for Instagram and TikTok", () => {
    expect(validateForPlatform("instagram", "hi", 0)).toHaveLength(1);
    expect(validateForPlatform("instagram", "hi", 1)).toHaveLength(0);
    expect(validateForPlatform("tiktok", "hi", 0)).toHaveLength(1);
  });
});

describe("dig", () => {
  it("finds nested and array paths and stringifies numbers", () => {
    expect(dig({ a: { b: [{ c: 7 }] } }, "a.b.0.c")).toBe("7");
    expect(dig({ id: "" , data: { id: "z" } }, "id", "data.id")).toBe("z");
    expect(dig(null, "a")).toBeUndefined();
  });
});

describe("Composio publishing", () => {
  it("Instagram photo: creates container then publishes, caching the IG id", async () => {
    executeAction
      .mockResolvedValueOnce({ success: true, data: { id: "ig123" } })          // GET_USER_INFO
      .mockResolvedValueOnce({ success: true, data: { id: "container9" } })     // CREATE_MEDIA_CONTAINER
      .mockResolvedValueOnce({ success: true, data: { id: "post42" } });        // CREATE_POST

    const r = await publishToChannel(
      input("instagram", { composio_account_id: "ca_ig" }, "caption", [{ type: "image", url: "https://x/y.jpg" }]),
    );

    expect(r.provider).toBe("composio");
    expect(r.platformPostId).toBe("post42");
    expect(r.settingsPatch).toEqual({ ig_user_id: "ig123" });
    const calls = executeAction.mock.calls.map((c) => c[1]);
    expect(calls).toEqual(["INSTAGRAM_GET_USER_INFO", "INSTAGRAM_CREATE_MEDIA_CONTAINER", "INSTAGRAM_CREATE_POST"]);
    expect(executeAction.mock.calls[1][2]).toMatchObject({ ig_user_id: "ig123", image_url: "https://x/y.jpg", content_type: "photo" });
    expect(executeAction.mock.calls[2][3]).toBe("ca_ig");
  });

  it("Instagram skips discovery when ig_user_id is cached", async () => {
    executeAction
      .mockResolvedValueOnce({ success: true, data: { id: "c1" } })
      .mockResolvedValueOnce({ success: true, data: { id: "p1" } });
    const r = await publishToChannel(
      input("instagram", { composio_account_id: "ca", ig_user_id: "ig1" }, "c", [{ type: "image", url: "u" }]),
    );
    expect(r.settingsPatch).toBeUndefined();
    expect(executeAction).toHaveBeenCalledTimes(2);
  });

  it("Instagram without media is rejected before any API call", async () => {
    await expect(publishToChannel(input("instagram", { composio_account_id: "ca" }))).rejects.toBeInstanceOf(
      PublishValidationError,
    );
    expect(executeAction).not.toHaveBeenCalled();
  });

  it("uses composio_user_id instead of the brand id when set", async () => {
    executeAction.mockResolvedValueOnce({ success: true, data: { data: { id: "9" } } });
    await publishToChannel(input("twitter", { composio_account_id: "ca", composio_user_id: "pleij-salon" }, "hi"));
    expect(executeAction.mock.calls[0][0]).toBe("pleij-salon");
  });

  it("Facebook text post discovers the page id", async () => {
    executeAction
      .mockResolvedValueOnce({ success: true, data: { data: [{ id: "pg1" }] } })
      .mockResolvedValueOnce({ success: true, data: { id: "pg1_99" } });
    const r = await publishToChannel(input("facebook", { composio_account_id: "ca" }, "hello"));
    expect(r.platformPostId).toBe("pg1_99");
    expect(r.settingsPatch).toEqual({ page_id: "pg1" });
    expect(executeAction.mock.calls[1][1]).toBe("FACEBOOK_CREATE_POST");
  });

  it("surfaces Composio failures with the action name", async () => {
    executeAction.mockResolvedValueOnce({ success: false, data: {}, error: "token expired" });
    await expect(
      publishToChannel(input("twitter", { composio_account_id: "ca" }, "hi")),
    ).rejects.toThrow(/TWITTER_CREATION_OF_A_POST failed: token expired/);
  });

  it("unsupported media is a non-retryable validation error", async () => {
    await expect(
      publishToChannel(input("tiktok", { composio_account_id: "ca" }, "v", [{ type: "video", url: "u" }])),
    ).rejects.toBeInstanceOf(PublishValidationError);
  });

  it("over-limit text never reaches the provider", async () => {
    await expect(
      publishToChannel(input("twitter", { composio_account_id: "ca" }, "x".repeat(300))),
    ).rejects.toBeInstanceOf(PublishValidationError);
    expect(executeAction).not.toHaveBeenCalled();
  });
});

describe("Zernio publishing (GBP)", () => {
  it("posts to googlebusiness with the stored account id", async () => {
    createPost.mockResolvedValueOnce({ _id: "zp1" });
    const r = await publishToChannel(input("gbp", { zernio_account_id: "za1" }, "offer!"));
    expect(r.provider).toBe("zernio");
    expect(r.platformPostId).toBe("zp1");
    expect(createPost.mock.calls[0][0]).toMatchObject({
      content: "offer!",
      publishNow: true,
      platforms: [{ platform: "googlebusiness", accountId: "za1" }],
    });
  });

  it("TikTok can be routed to Zernio per channel", async () => {
    createPost.mockResolvedValueOnce({ _id: "zt1" });
    const r = await publishToChannel(input("tiktok", { provider: "zernio", zernio_account_id: "zt" }, "hi", [{ type: "video", url: "https://x/v.mp4" }]));
    expect(r.provider).toBe("zernio");
    expect(createPost.mock.calls[0][0].platforms[0]).toMatchObject({ platform: "tiktok", accountId: "zt" });
  });

  it("requires a zernio_account_id", async () => {
    await expect(publishToChannel(input("gbp", {}))).rejects.toBeInstanceOf(PublishValidationError);
  });
});
