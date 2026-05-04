"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  Globe,
  Clock,
  ImagePlus,
  Music2,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { api } from "../../../lib/api";

type Industry =
  | "salon"
  | "saas"
  | "ecommerce"
  | "education"
  | "marketplace"
  | "professional"
  | "other";

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "salon", label: "Salon" },
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "education", label: "Education" },
  { value: "marketplace", label: "Marketplace" },
  { value: "professional", label: "Professional Services" },
  { value: "other", label: "Other" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

type Step = 1 | 2 | 3 | 4;

type SocialPlatform = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  comingSoon: boolean;
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "twitter",
    name: "Twitter / X",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    color: "#1DA1F2",
    comingSoon: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>,
    color: "#E4405F",
    comingSoon: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    color: "#1877F2",
    comingSoon: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    color: "#0A66C2",
    comingSoon: false,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <Music2 size={20} />,
    color: "#000000",
    comingSoon: true,
  },
];

const STEP_TITLES: Record<Step, string> = {
  1: "Brand Setup",
  2: "Social Accounts",
  3: "Adobe Express",
  4: "You're all set!",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState<Industry | "">("");
  const [timezone, setTimezone] = useState("UTC");

  // Step 2 state
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const [connectLoading, setConnectLoading] = useState<Record<string, boolean>>({});

  const handleCreateBrand = async () => {
    if (!brandName.trim()) {
      setError("Brand name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.brands.create(brandName, timezone);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSocial = async (platform: SocialPlatform) => {
    if (platform.comingSoon) return;
    setConnectLoading((prev) => ({ ...prev, [platform.id]: true }));
    try {
      // We need a brand ID. If not created yet, show error.
      const brandRes = await api.brands.list();
      const brands = brandRes.data || [];
      if (brands.length === 0) {
        setError("Please complete Step 1 (Brand Setup) first.");
        setConnectLoading((prev) => ({ ...prev, [platform.id]: false }));
        return;
      }
      const brandId = brands[0].id;
      const res = await api.channels.oauthConnect(platform.id, brandId);
      window.location.href = res.authorization_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to connect ${platform.name}`);
      setConnectLoading((prev) => ({ ...prev, [platform.id]: false }));
    }
  };

  const handleAdobeExpress = () => {
    // Adobe Express SDK already wired via CCEverywhereProvider in layout
    // For now, just mark as done and proceed
    setStep(4);
  };

  const handleSkip = () => {
    if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  const goBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  };

  // Detect just-connected platforms from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected) {
      setConnectedPlatforms((prev) => new Set(prev).add(connected));
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    }
    const oauthError = params.get("error");
    if (oauthError) {
      setError(`OAuth failed: ${oauthError}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const progressPercent = ((step - 1) / 3) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            AS
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Welcome to AgentSocial
          </h1>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>
            Let&apos;s set up your account in a few quick steps
          </p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #2563eb, #7c3aed)",
                borderRadius: 2,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "0.5rem",
              fontSize: "0.75rem",
              color: "#666",
            }}
          >
            <span>Brand</span>
            <span>Social</span>
            <span>Adobe</span>
            <span>Done</span>
          </div>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            background: "#141414",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "2rem",
          }}
        >
          {/* Step Header */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              {step > 1 && (
                <button
                  onClick={goBack}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {STEP_TITLES[step]}
              </h2>
            </div>
            <p style={{ color: "#888", fontSize: "0.875rem" }}>
              Step {step} of 4
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(220,38,38,0.1)",
                border: "1px solid rgba(220,38,38,0.3)",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                color: "#ef4444",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          {/* ─── Step 1: Brand Setup ─── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ color: "#ccc" }}>
                  Brand Name *
                </label>
                <div style={{ position: "relative" }}>
                  <Building2
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#666",
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Che Lace Beauty"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: "#ccc" }}>
                  Industry / Type
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "0.5rem",
                  }}
                >
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      onClick={() => setIndustry(ind.value)}
                      style={{
                        padding: "0.625rem 0.75rem",
                        borderRadius: 8,
                        border:
                          industry === ind.value
                            ? "1px solid #2563eb"
                            : "1px solid rgba(255,255,255,0.08)",
                        background:
                          industry === ind.value
                            ? "rgba(37,99,235,0.1)"
                            : "transparent",
                        color: industry === ind.value ? "#fff" : "#888",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: "#ccc" }}>
                  Timezone
                </label>
                <div style={{ position: "relative" }}>
                  <Clock
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#666",
                    }}
                  />
                  <select
                    className="form-input"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    style={{ paddingLeft: 40, appearance: "auto" }}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: "#ccc" }}>
                  Logo
                </label>
                <div
                  style={{
                    border: "2px dashed rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "2rem",
                    textAlign: "center",
                    color: "#666",
                    cursor: "pointer",
                  }}
                >
                  <ImagePlus size={24} style={{ marginBottom: "0.5rem" }} />
                  <p style={{ fontSize: "0.875rem" }}>Logo upload coming soon</p>
                  <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    You can add this later in Settings
                  </p>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCreateBrand}
                disabled={loading || !brandName.trim()}
                style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ─── Step 2: Social Accounts ─── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                Connect the social platforms you want to manage. You can always add more later in Settings.
              </p>

              {SOCIAL_PLATFORMS.map((platform) => {
                const isConnected = connectedPlatforms.has(platform.id);
                return (
                  <div
                    key={platform.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: `${platform.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: platform.color,
                        }}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#fff", fontSize: "0.875rem" }}>
                          {platform.name}
                        </div>
                        {platform.comingSoon ? (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#888",
                              background: "rgba(255,255,255,0.06)",
                              padding: "0.125rem 0.5rem",
                              borderRadius: 4,
                            }}
                          >
                            Coming soon
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#666" }}>
                            {isConnected ? "Connected" : "Not connected"}
                          </span>
                        )}
                      </div>
                    </div>

                    {platform.comingSoon ? (
                      <button
                        className="btn btn-secondary"
                        disabled
                        style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem", opacity: 0.5 }}
                      >
                        Connect
                      </button>
                    ) : connectLoading[platform.id] ? (
                      <button
                        className="btn btn-primary"
                        disabled
                        style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem" }}
                      >
                        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        Connecting...
                      </button>
                    ) : (
                      <button
                        className={`btn btn-sm ${isConnected ? "btn-secondary" : "btn-primary"}`}
                        onClick={() => handleConnectSocial(platform)}
                        style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem" }}
                      >
                        {isConnected ? (
                          <>
                            <Check size={14} />
                            Connected
                          </>
                        ) : (
                          "+ Connect"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={handleSkip}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Skip for now
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(3)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Continue
                  <ChevronRight size={16} />
                </button>
              </div>
              <p style={{ color: "#555", fontSize: "0.75rem", textAlign: "center" }}>
                You can connect accounts later in Settings
              </p>
            </div>
          )}

          {/* ─── Step 3: Adobe Express ─── */}
          {step === 3 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "1.25rem",
                padding: "1rem 0",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Sparkles size={28} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#fff",
                    marginBottom: "0.5rem",
                  }}
                >
                  Create stunning visuals with Adobe Express
                </h3>
                <p style={{ color: "#888", fontSize: "0.875rem", lineHeight: 1.6, maxWidth: 400 }}>
                  Design eye-catching posts, stories, and ads directly within AgentSocial.
                  No design experience needed.
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleAdobeExpress}
                style={{ minWidth: 220, justifyContent: "center" }}
              >
                <Sparkles size={16} />
                Connect Adobe Express
              </button>

              <button
                onClick={handleSkip}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  padding: "0.5rem",
                }}
              >
                Skip for now
              </button>
            </div>
          )}

          {/* ─── Step 4: Done ─── */}
          {step === 4 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "1.5rem",
                padding: "1rem 0",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Check size={36} strokeWidth={3} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "0.5rem",
                  }}
                >
                  You&apos;re all set!
                </h3>
                <p style={{ color: "#888", fontSize: "0.875rem", lineHeight: 1.6 }}>
                  Your brand is ready. Start creating and scheduling posts to grow your social presence.
                </p>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 12,
                  padding: "1rem 1.25rem",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>
                  What&apos;s next?
                </h4>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {[
                    "Create your first post",
                    "Schedule content for the week",
                    "Connect more social accounts",
                    "Explore analytics insights",
                  ].map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.875rem",
                        color: "#888",
                      }}
                    >
                      <Check size={14} color="#10b981" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleFinish}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", color: "#555", marginTop: "1.5rem", fontSize: "0.75rem" }}>
          Need help?{" "}
          <Link href="/help" style={{ color: "#888" }}>
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
