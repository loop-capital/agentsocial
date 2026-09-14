export interface DesignToken {
  name: string;
  value: string;
}

export interface ColorSystem {
  primary: DesignToken[];
  secondary: DesignToken[];
  accent: DesignToken[];
  background: DesignToken[];
  foreground: DesignToken[];
  border: DesignToken[];
  muted: DesignToken[];
}

export interface TypographySystem {
  families: {
    heading: string[];
    body: string[];
    mono: string[];
  };
  sizes: string[];
  weights: string[];
  line_heights: string[];
}

export interface SpacingSystem {
  padding: string[];
  margin: string[];
  gap: string[];
}

export interface ComponentPatterns {
  buttons: any[];
  cards: any[];
  inputs: any[];
  nav_patterns: any[];
}

export interface DesignSystem {
  site_name: string;
  url: string;
  colors: ColorSystem;
  typography: TypographySystem;
  spacing: SpacingSystem;
  components: ComponentPatterns;
  borders: any;
  shadows: any;
  style_tags: string[];
  design_philosophy: string;
}

export interface GeneratedPage {
  page: string;
  componentName: string;
  code: string;
  filePath: string;
}

export interface BrandConfig {
  name: string;
  tagline: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  logo?: string;
}

export interface GeneratedSite {
  brand: BrandConfig;
  baseTemplate: string;
  pages: GeneratedPage[];
  cssVariables: string;
  tailwindConfig: string;
}
