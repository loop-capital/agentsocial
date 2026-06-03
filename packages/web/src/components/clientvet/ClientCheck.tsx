"use client";

import { useState, useEffect } from "react";

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

interface PrivateNote {
  id: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

// ─── Risk Level Badge ─────────────────────────────────────────────────────────

const riskColors: Record<RiskLevel, { bg: string; text: string; border: string; label: string }> = {
  low: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Low Risk" },
  medium: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Medium Risk" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "High Risk" },
  fraud: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Fraud" },
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = riskColors[level];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
}

// ─── Flag Type Labels ─────────────────────────────────────────────────────────

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

// ─── ClientCheck Component ────────────────────────────────────────────────────

interface ClientCheckProps {
  brandId: string;
  onRiskDetermined?: (assessment: RiskAssessment) => void;
}

export default function ClientCheck({ brandId, onRiskDetermined }: ClientCheckProps) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddFlag, setShowAddFlag] = useState(false);
  const [flagType, setFlagType] = useState("no_show");
  const [flagDesc, setFlagDesc] = useState("");
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [depositUrl, setDepositUrl] = useState<string | null>(null);

  // ─── Check Client ────────────────────────────────────────────────────────

  const checkClient = async () => {
    if (!phone && !email) {
      setError("Enter a phone number or email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/clientvet/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone || undefined,
          email: email || undefined,
          brandId,
          serviceAmountCents: 10000, // $100 default, for deposit calculation
        }),
      });

      if (!res.ok) throw new Error("Failed to check client");

      const data: RiskAssessment = await res.json();
      setAssessment(data);
      if (data.depositCheckout?.checkoutUrl) {
        setDepositUrl(data.depositCheckout.checkoutUrl);
      }
      onRiskDetermined?.(data);

      // Load private notes if client exists
      if (data.clientFlagId) {
        loadNotes(data.clientFlagId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to check client");
    } finally {
      setLoading(false);
    }
  };

  // ─── Load Private Notes ────────────────────────────────────────────────────

  const loadNotes = async (clientFlagId: string) => {
    try {
      const res = await fetch(`/api/v1/clientvet/clients/${clientFlagId}/notes?brandId=${brandId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch {
      // Notes are optional
    }
  };

  // ─── Add Flag ─────────────────────────────────────────────────────────────

  const addFlag = async () => {
    if (!assessment?.clientFlagId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/clientvet/clients/${assessment.clientFlagId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagType,
          description: flagDesc || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to add flag");

      const data = await res.json();
      setAssessment({ ...assessment, ...data.assessment });
      setShowAddFlag(false);
      setFlagDesc("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Add Private Note ──────────────────────────────────────────────────────

  const addNote = async () => {
    if (!assessment?.clientFlagId || !newNote.trim()) return;

    try {
      const res = await fetch(`/api/v1/clientvet/clients/${assessment.clientFlagId}/notes?brandId=${brandId}`, {
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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Client Risk Check</h2>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={checkClient}
          disabled={loading || (!phone && !email)}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Checking..." : "Check Client"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Assessment Results */}
      {assessment && (
        <>
          {/* Risk Level Card */}
          <div className={`rounded-xl border-2 p-6 mb-6 ${riskColors[assessment.riskLevel].bg} ${riskColors[assessment.riskLevel].border}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
              <RiskBadge level={assessment.riskLevel} />
            </div>

            {/* Deposit Requirement */}
            {assessment.depositRequired && (
              <div className="bg-white/80 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-semibold text-gray-900">
                    {assessment.depositPercent}% Deposit Required
                  </span>
                </div>
                {assessment.requirePrepayment && (
                  <p className="text-sm text-orange-700">Full prepayment required before booking confirmation</p>
                )}
                {assessment.creditOnly && (
                  <p className="text-sm text-red-700">⚠️ Refunds issued as credit only — no cash refunds</p>
                )}
                {assessment.noProductSales && (
                  <p className="text-sm text-red-700">⚠️ Product sales restricted — service appointments only</p>
                )}
                {!assessment.allowBooking && (
                  <p className="text-sm text-red-700 font-bold">⛔ Booking denied — contact salon directly</p>
                )}
                {depositUrl && assessment.allowBooking && (
                  <a
                    href={depositUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Pay Deposit via Square →
                  </a>
                )}
              </div>
            )}

            {/* Flag History */}
            {assessment.flags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Flag History</h4>
                <div className="space-y-2">
                  {assessment.flags.map((flag, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-gray-800">
                        {flagLabels[flag.type] || flag.type}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {flag.count} {flag.count === 1 ? "occurrence" : "occurrences"}
                        </span>
                        {flag.lastOccurrence && (
                          <span className="text-xs text-gray-500">
                            Last: {new Date(flag.lastOccurrence).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowAddFlag(!showAddFlag)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              {showAddFlag ? "Cancel" : "🚩 Add Flag"}
            </button>
            {assessment.clientFlagId && (
              <button
                onClick={() => loadNotes(assessment.clientFlagId!)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                📝 Private Notes
              </button>
            )}
          </div>

          {/* Add Flag Form */}
          {showAddFlag && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Add Flag</h4>
              <select
                value={flagType}
                onChange={(e) => setFlagType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
              >
                {Object.entries(flagLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <textarea
                value={flagDesc}
                onChange={(e) => setFlagDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 h-20 resize-none"
              />
              <button
                onClick={addFlag}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                Add Flag
              </button>
            </div>
          )}

          {/* Private Notes */}
          {notes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                🔒 Private Notes
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (visible to your business only)
                </span>
              </h4>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-800">{note.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Note */}
          {assessment.clientFlagId && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a private note..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addNote()}
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                Save
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}