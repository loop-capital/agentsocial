"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flag,
  StickyNote,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Ban,
  Clock,
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Settings2,
  Users,
} from "lucide-react";
import { api } from "../../../lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "low" | "medium" | "high" | "fraud";

interface RiskAssessment {
  riskLevel: RiskLevel;
  depositRequired: boolean;
  depositPercent: number;
  requirePrepayment: boolean;
  allowBooking: boolean;
  creditOnly: boolean;
  noProductSales: boolean;
  flags: FlagSummary[];
  clientFlagId: string | null;
  depositCheckout?: {
    checkoutUrl: string;
    paymentId: string;
    amountCents: number;
    riskLevel: RiskLevel;
    depositPercent: number;
  } | null;
}

interface FlagSummary {
  type: string;
  count: number;
  lastOccurrence: string | null;
}

interface ClientFlag {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  riskLevel: RiskLevel;
  noShowCount: number;
  negativeReviewCount: number;
  chargebackCount: number;
  refundCount: number;
  productReturnFraudCount: number;
  reviewExtortionCount: number;
  freeServiceExtractionCount: number;
  lastFlagAt: string | null;
  createdAt: string;
}

interface FlagEvent {
  id: string;
  flagType: string;
  description: string | null;
  evidence: string | null;
  appointmentLink: string | null;
  createdBy: string;
  createdAt: string;
}

interface PrivateNote {
  id: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

interface DepositPolicy {
  riskLevel: RiskLevel;
  depositPercent: number;
  requirePrepayment: boolean;
  allowBooking: boolean;
  creditOnly: boolean;
  noProductSales: boolean;
}

interface ClientsResponse {
  clients: ClientFlag[];
  total: number;
  page: number;
  limit: number;
}

// ─── Risk Config ──────────────────────────────────────────────────────────────

const riskColors: Record<RiskLevel, { bg: string; text: string; border: string; label: string }> = {
  low: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Low Risk" },
  medium: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Medium Risk" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "High Risk" },
  fraud: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Fraud" },
};

const riskDot: Record<RiskLevel, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  fraud: "bg-red-500",
};

const flagLabels: Record<string, string> = {
  no_show: "No-Show",
  late_cancel: "Late Cancel",
  negative_review: "Negative Review",
  review_extortion: "Review Extortion",
  chargeback: "Chargeback",
  refund_abuse: "Refund Abuse",
  product_return_fraud: "Product Return Fraud",
  free_service_extraction: "Free Service Extraction",
  other: "Other",
};

// ─── Helper Components ────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const c = riskColors[level];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${riskDot[level]}`} />
      {c.label}
    </span>
  );
}

function SectionCard({ title, icon, children, actions }: { title: string; icon?: React.ReactNode; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon size={40} className="text-gray-300 mb-3" strokeWidth={1.5} />
      <h3 className="text-base font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm">{description}</p>
    </div>
  );
}

// ─── Client Lookup Section ────────────────────────────────────────────────────

function ClientLookup({ brandId }: { brandId: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [clientData, setClientData] = useState<ClientFlag | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddFlag, setShowAddFlag] = useState(false);
  const [flagType, setFlagType] = useState("no_show");
  const [flagDesc, setFlagDesc] = useState("");
  const [flagEvidence, setFlagEvidence] = useState("");
  const [flagApptLink, setFlagApptLink] = useState("");
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [flagHistory, setFlagHistory] = useState<FlagEvent[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const lookupClient = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setAssessment(null);
    setClientData(null);
    setNotes([]);
    setFlagHistory([]);

    try {
      // Lookup client profile
      const lookupRes = await fetch(`${API_URL}/api/v1/clientvet/clients/${encodeURIComponent(query.trim())}?brandId=${brandId}`);
      let client: ClientFlag | null = null;
      if (lookupRes.ok) {
        const data = await lookupRes.json();
        client = data.client || data;
        setClientData(client);
      }

      // Also run booking check
      const body: Record<string, string | number> = { brandId: brandId, serviceAmountCents: 10000 };
      if (query.includes("@")) {
        body.email = query.trim();
      } else {
        body.phone = query.trim();
      }

      const checkRes = await fetch(`${API_URL}/api/v1/clientvet/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!checkRes.ok && !lookupRes.ok) {
        throw new Error("Client not found");
      }

      if (checkRes.ok) {
        const checkData: RiskAssessment = await checkRes.json();
        setAssessment(checkData);

        if (checkData.clientFlagId) {
          loadNotes(checkData.clientFlagId);
          loadFlagHistory(checkData.clientFlagId);
        }
      } else if (client) {
        // Fallback: build assessment from client data
        setAssessment({
          riskLevel: client.riskLevel,
          depositRequired: client.riskLevel === "high" || client.riskLevel === "fraud",
          depositPercent: client.riskLevel === "high" ? 50 : client.riskLevel === "fraud" ? 100 : 0,
          requirePrepayment: client.riskLevel === "fraud",
          allowBooking: client.riskLevel !== "fraud",
          creditOnly: client.riskLevel === "high" || client.riskLevel === "fraud",
          noProductSales: client.riskLevel === "fraud",
          flags: [
            ...(client.noShowCount > 0 ? [{ type: "no_show", count: client.noShowCount, lastOccurrence: client.lastFlagAt }] : []),
            ...(client.negativeReviewCount > 0 ? [{ type: "negative_review", count: client.negativeReviewCount, lastOccurrence: client.lastFlagAt }] : []),
            ...(client.chargebackCount > 0 ? [{ type: "chargeback", count: client.chargebackCount, lastOccurrence: client.lastFlagAt }] : []),
            ...(client.refundCount > 0 ? [{ type: "refund_abuse", count: client.refundCount, lastOccurrence: client.lastFlagAt }] : []),
            ...(client.productReturnFraudCount > 0 ? [{ type: "product_return_fraud", count: client.productReturnFraudCount, lastOccurrence: client.lastFlagAt }] : []),
            ...(client.reviewExtortionCount > 0 ? [{ type: "review_extortion", count: client.reviewExtortionCount, lastOccurrence: client.lastFlagAt }] : []),
            ...(client.freeServiceExtractionCount > 0 ? [{ type: "free_service_extraction", count: client.freeServiceExtractionCount, lastOccurrence: client.lastFlagAt }] : []),
          ],
          clientFlagId: client.id,
          depositCheckout: null,
        });
        loadNotes(client.id);
        loadFlagHistory(client.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to look up client");
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (clientFlagId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/clientvet/clients/${clientFlagId}/notes?brandId=${brandId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch {
      // Notes are optional
    }
  };

  const loadFlagHistory = async (clientFlagId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/clientvet/clients/${clientFlagId}/flags?brandId=${brandId}`);
      if (res.ok) {
        const data = await res.json();
        setFlagHistory(data.flags || data || []);
      }
    } catch {
      // Flag history is optional
    }
  };

  const addFlag = async () => {
    if (!assessment?.clientFlagId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/clientvet/clients/${assessment.clientFlagId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagType,
          description: flagDesc || undefined,
          evidence: flagEvidence || undefined,
          appointmentLink: flagApptLink || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add flag");
      // Re-lookup to refresh
      setShowAddFlag(false);
      setFlagDesc("");
      setFlagEvidence("");
      setFlagApptLink("");
      await lookupClient();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!assessment?.clientFlagId || !newNote.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/clientvet/clients/${assessment.clientFlagId}/notes?brandId=${brandId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        loadNotes(assessment.clientFlagId);
      }
    } catch {
      // Try again later
    }
  };

  const totalFlags = assessment?.flags.reduce((s, f) => s + f.count, 0) || 0;

  return (
    <SectionCard
      title="Client Lookup"
      icon={<Search size={20} />}
    >
      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupClient()}
            placeholder="Enter phone number or email address..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <button
          onClick={lookupClient}
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Lookup"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Results */}
      {assessment && (
        <div className="space-y-6">
          {/* Risk Level Header */}
          <div className={`rounded-xl border-2 p-5 ${riskColors[assessment.riskLevel].bg} ${riskColors[assessment.riskLevel].border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {clientData?.fullName || "Unknown Client"}
                </h3>
                <RiskBadge level={assessment.riskLevel} />
              </div>
              {totalFlags > 0 && (
                <span className="text-sm text-gray-500">{totalFlags} flag{totalFlags !== 1 ? "s" : ""}</span>
              )}
            </div>

            {/* Client Contact Info */}
            {clientData && (
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                {clientData.phone && (
                  <span className="flex items-center gap-1"><Phone size={14} /> {clientData.phone}</span>
                )}
                {clientData.email && (
                  <span className="flex items-center gap-1"><Mail size={14} /> {clientData.email}</span>
                )}
              </div>
            )}

            {/* Booking Status & Deposit */}
            <div className="bg-white/80 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-1.5">
                  {assessment.allowBooking ? (
                    <CheckCircle2 size={16} className="text-green-600" />
                  ) : (
                    <Ban size={16} className="text-red-600" />
                  )}
                  <span className={assessment.allowBooking ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                    {assessment.allowBooking ? "Booking Allowed" : "Booking Blocked"}
                  </span>
                </span>

                {assessment.depositRequired && (
                  <span className="flex items-center gap-1.5 text-orange-700 font-medium">
                    <CreditCard size={16} />
                    {assessment.depositPercent}% Deposit Required
                  </span>
                )}

                {assessment.creditOnly && (
                  <span className="flex items-center gap-1.5 text-red-700 text-sm">
                    <AlertTriangle size={14} />
                    Credit Only
                  </span>
                )}

                {assessment.noProductSales && (
                  <span className="flex items-center gap-1.5 text-red-700 text-sm">
                    <Ban size={14} />
                    No Product Sales
                  </span>
                )}

                {assessment.requirePrepayment && (
                  <span className="flex items-center gap-1.5 text-orange-700 text-sm">
                    <CreditCard size={14} />
                    Prepayment Required
                  </span>
                )}
              </div>

              {/* Deposit Payment Link */}
              {assessment.depositCheckout?.checkoutUrl && assessment.allowBooking && (
                <a
                  href={assessment.depositCheckout.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <CreditCard size={16} />
                  Pay Deposit via Square →
                </a>
              )}
            </div>
          </div>

          {/* Flag Summary Cards */}
          {assessment.flags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Flag Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {assessment.flags.map((flag, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                    <div className="text-xs text-gray-500 mb-1">{flagLabels[flag.type] || flag.type}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900">{flag.count}</span>
                      <span className="text-xs text-gray-400">
                        {flag.count === 1 ? "occurrence" : "occurrences"}
                      </span>
                    </div>
                    {flag.lastOccurrence && (
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={10} /> {new Date(flag.lastOccurrence).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddFlag(!showAddFlag)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Flag size={14} /> {showAddFlag ? "Cancel" : "Add Flag"}
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <StickyNote size={14} /> {showNotes ? "Hide Notes" : "Private Notes"}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Clock size={14} /> {showHistory ? "Hide History" : "Flag History"}
            </button>
          </div>

          {/* Add Flag Form */}
          {showAddFlag && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 mb-4">Add Flag</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flag Type</label>
                  <select
                    value={flagType}
                    onChange={(e) => setFlagType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.entries(flagLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Link (optional)</label>
                  <input
                    type="url"
                    value={flagApptLink}
                    onChange={(e) => setFlagApptLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={flagDesc}
                  onChange={(e) => setFlagDesc(e.target.value)}
                  placeholder="Describe the incident..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Evidence (optional)</label>
                <input
                  type="text"
                  value={flagEvidence}
                  onChange={(e) => setFlagEvidence(e.target.value)}
                  placeholder="Screenshot URL, reference number, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={addFlag}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Add Flag"}
              </button>
            </div>
          )}

          {/* Flag History */}
          {showHistory && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={16} /> Flag History
              </h4>
              {flagHistory.length === 0 ? (
                <p className="text-sm text-gray-400">No flag events recorded.</p>
              ) : (
                <div className="space-y-3">
                  {flagHistory.map((event, i) => (
                    <div key={event.id || i} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-0">
                      <div className={`absolute left-0 top-0.5 w-3 h-3 rounded-full border-2 border-white ${riskDot[assessment.riskLevel] || "bg-gray-400"} -translate-x-[7px]`} />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {flagLabels[event.flagType] || event.flagType}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(event.createdAt).toLocaleDateString()} {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                      )}
                      {event.evidence && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Eye size={10} /> Evidence: {event.evidence}
                        </p>
                      )}
                      <span className="text-xs text-gray-400">by {event.createdBy || "system"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Private Notes */}
          {showNotes && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <StickyNote size={16} /> Private Notes
                <span className="text-xs text-gray-400 font-normal ml-1">(visible to your business only)</span>
              </h4>

              {notes.length > 0 && (
                <div className="space-y-2 mb-4">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                      <p className="text-sm text-gray-800">{note.note}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{note.createdBy || "Unknown"}</span>
                        <span>·</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  placeholder="Add a private note..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no search yet */}
      {!assessment && !error && !loading && (
        <EmptyState
          icon={Shield}
          title="Look up a client"
          description="Enter a phone number or email to check risk level, flags, and booking eligibility."
        />
      )}

      {loading && !assessment && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      )}
    </SectionCard>
  );
}

// ─── Flagged Clients Table ────────────────────────────────────────────────────

function FlaggedClientsTable({ brandId }: { brandId: string }) {
  const [clients, setClients] = useState<ClientFlag[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("lastFlagAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        brandId: brandId,
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (riskFilter !== "all") params.set("riskLevel", riskFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);

      const res = await fetch(`${API_URL}/api/v1/clientvet/clients?${params}`);
      if (res.ok) {
        const data: ClientsResponse = await res.json();
        setClients(data.clients || []);
        setTotal(data.total || 0);
      }
    } catch {
      // Table will show empty
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, riskFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const totalPages = Math.ceil(total / limit);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const totalFlagCount = (c: ClientFlag) =>
    c.noShowCount + c.negativeReviewCount + c.chargebackCount + c.refundCount + c.productReturnFraudCount + c.reviewExtortionCount + c.freeServiceExtractionCount;

  return (
    <SectionCard
      title="Flagged Clients"
      icon={<Users size={20} />}
      actions={
        <span className="text-sm text-gray-500">{total} client{total !== 1 ? "s" : ""}</span>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value as RiskLevel | "all"); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
          <option value="fraud">Fraud</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No flagged clients"
          description="When clients are flagged for no-shows, chargebacks, or other issues, they'll appear here."
        />
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-6 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("fullName")}>
                  Name {sortBy === "fullName" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("riskLevel")}>
                  Risk Level {sortBy === "riskLevel" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("lastFlagAt")}>
                  Last Flag {sortBy === "lastFlagAt" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Flags</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const c = riskColors[client.riskLevel];
                return (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          {(client.fullName || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{client.fullName || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-600">
                        {client.phone && <div className="flex items-center gap-1 text-xs"><Phone size={12} /> {client.phone}</div>}
                        {client.email && <div className="flex items-center gap-1 text-xs"><Mail size={12} /> {client.email}</div>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={client.riskLevel} />
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {client.lastFlagAt
                        ? new Date(client.lastFlagAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                        {totalFlagCount(client)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Booking Check Section ────────────────────────────────────────────────────

function BookingCheck({ brandId }: { brandId: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkClient = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string | number> = { brandId: brandId, serviceAmountCents: 10000 };
      if (query.includes("@")) {
        body.email = query.trim();
      } else {
        body.phone = query.trim();
      }

      const res = await fetch(`${API_URL}/api/v1/clientvet/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Client check failed");
      const data: RiskAssessment = await res.json();
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || "Failed to check client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard
      title="Booking Check"
      icon={<Shield size={20} />}
    >
      <p className="text-sm text-gray-500 mb-4">
        Simulate the booking flow — check a client&apos;s risk level and deposit requirements before confirming an appointment.
      </p>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkClient()}
            placeholder="Phone or email for booking check..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <button
          onClick={checkClient}
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Check"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {assessment && (
        <div className={`rounded-xl border-2 p-5 ${riskColors[assessment.riskLevel].bg} ${riskColors[assessment.riskLevel].border}`}>
          {/* Risk Level */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Booking Assessment</h3>
            <RiskBadge level={assessment.riskLevel} />
          </div>

          <div className="bg-white/80 rounded-lg p-4 space-y-3">
            {/* Booking Status */}
            <div className="flex items-center gap-2">
              {assessment.allowBooking ? (
                <CheckCircle2 size={20} className="text-green-600" />
              ) : (
                <XCircle size={20} className="text-red-600" />
              )}
              <span className={`font-semibold ${assessment.allowBooking ? "text-green-700" : "text-red-700"}`}>
                {assessment.allowBooking ? "Booking Allowed" : "⛔ Booking Blocked"}
              </span>
            </div>

            {/* Deposit Info */}
            {assessment.depositRequired && (
              <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <CreditCard size={18} className="text-orange-600" />
                <div>
                  <span className="font-semibold text-orange-800">
                    Deposit Required: {assessment.depositPercent}%
                  </span>
                  {assessment.requirePrepayment && (
                    <span className="block text-xs text-orange-700">Full prepayment required</span>
                  )}
                </div>
              </div>
            )}

            {/* Restrictions */}
            {assessment.creditOnly && (
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle size={14} /> Refunds as credit only — no cash refunds
              </div>
            )}
            {assessment.noProductSales && (
              <div className="flex items-center gap-2 text-sm text-red-700">
                <Ban size={14} /> Product sales restricted — service appointments only
              </div>
            )}

            {/* Create Payment Link */}
            {assessment.depositCheckout?.checkoutUrl && assessment.allowBooking && (
              <a
                href={assessment.depositCheckout.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <CreditCard size={16} />
                Create Square Payment Link
              </a>
            )}
          </div>
        </div>
      )}

      {!assessment && !error && !loading && (
        <EmptyState
          icon={Shield}
          title="Check before booking"
          description="Enter a phone number or email to see if a deposit is required or if booking should be blocked."
        />
      )}
    </SectionCard>
  );
}

// ─── Deposit Policy Settings ──────────────────────────────────────────────────

function DepositPolicySettings({ brandId }: { brandId: string }) {
  const [policies, setPolicies] = useState<DepositPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultPolicies: DepositPolicy[] = [
    { riskLevel: "low", depositPercent: 0, requirePrepayment: false, allowBooking: true, creditOnly: false, noProductSales: false },
    { riskLevel: "medium", depositPercent: 25, requirePrepayment: false, allowBooking: true, creditOnly: false, noProductSales: false },
    { riskLevel: "high", depositPercent: 50, requirePrepayment: false, allowBooking: true, creditOnly: true, noProductSales: false },
    { riskLevel: "fraud", depositPercent: 100, requirePrepayment: true, allowBooking: false, creditOnly: true, noProductSales: true },
  ];

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/clientvet/deposits/${brandId}`);
      if (res.ok) {
        const data = await res.json();
        setPolicies(data.policies || data || defaultPolicies);
      } else {
        setPolicies(defaultPolicies);
      }
    } catch {
      setPolicies(defaultPolicies);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const updatePolicy = (index: number, field: keyof DepositPolicy, value: number | boolean) => {
    setPolicies(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const savePolicies = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/clientvet/deposits/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies }),
      });
      if (!res.ok) throw new Error("Failed to save deposit policies");
      setSuccessMessage("Deposit policies saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SectionCard title="Deposit Policy Settings" icon={<Settings2 size={20} />}>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Deposit Policy Settings"
      icon={<Settings2 size={20} />}
      actions={
        <button
          onClick={savePolicies}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
        </button>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {policies.map((policy, idx) => {
          const c = riskColors[policy.riskLevel];
          return (
            <div key={policy.riskLevel} className={`rounded-xl border-2 p-5 ${c.bg} ${c.border}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 capitalize">
                  {policy.riskLevel} Risk Policy
                </h3>
                <RiskBadge level={policy.riskLevel} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.depositPercent}
                    onChange={(e) => updatePolicy(idx, "depositPercent", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.requirePrepayment}
                      onChange={(e) => updatePolicy(idx, "requirePrepayment", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Require Prepayment</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.allowBooking}
                      onChange={(e) => updatePolicy(idx, "allowBooking", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Allow Booking</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.creditOnly}
                      onChange={(e) => updatePolicy(idx, "creditOnly", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Credit Only (No Cash Refunds)</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.noProductSales}
                      onChange={(e) => updatePolicy(idx, "noProductSales", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">No Product Sales</span>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ClientVetPage() {
  const [activeTab, setActiveTab] = useState<"lookup" | "clients" | "booking" | "deposits">("lookup");
  const [brandId, setBrandId] = useState<string>("");
  const [brandLoading, setBrandLoading] = useState(true);

  // Load brand from auth context
  useEffect(() => {
    (async () => {
      try {
        const brandsRes = await api.brands.list();
        const userBrands = brandsRes.data || [];
        if (userBrands.length > 0) {
          setBrandId(userBrands[0].id);
        }
      } catch (err) {
        console.error("[ClientVet] Failed to load brands:", err);
      } finally {
        setBrandLoading(false);
      }
    })();
  }, []);

  if (brandLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!brandId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900">No Brand Found</h2>
        <p className="text-gray-500 mt-1">Please create a brand in Settings before using ClientVet.</p>
      </div>
    );
  }

  const tabs = [
    { id: "lookup" as const, label: "Client Lookup", icon: Search },
    { id: "clients" as const, label: "Flagged Clients", icon: Users },
    { id: "booking" as const, label: "Booking Check", icon: Shield },
    { id: "deposits" as const, label: "Deposit Policies", icon: Settings2 },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ClientVet</h1>
        <p className="text-gray-500 mt-1">Protect your business from no-shows, chargebacks, and problem clients</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "lookup" && <ClientLookup brandId={brandId} />}
      {activeTab === "clients" && <FlaggedClientsTable brandId={brandId} />}
      {activeTab === "booking" && <BookingCheck brandId={brandId} />}
      {activeTab === "deposits" && <DepositPolicySettings brandId={brandId} />}
    </div>
  );
}