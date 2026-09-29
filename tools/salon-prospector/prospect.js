#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { generateWebsite } = require('./generate.js');

program
  .option('-c, --city <city>', 'Target city')
  .option('-i, --industry <industry>', 'Industry type', 'hair salon')
  .option('-n, --count <number>', 'Number of prospects', '5')
  .option('--dry-run', 'Show only, no generation')
  .parse();

const opts = program.opts();

async function main() {
  console.log(`Finding ${opts.count} ${opts.industry}s in ${opts.city}...`);
  
  if (!opts.city) {
    console.error('Error: --city required');
    process.exit(1);
  }

  // TODO: Replace with actual Google Places API discovery
  const prospects = [
    { name: "Glamour Cuts", phone: "+1-614-555-0100", address: "123 Main St, Columbus, OH", industry: opts.industry, city: opts.city },
    { name: "Shear Perfection", phone: "+1-614-555-0200", address: "456 Oak Ave, Columbus, OH", industry: opts.industry, city: opts.city },
    { name: "Beauty Haven", phone: "+1-614-555-0300", address: "789 Elm St, Columbus, OH", industry: opts.industry, city: opts.city }
  ].slice(0, parseInt(opts.count));

  console.log(`Found ${prospects.length} prospects`);

  if (!opts.dryRun) {
    for (const p of prospects) {
      console.log(`Generating: ${p.name}`);
      const result = generateWebsite(p);
      p.previewPath = result.outputDir;
      p.previewUrl = result.previewUrl;
    }
  }

  // Save results
  const dataDir = path.join(__dirname, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, 'prospects.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), prospects }, null, 2)
  );

  console.log(`Saved to data/prospects.json`);
  console.log(`Sites in: ${path.join(__dirname, 'runs')}`);
}

main().catch(console.error);
