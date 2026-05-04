import type { FastifyInstance } from "fastify";

const privacyPolicy = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - AgentSocial</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333}h1{color:#2563eb}</style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p><strong>Last updated:</strong> April 22, 2026</p>
  <p>AgentSocial respects your privacy. This policy explains how we collect, use, and protect your data.</p>
  <h2>Data We Collect</h2>
  <ul>
    <li>Account information (email, name)</li>
    <li>Social media account connections (OAuth tokens)</li>
    <li>Content you create and schedule</li>
    <li>Analytics and usage data</li>
  </ul>
  <h2>How We Use Data</h2>
  <ul>
    <li>Provide social media management services</li>
    <li>Schedule and publish your content</li>
    <li>Generate analytics reports</li>
    <li>Improve our platform</li>
  </ul>
  <h2>Your Rights</h2>
  <p>You can request data deletion, export, or modification at any time by contacting support@getagentsocial.com.</p>
</body>
</html>`;

const termsOfService = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - AgentSocial</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333}h1{color:#2563eb}</style>
</head>
<body>
  <h1>Terms of Service</h1>
  <p><strong>Last updated:</strong> April 22, 2026</p>
  <p>By using AgentSocial, you agree to these terms.</p>
  <h2>1. Service Description</h2>
  <p>AgentSocial provides AI-powered social media management tools including scheduling, analytics, and content creation.</p>
  <h2>2. User Responsibilities</h2>
  <ul>
    <li>You own all content you post</li>
    <li>You comply with each platform's terms</li>
    <li>You use the service lawfully</li>
  </ul>
  <h2>3. Limitation of Liability</h2>
  <p>AgentSocial is not liable for platform API changes, account suspensions, or content performance.</p>
</body>
</html>`;

export const legalRoutes = async (server: FastifyInstance) => {
  server.get("/privacy", async (_request, reply) => {
    return reply.type("text/html").send(privacyPolicy);
  });

  server.get("/terms", async (_request, reply) => {
    return reply.type("text/html").send(termsOfService);
  });
};
