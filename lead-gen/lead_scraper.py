#!/usr/bin/env python3
"""
COLORgenius Lead Scraper — Columbus Pilot
Targets booth rental sites (Sola, Salon Lofts, My Salon Suite, Phenix)
to find independent beauty professionals for COLORgenius outreach.

Uses self-hosted ScrapeGraphAI with local Ollama (llama3.2) for extraction.
No API costs — runs entirely locally.

Usage:
  source .venv-leads/bin/activate
  python lead_scraper.py                    # Full Columbus run
  python lead_scraper.py --source sola      # Just Sola
  python lead_scraper.py --source lofts     # Just Salon Lofts
  python lead_scraper.py --city "Cleveland" # Different city
  python lead_scraper.py --dry-run          # List URLs only, no scraping
"""

import argparse
import csv
import json
import logging
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("lead-gen/scraper.log", mode="a"),
    ],
)
log = logging.getLogger("lead-scraper")

# ---------------------------------------------------------------------------
# Booth Rental Site Definitions
# ---------------------------------------------------------------------------
# These sites list independent beauty pros with profile pages containing
# name, specialty, phone, email, website, social links.

SITES = {
    "sola": {
        "name": "Sola Salon Studios",
        "base_url": "https://www.solasalonstudios.com",
        # Sola has location pages that list pros at each salon
        # Columbus locations discovered via /locations page
        "city_paths": {
            "Columbus": [
                "/locations/oh/columbus/dublin",
                "/locations/oh/columbus/polaris",
                "/locations/oh/columbus/worthington",
                "/locations/oh/columbus/hilliard",
                "/locations/oh/columbus/easton",
                "/locations/oh/columbus/lewiscenter",
            ],
        },
        "profile_pattern": r"/salon/[\w-]+/[\w-]+",  # individual pro pages
    },
    "lofts": {
        "name": "Salon Lofts",
        "base_url": "https://www.salonlofts.com",
        # Salon Lofts organizes by market → location → loft owner
        "city_paths": {
            "Columbus": [
                "/locations/columbus",
            ],
        },
        "profile_pattern": r"/loft-owner/[\w-]+",
    },
    "mysalonsuite": {
        "name": "My Salon Suite",
        "base_url": "https://www.mysalonsuite.com",
        "city_paths": {
            "Columbus": [
                "/locations/oh/columbus",
                "/locations/oh/columbus-dublin",
                "/locations/oh/columbus-hilliard",
            ],
        },
        "profile_pattern": r"/suite/[\w-]+",
    },
    "phenix": {
        "name": "Phenix Salon Suites",
        "base_url": "https://www.phenixsuites.com",
        "city_paths": {
            "Columbus": [
                "/locations/ohio/columbus",
            ],
        },
        "profile_pattern": r"/professional/[\w-]+",
    },
}

# Additional discovery sources (booking platforms, directories)
DISCOVERY_SOURCES = {
    "styleseat": {
        "name": "StyleSeat",
        "search_url": "https://www.styleseat.com/search",
        "note": "Requires JS rendering + search queries per specialty",
    },
    "booksy": {
        "name": "Booksy",
        "search_url": "https://booksy.com/search",
        "note": "Requires JS rendering + location-based search",
    },
    "yelp": {
        "name": "Yelp",
        "search_url": "https://www.yelp.com/search",
        "note": "Good for discovery but email harvesting limited",
    },
}

# Output schema for extracted leads
LEAD_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string", "description": "Full name of the beauty professional"},
        "specialty": {"type": "string", "description": "Primary service/specialty (e.g., hair colorist, nail tech, esthetician)"},
        "business_name": {"type": "string", "description": "Name of their business/suite if different from personal name"},
        "email": {"type": "string", "description": "Email address if publicly listed"},
        "phone": {"type": "string", "description": "Phone number if publicly listed"},
        "website": {"type": "string", "description": "Personal website URL"},
        "instagram": {"type": "string", "description": "Instagram handle or URL"},
        "facebook": {"type": "string", "description": "Facebook page URL"},
        "address": {"type": "string", "description": "Salon/suite address"},
        "services": {"type": "string", "description": "List of services offered"},
        "booking_url": {"type": "string", "description": "Online booking link"},
        "source_url": {"type": "string", "description": "URL where this info was found"},
        "source_site": {"type": "string", "description": "Which booth rental site"},
    },
}


# ---------------------------------------------------------------------------
# ScrapeGraphAI Pipeline
# ---------------------------------------------------------------------------
class LeadScraper:
    """Scrape leads from booth rental sites using ScrapeGraphAI."""

    def __init__(self, model: str = "ollama/llama3.2:3b", headless: bool = True):
        self.model = model
        self.headless = headless
        self.graph_config = {
            "llm": {
                "model": model,
                "model_tokens": 8192,
                "format": "json",
            },
            "verbose": True,
            "headless": headless,
        }
        self.leads: list[dict] = []
        self.output_dir = Path("lead-gen/output")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def scrape_profile_page(self, url: str, source_site: str) -> Optional[dict]:
        """Scrape a single professional's profile page."""
        try:
            from scrapegraphai.graphs import SmartScraperGraph

            prompt = (
                "Extract the beauty professional's contact information from this page. "
                "Look for: full name, specialty/services (especially hair color, colorist, stylist), "
                "business name, email address, phone number, personal website, "
                "Instagram handle or link, Facebook page, physical address, and booking URL. "
                "Return ALL contact info you can find."
            )

            graph = SmartScraperGraph(
                prompt=prompt,
                source=url,
                config=self.graph_config,
            )

            result = graph.run()
            if result:
                result["source_url"] = url
                result["source_site"] = source_site
                # Filter for colorists/stylists if possible
                return result
            return None

        except Exception as e:
            log.error(f"Failed to scrape {url}: {e}")
            return None

    def scrape_directory_page(self, url: str, source_site: str) -> list[str]:
        """Scrape a directory/location page to find individual profile URLs."""
        try:
            from scrapegraphai.graphs import SmartScraperGraph

            prompt = (
                "Extract all URLs on this page that link to individual beauty professional profiles, "
                "loft owners, or suite renters. Look for links containing names, stylist profiles, "
                "loft-owner pages, or suite pages. Return the full URLs."
            )

            graph = SmartScraperGraph(
                prompt=prompt,
                source=url,
                config=self.graph_config,
            )

            result = graph.run()
            if result and isinstance(result, dict):
                # Try to extract URLs from the result
                urls = []
                for key, value in result.items():
                    if isinstance(value, str) and value.startswith("http"):
                        urls.append(value)
                    elif isinstance(value, list):
                        for item in value:
                            if isinstance(item, str) and item.startswith("http"):
                                urls.append(item)
                            elif isinstance(item, dict):
                                for v in item.values():
                                    if isinstance(v, str) and v.startswith("http"):
                                        urls.append(v)
                return urls
            return []

        except Exception as e:
            log.error(f"Failed to scrape directory {url}: {e}")
            return []

    def discover_profile_urls(
        self, source_key: str, city: str = "Columbus"
    ) -> list[str]:
        """Discover all profile URLs for a given source and city."""
        site = SITES[source_key]
        paths = site["city_paths"].get(city, [])
        profile_urls = []

        for path in paths:
            url = f"{site['base_url']}{path}"
            log.info(f"Discovering profiles at: {url}")
            found = self.scrape_directory_page(url, site["name"])
            profile_urls.extend(found)
            time.sleep(2)  # Be polite

        return profile_urls

    def run(
        self,
        sources: list[str] | None = None,
        city: str = "Columbus",
        dry_run: bool = False,
        max_profiles: int = 50,
    ) -> list[dict]:
        """Run the full lead scraping pipeline."""
        if sources is None:
            sources = list(SITES.keys())

        all_profile_urls: list[str] = []

        # Phase 1: Discover profile URLs from directory pages
        log.info(f"=== Phase 1: Discovering profiles in {city} ===")
        for source_key in sources:
            if source_key not in SITES:
                log.warning(f"Unknown source: {source_key}")
                continue

            site = SITES[source_key]
            log.info(f"\nDiscovering {site['name']} profiles...")

            paths = site["city_paths"].get(city, [])
            if not paths:
                log.warning(f"No paths defined for {city} in {site['name']}")
                continue

            for path in paths:
                url = f"{site['base_url']}{path}"
                log.info(f"  Scanning: {url}")

                if dry_run:
                    log.info(f"  [DRY RUN] Would scrape: {url}")
                    continue

                found = self.scrape_directory_page(url, site["name"])
                log.info(f"  Found {len(found)} profile URLs")
                all_profile_urls.extend(found)
                time.sleep(3)

        # Phase 2: Scrape individual profiles
        log.info(f"\n=== Phase 2: Scraping {len(all_profile_urls)} profiles ===")

        for i, url in enumerate(all_profile_urls[:max_profiles]):
            log.info(f"  [{i+1}/{min(len(all_profile_urls), max_profiles)}] {url}")

            if dry_run:
                log.info(f"  [DRY RUN] Would scrape: {url}")
                continue

            # Determine source site from URL
            source_site = "unknown"
            for key, site in SITES.items():
                if site["base_url"] in url:
                    source_site = site["name"]
                    break

            lead = self.scrape_profile_page(url, source_site)
            if lead:
                self.leads.append(lead)
                log.info(f"  ✓ {lead.get('name', 'Unknown')} — {lead.get('specialty', 'N/A')}")

            time.sleep(2)  # Be polite between profile scrapes

        # Phase 3: Save results
        self._save_results(city)
        return self.leads

    def _save_results(self, city: str):
        """Save scraped leads to CSV and JSON."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # CSV
        csv_path = self.output_dir / f"{city.lower()}_leads_{timestamp}.csv"
        if self.leads:
            fieldnames = list(LEAD_SCHEMA["properties"].keys())
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for lead in self.leads:
                    row = {k: lead.get(k, "") for k in fieldnames}
                    writer.writerow(row)
            log.info(f"Saved {len(self.leads)} leads to {csv_path}")

        # JSON (full data)
        json_path = self.output_dir / f"{city.lower()}_leads_{timestamp}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(self.leads, f, indent=2, ensure_ascii=False)
        log.info(f"Saved raw data to {json_path}")


# ---------------------------------------------------------------------------
# Playwright Direct Scraper (fallback for JS-heavy sites)
# ---------------------------------------------------------------------------
class PlaywrightScraper:
    """
    Direct Playwright scraper for JS-rendered booth rental sites.
    Used as fallback when ScrapeGraph can't handle SPAs.
    """

    def __init__(self):
        self.leads: list[dict] = []
        self.output_dir = Path("lead-gen/output")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    async def scrape_sola_location(self, city: str = "Columbus") -> list[dict]:
        """Scrape Sola Salon Studios location pages for Columbus."""
        try:
            from playwright.async_api import async_playwright

            locations = SITES["sola"]["city_paths"].get(city, [])
            leads = []

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                for loc_path in locations:
                    url = f"{SITES['sola']['base_url']}{loc_path}"
                    log.info(f"Loading Sola location: {url}")
                    await page.goto(url, wait_until="networkidle", timeout=30000)

                    # Find all professional profile links on this location page
                    links = await page.query_selector_all("a[href*='/salon/']")
                    for link in links:
                        href = await link.get_attribute("href")
                        name = await link.inner_text()
                        if href and name:
                            full_url = (
                                href
                                if href.startswith("http")
                                else f"{SITES['sola']['base_url']}{href}"
                            )
                            leads.append(
                                {
                                    "name": name.strip(),
                                    "source_url": full_url,
                                    "source_site": "Sola Salon Studios",
                                    "specialty": "",
                                }
                            )

                await browser.close()

            return leads

        except ImportError:
            log.error("Playwright not installed. Run: playwright install chromium")
            return []
        except Exception as e:
            log.error(f"Playwright Sola scraper failed: {e}")
            return []

    async def scrape_salon_lofts(self, city: str = "Columbus") -> list[dict]:
        """Scrape Salon Lofts for Columbus professionals."""
        try:
            from playwright.async_api import async_playwright

            locations = SITES["lofts"]["city_paths"].get(city, [])
            leads = []

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                for loc_path in locations:
                    url = f"{SITES['lofts']['base_url']}{loc_path}"
                    log.info(f"Loading Salon Lofts: {url}")
                    await page.goto(url, wait_until="networkidle", timeout=30000)

                    # Look for loft owner links
                    links = await page.query_selector_all("a[href*='loft-owner'], a[href*='/loft/']")
                    for link in links:
                        href = await link.get_attribute("href")
                        name = await link.inner_text()
                        if href and name and name.strip():
                            full_url = (
                                href
                                if href.startswith("http")
                                else f"{SITES['lofts']['base_url']}{href}"
                            )
                            leads.append(
                                {
                                    "name": name.strip(),
                                    "source_url": full_url,
                                    "source_site": "Salon Lofts",
                                    "specialty": "",
                                }
                            )

                await browser.close()

            return leads

        except Exception as e:
            log.error(f"Playwright Salon Lofts scraper failed: {e}")
            return []


# ---------------------------------------------------------------------------
# URL Discovery via Playwright (for JS-rendered sites)
# ---------------------------------------------------------------------------
async def discover_urls_playwright(source_key: str, city: str = "Columbus") -> list[str]:
    """Use Playwright to discover profile URLs from JS-rendered directory pages."""
    scraper = PlaywrightScraper()

    if source_key == "sola":
        leads = await scraper.scrape_sola_location(city)
        return [l["source_url"] for l in leads]
    elif source_key == "lofts":
        leads = await scraper.scrape_salon_lofts(city)
        return [l["source_url"] for l in leads]
    else:
        log.warning(f"No Playwright scraper for {source_key}")
        return []


# ---------------------------------------------------------------------------
# Manual URL list (seed data for Columbus)
# ---------------------------------------------------------------------------
# These are known Columbus booth rental locations we can start with.
# The scraper will discover more from the directory pages.

COLUMBUS_SEED_URLS = {
    "sola": [
        "https://www.solasalonstudios.com/locations/oh/columbus/dublin",
        "https://www.solasalonstudios.com/locations/oh/columbus/polaris",
        "https://www.solasalonstudios.com/locations/oh/columbus/worthington",
        "https://www.solasalonstudios.com/locations/oh/columbus/hilliard",
        "https://www.solasalonstudios.com/locations/oh/columbus/easton",
        "https://www.solasalonstudios.com/locations/oh/columbus/lewiscenter",
    ],
    "lofts": [
        "https://www.salonlofts.com/locations/columbus",
    ],
}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="COLORgenius Lead Scraper — Find beauty pros on booth rental sites"
    )
    parser.add_argument(
        "--source",
        choices=list(SITES.keys()) + ["all"],
        default="all",
        help="Which booth rental site to scrape (default: all)",
    )
    parser.add_argument(
        "--city",
        default="Columbus",
        help="City to search (default: Columbus)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List URLs only, don't scrape profiles",
    )
    parser.add_argument(
        "--max-profiles",
        type=int,
        default=50,
        help="Maximum number of profiles to scrape (default: 50)",
    )
    parser.add_argument(
        "--model",
        default="ollama/llama3.2:3b",
        help="Ollama model for extraction (default: llama3.2)",
    )
    parser.add_argument(
        "--method",
        choices=["scrapegraph", "playwright", "both"],
        default="both",
        help="Scraping method (default: both)",
    )
    parser.add_argument(
        "--playwright-only",
        action="store_true",
        help="Use Playwright only (skip ScrapeGraph AI extraction)",
    )

    args = parser.parse_args()

    log.info(f"COLORgenius Lead Scraper — {args.city}")
    log.info(f"Source: {args.source} | Method: {args.method} | Model: {args.model}")

    if args.dry_run:
        log.info("DRY RUN — listing URLs only, no scraping")
        print("\n📋 Seed URLs for Columbus:\n")
        for source_key, urls in COLUMBUS_SEED_URLS.items():
            if args.source != "all" and args.source != source_key:
                continue
            site_name = SITES[source_key]["name"]
            print(f"\n{site_name}:")
            for url in urls:
                print(f"  {url}")
        print("\n💡 Run without --dry-run to start scraping")
        return

    # Run the scraper
    sources = list(SITES.keys()) if args.source == "all" else [args.source]
    scraper = LeadScraper(model=args.model)
    leads = scraper.run(
        sources=sources,
        city=args.city,
        dry_run=args.dry_run,
        max_profiles=args.max_profiles,
    )

    # Print summary
    print(f"\n{'='*60}")
    print(f"COLORgenius Lead Scraper Results — {args.city}")
    print(f"{'='*60}")
    print(f"Total leads found: {len(leads)}")
    print(f"Output saved to: lead-gen/output/")
    print(f"{'='*60}\n")

    # Print leads with colorist focus
    colorists = [
        l
        for l in leads
        if l.get("specialty", "").lower()
        and any(
            kw in l.get("specialty", "").lower()
            for kw in ["color", "colorist", "hair", "balayage", "highlight", "bleach"]
        )
    ]
    if colorists:
        print(f"🎨 Colorists found: {len(colorists)}")
        for c in colorists[:10]:
            print(f"  • {c.get('name', '?')} — {c.get('specialty', '?')} — {c.get('email', c.get('phone', 'no contact'))}")
    else:
        print("No colorists identified yet (may need profile-level scraping)")


if __name__ == "__main__":
    main()