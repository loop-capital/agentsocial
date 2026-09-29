import { describe, it, expect, vi } from "vitest";

vi.mock("../services/composio.js", () => ({
  getConnectedAccounts: vi.fn(),
  PLATFORM_TO_TOOLKIT: { facebook: "facebook", instagram: "instagram", youtube: "youtube" },
}));
vi.mock("../db/index.js", () => ({ db: {}, channels: {} }));

const { planChannelSync } = await import("../services/composio-channels.js");

const account = (id: string, status: string, created = "2026-09-28T00:00:00Z", app = "facebook") => ({
  id, entity_id: "brand", app_name: app, app_unique_id: app, status,
  created_at: created, updated_at: created, is_disabled: false,
});
const channel = (settings: Record<string, unknown>, status = "active", accountId = "x") => ({
  id: "ch1", platform: "facebook" as const, status: status as any, accountId, settings,
});

describe("planChannelSync", () => {
  it("promotes a pending account once it is ACTIVE", () => {
    const plan = planChannelSync(channel({ composio_pending_account_id: "ca_new" }, "disconnected"), [account("ca_new", "ACTIVE")]);
    expect(plan).toEqual({ status: "active", accountId: "ca_new", settings: { composio_account_id: "ca_new" } });
  });

  it("keeps the working account while a reconnect is still pending", () => {
    const plan = planChannelSync(
      channel({ composio_account_id: "ca_old", composio_pending_account_id: "ca_new" }, "active", "ca_old"),
      [account("ca_old", "ACTIVE"), account("ca_new", "INITIATED")],
    );
    expect(plan).toBeNull();
  });

  it("drops an abandoned pending link without touching a direct channel's status", () => {
    const plan = planChannelSync(channel({ composio_pending_account_id: "ca_gone" }, "error", "page123"), []);
    expect(plan).toEqual({ status: "error", accountId: "page123", settings: {} });
  });

  it("marks an EXPIRED account's channel as error", () => {
    const plan = planChannelSync(channel({ composio_account_id: "ca_1" }, "active", "ca_1"), [account("ca_1", "EXPIRED")]);
    expect(plan?.status).toBe("error");
  });

  it("ignores channels that are not Composio-managed", () => {
    expect(planChannelSync(channel({}, "active", "page123"), [account("ca_1", "ACTIVE")])).toBeNull();
  });

  it("adopts the newest ACTIVE account for an explicitly included channel", () => {
    const plan = planChannelSync(
      channel({}, "disconnected", "page123"),
      [account("ca_a", "ACTIVE", "2026-09-01T00:00:00Z"), account("ca_b", "ACTIVE", "2026-09-20T00:00:00Z")],
      "ch1",
    );
    expect(plan?.accountId).toBe("ca_b");
    expect(plan?.status).toBe("active");
  });

  it("ignores platforms Composio doesn't handle", () => {
    const ch = { ...channel({ composio_account_id: "ca_1" }), platform: "gbp" as any };
    expect(planChannelSync(ch, [account("ca_1", "ACTIVE")])).toBeNull();
  });
});
