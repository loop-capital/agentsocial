"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessInfo {
  name: string;
  logo?: string;
  slug: string;
  googlePlaceId: string;
  googleReviewUrl: string;
  primaryColor: string;
}

interface RateResponse {
  success: boolean;
  rating?: number;
  feedbackId?: string;
  redirectUrl?: string;
  message?: string;
}

// ─── Star Rating Component ─────────────────────────────────────────────────────

function StarRating({
  rating,
  onRate,
  interactive = true,
}: {
  rating: number;
  onRate?: (stars: number) => void;
  interactive?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`text-4xl transition-all duration-150 ${
            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
          } ${
            star <= (hovered || rating)
              ? "text-amber-400 drop-shadow-md"
              : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Feedback Form Component ───────────────────────────────────────────────────

function FeedbackForm({
  onSubmit,
  businessName,
}: {
  onSubmit: (data: { name: string; email: string; details: string }) => void;
  businessName: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          We&apos;re sorry to hear that 😔
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Your feedback helps {businessName} improve. Tell us what happened and
          we&apos;ll follow up personally.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What happened?
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            placeholder="Please share the details of your experience..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      <button
        onClick={() => onSubmit({ name, email, details })}
        className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
      >
        Submit Feedback
      </button>

      <p className="text-xs text-gray-400 text-center">
        We&apos;ll follow up within 24 hours.
      </p>
    </div>
  );
}

// ─── Thank You Component (Positive) ────────────────────────────────────────────

function ThankYouPositive({
  businessName,
  googleReviewUrl,
  onClose,
}: {
  businessName: string;
  googleReviewUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">🎉</div>
      <h2 className="text-xl font-semibold text-gray-900">
        Thank you, {businessName} appreciates you!
      </h2>
      <p className="text-sm text-gray-500">
        Would you mind sharing your experience on Google? It helps small
        businesses like ours so much!
      </p>

      <a
        href={googleReviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3.5 bg-[#4285F4] text-white rounded-xl font-semibold hover:bg-[#3367D6] transition-colors shadow-lg shadow-blue-200"
      >
        Leave a Google Review →
      </a>

      <button
        onClick={onClose}
        className="block w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        No thanks
      </button>

      <p className="text-xs text-gray-400">
        Reviews help small businesses like {businessName} grow. Thank you! 🙏
      </p>
    </div>
  );
}

// ─── Thank You Component (Negative) ────────────────────────────────────────────

function ThankYouNegative({ businessName }: { businessName: string }) {
  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">💜</div>
      <h2 className="text-xl font-semibold text-gray-900">
        Thank you for your feedback
      </h2>
      <p className="text-sm text-gray-500">
        {businessName} takes every concern seriously. Someone from the team will
        reach out to you within 24 hours.
      </p>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function ReviewPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [step, setStep] = useState<
    "rating" | "positive" | "negative" | "thankyou-positive" | "thankyou-negative"
  >("rating");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/v1/review-sentry/business/${slug}`
        );
        if (!res.ok) throw new Error("Business not found");
        const data = await res.json();
        setBusiness(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchBusiness();
  }, [slug]);

  const handleRate = async (stars: number) => {
    setRating(stars);
    setSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/v1/review-sentry/rate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, rating: stars }),
        }
      );
      const data: RateResponse = await res.json();

      if (stars >= 4) {
        setStep("positive");
      } else {
        setStep("negative");
      }
    } catch {
      // Still route even if API fails
      if (stars >= 4) {
        setStep("positive");
      } else {
        setStep("negative");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = async (data: {
    name: string;
    email: string;
    details: string;
  }) => {
    setSubmitting(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/v1/review-sentry/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            rating,
            name: data.name,
            email: data.email,
            details: data.details,
          }),
        }
      );
    } catch {
      // Continue even if API fails
    }
    setStep("thankyou-negative");
    setSubmitting(false);
  };

  const handlePositiveClose = () => {
    setStep("thankyou-positive");
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-semibold text-gray-900">
            Business Not Found
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            We couldn&apos;t find this business. The link may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────

  const primaryColor = business.primaryColor || "#4F46E5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        style={{ borderTop: `4px solid ${primaryColor}` }}
      >
        {/* Business Header */}
        <div className="text-center mb-6">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {business.name.charAt(0)}
            </div>
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {business.name}
          </h1>
          {step === "rating" && (
            <p className="text-sm text-gray-500 mt-1">
              How was your experience?
            </p>
          )}
        </div>

        {/* Step Content */}
        {submitting ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : step === "rating" ? (
          <div className="space-y-6">
            <StarRating rating={rating} onRate={handleRate} />
            <p className="text-center text-xs text-gray-400">
              Tap a star to rate your experience
            </p>
          </div>
        ) : step === "positive" ? (
          <ThankYouPositive
            businessName={business.name}
            googleReviewUrl={
              business.googleReviewUrl ||
              `https://search.google.com/local/writereview?placeid=${business.googlePlaceId}`
            }
            onClose={handlePositiveClose}
          />
        ) : step === "negative" ? (
          <FeedbackForm
            onSubmit={handleFeedback}
            businessName={business.name}
          />
        ) : step === "thankyou-positive" ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✨</div>
            <h2 className="text-xl font-semibold text-gray-900">
              Thank you!
            </h2>
            <p className="text-sm text-gray-500">
              Your review means the world to {business.name}.
            </p>
          </div>
        ) : (
          <ThankYouNegative businessName={business.name} />
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <span className="font-medium text-gray-500">Review Sentry</span>
          </p>
        </div>
      </div>
    </div>
  );
}