"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  ExternalLink,
  Plus,
  BarChart3,
  MessageSquare,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface VoiceProfile {
  id: string;
  businessName: string;
  receptionistName: string;
  bookingProvider: string;
  bookingMode: string;
  status: "active" | "paused" | "setup";
  totalCalls: number;
  bookingsCreated: number;
  leadsCaptured: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function VoiceDashboardPage() {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/v1/voice/profiles`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setProfiles(data.data || data || []);
        }
        // If 404 or error, profiles will stay empty — show setup CTA
      } catch {
        // API not available yet, show setup CTA
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(139,92,246,0.2)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "#888" }}>Loading Voice AI...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // No profiles yet — show setup CTA
  if (profiles.length === 0) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              marginBottom: "1.5rem",
            }}
          >
            <Mic size={36} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>
            Set Up Your AI Receptionist
          </h1>
          <p style={{ color: "#888", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            Your AI receptionist answers calls, books appointments, and captures leads 24/7.
            Set one up in about 30 minutes.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "2rem",
              textAlign: "left",
            }}
          >
            {[
              { icon: Phone, label: "Answers calls 24/7" },
              { icon: Zap, label: "Books appointments live" },
              { icon: MessageSquare, label: "Captures leads via SMS" },
              { icon: Users, label: "Knows your team by name" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <item.icon size={16} color="#8b5cf6" />
                <span style={{ color: "#ccc", fontSize: "0.8rem" }}>{item.label}</span>
              </div>
            ))}
          </div>

          <Link
            href="/voice/onboarding"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 2rem",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              borderRadius: 10,
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9375rem",
              textDecoration: "none",
            }}
          >
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // Show profiles
  return (
    <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>Voice AI</h1>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>Manage your AI receptionists</p>
        </div>
        <Link
          href="/voice/onboarding"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            borderRadius: 8,
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.8rem",
            textDecoration: "none",
          }}
        >
          <Plus size={16} /> Add Receptionist
        </Link>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {profiles.map((profile) => (
          <div
            key={profile.id}
            style={{
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  {profile.receptionistName?.[0] || "AI"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#fff" }}>{profile.receptionistName}</div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>{profile.businessName}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {profile.status === "active" ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "0.25rem 0.625rem", borderRadius: 4 }}>
                    <CheckCircle2 size={12} /> Active
                  </span>
                ) : profile.status === "paused" ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#eab308", background: "rgba(234,179,8,0.1)", padding: "0.25rem 0.625rem", borderRadius: 4 }}>
                    <PhoneOff size={12} /> Paused
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#8b5cf6", background: "rgba(139,92,246,0.1)", padding: "0.25rem 0.625rem", borderRadius: 4 }}>
                    <AlertCircle size={12} /> Setup
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[
                { label: "Total Calls", value: profile.totalCalls, icon: Phone },
                { label: "Bookings", value: profile.bookingsCreated, icon: Zap },
                { label: "Leads", value: profile.leadsCaptured, icon: MessageSquare },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                    padding: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  <stat.icon size={16} color="#8b5cf6" style={{ marginBottom: "0.25rem" }} />
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.7rem", color: "#666" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.05)",
                    color: "#888",
                  }}
                >
                  {profile.bookingProvider === "none" ? "Lead Capture" : profile.bookingProvider.charAt(0).toUpperCase() + profile.bookingProvider.slice(1)}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: 4,
                    background: profile.bookingMode === "integrated" ? "rgba(16,185,129,0.1)" : "rgba(234,179,8,0.1)",
                    color: profile.bookingMode === "integrated" ? "#10b981" : "#eab308",
                  }}
                >
                  {profile.bookingMode === "integrated" ? "Integrated" : "Lead Capture"}
                </span>
              </div>
              <Link
                href={`/voice/${profile.id}`}
                style={{ color: "#8b5cf6", fontSize: "0.8rem", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                Manage <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}