#!/usr/bin/env node
/**
 * Generate salon website from template with business details
 */

const fs = require('fs');
const path = require('path');

function generateWebsite(prospect) {
  const templatePath = path.join(__dirname, 'templates', 'salon', 'index.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  template = template.replace(/\{\{business_name\}\}/g, prospect.name);
  template = template.replace(/\{\{industry\}\}/g, prospect.industry);
  template = template.replace(/\{\{city\}\}/g, prospect.city);
  template = template.replace(/\{\{phone\}\}/g, prospect.phone);
  template = template.replace(/\{\{address\}\}/g, prospect.address);
  template = template.replace(/\{\{email\}\}/g, prospect.email || 'contact@' + prospect.name.toLowerCase().replace(/\s+/g, '') + '.com');
  
  // Generate unique output directory
  const outputDir = path.join(__dirname, 'runs', prospect.name.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outputDir, 'index.html'), template);
  
  return {
    outputDir,
    previewUrl: `https://agentsocial-previews.vercel.app/${path.basename(outputDir)}`
  };
}

module.exports = { generateWebsite };
