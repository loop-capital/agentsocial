// ─── Review Response Templates for Salons/Beauty ───────────────────────────────
// Pre-built response templates categorized by rating, with salon-specific language.

interface TemplateData {
  rating: number;
  businessName: string;
  reviewerName: string;
  businessPhone: string;
}

const TEMPLATES: Record<number, string[]> = {
  5: [
    "Thank you so much, {name}! We're thrilled you loved your experience at {business}! 💇‍♀️✨",
    "{name}, your kind words made our day! Thank you for the 5-star review — we can't wait to see you again at {business}! 💖",
    "Wow, {name}, thank you for the amazing review! The team at {business} loves hearing from happy clients like you! 🌟",
    "{name}, thank you for taking the time to share your experience! We're so glad you loved your visit to {business}. See you next time! ✨",
    "Thank you, {name}! It was a pleasure having you at {business}. Your 5-star review means the world to our team! 🙏",
  ],
  4: [
    "Thanks, {name}! We appreciate your feedback and are glad you had a great visit to {business}. We'd love to make it 5 stars next time!",
    "{name}, thank you for the review! We're happy you enjoyed your visit to {business}. Let us know how we can exceed your expectations next time! 😊",
    "Thank you for the 4-star review, {name}! We're glad you had a good experience at {business}. If there's anything we can do better next time, please let us know!",
    "{name}, we really appreciate your feedback! At {business}, we always strive for 5 stars — we'd love to hear how we can improve your next visit.",
    "Thanks {name}! So glad you enjoyed your time at {business}. We noticed you left 4 stars — is there anything we could have done better? We'd love to earn that 5th star! ⭐",
  ],
  3: [
    "Thank you for your review, {name}. We're sorry we didn't quite hit the mark this time. Please reach out to us at {phone} so we can make it right.",
    "{name}, we appreciate your honest feedback. At {business}, we want every visit to be exceptional. Please call us at {phone} so we can make this right for you.",
    "We hear you, {name}, and we're sorry your experience at {business} wasn't up to our usual standard. We'd love the chance to make it right — please reach out at {phone}.",
    "Thank you for sharing your experience, {name}. This isn't the level of service we aim for at {business}. Please contact us at {phone} so we can discuss how to improve your next visit.",
    "{name}, we take 3-star reviews seriously at {business}. We'd love to learn more about what went wrong and make it right. Please call us at {phone}. 🙏",
  ],
  2: [
    "We're sorry to hear this, {name}. This isn't our standard at {business}. Please contact us at {phone} so we can address your concerns directly.",
    "{name}, we sincerely apologize for your experience at {business}. This is not acceptable to us either. Please reach out at {phone} so we can make things right.",
    "We're disappointed to hear about your visit, {name}. At {business}, we hold ourselves to a higher standard. Please call {phone} so we can discuss how to make this right.",
    "{name}, we're so sorry your experience fell short. We take this kind of feedback very seriously at {business}. Please contact us directly at {phone} — we want to make this right.",
    "We apologize, {name}. Your experience at {business} doesn't reflect the level of care we provide. Please call {phone} — we'd like to invite you back to show you what we're really about.",
  ],
  1: [
    "We apologize for your experience, {name}. We take this seriously at {business}. Please call us at {phone} — we want to make this right.",
    "{name}, we're truly sorry. This is not the experience we want anyone to have at {business}. Please reach out directly at {phone} so we can address this immediately.",
    "We're devastated to hear this, {name}. At {business}, client satisfaction is everything. Please call us at {phone} — we want to understand what happened and make it right.",
    "{name}, we sincerely apologize. This falls far short of our standards at {business}. Please contact us at {phone} — we'd like the chance to earn back your trust.",
    "We're so sorry, {name}. Your experience at {business} is unacceptable to us. Please call {phone} directly — we want to make this right and show you the {business} difference.",
  ],
};

/**
 * Generate a review response based on the rating.
 * Picks a random template variation and fills in the business/reviewer details.
 */
export function generateResponse(
  rating: number,
  businessName: string,
  reviewerName: string,
  businessPhone: string
): string {
  // Clamp rating to 1-5 range
  const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));

  const templates = TEMPLATES[clampedRating] ?? TEMPLATES[3]; // Default to 3-star if somehow missing
  const template = templates[Math.floor(Math.random() * templates.length)];

  return template
    .replace(/{name}/g, reviewerName || "there")
    .replace(/{business}/g, businessName)
    .replace(/{phone}/g, businessPhone);
}

/**
 * Get all available templates for a given rating.
 * Useful for showing template options in the UI.
 */
export function getTemplatesForRating(rating: number): string[] {
  const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
  return TEMPLATES[clampedRating] ?? TEMPLATES[3];
}

/**
 * Get all template categories with their rating levels.
 */
export function getAllTemplateCategories(): Record<string, number[]> {
  return {
    positive: [5, 4],
    neutral: [3],
    negative: [2, 1],
  };
}