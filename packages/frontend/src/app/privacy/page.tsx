import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - AgentSocial",
  description: "Privacy Policy for AgentSocial by ClawStudio",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-gray-600 mb-6">Last updated: May 21, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          We collect information you provide directly, including:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Account information (email, name, password)</li>
          <li>Business profile data (business name, category, address, phone, hours)</li>
          <li>Content you create, upload, or generate (posts, images, videos)</li>
          <li>Social media account connections and OAuth tokens</li>
          <li>Payment information (processed securely through Square; we never store full card numbers)</li>
          <li>Usage data, preferences, and analytics</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
        <p className="text-gray-700 leading-relaxed">
          We use your information to provide, maintain, and improve our services,
          including publishing content to connected social media platforms,
          generating AI-powered content and analytics, processing payments,
          and personalizing your experience.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Social Media Platform Integration</h2>
        <p className="text-gray-700 leading-relaxed">
          When you connect social media accounts (Instagram, Facebook, X/Twitter, LinkedIn,
          TikTok, YouTube, Google Business Profile), we store access tokens securely to
          publish content and manage your presence on your behalf. We only access the minimum
          permissions necessary and you can revoke access at any time from your account settings
          or directly through the respective platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. AI-Generated Content</h2>
        <p className="text-gray-700 leading-relaxed">
          AgentSocial uses artificial intelligence services to generate content, including:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
          <li><strong>Text generation</strong> — Social post copy, captions, hashtags (powered by AI language models)</li>
          <li><strong>Image generation and editing</strong> — AI-generated images and photo editing (powered by Adobe Express and/or Gemini)</li>
          <li><strong>Video generation</strong> — Short-form video content (powered by Gemini Omni when available)</li>
          <li><strong>Voice AI</strong> — Phone reception and booking assistance (powered by our voice agent platform)</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          AI-generated content is your responsibility to review before publishing.
          We do not guarantee the accuracy, appropriateness, or originality of AI-generated content.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Adobe Express Embed SDK</h2>
        <p className="text-gray-700 leading-relaxed">
          Our image editor is powered by the Adobe Express Embed SDK (CC Everywhere v4).
          When you use the editor, Adobe may process the following data:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
          <li>Images you upload or create within the editor</li>
          <li>Editor session data (designs, edits, exports)</li>
          <li>Browser and device information for session management</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          Adobe processes this data under their Privacy Policy available at
          <a href="https://www.adobe.com/privacy.html" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">adobe.com/privacy</a>.
          Images and designs you create are stored on your device and/or our servers, not Adobe's,
          unless you explicitly share them through Adobe services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Data Storage and Security</h2>
        <p className="text-gray-700 leading-relaxed">
          We use industry-standard encryption and security practices. OAuth access tokens
          and sensitive credentials are encrypted at rest using AES-256-GCM. We do not sell
          your personal information to third parties.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
        <p className="text-gray-700 leading-relaxed">
          We integrate with third-party platforms and services including:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
          <li>Social media platforms (Meta/Instagram, X/Twitter, LinkedIn, TikTok, YouTube, Google)</li>
          <li>Adobe Express (image editing and generation)</li>
          <li>Google AI / Gemini (content generation)</li>
          <li>Square (payment processing)</li>
          <li>Supabase (database and authentication)</li>
          <li>Composio (OAuth connection management)</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          Each third-party service has its own privacy policy governing data on their platforms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
        <p className="text-gray-700 leading-relaxed">
          You can access, update, or delete your account and data at any time from your
          account settings. You can disconnect social media accounts at any time.
          You may request a full data export or account deletion by contacting us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Data Retention</h2>
        <p className="text-gray-700 leading-relaxed">
          We retain your account data for as long as your account is active.
          Upon account deletion, we remove personal data within 30 days, except
          where retention is required by law. Anonymized analytics data may be
          retained for service improvement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          For privacy questions or data requests, contact us at{" "}
          <a href="mailto:support@clawstudio.co" className="text-blue-600 hover:underline">support@clawstudio.co</a>.
        </p>
        <p className="text-gray-700 leading-relaxed mt-2">
          ClawStudio LLC<br />
          https://clawstudio.co
        </p>
      </section>
    </div>
  );
}