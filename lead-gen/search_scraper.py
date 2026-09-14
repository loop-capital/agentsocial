#!/usr/bin/env python3
"""
COLORgenius Lead Scraper — Search-Based Discovery
Finds independent beauty professionals on booth rental sites using web search.

This is the WORKING method. Direct site scraping times out on JS SPAs.
Search engines have already indexed the profile pages — we find them that way,
then scrape individual profiles for full contact info.

Usage:
  source .venv-leads/bin/activate
  python lead-gen/search_scraper.py                    # Columbus, all sources
  python lead-gen/search_scraper.py --source sola      # Just Sola
  python lead-gen/search_scraper.py --city "Cleveland" # Different city
  python lead-gen/search_scraper.py --scrape-profiles  # Also scrape individual profiles
"""

import argparse
import asyncio
import csv
import json
import logging
import re
import sys
import time
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("lead-gen/scraper.log", mode="a"),
    ],
)
log = logging.getLogger("search-scraper")

OUTPUT_DIR = Path("lead-gen/output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Search queries for each platform
# ---------------------------------------------------------------------------
SEARCH_QUERIES = {
    "sola": [
        "site:solasalonstudios.com Columbus Ohio hair colorist",
        "site:solasalonstudios.com Columbus Ohio hair stylist",
        "site:solasalonstudios.com Columbus Ohio balayage highlights",
        "site:solasalonstudios.com Columbus Ohio color correction",
        "site:solasalonstudios.com Columbus Ohio blond specialist",
        "site:solasalonstudios.com Columbus Ohio esthetician",
        "site:solasalonstudios.com Columbus Ohio nail tech",
    ],
    "lofts": [
        "site:salonlofts.com Columbus Ohio hair colorist",
        "site:salonlofts.com Columbus Ohio hair stylist",
        "site:salonlofts.com Columbus Ohio balayage highlights",
        "site:salonlofts.com Columbus Ohio color correction",
        "site:salonlofts.com Columbus Ohio blond specialist",
        "site:salonlofts.com Columbus Ohio esthetician",
        "site:salonlofts.com Columbus Ohio nail artist",
    ],
    "mysalonsuite": [
        "site:mysalonsuite.com Columbus Ohio hair colorist",
        "site:mysalonsuite.com Columbus Ohio hair stylist",
        "site:mysalonsuite.com Columbus Ohio balayage",
        "site:mysalonsuite.com Columbus Ohio colorist",
        "site:mysalonsuite.com Columbus Ohio nail tech",
    ],
    "phenix": [
        "site:phenixsuites.com Columbus Ohio hair stylist",
        "site:phenixsuites.com Columbus Ohio colorist",
    ],
    # Broader discovery sources
    "styleseat": [
        "site:styleseat.com Columbus Ohio hair colorist",
        "site:styleseat.com Columbus Ohio hair stylist balayage",
    ],
    "booksy": [
        "site:booksy.com Columbus Ohio hair colorist",
        "site:booksy.com Columbus Ohio hair stylist",
    ],
    "fresha": [
        "site:fresha.com Columbus Ohio hair colorist",
        "site:fresha.com Columbus Ohio hair stylist",
    ],
}

# City-specific overrides (replace "Columbus Ohio" with city name)
CITY_QUERIES = {
    "Cleveland": "Cleveland Ohio",
    "Cincinnati": "Cincinnati Ohio",
    "Dayton": "Dayton Ohio",
    "Chicago": "Chicago Illinois",
    "Nashville": "Nashville Tennessee",
    "Austin": "Austin Texas",
    "Dallas": "Dallas Texas",
    "Houston": "Houston Texas",
    "Denver": "Denver Colorado",
    "Atlanta": "Atlanta Georgia",
    "Miami": "Miami Florida",
    "Phoenix": "Phoenix Arizona",
}


def adapt_queries_for_city(queries: dict, city: str) -> dict:
    """Replace 'Columbus Ohio' in queries with the target city."""
    if city == "Columbus":
        return queries
    city_state = CITY_QUERIES.get(city, city)
    adapted = {}
    for source, query_list in queries.items():
        adapted[source] = [q.replace("Columbus Ohio", city_state) for q in query_list]
    return adapted


# ---------------------------------------------------------------------------
# Colorist/Lead priority scoring
# ---------------------------------------------------------------------------
TIER1_KEYWORDS = [
    "colorist", "color", "balayage", "blond specialist", "blonde specialist",
    "highlights", "ombre", "color correction", "hair color", "freehand color",
]

TIER2_KEYWORDS = [
    "hair stylist", "stylist", "hair design", "haircut", "cut and color",
    "precision cut", "extensions", "keratin",
]

TIER3_KEYWORDS = [
    "nail", "esthetician", "skin care", "lashes", "brow", "makeup artist",
    "massage", "barber", "men's cut",
]


def score_lead(lead: dict) -> tuple[int, str]:
    """Score a lead by tier priority. Returns (tier, tier_label)."""
    text = f"{lead.get('name', '')} {lead.get('description', '')} {lead.get('specialty', '')}".lower()
    for kw in TIER1_KEYWORDS:
        if kw in text:
            return (1, "tier1_colorist")
    for kw in TIER2_KEYWORDS:
        if kw in text:
            return (2, "tier2_stylist")
    for kw in TIER3_KEYWORDS:
        if kw in text:
            return (3, "tier3_other")
    return (4, "tier4_general")


# ---------------------------------------------------------------------------
# Run searches via web_search tool (called externally, results parsed manually)
# ---------------------------------------------------------------------------
def generate_search_commands(queries: dict, city: str = "Columbus") -> list[str]:
    """Generate all search queries to run. Output for copy-paste or script."""
    adapted = adapt_queries_for_city(queries, city)
    all_queries = []
    for source, query_list in adapted.items():
        for q in query_list:
            all_queries.append(q)
    return all_queries


# ---------------------------------------------------------------------------
# Lead data structure
# ---------------------------------------------------------------------------
def create_lead(
    name: str,
    source_site: str,
    source_url: str,
    description: str = "",
    specialty: str = "",
    email: str = "",
    phone: str = "",
    website: str = "",
    instagram: str = "",
    facebook: str = "",
    booking_url: str = "",
    address: str = "",
) -> dict:
    """Create a standardized lead dict."""
    lead = {
        "name": name,
        "source_site": source_site,
        "source_url": source_url,
        "description": description[:500] if description else "",
        "specialty": specialty,
        "email": email,
        "phone": phone,
        "website": website,
        "instagram": instagram,
        "facebook": facebook,
        "booking_url": booking_url,
        "address": address,
        "tier": 0,
        "tier_label": "",
        "discovered_at": datetime.now().isoformat(),
    }
    tier, label = score_lead(lead)
    lead["tier"] = tier
    lead["tier_label"] = label
    return lead


# ---------------------------------------------------------------------------
# Save results
# ---------------------------------------------------------------------------
def save_leads(leads: list[dict], city: str, timestamp: str):
    """Save leads to CSV and JSON."""
    # Sort by tier
    leads.sort(key=lambda l: l.get("tier", 99))

    # CSV
    csv_path = OUTPUT_DIR / f"{city.lower().replace(' ', '_')}_leads_{timestamp}.csv"
    fieldnames = [
        "tier", "tier_label", "name", "specialty", "email", "phone",
        "website", "instagram", "facebook", "booking_url", "address",
        "source_site", "source_url", "description",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for lead in leads:
            row = {k: lead.get(k, "") for k in fieldnames}
            writer.writerow(row)
    log.info(f"Saved {len(leads)} leads to {csv_path}")

    # JSON
    json_path = OUTPUT_DIR / f"{city.lower().replace(' ', '_')}_leads_{timestamp}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)
    log.info(f"Saved raw data to {json_path}")

    return csv_path, json_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="COLORgenius Lead Scraper — Search-based discovery of beauty pros"
    )
    parser.add_argument(
        "--source",
        choices=list(SEARCH_QUERIES.keys()) + ["all"],
        default="all",
        help="Which source to search (default: all)",
    )
    parser.add_argument("--city", default="Columbus", help="City to search")
    parser.add_argument(
        "--list-queries",
        action="store_true",
        help="List all search queries without running",
    )

    args = parser.parse_args()

    if args.list_queries:
        queries = adapt_queries_for_city(SEARCH_QUERIES, args.city)
        sources = [args.source] if args.source != "all" else list(queries.keys())
        print(f"\n📋 Search queries for {args.city}:\n")
        for source in sources:
            if source in queries:
                print(f"\n{source.upper()}:")
                for q in queries[source]:
                    print(f"  {q}")
        return

    # Generate queries
    queries = adapt_queries_for_city(SEARCH_QUERIES, args.city)
    sources = [args.source] if args.source != "all" else list(queries.keys())

    print(f"\n🎨 COLORgenius Lead Scraper — {args.city}")
    print(f"   Sources: {', '.join(sources)}")
    print(f"\n   This script generates search queries to run via OpenClaw's web_search tool.")
    print(f"   Run each query, then compile results into the output CSV.\n")

    all_queries = []
    for source in sources:
        if source in queries:
            all_queries.extend(queries[source])

    print(f"Total queries to run: {len(all_queries)}\n")
    for i, q in enumerate(all_queries, 1):
        print(f"  {i}. {q}")

    print(f"\n💡 Run these queries via the OpenClaw web_search tool, then compile results.")
    print(f"   Or use the Playwright profile scraper to enrich discovered leads.")


if __name__ == "__main__":
    main()