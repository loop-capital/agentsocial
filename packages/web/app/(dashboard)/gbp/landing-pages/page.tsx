"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  BarChart3,
  Loader2,
  AlertCircle,
  LayoutTemplate,
  Copy,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateType = "salon_promo" | "new_client" | "service_highlight";
type UrgencyType = "countdown" | "limited_spots" | "seasonal";

interface LandingPage {
  id: string;
  brandId: string;
  slug: string;
  title: string;
  templateType: TemplateType;
  headline: string;
  subheadline: string | null;
  offerText: string | null;
  originalPrice: string | null;
  salePrice: string | null;
  ctaText: string;
  ctaUrl: string | null;
  businessName: string;
  businessCategory: string | null;
  phone: string | null;
  address: string | null;
  reviews: Array<{ name: string; rating: number; text: string; date?: string }>;
  features: Array<{ icon?: string; title: string; description?: string }>;
  urgencyType: UrgencyType | null;
  urgencyConfig: Record<string, unknown> | null;
  isPublished: boolean;
  publishedAt: string | null;
  conversionTrackingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConversionStats {
  impressions: number;
  clicks: number;
  formStarts: number;
  bookings: number;
}

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  salon_promo: "🌸 Salon Promo",
  new_client: "🆕 New Client Special",
  service_highlight: "✨ Service Highlight",
};

const TEMPLATE_COLORS: Record<TemplateType, string> = {
  salon_promo: "bg-purple-100 text-purple-700",
  new_client: "bg-amber-100 text-amber-700",
  service_highlight: "bg-emerald-100 text-emerald-700",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LandingPagesManager() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const BRAND_ID = "00000000-0000-0000-0000-000000000000";

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/landing-pages?brandId=${BRAND_ID}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch landing pages");
      const { data } = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handlePublishToggle = async (page: LandingPage) => {
    try {
      const endpoint = page.isPublished ? "unpublish" : "publish";
      const res = await fetch(`${API_BASE}/api/v1/landing-pages/${page.slug}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to update publish status");
      const { data } = await res.json();
      setPages((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (page: LandingPage) => {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/landing-pages/${page.slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete landing page");
      setPages((prev) => prev.filter((p) => p.id !== page.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyLink = (slug: string) => {
    const url = `https://getuplook.com/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error && pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchPages(); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const publishedCount = pages.filter((p) => p.isPublished).length;
  const draftCount = pages.length - publishedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage ad landing pages for your campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Landing Page
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Pages"
          value={pages.length.toString()}
          icon={<LayoutTemplate className="w-5 h-5" />}
        />
        <StatCard
          label="Published"
          value={publishedCount.toString()}
          icon={<Eye className="w-5 h-5 text-green-500" />}
          changeType="positive"
        />
        <StatCard
          label="Drafts"
          value={draftCount.toString()}
          icon={<Edit3 className="w-5 h-5 text-gray-400" />}
        />
      </div>

      {/* Page List */}
      {pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <LayoutTemplate className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Landing Pages Yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first landing page for your ad campaigns. Choose from professional templates designed to convert.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Landing Page
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{page.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TEMPLATE_COLORS[page.templateType]}`}>
                      {TEMPLATE_LABELS[page.templateType]}
                    </span>
                    {page.isPublished ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{page.headline}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      /{page.slug}
                      <button
                        onClick={() => copyLink(page.slug)}
                        className="text-indigo-500 hover:text-indigo-600"
                        title="Copy link"
                      >
                        {copiedSlug === page.slug ? "✓" : <Copy className="w-3 h-3" />}
                      </button>
                    </span>
                    {page.offerText && <span>📌 {page.offerText}</span>}
                    {page.salePrice && (
                      <span>
                        {page.originalPrice && <span className="line-through">${page.originalPrice}</span>}
                        <span className="font-semibold text-gray-700 ml-1">${page.salePrice}</span>
                      </span>
                    )}
                    <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {page.isPublished && (
                    <a
                      href={`/landing/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handlePublishToggle(page)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      page.isPublished
                        ? "text-amber-600 hover:bg-amber-50"
                        : "text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {page.isPublished ? (
                      <><EyeOff className="w-4 h-4" /> Unpublish</>
                    ) : (
                      <><Eye className="w-4 h-4" /> Publish</>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingPage(page)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(page)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <LandingPageFormModal
          onClose={() => setShowCreateModal(false)}
          onSaved={() => { setShowCreateModal(false); fetchPages(); }}
          brandId={BRAND_ID}
        />
      )}

      {/* Edit Modal */}
      {editingPage && (
        <LandingPageFormModal
          onClose={() => setEditingPage(null)}
          onSaved={() => { setEditingPage(null); fetchPages(); }}
          brandId={BRAND_ID}
          existingPage={editingPage}
        />
      )}
    </div>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface FormModalProps {
  onClose: () => void;
  onSaved: () => void;
  brandId: string;
  existingPage?: LandingPage | null;
}

function LandingPageFormModal({ onClose, onSaved, brandId, existingPage }: FormModalProps) {
  const isEdit = !!existingPage;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: existingPage?.title || "",
    templateType: (existingPage?.templateType || "salon_promo") as TemplateType,
    headline: existingPage?.headline || "",
    subheadline: existingPage?.subheadline || "",
    offerText: existingPage?.offerText || "",
    originalPrice: existingPage?.originalPrice || "",
    salePrice: existingPage?.salePrice || "",
    ctaText: existingPage?.ctaText || "Book Now",
    ctaUrl: existingPage?.ctaUrl || "",
    businessName: existingPage?.businessName || "",
    businessCategory: existingPage?.businessCategory || "",
    phone: existingPage?.phone || "",
    address: existingPage?.address || "",
    urgencyType: (existingPage?.urgencyType || "") as UrgencyType | "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        brandId,
        ...form,
        templateType: form.templateType || "salon_promo",
        urgencyType: form.urgencyType || null,
        subheadline: form.subheadline || null,
        offerText: form.offerText || null,
        originalPrice: form.originalPrice || null,
        salePrice: form.salePrice || null,
        ctaUrl: form.ctaUrl || null,
        businessCategory: form.businessCategory || null,
        phone: form.phone || null,
        address: form.address || null,
        reviews: existingPage?.reviews || [],
        features: existingPage?.features || [],
      };

      const url = isEdit
        ? `${API_BASE}/api/v1/landing-pages/${existingPage!.slug}`
        : `${API_BASE}/api/v1/landing-pages`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to save landing page");
      }
      onSaved();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Edit Landing Page" : "Create Landing Page"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <div className="grid grid-cols-3 gap-3">
              {(["salon_promo", "new_client", "service_highlight"] as TemplateType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, templateType: t }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    form.templateType === t
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  {TEMPLATE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Spring Glow Promo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Pleij Salon"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline *</label>
            <input
              type="text"
              required
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Get Your Spring Glow On"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
            <input
              type="text"
              value={form.subheadline}
              onChange={(e) => setForm((f) => ({ ...f, subheadline: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Limited time offer for new and returning clients"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Text</label>
            <input
              type="text"
              value={form.offerText}
              onChange={(e) => setForm((f) => ({ ...f, offerText: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="50% Off Your First Visit"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
              <input
                type="text"
                value={form.originalPrice}
                onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
              <input
                type="text"
                value={form.salePrice}
                onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="59"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text</label>
              <input
                type="text"
                value={form.ctaText}
                onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Book Now"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA URL (booking link)</label>
              <input
                type="url"
                value={form.ctaUrl}
                onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="https://book.squareup.com/..."
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
              <input
                type="text"
                value={form.businessCategory}
                onChange={(e) => setForm((f) => ({ ...f, businessCategory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Hair Salon"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="123 Main St, City, ST 12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Type</label>
            <select
              value={form.urgencyType}
              onChange={(e) => setForm((f) => ({ ...f, urgencyType: e.target.value as UrgencyType | "" }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">None</option>
              <option value="countdown">⏰ Countdown Timer</option>
              <option value="limited_spots">🔥 Limited Spots</option>
              <option value="seasonal">🌟 Seasonal</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}