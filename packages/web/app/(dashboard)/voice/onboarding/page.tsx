"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Check, Phone, Building2, Clock, User,
  MessageSquare, Zap, Loader2, AlertCircle, Link2, Mic, Sparkles,
  Globe, Users,
} from "lucide-react";

type BookingProvider = "square" | "phorest" | "booker" | "boulevard" | "vagaro" | "meevo" | "fresha" | "schedulicity" | "none";
type BookingMode = "integrated" | "lead_capture";

interface StylistEntry { displayName: string; specialties: string; isActive: boolean; }

interface VoiceProfile {
  bookingProvider: BookingProvider; bookingMode: BookingMode;
  businessName: string; businessPhone: string; businessAddress: string; businessTimezone: string;
  providerAccessToken: string; providerLocationId: string;
  stylists: StylistEntry[];
  receptionistName: string; ttsVoice: string; greeting: string;
  smsConfirmation: boolean;
  leadDeliveryMethod: "sms" | "email" | "both"; leadDeliveryDestination: string;
}

const PROVIDERS: { value: BookingProvider; label: string; desc: string; mode: BookingMode; status: "ready" | "coming_soon" | "lead_only" }[] = [
  { value: "square", label: "Square", desc: "Full booking integration — availability, appointments, cancellations", mode: "integrated", status: "ready" },
  { value: "phorest", label: "Phorest", desc: "Full booking integration — availability, appointments", mode: "integrated", status: "coming_soon" },
  { value: "booker", label: "Booker (Mindbody)", desc: "Full booking integration (requires partner approval)", mode: "integrated", status: "coming_soon" },
  { value: "boulevard", label: "Boulevard", desc: "Full booking integration", mode: "integrated", status: "coming_soon" },
  { value: "vagaro", label: "Vagaro", desc: "No public API — lead capture only", mode: "lead_capture", status: "lead_only" },
  { value: "meevo", label: "Meevo (Millennium)", desc: "No public API — lead capture only", mode: "lead_capture", status: "lead_only" },
  { value: "fresha", label: "Fresha", desc: "No API available — lead capture only", mode: "lead_capture", status: "lead_only" },
  { value: "none", label: "No booking software", desc: "I don\u2019t use any scheduling software", mode: "lead_capture", status: "ready" },
];

const TTS_VOICES = [
  { id: "alloy", name: "Alloy", desc: "Professional" },
  { id: "echo", name: "Echo", desc: "Warm" },
  { id: "fable", name: "Fable", desc: "Friendly" },
  { id: "onyx", name: "Onyx", desc: "Confident" },
  { id: "nova", name: "Nova", desc: "Energetic" },
  { id: "shimmer", name: "Shimmer", desc: "Calm" },
];

const TIMEZONES = ["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Anchorage","Pacific/Honolulu","America/Phoenix"];
const DEFAULT_GREETING = "Thank you for calling {business_name}, this is {receptionist_name}. How can I help you today?";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function VoiceOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<VoiceProfile>({
    bookingProvider: "square", bookingMode: "integrated",
    businessName: "", businessPhone: "", businessAddress: "", businessTimezone: "America/New_York",
    providerAccessToken: "", providerLocationId: "",
    stylists: [{ displayName: "", specialties: "", isActive: true }],
    receptionistName: "Maya", ttsVoice: "echo", greeting: DEFAULT_GREETING,
    smsConfirmation: true, leadDeliveryMethod: "sms", leadDeliveryDestination: "",
  });

  const sel = PROVIDERS.find(p => p.value === profile.bookingProvider);
  const isInt = profile.bookingMode === "integrated";
  const isLC = profile.bookingMode === "lead_capture";
  // Steps: 1=provider, 2=business, 3=connect(integrated only)/team(lead), 4=team(integrated)/voice(lead), 5=voice(integrated)/review(lead), 6=review(integrated)
  const maxStep = isInt && profile.bookingProvider !== "none" ? 6 : 5;
  // Map logical step to display step
  const currentPanel = (() => {
    if (!isInt) {
      // Lead capture: 1=provider, 2=business, 3=team, 4=voice, 5=review
      if (step === 1) return "provider" as const;
      if (step === 2) return "business" as const;
      if (step === 3) return "team" as const;
      if (step === 4) return "voice" as const;
      return "review" as const;
    }
    // Integrated: 1=provider, 2=business, 3=connect, 4=team, 5=voice, 6=review
    if (step === 1) return "provider" as const;
    if (step === 2) return "business" as const;
    if (step === 3) return "connect" as const;
    if (step === 4) return "team" as const;
    if (step === 5) return "voice" as const;
    return "review" as const;
  })();

  const goNext = () => { setError(null); if (step < maxStep) setStep(step + 1); };
  const goBack = () => { setError(null); if (step > 1) setStep(step - 1); };
  const upd = (p: Partial<VoiceProfile>) => setProfile(prev => ({ ...prev, ...p }));

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/v1/voice/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(profile),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.error?.message || `Failed (${res.status})`); }
      router.push("/voice/dashboard");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save"); }
    finally { setSaving(false); }
  };

  const panel = currentPanel;
  const stepLabels = isInt ? ["Provider","Business","Connect","Team","Voice","Launch"] : ["Provider","Business","Team","Voice","Launch"];
  const pct = ((step - 1) / (maxStep - 1)) * 100;

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.625rem 0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: "0.875rem", outline: "none" };
  const btnPri: React.CSSProperties = { padding: "0.75rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" };
  const btnSec: React.CSSProperties = { flex: 1, padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#888", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" };
  const btnGrn: React.CSSProperties = { ...btnPri, background: "linear-gradient(135deg, #10b981, #059669)", flex: 2 };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "2rem" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: "0.75rem" }}><Mic size={24} /></div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Set Up Your AI Receptionist</h1>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>Get your voice AI answering calls and booking appointments in minutes</p>
        </div>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #8b5cf6, #6366f1)", borderRadius: 2, transition: "width 0.4s ease" }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.7rem", color: "#555" }}>
            {stepLabels.map((l, i) => <span key={l} style={{ color: i + 1 <= step ? "#8b5cf6" : "#555" }}>{l}</span>)}
          </div>
        </div>
        <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "2rem" }}>
          <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {step > 1 && <button onClick={goBack} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 0 }}><ChevronLeft size={18} /></button>}
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff" }}>{panel === "provider" ? "Booking Provider" : panel === "business" ? "Business Info" : panel === "connect" ? "Connect Provider" : panel === "team" ? "Team & Services" : panel === "voice" ? "Voice & Branding" : "Review & Launch"}</h2>
          </div>
          {error && <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#ef4444", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><AlertCircle size={16} /> {error}</div>}

          {panel === "provider" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <p style={{ color: "#888", fontSize: "0.875rem" }}>What scheduling software does your salon use?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {PROVIDERS.map(p => {
                  const isSel = profile.bookingProvider === p.value;
                  const canClick = p.status === "ready" || p.status === "lead_only";
                  const badge = p.status === "coming_soon" ? "Coming Soon" : p.status === "lead_only" ? "Lead Capture" : p.status === "ready" ? "Available Now" : null;
                  return (
                    <button key={p.value} onClick={() => canClick && upd({ bookingProvider: p.value, bookingMode: p.mode })} disabled={!canClick} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", borderRadius: 10, border: isSel ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.08)", background: isSel ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)", cursor: canClick ? "pointer" : "not-allowed", textAlign: "left", opacity: !canClick ? 0.5 : 1 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: isSel ? "6px solid #8b5cf6" : "2px solid rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: 600, color: "#fff", fontSize: "0.875rem" }}>{p.label}</span>
                          {badge && <span style={{ fontSize: "0.65rem", padding: "0.125rem 0.5rem", borderRadius: 4, background: p.status === "lead_only" ? "rgba(234,179,8,0.15)" : p.status === "ready" ? "rgba(16,185,129,0.15)" : "rgba(139,92,246,0.15)", color: p.status === "lead_only" ? "#eab308" : p.status === "ready" ? "#10b981" : "#8b5cf6", fontWeight: 600 }}>{badge}</span>}
                        </div>
                        <p style={{ color: "#888", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {sel && (
                <div style={{ background: isInt ? "rgba(16,185,129,0.08)" : "rgba(234,179,8,0.08)", border: `1px solid ${isInt ? "rgba(16,185,129,0.2)" : "rgba(234,179,8,0.2)"}`, borderRadius: 10, padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {isInt ? <Zap size={16} color="#10b981" /> : <MessageSquare size={16} color="#eab308" />}
                    <span style={{ fontWeight: 600, color: isInt ? "#10b981" : "#eab308", fontSize: "0.875rem" }}>{isInt ? "Integrated Booking" : "Lead Capture Mode"}</span>
                  </div>
                  <p style={{ color: "#888", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>{isInt ? "The AI checks real-time availability and books directly into your scheduling software." : "The AI collects caller info and preferred time, then sends it to your team via SMS/email to confirm manually."}</p>
                </div>
              )}
              <button onClick={goNext} disabled={!sel} style={{ ...btnPri, width: "100%", background: sel ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "rgba(255,255,255,0.05)", color: sel ? "#fff" : "#555", cursor: sel ? "pointer" : "not-allowed" }}>Continue <ChevronRight size={16} /></button>
            </div>
          )}

          {panel === "business" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Salon / Business Name *</label><div style={{ position: "relative" }}><Building2 size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666" }} /><input type="text" placeholder="e.g. PLEIJ Salon" value={profile.businessName} onChange={e => upd({ businessName: e.target.value })} style={{ ...inputStyle, paddingLeft: 40 }} /></div></div>
              <div><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Business Phone *</label><div style={{ position: "relative" }}><Phone size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666" }} /><input type="tel" placeholder="e.g. 614-555-1234" value={profile.businessPhone} onChange={e => upd({ businessPhone: e.target.value })} style={{ ...inputStyle, paddingLeft: 40 }} /></div></div>
              <div><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Address</label><div style={{ position: "relative" }}><Globe size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666" }} /><input type="text" placeholder="e.g. 8930 Lyra Drive, Columbus, OH 43240" value={profile.businessAddress} onChange={e => upd({ businessAddress: e.target.value })} style={{ ...inputStyle, paddingLeft: 40 }} /></div></div>
              <div><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Timezone</label><div style={{ position: "relative" }}><Clock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666" }} /><select value={profile.businessTimezone} onChange={e => upd({ businessTimezone: e.target.value })} style={{ ...inputStyle, paddingLeft: 40, appearance: "auto" as const }}>{TIMEZONES.map(tz => <option key={tz} value={tz} style={{ background: "#1a1a1a" }}>{tz.replace("America/", "").replace("_", " ")}</option>)}</select></div></div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={goBack} style={btnSec}>Back</button>
                <button onClick={goNext} disabled={!profile.businessName.trim() || !profile.businessPhone.trim()} style={{ ...btnPri, flex: 2, background: profile.businessName.trim() && profile.businessPhone.trim() ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "rgba(255,255,255,0.05)", color: profile.businessName.trim() && profile.businessPhone.trim() ? "#fff" : "#555", cursor: profile.businessName.trim() && profile.businessPhone.trim() ? "pointer" : "not-allowed" }}>Continue <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {panel === "connect" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "1.25rem", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(139,92,246,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}><Link2 size={24} color="#8b5cf6" /></div>
                <h3 style={{ color: "#fff", fontWeight: 600, marginBottom: "0.5rem" }}>Connect {sel?.label}</h3>
                <p style={{ color: "#888", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1rem" }}>We need access to check availability and create bookings. Your credentials are encrypted.</p>
                {profile.bookingProvider === "square" ? (
                  <div style={{ textAlign: "left" }}>
                    <div style={{ marginBottom: "1rem" }}><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Square Access Token *</label><input type="password" placeholder="EAAAAl..." value={profile.providerAccessToken} onChange={e => upd({ providerAccessToken: e.target.value })} style={{ ...inputStyle, fontFamily: "monospace" }} /></div>
                    <div><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Square Location ID *</label><input type="text" placeholder="e.g. 0Q59TWNM39JRJ" value={profile.providerLocationId} onChange={e => upd({ providerLocationId: e.target.value })} style={{ ...inputStyle, fontFamily: "monospace" }} /></div>
                  </div>
                ) : <p style={{ color: "#8b5cf6", fontSize: "0.875rem" }}>OAuth connection for {sel?.label} coming soon. You can add credentials later in Settings.</p>}
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={goBack} style={btnSec}>Back</button>
                <button onClick={goNext} style={{ ...btnPri, flex: 2 }}>Continue <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {panel === "team" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><h3 style={{ color: "#fff", fontWeight: 600, fontSize: "0.9375rem" }}>Team Members</h3><p style={{ color: "#888", fontSize: "0.8rem", marginTop: "0.25rem" }}>Add the stylists the AI should know by name</p></div>
                <button onClick={() => setProfile(p => ({ ...p, stylists: [...p.stylists, { displayName: "", specialties: "", isActive: true }] }))} style={{ padding: "0.375rem 0.75rem", borderRadius: 6, border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}><Users size={14} /> Add</button>
              </div>
              {profile.stylists.map((st, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ color: "#888", fontSize: "0.75rem" }}>Stylist {i + 1}</span>
                    {profile.stylists.length > 1 && <button onClick={() => setProfile(p => ({ ...p, stylists: p.stylists.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.75rem", cursor: "pointer" }}>Remove</button>}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <input type="text" placeholder="Display name (e.g. Tiche)" value={st.displayName} onChange={e => setProfile(p => ({ ...p, stylists: p.stylists.map((s, j) => j === i ? { ...s, displayName: e.target.value } : s) }))} style={{ flex: 1, ...inputStyle }} />
                    <input type="text" placeholder="Specialties (e.g. color, balayage)" value={st.specialties} onChange={e => setProfile(p => ({ ...p, stylists: p.stylists.map((s, j) => j === i ? { ...s, specialties: e.target.value } : s) }))} style={{ flex: 2, ...inputStyle }} />
                  </div>
                </div>
              ))}
              {isLC && (
                <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10, padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><MessageSquare size={16} color="#eab308" /><span style={{ fontWeight: 600, color: "#eab308", fontSize: "0.875rem" }}>Lead Delivery</span></div>
                  <p style={{ color: "#888", fontSize: "0.8rem", lineHeight: 1.5, marginBottom: "0.75rem" }}>How should we send you new leads?</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {(["sms", "email", "both"] as const).map(m => (
                      <button key={m} onClick={() => upd({ leadDeliveryMethod: m })} style={{ padding: "0.5rem 0.75rem", borderRadius: 6, border: profile.leadDeliveryMethod === m ? "1px solid #eab308" : "1px solid rgba(255,255,255,0.08)", background: profile.leadDeliveryMethod === m ? "rgba(234,179,8,0.1)" : "transparent", color: profile.leadDeliveryMethod === m ? "#eab308" : "#888", fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}>
                        {m === "sms" ? "📱 SMS" : m === "email" ? "📧 Email" : "📱📧 Both"}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.75rem" }}>
                    <input type={profile.leadDeliveryMethod === "email" ? "email" : "tel"} placeholder={profile.leadDeliveryMethod === "email" ? "Email for leads" : "Phone for SMS"} value={profile.leadDeliveryDestination} onChange={e => upd({ leadDeliveryDestination: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={goBack} style={btnSec}>Back</button>
                <button onClick={goNext} style={{ ...btnPri, flex: 2 }}>Continue <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {panel === "voice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Receptionist Name *</label><p style={{ color: "#666", fontSize: "0.75rem", marginBottom: "0.5rem" }}>The name the AI uses when answering calls</p><div style={{ position: "relative" }}><User size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666" }} /><input type="text" placeholder="e.g. Maya, Sophie, Alex" value={profile.receptionistName} onChange={e => upd({ receptionistName: e.target.value })} style={{ ...inputStyle, paddingLeft: 40 }} /></div></div>
              <div><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Voice Style</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {TTS_VOICES.map(v => (
                    <button key={v.id} onClick={() => upd({ ttsVoice: v.id })} style={{ padding: "0.75rem 0.5rem", borderRadius: 8, border: profile.ttsVoice === v.id ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.08)", background: profile.ttsVoice === v.id ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)", color: profile.ttsVoice === v.id ? "#fff" : "#888", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.125rem" }}>{v.name}</div>
                      <div style={{ fontSize: "0.7rem", color: profile.ttsVoice === v.id ? "#8b5cf6" : "#666" }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div><label style={{ color: "#ccc", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", display: "block" }}>Greeting Message</label><textarea value={profile.greeting} onChange={e => upd({ greeting: e.target.value })} rows={3} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: "0.875rem", outline: "none", resize: "vertical", fontFamily: "inherit" }} /><p style={{ color: "#555", fontSize: "0.7rem", marginTop: "0.25rem" }}>Use {"{business_name}"} and {"{receptionist_name}"} as placeholders</p></div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><Phone size={18} color="#8b5cf6" /><div><div style={{ color: "#fff", fontWeight: 500, fontSize: "0.875rem" }}>SMS Confirmations</div><div style={{ color: "#666", fontSize: "0.75rem" }}>Send text confirmations after bookings</div></div></div>
                <button onClick={() => upd({ smsConfirmation: !profile.smsConfirmation })} style={{ width: 44, height: 24, borderRadius: 12, background: profile.smsConfirmation ? "#8b5cf6" : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", position: "relative" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: profile.smsConfirmation ? 23 : 3, transition: "left 0.2s" }} />
                </button>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={goBack} style={btnSec}>Back</button>
                <button onClick={goNext} style={{ ...btnPri, flex: 2 }}>Continue <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {panel === "review" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "1.25rem", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}><Sparkles size={28} color="#10b981" /></div>
                <h3 style={{ color: "#fff", fontWeight: 600, fontSize: "1.125rem", marginBottom: "0.5rem" }}>Ready to Launch {profile.receptionistName}!</h3>
                <p style={{ color: "#888", fontSize: "0.875rem" }}>Review your setup, then we will create your AI receptionist</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Business", value: profile.businessName || "Not set", Icon: Building2 },
                  { label: "Provider", value: sel?.label || "None", Icon: Link2 },
                  { label: "Mode", value: isInt ? "Integrated Booking" : "Lead Capture", Icon: isInt ? Zap : MessageSquare },
                  { label: "Receptionist", value: `${profile.receptionistName} (${TTS_VOICES.find(v => v.id === profile.ttsVoice)?.name || "Echo"})`, Icon: Mic },
                  { label: "SMS", value: profile.smsConfirmation ? "Enabled" : "Disabled", Icon: Phone },
                  { label: "Team", value: `${profile.stylists.filter(s => s.isActive).length} stylist(s)`, Icon: Users },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><item.Icon size={16} color="#8b5cf6" /><span style={{ color: "#888", fontSize: "0.8rem" }}>{item.label}</span></div>
                    <span style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={goBack} style={btnSec}>Back</button>
                <button onClick={handleSave} disabled={saving} style={{ ...btnGrn, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : <><Check size={16} /> Launch {profile.receptionistName}</>}
                </button>
              </div>
            </div>
          )}
        </div>
        <p style={{ textAlign: "center", color: "#555", marginTop: "1.5rem", fontSize: "0.75rem" }}>Need help? <a href="mailto:support@clawstudio.co" style={{ color: "#888" }}>Contact support</a></p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
