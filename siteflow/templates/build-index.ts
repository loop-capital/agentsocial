import * as fs from 'fs';
import * as path from 'path';

interface TemplateEntry {
  id: string;
  site_name: string;
  url: string;
  source_type: 'scraped';
  design_tokens: any;
  style_classification: {
    tags: string[];
    philosophy: string;
    archetype: string;
  };
  page_templates: any[];
  files: {
    raw_scrape: string;
    design_system: string;
    tailwind_config: string;
    css_tokens: string;
    html_snapshot: string;
  };
}

function buildIndex(): void {
  const scrapedDir = path.join(__dirname, 'scraped');
  const extractedDir = path.join(__dirname, 'extracted');
  
  const sites = fs.readdirSync(scrapedDir)
    .filter(d => fs.statSync(path.join(scrapedDir, d)).isDirectory() && d !== 'screenshots');
  
  const templates: TemplateEntry[] = sites.map(site => {
    const rawPath = path.join(scrapedDir, site, 'design-tokens.json');
    const dsPath = path.join(extractedDir, site, 'design-system.json');
    const twPath = path.join(extractedDir, site, 'tailwind.config.ts');
    const cssPath = path.join(extractedDir, site, 'tokens.css');
    const htmlPath = path.join(scrapedDir, site, 'page.html');
    
    let raw: any = {};
    let ds: any = {};
    
    try { raw = JSON.parse(fs.readFileSync(rawPath, 'utf8')); } catch (e) {}
    try { ds = JSON.parse(fs.readFileSync(dsPath, 'utf8')); } catch (e) {}
    
    const archetypes: Record<string, string> = {
      'stripe.com': 'fintech',
      'framer.com': 'creative',
      'figma.com': 'creative',
      'notion.so': 'productivity',
      'raycast.com': 'developer',
      'perplexity.ai': 'ai',
      'amie.so': 'productivity',
      'ped.ro': 'portfolio',
      'linear.app': 'saas',
      'vercel.com': 'developer',
    };
    
    return {
      id: site.replace(/\./g, '-'),
      site_name: site,
      url: raw.url || ds.url || `https://${site}`,
      source_type: 'scraped',
      design_tokens: {
        colors: ds.colors || {},
        typography: ds.typography || {},
        spacing: ds.spacing || {},
        components: {
          buttons: raw.buttons || ds.button_styles || [],
          cards: raw.cards || ds.card_styles || [],
          inputs: raw.inputs || ds.input_styles || [],
          nav_patterns: raw.nav_patterns || ds.layout_patterns || [],
        },
        borders: ds.borders || {},
        shadows: ds.shadows || {},
      },
      style_classification: {
        tags: ds.style_tags || [],
        philosophy: ds.design_philosophy || 'Modern professional web design',
        archetype: archetypes[site] || 'saas',
      },
      page_templates: [
        { page: 'landing', available: true, sections: ['hero', 'features', 'cta'] },
        { page: 'about', available: true, sections: ['story', 'team', 'values'] },
        { page: 'pricing', available: site === 'stripe.com' || site === 'framer.com', sections: ['plans', 'faq'] },
        { page: 'contact', available: true, sections: ['form', 'info'] },
      ],
      files: {
        raw_scrape: path.relative(__dirname, rawPath),
        design_system: path.relative(__dirname, dsPath),
        tailwind_config: path.relative(__dirname, twPath),
        css_tokens: path.relative(__dirname, cssPath),
        html_snapshot: path.relative(__dirname, htmlPath),
      },
    };
  });
  
  const index = {
    meta: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      total_templates: templates.length,
      scraped_sites: sites.length,
      successful_extractions: templates.filter(t => Object.keys(t.design_tokens.colors).length > 0).length,
    },
    templates,
  };
  
  fs.writeFileSync(path.join(__dirname, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`✅ Built index with ${templates.length} templates`);
  console.log(`   Archetypes: ${[...new Set(templates.map(t => t.style_classification.archetype))].join(', ')}`);
}

buildIndex();
