"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function VoicePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkProfiles() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/v1/voice/profiles`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const profiles = data.data || data || [];
          if (profiles.length > 0) {
            // Has profiles, go to dashboard
            router.push("/voice/dashboard");
            return;
          }
        }
      } catch {
        // API not available yet, go to onboarding
      }
      // No profiles or API unavailable, go to onboarding
      router.push("/voice/onboarding");
    }
    checkProfiles().finally(() => setChecking(false));
  }, [router]);

  if (checking) {
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

  return null;
}