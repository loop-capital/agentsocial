import * as fs from 'fs';
import * as path from 'path';
import { DesignSystem, BrandConfig, GeneratedSite } from './types';
import { generateSite } from './code-generator';

/**
 * Brand Adaptation Engine
 * Takes a template design system + new brand info and adapts all tokens
 */

export function parseBrandColors(colorsStr: string): { primary: string; secondary: string; accent: string; background: string; foreground: string } {
  const colors = colorsStr.split(',').map(c => c.trim()).filter(Boolean);
  return {
    primary: colors[0] || '#5E6AD2',
    secondary: colors[1] || '#8B8D98',
    accent: colors[2] || '#F58116',
    background: colors[3] || '#0A0A0F',
    foreground: colors[4] || '#EDEDF0',
  };
}

export function adaptDesignSystem(
  baseSystem: DesignSystem,
  brand: BrandConfig
): DesignSystem {
  const adapted: DesignSystem = JSON.parse(JSON.stringify(baseSystem));
  
  adapted.site_name = brand.name;
  
  // Adapt colors
  adapted.colors = {
    primary: [{ name: 'brand-primary', value: brand.colors.primary }],
    secondary: [{ name: 'brand-secondary', value: brand.colors.secondary }],
    accent: [{ name: 'brand-accent', value: brand.colors.accent }],
    background: [{ name: 'brand-bg', value: brand.colors.background }],
    foreground: [{ name: 'brand-fg', value: brand.colors.foreground }],
    border: baseSystem.colors.border.length > 0
      ? baseSystem.colors.border.map((c: any) => ({ ...c, value: brand.colors.secondary + '33' }))
      : [{ name: 'brand-border', value: brand.colors.secondary + '33' }],
    muted: baseSystem.colors.muted.length > 0
      ? baseSystem.colors.muted.map((c: any) => ({ ...c, value: brand.colors.secondary + '99' }))
      : [{ name: 'brand-muted', value: brand.colors.secondary + '99' }],
  };
  
  // Adapt fonts
  adapted.typography = {
    ...baseSystem.typography,
    families: {
      heading: [brand.fonts.heading],
      body: [brand.fonts.body],
      mono: [brand.fonts.mono],
    },
  };
  
  // Update style tags to reflect brand
  adapted.style_tags = [...baseSystem.style_tags];
  if (!adapted.style_tags.includes('branded')) {
    adapted.style_tags.push('branded');
  }
  
  adapted.design_philosophy = `Custom ${brand.name} brand adapted from ${baseSystem.site_name}`;
  
  return adapted;
}

export function generateAdaptedCSS(system: DesignSystem, brand: BrandConfig): string {
  return `:root {
  /* ${brand.name} Brand Colors */
  --color-primary: ${brand.colors.primary};
  --color-secondary: ${brand.colors.secondary};
  --color-accent: ${brand.colors.accent};
  --color-background: ${brand.colors.background};
  --color-foreground: ${brand.colors.foreground};
  --color-muted: ${brand.colors.secondary}99;
  --color-border: ${brand.colors.secondary}33;
  
  /* Typography */
  --font-heading: ${brand.fonts.heading};
  --font-body: ${brand.fonts.body};
  --font-mono: ${brand.fonts.mono};
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  
  /* Radii */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-glow: 0 0 20px ${brand.colors.primary}40;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-body), system-ui, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), system-ui, sans-serif;
}
`;
}

export function adaptBrand(
  templateId: string,
  brandConfig: BrandConfig,
  outputDir: string
): GeneratedSite {
  const extractedDir = path.join(__dirname, '..', 'templates', 'extracted');
  const dsPath = path.join(extractedDir, templateId, 'design-system.json');
  
  if (!fs.existsSync(dsPath)) {
    throw new Error(`Template not found: ${templateId}. Available: ${fs.readdirSync(extractedDir).filter(d => !d.endsWith('.json')).join(', ')}`);
  }
  
  const baseSystem: DesignSystem = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
  const adaptedSystem = adaptDesignSystem(baseSystem, brandConfig);
  
  console.log(`🎨 Adapting ${templateId} → ${brandConfig.name}`);
  console.log(`   Primary: ${brandConfig.colors.primary}`);
  console.log(`   Fonts: ${brandConfig.fonts.heading} / ${brandConfig.fonts.body}`);
  
  const site = generateSite(adaptedSystem, outputDir, brandConfig);
  
  // Also write the adapted design system
  const adaptedPath = path.join(outputDir, 'adapted-design-system.json');
  fs.writeFileSync(adaptedPath, JSON.stringify(adaptedSystem, null, 2));
  
  // Write adapted CSS
  const cssPath = path.join(outputDir, 'adapted-tokens.css');
  fs.writeFileSync(cssPath, generateAdaptedCSS(adaptedSystem, brandConfig));
  
  console.log(`✅ Adapted site saved to ${outputDir}`);
  
  return site;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const templateArg = args.find(a => a.startsWith('--template='))?.split('=')[1];
  const brandArg = args.find(a => a.startsWith('--brand='))?.split('=')[1];
  const colorsArg = args.find(a => a.startsWith('--colors='))?.split('=')[1];
  const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1] || './generated';
  
  if (!templateArg || !brandArg) {
    console.log('Usage: npx tsx generator/brand-adapter.ts --template=stripe.com --brand="MyBrand" --colors="#FF0000,#000000,#FFFFFF,#111111,#EEEEEE" [--output=./generated]');
    process.exit(1);
  }
  
  const colors = parseBrandColors(colorsArg || '#5E6AD2,#8B8D98,#F58116,#0A0A0F,#EDEDF0');
  
  const brandConfig: BrandConfig = {
    name: brandArg,
    tagline: `Welcome to ${brandArg}`,
    description: `${brandArg} helps teams build faster and smarter.`,
    colors,
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'monospace',
    },
  };
  
  adaptBrand(templateArg, brandConfig, outputArg);
}
