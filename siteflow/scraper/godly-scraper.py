#!/usr/bin/env python3
"""
SiteFlow Godly Scraper
Scrapes design-focused websites for inspiration and design token extraction.
Respects robots.txt, uses screenshots when available, extracts CSS/design patterns.
"""

import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse, urljoin

try:
    import requests
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "beautifulsoup4"])
    import requests

try:
    from bs4 import BeautifulSoup
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "beautifulsoup4"])
    from bs4 import BeautifulSoup


OUTPUT_DIR = Path(__file__).parent.parent / "templates" / "scraped"
SCREENSHOT_DIR = OUTPUT_DIR / "screenshots"


@dataclass
class DesignTokens:
    """Extracted design tokens from a website."""
    site_name: str
    url: str
    scraped_at: str = ""
    
    # Colors
    colors: dict = field(default_factory=dict)
    
    # Typography
    fonts: list = field(default_factory=list)
    font_sizes: list = field(default_factory=list)
    font_weights: list = field(default_factory=list)
    line_heights: list = field(default_factory=list)
    
    # Spacing
    padding_values: list = field(default_factory=list)
    margin_values: list = field(default_factory=list)
    gap_values: list = field(default_factory=list)
    
    # Layout
    border_radii: list = field(default_factory=list)
    shadows: list = field(default_factory=list)
    breakpoints: list = field(default_factory=list)
    
    # Components
    buttons: list = field(default_factory=list)
    cards: list = field(default_factory=list)
    inputs: list = field(default_factory=list)
    nav_patterns: list = field(default_factory=list)
    
    # Animation
    transitions: list = field(default_factory=list)
    animations: list = field(default_factory=list)
    
    # Meta
    meta_description: str = ""
    og_image: str = ""
    favicon: str = ""
    page_title: str = ""


def check_robots_txt(url: str) -> bool:
    """Check if scraping is allowed by robots.txt."""
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    
    try:
        resp = requests.get(robots_url, timeout=10, headers={
            "User-Agent": "SiteFlow-DesignBot/1.0 (design research)"
        })
        if resp.status_code != 200:
            return True  # No robots.txt = allowed
        
        # Simple check: look for Disallow on / for our bot or *
        lines = resp.text.lower().splitlines()
        our_agent = False
        all_agent = False
        
        for line in lines:
            line = line.strip()
            if line.startswith("user-agent:"):
                agent = line.split(":", 1)[1].strip()
                our_agent = "siteflow" in agent or "designbot" in agent
                all_agent = agent == "*"
            elif line.startswith("disallow:") and (our_agent or all_agent):
                path = line.split(":", 1)[1].strip()
                if path == "/" or path == "":
                    return path != "/"
        
        return True
    except Exception:
        return True  # If we can't check, proceed


def extract_css_variables(soup: BeautifulSoup) -> dict:
    """Extract CSS custom properties (design tokens) from style tags."""
    colors = {}
    
    for style in soup.find_all("style"):
        css_text = style.string or ""
        # Match CSS custom properties
        var_pattern = r'--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);'
        for match in re.finditer(var_pattern, css_text):
            name, value = match.groups()
            value = value.strip()
            
            # Categorize by name patterns
            name_lower = name.lower()
            if any(c in name_lower for c in ['color', 'bg', 'background', 'border', 'text', 'fg']):
                colors[name] = value
    
    return colors


def extract_inline_styles(soup: BeautifulSoup) -> dict:
    """Extract patterns from inline styles."""
    tokens = {
        "colors": set(),
        "font_sizes": set(),
        "font_families": set(),
        "border_radii": set(),
        "shadows": set(),
        "padding": set(),
        "margin": set(),
    }
    
    color_pattern = r'(?:color|background|border-color|background-color)\s*:\s*([^;]+)'
    font_size_pattern = r'font-size\s*:\s*([^;]+)'
    font_family_pattern = r'font-family\s*:\s*([^;]+)'
    radius_pattern = r'border-radius\s*:\s*([^;]+)'
    shadow_pattern = r'box-shadow\s*:\s*([^;]+)'
    
    for element in soup.find_all(style=True):
        style = element.get("style", "")
        
        for match in re.finditer(color_pattern, style, re.IGNORECASE):
            tokens["colors"].add(match.group(1).strip())
        for match in re.finditer(font_size_pattern, style, re.IGNORECASE):
            tokens["font_sizes"].add(match.group(1).strip())
        for match in re.finditer(font_family_pattern, style, re.IGNORECASE):
            tokens["font_families"].add(match.group(1).strip())
        for match in re.finditer(radius_pattern, style, re.IGNORECASE):
            tokens["border_radii"].add(match.group(1).strip())
        for match in re.finditer(shadow_pattern, style, re.IGNORECASE):
            tokens["shadows"].add(match.group(1).strip())
    
    return {k: list(v) for k, v in tokens.items()}


def extract_meta_info(soup: BeautifulSoup, url: str) -> dict:
    """Extract meta information and Open Graph data."""
    meta = {}
    
    # Title
    title = soup.find("title")
    meta["page_title"] = title.string.strip() if title and title.string else ""
    
    # Meta description
    desc = soup.find("meta", attrs={"name": "description"})
    meta["meta_description"] = desc.get("content", "") if desc else ""
    
    # OG Image
    og_img = soup.find("meta", attrs={"property": "og:image"})
    meta["og_image"] = og_img.get("content", "") if og_img else ""
    
    # Favicon
    favicon = soup.find("link", rel=lambda x: x and "icon" in x)
    if favicon and favicon.get("href"):
        meta["favicon"] = urljoin(url, favicon["href"])
    else:
        meta["favicon"] = ""
    
    return meta


def extract_component_patterns(soup: BeautifulSoup) -> dict:
    """Extract UI component patterns (buttons, cards, inputs, nav)."""
    patterns = {
        "buttons": [],
        "cards": [],
        "inputs": [],
        "nav_patterns": [],
    }
    
    # Buttons
    for btn in soup.find_all(["button", "a"], class_=True):
        classes = " ".join(btn.get("class", []))
        if any(word in classes.lower() for word in ["btn", "button", "cta", "primary", "secondary"]):
            patterns["buttons"].append({
                "tag": btn.name,
                "classes": classes,
                "text": btn.get_text(strip=True)[:50],
            })
    
    # Cards (heuristic: elements with card-like class names)
    for card in soup.find_all(class_=True):
        classes = " ".join(card.get("class", []))
        if any(word in classes.lower() for word in ["card", "tile", "panel", "feature"]):
            patterns["cards"].append({
                "tag": card.name,
                "classes": classes,
            })
    
    # Inputs
    for inp in soup.find_all(["input", "textarea", "select"]):
        patterns["inputs"].append({
            "type": inp.get("type", inp.name),
            "placeholder": inp.get("placeholder", ""),
            "classes": " ".join(inp.get("class", [])),
        })
    
    # Navigation
    for nav in soup.find_all("nav"):
        links = [a.get("href", "") for a in nav.find_all("a")]
        patterns["nav_patterns"].append({
            "links_count": len(links),
            "links": links[:10],
        })
    
    return patterns


def extract_animation_patterns(soup: BeautifulSoup) -> dict:
    """Extract animation and transition patterns from CSS and style tags."""
    animations = {
        "transitions": [],
        "animations": [],
    }
    
    for style in soup.find_all("style"):
        css_text = style.string or ""
        
        # Transitions
        trans_pattern = r'transition\s*:\s*([^;]+);'
        for match in re.finditer(trans_pattern, css_text, re.IGNORECASE):
            animations["transitions"].append(match.group(1).strip())
        
        # Keyframe animation names
        keyframes_pattern = r'@keyframes\s+([a-zA-Z0-9_-]+)'
        for match in re.finditer(keyframes_pattern, css_text):
            animations["animations"].append(match.group(1))
    
    return animations


def scrape_site(url: str) -> Optional[DesignTokens]:
    """Scrape a single website and extract design tokens."""
    print(f"🔍 Scraping: {url}")
    
    # Check robots.txt
    if not check_robots_txt(url):
        print(f"  ⛔ Blocked by robots.txt: {url}")
        return None
    
    try:
        resp = requests.get(url, timeout=15, headers={
            "User-Agent": "SiteFlow-DesignBot/1.0 (design research; +https://siteflow.dev)",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        })
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  ❌ Failed to fetch: {e}")
        return None
    
    soup = BeautifulSoup(resp.text, "html.parser")
    parsed_url = urlparse(url)
    site_name = parsed_url.netloc.replace("www.", "")
    
    # Extract all patterns
    css_vars = extract_css_variables(soup)
    inline_tokens = extract_inline_styles(soup)
    meta_info = extract_meta_info(soup, url)
    component_patterns = extract_component_patterns(soup)
    animation_patterns = extract_animation_patterns(soup)
    
    tokens = DesignTokens(
        site_name=site_name,
        url=url,
        scraped_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        
        colors={**css_vars, **{k: v for k, v in zip(
            [f"inline_{i}" for i in range(len(inline_tokens.get("colors", [])))],
            inline_tokens.get("colors", [])
        )}},
        
        fonts=inline_tokens.get("font_families", []),
        font_sizes=inline_tokens.get("font_sizes", []),
        font_weights=[],
        line_heights=[],
        
        padding_values=inline_tokens.get("padding", []),
        margin_values=inline_tokens.get("margin", []),
        gap_values=[],
        
        border_radii=inline_tokens.get("border_radii", []),
        shadows=inline_tokens.get("shadows", []),
        breakpoints=[],
        
        buttons=component_patterns.get("buttons", [])[:20],
        cards=component_patterns.get("cards", [])[:20],
        inputs=component_patterns.get("inputs", [])[:10],
        nav_patterns=component_patterns.get("nav_patterns", [])[:5],
        
        transitions=animation_patterns.get("transitions", [])[:15],
        animations=animation_patterns.get("animations", [])[:15],
        
        **meta_info,
    )
    
    # Save
    site_dir = OUTPUT_DIR / site_name
    site_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = site_dir / "design-tokens.json"
    with open(output_path, "w") as f:
        json.dump(asdict(tokens), f, indent=2)
    
    # Also save raw HTML for AI vision analysis later
    html_path = site_dir / "page.html"
    with open(html_path, "w") as f:
        f.write(resp.text)
    
    print(f"  ✅ Saved to {output_path}")
    print(f"     Colors: {len(tokens.colors)} | Fonts: {len(tokens.fonts)} | Buttons: {len(tokens.buttons)} | Cards: {len(tokens.cards)}")
    
    return tokens


def main():
    """Scrape all target sites."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Godly-tier sites
    sites = [
        "https://linear.app",
        "https://vercel.com",
        "https://stripe.com",
        "https://framer.com",
        "https://figma.com",
        "https://notion.so",
        "https://raycast.com",
        "https://perplexity.ai",
        "https://amie.so",
        "https://ped.ro",
    ]
    
    results = []
    for url in sites:
        tokens = scrape_site(url)
        if tokens:
            results.append(tokens)
        time.sleep(2)  # Be respectful
    
    # Summary
    summary_path = OUTPUT_DIR / "scrape-summary.json"
    summary = {
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_sites": len(sites),
        "successful": len(results),
        "failed": len(sites) - len(results),
        "sites": [asdict(r) for r in results],
    }
    
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n🏁 Done! Scraped {len(results)}/{len(sites)} sites successfully.")
    print(f"   Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()