#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deploy() {
  const dataPath = path.join(__dirname, 'data', 'prospects.json');
  if (!fs.existsSync(dataPath)) {
    console.error('No prospects found. Run prospect.js first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  for (const p of data.prospects) {
    if (p.previewPath && !p.previewUrl) {
      console.log(`Deploying ${p.name}...`);
      try {
        const result = execSync(
          `cd "${p.previewPath}" && npx vercel@latest --yes`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        const urlMatch = result.match(/https:\/\/[^\s]+\.vercel\.app/);
        if (urlMatch) {
          p.previewUrl = urlMatch[0];
          console.log(`  ✅ ${urlMatch[0]}`);
        }
      } catch (err) {
        console.error(`  ❌ Failed: ${err.message}`);
      }
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Deployment complete');
}

deploy().catch(console.error);
