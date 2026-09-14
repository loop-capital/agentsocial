import express from 'express';
import cors from 'cors';
import { renderToString } from 'react-dom/server';
import React from 'react';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SiteFlow Preview Renderer
 * Express server that renders generated sites via API endpoint
 */

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'siteflow-renderer', version: '1.0.0' });
});

// Simple HTML template wrapper
function wrapHTML(content: string, title: string, cssVars: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${cssVars}
  </style>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              primary: 'var(--color-primary)',
              secondary: 'var(--color-secondary)',
              accent: 'var(--color-accent)',
              background: 'var(--color-background)',
              foreground: 'var(--color-foreground)',
              muted: 'var(--color-muted)',
              border: 'var(--color-border)',
            }
          }
        }
      }
    }
  </script>
</head>
<body>
  <div id="root">${content}</div>
</body>
</html>`;
}

// POST /api/preview - Render a design system as HTML preview
app.post('/api/preview', (req, res) => {
  try {
    const { designSystem, page = 'landing', brand } = req.body;
    
    if (!designSystem) {
      return res.status(400).json({ error: 'designSystem is required' });
    }

    const ds = typeof designSystem === 'string' ? JSON.parse(designSystem) : designSystem;
    const brandName = brand?.name || ds.site_name || 'SiteFlow Preview';
    
    // Build CSS variables from design system
    const colors = ds.colors || {};
    const cssVars = `:root {
  --color-primary: ${extractValue(colors.primary, '#5E6AD2')};
  --color-secondary: ${extractValue(colors.secondary, '#8B8D98')};
  --color-accent: ${extractValue(colors.accent, '#F58116')};
  --color-background: ${extractValue(colors.background, '#0A0A0F')};
  --color-foreground: ${extractValue(colors.foreground, '#EDEDF0')};
  --color-muted: ${extractValue(colors.muted, '#6B6D76')};
  --color-border: ${extractValue(colors.border, '#2A2A32')};
  --font-heading: ${(brand?.fonts?.heading || ds.typography?.families?.heading?.[0] || 'Inter').replace(/"/g, '')};
  --font-body: ${(brand?.fonts?.body || ds.typography?.families?.body?.[0] || 'Inter').replace(/"/g, '')};
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-body), system-ui, sans-serif;
  margin: 0;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), system-ui, sans-serif;
  margin: 0;
}
`;

    // Generate static HTML for the requested page type
    const html = generatePreviewHTML(ds, page, brandName, cssVars);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err: any) {
    console.error('Preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

function extractValue(tokens: any[], fallback: string): string {
  if (!tokens || tokens.length === 0) return fallback;
  const val = typeof tokens[0] === 'object' ? tokens[0].value : tokens[0];
  if (!val || val === 'inherit' || val === 'initial' || val === 'unset' || val === 'transparent') return fallback;
  return val;
}

function generatePreviewHTML(ds: any, page: string, brandName: string, cssVars: string): string {
  const primary = extractValue(ds.colors?.primary, '#5E6AD2');
  const bg = extractValue(ds.colors?.background, '#0A0A0F');
  const fg = extractValue(ds.colors?.foreground, '#EDEDF0');
  
  const landingHTML = `
    <div style="min-height:100vh;background:var(--color-background);color:var(--color-foreground)">
      <nav style="position:fixed;top:0;left:0;right:0;z-index:50;border-bottom:1px solid var(--color-border);background:var(--color-background);padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <div style="width:2rem;height:2rem;background:var(--color-primary);border-radius:0.5rem"></div>
          <span style="font-family:var(--font-heading);font-weight:600;font-size:1.125rem">${brandName}</span>
        </div>
        <div style="display:flex;gap:2rem">
          <a href="#" style="color:var(--color-muted);text-decoration:none;font-size:0.875rem">Features</a>
          <a href="#" style="color:var(--color-muted);text-decoration:none;font-size:0.875rem">Pricing</a>
          <a href="#" style="color:var(--color-muted);text-decoration:none;font-size:0.875rem">About</a>
        </div>
        <button style="background:var(--color-primary);color:white;border:none;padding:0.5rem 1rem;border-radius:0.5rem;font-size:0.875rem;cursor:pointer">Get Started</button>
      </nav>
      
      <section style="padding-top:8rem;padding-bottom:5rem;text-align:center;position:relative">
        <div style="max-width:56rem;margin:0 auto;padding:0 1rem">
          <h1 style="font-size:3.5rem;font-weight:700;letter-spacing:-0.025em;line-height:1.1">${ds.design_philosophy || 'Build something amazing'}</h1>
          <p style="margin-top:1.5rem;font-size:1.125rem;color:var(--color-muted);max-width:36rem;margin-left:auto;margin-right:auto">The platform that helps teams build, ship, and grow faster than ever before.</p>
          <div style="margin-top:2.5rem;display:flex;gap:1rem;justify-content:center">
            <button style="background:var(--color-primary);color:white;border:none;padding:1rem 2rem;border-radius:0.5rem;font-size:1rem;font-weight:500;cursor:pointer">Get Started Free</button>
            <button style="background:transparent;border:1px solid var(--color-border);color:var(--color-foreground);padding:1rem 2rem;border-radius:0.5rem;font-size:1rem;cursor:pointer">Watch Demo</button>
          </div>
        </div>
      </section>
      
      <section style="padding:5rem 0">
        <div style="max-width:80rem;margin:0 auto;padding:0 1rem">
          <div style="text-align:center;margin-bottom:4rem">
            <h2 style="font-size:2rem;font-weight:700">Everything you need</h2>
            <p style="margin-top:1rem;color:var(--color-muted)">Powerful features designed for modern teams.</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(20rem,1fr));gap:2rem">
            ${['Lightning Fast','Collaborative','Secure','Customizable','Analytics','Integrations'].map(f => `
            <div style="border:1px solid var(--color-border);border-radius:1rem;padding:1.5rem;background:rgba(255,255,255,0.02)">
              <div style="width:2.5rem;height:2.5rem;background:var(--color-primary);border-radius:0.5rem;margin-bottom:1rem;opacity:0.2"></div>
              <h3 style="font-size:1.125rem;font-weight:600">${f}</h3>
              <p style="margin-top:0.5rem;font-size:0.875rem;color:var(--color-muted)">Built for performance with enterprise-grade reliability.</p>
            </div>`).join('')}
          </div>
        </div>
      </section>
      
      <section style="padding:5rem 0">
        <div style="max-width:80rem;margin:0 auto;padding:0 1rem">
          <div style="background:var(--color-primary);opacity:0.1;border:1px solid var(--color-primary);border-radius:1.5rem;padding:3rem;text-align:center">
            <h2 style="font-size:2rem;font-weight:700">Ready to get started?</h2>
            <p style="margin-top:1rem;color:var(--color-muted)">Join thousands of teams already using ${brandName}.</p>
            <button style="margin-top:1.5rem;background:var(--color-primary);color:white;border:none;padding:1rem 2rem;border-radius:0.5rem;font-size:1rem;font-weight:500;cursor:pointer">Start Building Now</button>
          </div>
        </div>
      </section>
      
      <footer style="border-top:1px solid var(--color-border);padding:3rem 0">
        <div style="max-width:80rem;margin:0 auto;padding:0 1rem;display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <div style="width:1.5rem;height:1.5rem;background:var(--color-primary);border-radius:0.375rem"></div>
            <span style="font-weight:600">${brandName}</span>
          </div>
          <p style="font-size:0.875rem;color:var(--color-muted)">© 2025 ${brandName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `;

  return wrapHTML(landingHTML, brandName, cssVars);
}

// GET /api/preview/file - Preview a generated site file
app.get('/api/preview/file', (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'path query param required' });
  }
  
  const fullPath = path.resolve(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(content);
});

app.listen(PORT, () => {
  console.log(`🚀 SiteFlow Renderer running on http://localhost:${PORT}`);
  console.log(`   POST /api/preview - Render design system`);
  console.log(`   GET  /api/preview/file?path=... - Preview file`);
});
