import { describe, it, expect } from "vitest";
import { isPublicRoute } from "../plugins/public-routes.js";

describe("public route allow-list", () => {
  it("allows the public review page's three calls", () => {
    expect(isPublicRoute("GET", "/review-sentry/business/pleij-salon")).toBe(true);
    expect(isPublicRoute("POST", "/review-sentry/rate")).toBe(true);
    expect(isPublicRoute("POST", "/review-sentry/feedback")).toBe(true);
  });

  it("does not open dashboard routes that share a public prefix", () => {
    expect(isPublicRoute("GET", "/review-sentry/feedback/0b8c0f7e-1111-4111-8111-111111111111")).toBe(false);
    expect(isPublicRoute("PATCH", "/review-sentry/feedback/abc/status")).toBe(false);
    expect(isPublicRoute("POST", "/review-sentry/feedback/abc/reply")).toBe(false);
    expect(isPublicRoute("DELETE", "/review-sentry/opt-out/+15555550100")).toBe(false);
  });

  it("limits method-scoped entries to that method", () => {
    expect(isPublicRoute("GET", "/profiles/some-salon")).toBe(true);
    expect(isPublicRoute("PUT", "/profiles/some-salon")).toBe(false);
    expect(isPublicRoute("GET", "/landing-pages/spring-promo")).toBe(true);
    expect(isPublicRoute("DELETE", "/landing-pages/spring-promo")).toBe(false);
  });

  it("keeps billing setup and checkout behind auth", () => {
    expect(isPublicRoute("POST", "/billing/init-plans")).toBe(false);
    expect(isPublicRoute("POST", "/billing/checkout")).toBe(false);
    expect(isPublicRoute("GET", "/billing/plans")).toBe(true);
  });

  it("requires auth for ordinary API routes", () => {
    expect(isPublicRoute("GET", "/brands")).toBe(false);
    expect(isPublicRoute("POST", "/generate/video")).toBe(false);
    expect(isPublicRoute("GET", "/social/profiles")).toBe(false);
  });

  it("allows root and health", () => {
    expect(isPublicRoute("GET", "/")).toBe(true);
    expect(isPublicRoute("GET", "/health")).toBe(true);
  });
});
