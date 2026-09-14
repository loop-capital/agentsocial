'use client';

import React from 'react';
import Link from 'next/link';

// GetUpLook SVG Logo Mark
const GetUpLookLogo = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#059669" />
    <path d="M8 22V10h3.5c2 0 3.5 1.2 3.5 3.2 0 1.4-.7 2.4-1.9 2.9l2.4 5.9h-2.8l-2-5h-.7v5H8zm2-7h1.3c1 0 1.7-.5 1.7-1.6 0-1-.7-1.6-1.7-1.6H10v3.2z" fill="white"/>
    <path d="M17.5 22V10h5.3v1.9h-3.3v3h2.8v1.9h-2.8v3.3h3.3V22h-5.3z" fill="white"/>
    <circle cx="24" cy="10" r="2" fill="#34D399"/>
  </svg>
);

type BadgeVariant = 'compact' | 'card' | 'banner';

interface GetUpLookBadgeProps {
  businessName: string;
  slug: string;
  rating?: number;
  reviewCount?: number;
  variant?: BadgeVariant;
}

const href = (slug: string) => `https://getuplook.com/${slug}`;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function GetUpLookBadge({
  businessName,
  slug,
  rating,
  reviewCount,
  variant = 'compact',
}: GetUpLookBadgeProps) {
  if (variant === 'compact') {
    return (
      <Link
        href={href(slug)}
        target="_blank"
        rel="noopener noreferrer"
        title={`See ${businessName} on GetUpLook`}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors group"
      >
        <GetUpLookLogo className="w-4 h-4" />
        <span className="group-hover:underline">Listed on GetUpLook</span>
        {rating != null && (
          <>
            <span className="text-emerald-600">·</span>
            <span className="flex items-center gap-1">
              <StarRating rating={rating} />
              <span className="text-xs text-emerald-600">{rating}</span>
            </span>
          </>
        )}
      </Link>
    );
  }

  if (variant === 'card') {
    return (
      <Link
        href={href(slug)}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-xs rounded-xl border border-emerald-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
      >
        <div className="flex items-center gap-3 mb-3">
          <GetUpLookLogo className="w-8 h-8" />
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
              {businessName}
            </p>
            <p className="text-xs text-gray-500">Listed on GetUpLook</p>
          </div>
        </div>
        {rating != null && (
          <div className="flex items-center gap-2">
            <StarRating rating={rating} />
            <span className="text-sm font-semibold text-gray-900">{rating}</span>
            {reviewCount != null && (
              <span className="text-xs text-gray-500">({reviewCount} reviews)</span>
            )}
          </div>
        )}
        <div className="mt-3 text-xs text-emerald-600 font-medium group-hover:underline">
          View profile →
        </div>
      </Link>
    );
  }

  // banner variant
  return (
    <Link
      href={href(slug)}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 sm:p-6 text-white hover:from-emerald-700 hover:to-emerald-600 transition-all group"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <GetUpLookLogo className="w-8 h-8" />
          </div>
          <div>
            <p className="font-bold text-lg">{businessName}</p>
            <p className="text-emerald-100 text-sm">Listed on GetUpLook — Your Local Discovery Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {rating != null && (
            <div className="text-center">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-300' : 'text-white/40'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm mt-0.5">
                <span className="font-bold">{rating}</span>
                {reviewCount != null && <span className="text-emerald-100"> · {reviewCount} reviews</span>}
              </p>
            </div>
          )}
          <div className="bg-white text-emerald-700 font-semibold px-4 py-2 rounded-lg text-sm group-hover:bg-emerald-50 transition-colors">
            View Profile →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default GetUpLookBadge;