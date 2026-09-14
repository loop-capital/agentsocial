#!/usr/bin/env tsx
/**
 * SiteFlow CLI Orchestrator
 * Pipeline: scrape → extract → generate → adapt → preview
 * 
 * Usage:
 *   npx tsx run.ts --site=linear.app --brand="MyBrand" --colors="#FF0000,#000000,#FFFFFF"
 *   npx tsx run.ts --scrape
 *   npx tsx run.ts --extract
 *   npx tsx run.ts --generate --template=stripe.com
 *   npx tsx run.ts --adapt --template=stripe.com --brand="MyBrand" --colors="#FF0000,#000000"
 *   npx tsx run.ts --preview
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { adaptBrand, parseBrandColors } from './generator/brand-adapter';
import { generateSite } from './generator/code-generator';
import { BrandConfig, DesignSystem } from './generator/types';

const ROOT_DIR = __dirname;
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');
const SCRAPED_DIR = path.join(TEMPLATES_DIR, 'scraped');
const EXTRACTED_DIR = path.join(TEMPLATES_DIR, 'extracted');
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');

function log(msg: string) { console.log(msg); }
function error(msg: string) { console.error(msg); process.exit(1); }

function runPythonScript(scriptPath: string, args: string[] = []): boolean {
  const result = spawnSync('python3', [scriptPath, ...args], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
  return result.status === 0;
}

function scrape(): void {
  log('\n🔍 STEP 1: Scraping target sites...');
  const scraperPath = path.join(ROOT_DIR, 'scraper', 'godly-scraper.py');
  if (!fs.existsSync(scraperPath)) {
    error(`Scraper not found: ${scraperPath}`);
  }
  const ok = runPythonScript(scraperPath);
  if (!ok) {
    log('⚠️  Some sites failed to scrape (anti-bot protection), continuing with available data...');
  }
  log('✅ Scraping complete\n');
}

function extract(): void {
  log('\n🎨 STEP 2: Extracting design systems...');
  const extractorPath = path.join(ROOT_DIR, 'extractor', 'design-token-extractor.py');
  if (!fs.existsSync(extractorPath)) {
    error(`Extractor not found: ${extractorPath}`);
  }
  runPythonScript(extractorPath);
  log('✅ Extraction complete\n');
}

function buildIndex(): void {
  log('\n📚 STEP 2b: Building template index...');
  const indexBuilderPath = path.join(TEMPLATES_DIR, 'build-index.ts');
  const result = spawnSync('npx', ['tsx', indexBuilderPath], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    // Fallback: just node with tsx if available
    spawnSync('node', ['--loader', 'tsx', indexBuilderPath], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
  }
  log('✅ Index built\n');
}

function generate(templateId: string): void {
  log(`\n🏗️  STEP 3: Generating site from template: ${templateId}...`);
  
  const dsPath = path.join(EXTRACTED_DIR, templateId, 'design-system.json');
  if (!fs.existsSync(dsPath)) {
    error(`Design system not found for ${templateId}. Run --extract first.`);
  }
  
  const ds: DesignSystem = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
  const outputDir = path.join(GENERATED_DIR, templateId);
  
  fs.mkdirSync(outputDir, { recursive: true });
  generateSite(ds, GENERATED_DIR);
  
  log('✅ Generation complete\n');
}

function adapt(templateId: string, brandName: string, colorsStr: string): void {
  log(`\n🎨 STEP 4: Adapting ${templateId} → ${brandName}...`);
  
  const colors = parseBrandColors(colorsStr);
  
  const brandConfig: BrandConfig = {
    name: brandName,
    tagline: `Welcome to ${brandName}`,
    description: `${brandName} helps teams build faster and smarter.`,
    colors,
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'monospace',
    },
  };
  
  const outputDir = path.join(GENERATED_DIR, brandName.replace(/[^a-zA-Z0-9]/g, '_'));
  fs.mkdirSync(outputDir, { recursive: true });
  
  adaptBrand(templateId, brandConfig, outputDir);
  
  log('✅ Adaptation complete\n');
}

function preview(): void {
  log('\n👁️  STEP 5: Starting preview server...');
  const serverPath = path.join(ROOT_DIR, 'renderer', 'server.ts');
  
  // Check if express is installed
  try {
    require.resolve('express');
  } catch {
    log('📦 Installing preview server dependencies...');
    spawnSync('npm', ['install', 'express', 'cors', '@types/express', '@types/cors'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
  }
  
  spawnSync('npx', ['tsx', serverPath], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
}

function fullPipeline(site: string, brand: string, colors: string): void {
  log('\n🚀 Running full SiteFlow pipeline...');
  
  // Check if scraped data exists
  if (!fs.existsSync(path.join(SCRAPED_DIR, site, 'design-tokens.json'))) {
    log(`Scraped data for ${site} not found. Running scraper...`);
    scrape();
  }
  
  // Check if extracted data exists
  if (!fs.existsSync(path.join(EXTRACTED_DIR, site, 'design-system.json'))) {
    log(`Extracted data for ${site} not found. Running extractor...`);
    extract();
    buildIndex();
  }
  
  // Adapt
  adapt(site, brand, colors);
  
  log('\n✅ Full pipeline complete!');
  log(`   Generated site: ${GENERATED_DIR}`);
  log('   Run with --preview to start the preview server');
}

// CLI Parser
function main(): void {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, ...valueParts] = arg.replace(/^--/, '').split('=');
      flags[key] = valueParts.join('=') || 'true';
    }
  }
  
  // Show help if no args
  if (args.length === 0 || flags.help) {
    console.log(`
SiteFlow CLI - Website Builder Pipeline

Commands:
  --scrape                     Run the scraper on all target sites
  --extract                    Extract design systems from scraped data
  --generate --template=ID     Generate a site from a template
  --adapt --template=ID --brand=NAME --colors=CSV  Adapt template to brand
  --preview                    Start the preview server
  --site=URL --brand=NAME --colors=CSV   Run full pipeline

Examples:
  npx tsx run.ts --site=stripe.com --brand="MyBrand" --colors="#FF0000,#000000,#FFFFFF"
  npx tsx run.ts --generate --template=framer.com
  npx tsx run.ts --adapt --template=stripe.com --brand="Acme" --colors="#6366F1,#1E1B4B,#818CF8"
`);
    process.exit(0);
  }
  
  // Full pipeline mode
  if (flags.site && flags.brand) {
    const colors = flags.colors || '#5E6AD2,#8B8D98,#F58116,#0A0A0F,#EDEDF0';
    fullPipeline(flags.site, flags.brand, colors);
    return;
  }
  
  // Individual steps
  if (flags.scrape) scrape();
  if (flags.extract) { extract(); buildIndex(); }
  if (flags.generate) {
    if (!flags.template) error('--template required with --generate');
    generate(flags.template);
  }
  if (flags.adapt) {
    if (!flags.template) error('--template required with --adapt');
    if (!flags.brand) error('--brand required with --adapt');
    adapt(flags.template, flags.brand, flags.colors || '#5E6AD2,#8B8D98,#F58116');
  }
  if (flags.preview) preview();
}

main();
