const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Agent Social', version: '0.1.0-stub' });
});

// OAuth callback stub — logs params, returns 200
// Meta and TikTok will redirect here after user approves OAuth
app.get('/v1/auth/callback', (req, res) => {
  console.log('[OAuth Callback]', { query: req.query, timestamp: new Date().toISOString() });
  res.status(200).send(`
    <html>
      <body style="font-family: sans-serif; max-width: 600px; margin: 80px auto; text-align: center;">
        <h2>Agent Social</h2>
        <p>Account connected successfully. You may close this window.</p>
      </body>
    </html>
  `);
});

// Privacy Policy
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Privacy Policy — Agent Social</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 60px auto; padding: 0 24px; color: #222; line-height: 1.6; }
        h1 { font-size: 28px; } h2 { font-size: 20px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p><strong>Effective Date:</strong> April 22, 2026</p>
      <p>Agent Social ("we", "our", or "us") operates the getagentsocial.com platform, a social media automation service for AI agents and developers.</p>

      <h2>Information We Collect</h2>
      <p>We collect information necessary to provide our service, including:</p>
      <ul>
        <li>Social media account credentials and OAuth tokens (encrypted at rest)</li>
        <li>Post content and scheduling data provided by API callers</li>
        <li>API usage logs for debugging and monitoring</li>
      </ul>

      <h2>How We Use Information</h2>
      <p>Information collected is used solely to operate the Agent Social platform — authenticating with social media platforms, publishing content on behalf of authorized accounts, and maintaining service reliability. We do not sell or share data with third parties.</p>

      <h2>OAuth Tokens and Social Account Access</h2>
      <p>We store OAuth tokens granted by users to access their social media accounts. Tokens are encrypted using AES-256 encryption. Access is used only to publish content explicitly authorized by the account owner. Users may revoke access at any time through their social media platform's connected apps settings.</p>

      <h2>Data Retention</h2>
      <p>Post records and dispatch logs are retained for 90 days. OAuth tokens are retained until revoked by the user or the account is disconnected from the platform.</p>

      <h2>Contact</h2>
      <p>For privacy-related questions, contact us at <a href="mailto:privacy@getagentsocial.com">privacy@getagentsocial.com</a>.</p>
    </body>
    </html>
  `);
});

// Terms of Service
app.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Terms of Service — Agent Social</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 60px auto; padding: 0 24px; color: #222; line-height: 1.6; }
        h1 { font-size: 28px; } h2 { font-size: 20px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <h1>Terms of Service</h1>
      <p><strong>Effective Date:</strong> April 22, 2026</p>
      <p>By using Agent Social ("the Service"), you agree to the following terms.</p>

      <h2>Acceptable Use</h2>
      <p>You may only use Agent Social to publish content you are authorized to post. You must comply with the terms of service of each social media platform you connect. You may not use the Service to publish spam, violate platform policies, or engage in any unlawful activity.</p>

      <h2>API Access</h2>
      <p>API access is provided for programmatic publishing of authorized content. API keys must be kept confidential. You are responsible for all activity under your API key.</p>

      <h2>Social Media Platform Compliance</h2>
      <p>You are responsible for ensuring your use of Agent Social complies with the terms and policies of Instagram, TikTok, Facebook, and any other platforms you connect. Agent Social is not responsible for content policy violations on connected platforms.</p>

      <h2>Service Availability</h2>
      <p>We aim for high availability but do not guarantee uninterrupted service. We are not liable for failed posts due to platform outages, rate limits imposed by third-party platforms, or force majeure events.</p>

      <h2>Limitation of Liability</h2>
      <p>Agent Social's liability is limited to the fees paid in the three months preceding any claim. We are not liable for indirect, incidental, or consequential damages.</p>

      <h2>Changes to Terms</h2>
      <p>We may update these terms. Continued use of the Service after changes constitutes acceptance.</p>

      <h2>Contact</h2>
      <p>Questions about these terms: <a href="mailto:legal@getagentsocial.com">legal@getagentsocial.com</a></p>
    </body>
    </html>
  `);
});

// Root
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 600px; margin: 80px auto; text-align: center;">
        <h1>Agent Social</h1>
        <p>AI-native social media automation platform.</p>
        <p><a href="/privacy">Privacy Policy</a> &nbsp;·&nbsp; <a href="/terms">Terms of Service</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Agent Social stub running on port ${PORT}`);
});
