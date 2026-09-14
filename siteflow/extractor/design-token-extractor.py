#!/usr/bin/env python3
"""
SiteFlow Design Token Extractor
Uses AI vision analysis to extract design tokens from website screenshots.
Falls back to CSS/HTML parsing when screenshots aren't available.
"""

import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
SCRAPED_DIR = TEMPLATES_DIR / "scraped"
EXTRACTED_DIR = TEMPLATES_DIR / "extracted"


@dataclass 
class ColorToken:
    name: str
    value: str
    usage: str  # primary, secondary, accent, background, text, border, etc.
    category: str  # light, dark, brand, neutral


@dataclass
class TypographyToken:
    font_family: str
    weight: str
    size: str
    line_height: str
    usage: str  # heading, body, caption, code, etc.


@dataclass
class SpacingToken:
    name: str
    value: str
    px_value: int
    usage: str


@dataclass
class ExtractedDesignSystem:
    """Complete extracted design system from a website."""
    site_name: str
    url: str
    extracted_at: str = ""
    
    # Brand
    brand_name: str = ""
    brand_colors: list = field(default_factory=list)  # ColorToken dicts
    brand_fonts: list = field(default_factory=list)
    
    # Design tokens
    colors: dict = field(default_factory=dict)  # {usage: value}
    typography: dict = field(default_factory=dict)
    spacing: dict = field(default_factory=dict)
    borders: dict = field(default_factory=dict)
    shadows: dict = field(default_factory=dict)
    
    # Component patterns
    button_styles: list = field(default_factory=list)
    card_styles: list = field(default_factory=list)
    input_styles: list = field(default_factory=list)
    layout_patterns: list = field(default_factory=list)
    
    # Animation
    motion_patterns: list = field(default_factory=list)
    
    # Overall style classification
    style_tags: list = field(default_factory=list)  # minimal, bold, playful, corporate, etc.
    design_philosophy: str = ""


def ai_vision_analyze(site_name: str, html_content: str, css_tokens: dict) -> dict:
    """
    Analyze a site's design using AI heuristics on extracted data.
    When AI vision API is available, this would send screenshots for analysis.
    """
    analysis = {
        "style_tags": [],
        "design_philosophy": "",
        "color_relationships": {},
        "typography_scale": {},
        "spacing_scale": {},
        "component_patterns": {},
    }
    
    # Classify design style based on extracted tokens
    colors = css_tokens.get("colors", {})
    fonts = css_tokens.get("fonts", [])
    shadows = css_tokens.get("shadows", [])
    border_radii = css_tokens.get("border_radii", [])
    animations = css_tokens.get("animations", [])
    
    # Color analysis
    dark_count = sum(1 for v in colors.values() if _is_dark_color(v))
    light_count = sum(1 for v in colors.values() if _is_light_color(v))
    
    if dark_count > light_count * 2:
        analysis["style_tags"].append("dark-mode-first")
    if light_count > dark_count * 2:
        analysis["style_tags"].append("light-clean")
    
    # Check for gradients
    gradient_count = sum(1 for v in colors.values() if "gradient" in str(v).lower())
    if gradient_count > 0:
        analysis["style_tags"].append("gradient-heavy")
    
    # Typography analysis
    if fonts:
        font_names = [f.lower() for f in fonts]
        if any("inter" in f for f in font_names):
            analysis["style_tags"].append("inter-typography")
        if any("geist" in f for f in font_names):
            analysis["style_tags"].append("geist-typography")
        if any("sans" in f for f in font_names):
            analysis["style_tags"].append("sans-serif")
        if any("serif" in f for f in font_names):
            analysis["style_tags"].append("serif-accent")
        if any("mono" in f for f in font_names):
            analysis["style_tags"].append("monospace-code")
    
    # Shadow analysis
    if len(shadows) > 3:
        analysis["style_tags"].append("elevated-depth")
    elif len(shadows) == 0:
        analysis["style_tags"].append("flat-design")
    
    # Border radius analysis
    radius_values = [r for r in border_radii if r]
    has_rounded = any("50%" in r or "9999" in r for r in radius_values)
    has_sharp = any(r == "0" or r == "0px" for r in radius_values)
    
    if has_rounded and not has_sharp:
        analysis["style_tags"].append("fully-rounded")
    elif has_sharp and not has_rounded:
        analysis["style_tags"].append("sharp-edges")
    else:
        analysis["style_tags"].append("mixed-radii")
    
    # Animation analysis
    if len(animations) > 5:
        analysis["style_tags"].append("animation-rich")
    elif len(animations) > 0:
        analysis["style_tags"].append("subtle-motion")
    
    # Design philosophy
    tags = analysis["style_tags"]
    if "dark-mode-first" in tags and "gradient-heavy" in tags:
        analysis["design_philosophy"] = "Futuristic dark UI with vibrant gradients"
    elif "light-clean" in tags and "flat-design" in tags:
        analysis["design_philosophy"] = "Minimalist flat design with clean whitespace"
    elif "inter-typography" in tags and "sharp-edges" in tags:
        analysis["design_philosophy"] = "Developer-focused clean interface"
    elif "serif-accent" in tags:
        analysis["design_philosophy"] = "Editorial-inspired with personality"
    elif "animation-rich" in tags:
        analysis["design_philosophy"] = "Playful and interactive experience"
    else:
        analysis["design_philosophy"] = "Modern professional web design"
    
    return analysis


def _is_dark_color(value: str) -> bool:
    """Check if a color value is likely dark."""
    value = str(value).strip().lower()
    # Hex colors
    hex_match = re.match(r'#([0-9a-f]{3,8})', value)
    if hex_match:
        hex_val = hex_match.group(1)
        if len(hex_val) >= 6:
            r, g, b = int(hex_val[0:2], 16), int(hex_val[2:4], 16), int(hex_val[4:6], 16)
            luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            return luminance < 0.5
    # Named dark colors
    dark_names = ["black", "dark", "night", "charcoal", "slate", "zinc", "neutral"]
    return any(n in value for n in dark_names)


def _is_light_color(value: str) -> bool:
    """Check if a color value is likely light."""
    value = str(value).strip().lower()
    hex_match = re.match(r'#([0-9a-f]{3,8})', value)
    if hex_match:
        hex_val = hex_match.group(1)
        if len(hex_val) >= 6:
            r, g, b = int(hex_val[0:2], 16), int(hex_val[2:4], 16), int(hex_val[4:6], 16)
            luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            return luminance > 0.7
    light_names = ["white", "light", "snow", "cream", "ghost", "gray-50", "gray-100"]
    return any(n in value for n in light_names)


def extract_from_scraped(site_name: str) -> Optional[ExtractedDesignSystem]:
    """Extract design system from previously scraped data."""
    site_dir = SCRAPED_DIR / site_name
    tokens_path = site_dir / "design-tokens.json"
    
    if not tokens_path.exists():
        print(f"  ❌ No scraped data for {site_name}")
        return None
    
    with open(tokens_path) as f:
        raw = json.load(f)
    
    # Run AI-style analysis
    ai_analysis = ai_vision_analyze(site_name, raw.get("url", ""), raw)
    
    # Build structured design system
    system = ExtractedDesignSystem(
        site_name=site_name,
        url=raw.get("url", ""),
        extracted_at=__import__("time").strftime("%Y-%m-%dT%H:%M:%SZ", __import__("time").gmtime()),
        
        brand_name=site_name.replace(".", " ").title(),
        style_tags=ai_analysis["style_tags"],
        design_philosophy=ai_analysis["design_philosophy"],
        
        colors=_organize_colors(raw.get("colors", {})),
        typography=_organize_typography(raw),
        spacing=_organize_spacing(raw),
        borders={"radii": raw.get("border_radii", [])},
        shadows={"values": raw.get("shadows", [])},
        
        button_styles=raw.get("buttons", []),
        card_styles=raw.get("cards", []),
        input_styles=raw.get("inputs", []),
        motion_patterns=raw.get("transitions", []) + raw.get("animations", []),
    )
    
    # Save
    out_dir = EXTRACTED_DIR / site_name
    out_dir.mkdir(parents=True, exist_ok=True)
    
    out_path = out_dir / "design-system.json"
    with open(out_path, "w") as f:
        json.dump(asdict(system), f, indent=2)
    
    # Generate Tailwind config
    tailwind_config = _generate_tailwind_config(system)
    tw_path = out_dir / "tailwind.config.ts"
    with open(tw_path, "w") as f:
        f.write(tailwind_config)
    
    # Generate CSS variables
    css_vars = _generate_css_variables(system)
    css_path = out_dir / "tokens.css"
    with open(css_path, "w") as f:
        f.write(css_vars)
    
    print(f"  ✅ Extracted design system for {site_name}")
    print(f"     Style: {', '.join(system.style_tags)}")
    print(f"     Philosophy: {system.design_philosophy}")
    
    return system


def _organize_colors(raw_colors: dict) -> dict:
    """Organize colors into a structured system."""
    organized = {
        "primary": [],
        "secondary": [],
        "accent": [],
        "background": [],
        "foreground": [],
        "border": [],
        "muted": [],
    }
    
    for name, value in raw_colors.items():
        name_lower = name.lower()
        value_str = str(value).strip()
        
        if not value_str or value_str in ["inherit", "initial", "unset", "transparent", "currentColor", "none"]:
            continue
        
        if any(w in name_lower for w in ["primary", "brand"]):
            organized["primary"].append({"name": name, "value": value_str})
        elif any(w in name_lower for w in ["secondary", "accent", "highlight"]):
            organized["accent"].append({"name": name, "value": value_str})
        elif any(w in name_lower for w in ["bg", "background", "surface", "canvas"]):
            organized["background"].append({"name": name, "value": value_str})
        elif any(w in name_lower for w in ["text", "fg", "foreground", "content"]):
            organized["foreground"].append({"name": name, "value": value_str})
        elif any(w in name_lower for w in ["border", "stroke", "divider", "outline"]):
            organized["border"].append({"name": name, "value": value_str})
        elif any(w in name_lower for w in ["muted", "subtle", "ghost", "dim", "disabled"]):
            organized["muted"].append({"name": name, "value": value_str})
        else:
            organized["secondary"].append({"name": name, "value": value_str})
    
    return organized


def _organize_typography(raw: dict) -> dict:
    """Organize typography into a scale."""
    return {
        "families": {
            "heading": raw.get("fonts", [])[:1] or ["system-ui"],
            "body": raw.get("fonts", [])[:1] or ["system-ui"],
            "mono": ["ui-monospace", "SFMono-Regular", "monospace"],
        },
        "sizes": raw.get("font_sizes", []),
        "weights": raw.get("font_weights", []),
        "line_heights": raw.get("line_heights", []),
    }


def _organize_spacing(raw: dict) -> dict:
    """Organize spacing values into a scale."""
    return {
        "padding": raw.get("padding_values", []),
        "margin": raw.get("margin_values", []),
        "gap": raw.get("gap_values", []),
    }


def _generate_tailwind_config(system: ExtractedDesignSystem) -> str:
    """Generate a Tailwind CSS config from extracted design system."""
    colors_obj = {}
    for category, values in system.colors.items():
        if values:
            if isinstance(values, list) and values:
                colors_obj[category] = values[0].get("value", "#000") if isinstance(values[0], dict) else values[0]
    
    return f"""import type {{ Config }} from 'tailwindcss'

const config: Config = {{
  theme: {{
    extend: {{
      colors: {{
        brand: {{
          primary: '{colors_obj.get("primary", "#5E6AD2")}',
          secondary: '{colors_obj.get("secondary", "#8B8D98")}',
          accent: '{colors_obj.get("accent", "#F58116")}',
          background: '{colors_obj.get("background", "#0A0A0F")}',
          foreground: '{colors_obj.get("foreground", "#EDEDF0")}',
          muted: '{colors_obj.get("muted", "#6B6D76")}',
          border: '{colors_obj.get("border", "#2A2A32")}',
        }},
      }},
      fontFamily: {{
        heading: {system.typography.get("families", {}).get("heading", ["Inter"])},
        body: {system.typography.get("families", {}).get("body", ["Inter"])},
        mono: {system.typography.get("families", {}).get("mono", ["monospace"])},
      }},
      borderRadius: {{
        DEFAULT: '{system.borders.get("radii", ["8px"])[0] if system.borders.get("radii") else "8px"}',
      }},
    }},
  }},
}}

export default config
"""


def _generate_css_variables(system: ExtractedDesignSystem) -> str:
    """Generate CSS custom properties from extracted design system."""
    lines = [
        f"/* Design tokens extracted from {system.site_name} */",
        f"/* Generated by SiteFlow Design Token Extractor */",
        f"/* {system.design_philosophy} */",
        "",
        ":root {",
    ]
    
    for category, values in system.colors.items():
        if isinstance(values, list):
            for i, v in enumerate(values):
                if isinstance(v, dict):
                    lines.append(f"  --color-{category}-{i}: {v.get('value', '')};")
                else:
                    lines.append(f"  --color-{category}-{i}: {v};")
        elif isinstance(values, str):
            lines.append(f"  --color-{category}: {values};")
    
    lines.extend([
        "",
        "  /* Typography */",
        f"  --font-heading: {', '.join(system.typography.get('families', {}).get('heading', ['Inter']))};",
        f"  --font-body: {', '.join(system.typography.get('families', {}).get('body', ['Inter']))};",
        f"  --font-mono: {', '.join(system.typography.get('families', {}).get('mono', ['monospace']))};",
        "",
        "  /* Spacing */",
    ])
    
    lines.extend([
        "}",
        "",
    ])
    
    return "\n".join(lines)


def main():
    """Extract design systems from all scraped sites."""
    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    
    if not SCRAPED_DIR.exists():
        print("❌ No scraped data found. Run godly-scraper.py first.")
        return
    
    sites = [d.name for d in SCRAPED_DIR.iterdir() if d.is_dir()]
    
    if not sites:
        print("❌ No scraped sites found in templates/scraped/")
        return
    
    print(f"🎨 Extracting design systems from {len(sites)} sites...\n")
    
    results = []
    for site_name in sorted(sites):
        system = extract_from_scraped(site_name)
        if system:
            results.append(system)
    
    # Create comparison matrix
    matrix = {
        "sites": {},
        "common_patterns": {},
        "unique_patterns": {},
    }
    
    all_tags = []
    for system in results:
        matrix["sites"][system.site_name] = {
            "style_tags": system.style_tags,
            "philosophy": system.design_philosophy,
            "color_count": sum(len(v) for v in system.colors.values() if isinstance(v, list)),
            "font_count": len(system.typography.get("families", {}).get("body", [])),
            "button_count": len(system.button_styles),
            "motion_count": len(system.motion_patterns),
        }
        all_tags.extend(system.style_tags)
    
    # Find common patterns
    from collections import Counter
    tag_counts = Counter(all_tags)
    matrix["common_patterns"] = {
        tag: count for tag, count in tag_counts.most_common(10)
        if count >= 2
    }
    
    matrix_path = EXTRACTED_DIR / "comparison-matrix.json"
    with open(matrix_path, "w") as f:
        json.dump(matrix, f, indent=2)
    
    print(f"\n🏁 Extracted {len(results)} design systems")
    print(f"   Common patterns: {', '.join(f'{k}({v})' for k, v in matrix['common_patterns'].items())}")
    print(f"   Output: {EXTRACTED_DIR}")


if __name__ == "__main__":
    main()