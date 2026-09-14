export default function Privacy() {
  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Privacy Policy</h1>
      <p style={{ color: "#888", marginBottom: "2rem" }}>Last updated: May 11, 2026</p>

      <section style={{ marginBottom: "2rem" }}>
        <h2>1. Introduction</h2>
        <p>AgentSocial ("we", "us", "our") operates the getagentsocial.com website and related services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>2. Information We Collect</h2>
        <p><strong>Account Information:</strong> Name, email address, password (hashed), and profile information you provide when creating an account.</p>
        <p><strong>Social Media Data:</strong> When you connect social media accounts, we access platform-specific data (posts, analytics, follower counts) as authorized by you through OAuth permissions.</p>
        <p><strong>Usage Data:</strong> Information about how you use the Service, including features accessed, pages visited, and actions taken.</p>
        <p><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain the Service</li>
          <li>To manage your account and authenticate access</li>
          <li>To publish content to your connected social media accounts on your behalf</li>
          <li>To provide analytics and insights about your social media performance</li>
          <li>To improve and personalize the Service</li>
          <li>To communicate with you about updates, support, and promotional offers</li>
          <li>To detect and prevent fraud, abuse, or security incidents</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>4. Data Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share data with:</p>
        <ul>
          <li><strong>Service Providers:</strong> Third-party vendors who help us operate the Service (hosting, analytics, email delivery)</li>
          <li><strong>Social Media Platforms:</strong> To publish content on your behalf as authorized</li>
          <li><strong>Legal Requirements:</strong> When required by law, subpoena, or government request</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>5. Data Security</h2>
        <p>We implement industry-standard security measures including encryption of data in transit (TLS) and at rest, secure credential storage, and regular security audits. However, no method of electronic transmission is 100% secure.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>6. Data Retention</h2>
        <p>We retain your personal information for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data at any time.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>7. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict processing of your data</li>
          <li>Data portability (receive your data in a portable format)</li>
        </ul>
        <p>To exercise these rights, contact us at <a href="mailto:support@getagentsocial.com">support@getagentsocial.com</a>.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>8. Children's Privacy</h2>
        <p>The Service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>9. International Data Transfers</h2>
        <p>Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>11. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, contact us at: <a href="mailto:support@getagentsocial.com">support@getagentsocial.com</a></p>
      </section>

      <style>{`
        h2 { font-size: 1.25rem; margin-bottom: 0.75rem; }
        p, li { line-height: 1.7; color: #333; }
        ul { padding-left: 1.5rem; }
        li { margin-bottom: 0.25rem; }
        strong { color: #111; }
      `}</style>
    </main>
  );
}
