'use client';

import React from 'react';

/**
 * GetUpLook Badge — Embeddable Widget
 *
 * Usage: Place the following snippet on any website to show the "Listed on GetUpLook" badge.
 *
 * <script>
 *   (function() {
 *     var s = document.createElement('script');
 *     s.src = 'https://cdn.getuplook.com/badge.js';
 *     s.setAttribute('data-slug', 'pleij-salon-spa');
 *     s.setAttribute('data-variant', 'compact');
 *     s.async = 1;
 *     document.head.appendChild(s);
 *   })();
 * </script>
 *
 * Or use the React component directly:
 * <GetUpLookBadgeEmbed slug="pleij-salon-spa" variant="compact" />
 */

interface GetUpLookBadgeEmbedProps {
  slug: string;
  variant?: 'compact' | 'card' | 'banner';
  businessName?: string;
  rating?: number;
  reviewCount?: number;
}

export function GetUpLookBadgeEmbed({
  slug,
  variant = 'compact',
  businessName,
  rating,
  reviewCount,
}: GetUpLookBadgeEmbedProps) {
  return (
    <div
      id="getuplook-badge"
      data-slug={slug}
      data-variant={variant}
      data-business-name={businessName}
      data-rating={rating}
      data-review-count={reviewCount}
    />
  );
}

/**
 * Generates an embeddable <script> snippet for use on external websites.
 */
export function generateBadgeEmbedScript(opts: {
  slug: string;
  variant?: 'compact' | 'card' | 'banner';
}): string {
  const variant = opts.variant || 'compact';
  return `<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://cdn.getuplook.com/badge.js';
    s.setAttribute('data-slug', '${opts.slug}');
    s.setAttribute('data-variant', '${variant}');
    s.async = 1;
    (document.body || document.head).appendChild(s);
  })();
</script>`;
}

export default GetUpLookBadgeEmbed;