// SMS Templates for Review Sentry
// Each template includes variables: {customer_name}, {business_name}, {review_url}

export interface TemplateVars {
  customer_name: string;
  business_name: string;
  review_url: string;
}

export const SMS_TEMPLATES: Record<string, { id: string; name: string; body: string }> = {
  thank_you: {
    id: "thank_you",
    name: "Thank You (Default)",
    body: "Hi {customer_name}! Thank you for visiting {business_name}. We'd love your feedback: {review_url}\n\nReply STOP to unsubscribe",
  },
  experience_matters: {
    id: "experience_matters",
    name: "Your Experience Matters",
    body: "Your experience at {business_name} matters! Share your thoughts: {review_url}\n\nReply STOP to unsubscribe",
  },
  loved_your_visit: {
    id: "loved_your_visit",
    name: "We Hope You Loved Your Visit",
    body: "We hope you loved your visit to {business_name}! Tell us how we did: {review_url}\n\nReply STOP to unsubscribe",
  },
  quick_rating: {
    id: "quick_rating",
    name: "Quick Rating",
    body: "{business_name}: How was your visit? Tap to rate: {review_url}\n\nReply STOP to unsubscribe",
  },
  appointment_followup: {
    id: "appointment_followup",
    name: "Appointment Follow-Up",
    body: "Hi {customer_name}, thanks for your appointment at {business_name}! We'd love a quick review: {review_url}\n\nReply STOP to unsubscribe",
  },
};

/**
 * Render an SMS template by ID, substituting variables.
 * Falls back to the "thank_you" template if the ID is not found.
 */
export function renderTemplate(templateId: string, vars: TemplateVars): string {
  const template = SMS_TEMPLATES[templateId] || SMS_TEMPLATES.thank_you;
  return template.body
    .replace(/\{customer_name\}/g, vars.customer_name)
    .replace(/\{business_name\}/g, vars.business_name)
    .replace(/\{review_url\}/g, vars.review_url);
}

/**
 * Get all available templates.
 */
export function listTemplates(): Array<{ id: string; name: string; body: string }> {
  return Object.values(SMS_TEMPLATES);
}

/**
 * Preview a template with sample data.
 */
export function previewTemplate(templateId: string): string {
  return renderTemplate(templateId, {
    customer_name: "Sarah",
    business_name: "PLEIJ Salon",
    review_url: "https://app.getagentsocial.com/review/pleij",
  });
}