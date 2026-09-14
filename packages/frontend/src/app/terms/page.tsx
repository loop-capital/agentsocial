import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - AgentSocial",
  description: "Terms of Service for AgentSocial by ClawStudio",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-gray-600 mb-6">Last updated: May 21, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p className="text-gray-700 leading-relaxed">
          By accessing or using AgentSocial, you agree to be bound by these Terms of Service.
          If you do not agree, you may not use the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
        <p className="text-gray-700 leading-relaxed">
          AgentSocial is a social media management and content automation platform that enables
          users to create, schedule, and publish content across multiple social media platforms,
          manage business listings, handle customer communications, and leverage AI-powered
          content generation tools.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
        <p className="text-gray-700 leading-relaxed">
          You are responsible for maintaining the confidentiality of your account credentials
          and for all activities that occur under your account. You must provide accurate
          information when creating your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Content Ownership and Licenses</h2>
        <p className="text-gray-700 leading-relaxed">
          You retain ownership of all content you create or upload. You grant AgentSocial
          the limited, non-exclusive rights necessary to publish your content to third-party
          platforms you authorize, process your content through AI services, and display
          content within your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. AI-Generated Content</h2>
        <p className="text-gray-700 leading-relaxed">
          AgentSocial provides AI-powered content generation tools. You are responsible
          for reviewing and approving all AI-generated content before publication.
          We do not guarantee the accuracy, originality, or appropriateness of
          AI-generated content. You assume all responsibility for content you publish.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Platform Integration</h2>
        <p className="text-gray-700 leading-relaxed">
          By connecting third-party platforms (Instagram, Facebook, X/Twitter, LinkedIn,
          TikTok, YouTube, Google Business Profile), you authorize AgentSocial to access
          and manage content on your behalf in accordance with each platform's terms of service.
          You may disconnect any platform at any time from your account settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Payment Terms</h2>
        <p className="text-gray-700 leading-relaxed">
          Paid services are billed through Square. Subscription fees are charged
          at the beginning of each billing cycle. Refunds are handled on a case-by-case
          basis. You may cancel your subscription at any time; access continues through
          the end of the current billing period.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Prohibited Uses</h2>
        <p className="text-gray-700 leading-relaxed">
          You may not use AgentSocial to:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
          <li>Violate any law or regulation</li>
          <li>Generate misleading, deceptive, or fraudulent content</li>
          <li>Infringe on intellectual property rights of others</li>
          <li>Harass, abuse, or harm others</li>
          <li>Spam or send unsolicited communications</li>
          <li>Attempt to bypass security measures or access restrictions</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
        <p className="text-gray-700 leading-relaxed">
          AgentSocial is provided &quot;as is&quot; without warranties. We are not liable for
          issues arising from third-party platform APIs, AI-generated content accuracy,
          service disruptions, or data loss beyond our reasonable control.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">10. Modifications</h2>
        <p className="text-gray-700 leading-relaxed">
          We may update these terms from time to time. Continued use of the service
          after changes constitutes acceptance of the updated terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          For questions about these terms, contact us at{" "}
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