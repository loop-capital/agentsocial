#!/usr/bin/env python3
"""
COLORgenius Booth Rental Lead Scraper — Columbus Pilot
Direct Playwright scraper for JS-heavy booth rental sites.
No LLM needed — just DOM extraction from rendered pages.

Usage:
  source .venv-leads/bin/activate
  python lead-gen/booth_scraper.py                     # All sources
  python lead-gen/booth_scraper.py --source sola        # Just Sola
  python lead-gen/booth_scraper.py --source lofts       # Just Salon Lofts
  python lead-gen/booth_scraper.py --city "Cleveland"   # Different city
  python lead-gen/booth_scraper.py --discover-only       # Just find URLs, don't scrape profiles
  python lead-gen/booth_scraper.py --scrape-profiles urls.txt  # Scrape from URL file
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
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("lead-gen/scraper.log", mode="a"),
    ],
)
log = logging.getLogger("booth-scraper")

OUTPUT_DIR = Path("lead-gen/output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


async def discover_sola_profiles(page, city: str = "Columbus") -> list[dict]:
    """Discover professional profiles from Sola Salon Studios."""
    # Sola Columbus locations
    sola_locations = {
        "Columbus": [
            "https://www.solasalonstudios.com/locations/oh/columbus/dublin",
            "https://www.solasalonstudios.com/locations/oh/columbus/polaris",
            "https://www.solasalonstudios.com/locations/oh/columbus/worthington",
            "https://www.solasalonstudios.com/locations/oh/columbus/hilliard",
            "https://www.solasalonstudios.com/locations/oh/columbus/easton",
            "https://www.solasalonstudios.com/locations/oh/columbus/lewiscenter",
        ],
        "Cleveland": [
            "https://www.solasalonstudios.com/locations/oh/cleveland-westlake",
            "https://www.solasalonstudios.com/locations/oh/cleveland-beachwood",
        ],
    }
    urls = sola_locations.get(city, sola_locations.get("Columbus", []))
    profiles = []

    for loc_url in urls:
        log.info(f"  Loading Sola location: {loc_url}")
        try:
            await page.goto(loc_url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            # Try to find profile links - Sola uses various link patterns
            links = await page.query_selector_all("a[href]")
            for link in links:
                href = await link.get_attribute("href")
                text = await link.inner_text()
                if href and text:
                    text = text.strip()
                    # Sola profile URLs contain /salon/ or /stylist/
                    if "/salon/" in (href or "") or "/stylist/" in (href or ""):
                        full_url = href if href.startswith("http") else f"https://www.solasalonstudios.com{href}"
                        # Avoid duplicates
                        if not any(p.get("source_url") == full_url for p in profiles):
                            profiles.append({
                                "name": text,
                                "source_url": full_url,
                                "source_site": "Sola Salon Studios",
                                "location_url": loc_url,
                                "specialty": "",
                            })
        except Exception as e:
            log.error(f"  Failed to load {loc_url}: {e}")
            continue

    return profiles


async def discover_salon_lofts_profiles(page, city: str = "Columbus") -> list[dict]:
    """Discover professional profiles from Salon Lofts."""
    lofts_locations = {
        "Columbus": [
            "https://www.salonlofts.com/locations/columbus",
        ],
    }
    urls = lofts_locations.get(city, lofts_locations.get("Columbus", []))
    profiles = []

    for loc_url in urls:
        log.info(f"  Loading Salon Lofts location: {loc_url}")
        try:
            await page.goto(loc_url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            # Salon Lofts uses various patterns for loft owner pages
            links = await page.query_selector_all("a[href]")
            for link in links:
                href = await link.get_attribute("href")
                text = await link.inner_text()
                if href and text:
                    text = text.strip()
                    # Look for loft owner or professional profile links
                    if any(pattern in (href or "") for pattern in ["/loft-owner/", "/professional/", "/loft/"]):
                        full_url = href if href.startswith("http") else f"https://www.salonlofts.com{href}"
                        if not any(p.get("source_url") == full_url for p in profiles):
                            profiles.append({
                                "name": text,
                                "source_url": full_url,
                                "source_site": "Salon Lofts",
                                "location_url": loc_url,
                                "specialty": "",
                            })
        except Exception as e:
            log.error(f"  Failed to load {loc_url}: {e}")
            continue

    return profiles


async def discover_mysalonsuite_profiles(page, city: str = "Columbus") -> list[dict]:
    """Discover professional profiles from My Salon Suite."""
    mss_locations = {
        "Columbus": [
            "https://www.mysalonsuite.com/locations/oh/columbus-dublin",
            "https://www.mysalonsuite.com/locations/oh/columbus-hilliard",
        ],
    }
    urls = mss_locations.get(city, mss_locations.get("Columbus", []))
    profiles = []

    for loc_url in urls:
        log.info(f"  Loading My Salon Suite location: {loc_url}")
        try:
            await page.goto(loc_url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            links = await page.query_selector_all("a[href]")
            for link in links:
                href = await link.get_attribute("href")
                text = await link.inner_text()
                if href and text:
                    text = text.strip()
                    if any(pattern in (href or "") for pattern in ["/suite/", "/stylist/", "/professional/"]):
                        full_url = href if href.startswith("http") else f"https://www.mysalonsuite.com{href}"
                        if not any(p.get("source_url") == full_url for p in profiles):
                            profiles.append({
                                "name": text,
                                "source_url": full_url,
                                "source_site": "My Salon Suite",
                                "location_url": loc_url,
                                "specialty": "",
                            })
        except Exception as e:
            log.error(f"  Failed to load {loc_url}: {e}")
            continue

    return profiles


async def discover_phenix_profiles(page, city: str = "Columbus") -> list[dict]:
    """Discover professional profiles from Phenix Salon Suites."""
    phenix_locations = {
        "Columbus": [
            "https://www.phenixsuites.com/locations/ohio/columbus",
        ],
    }
    urls = phenix_locations.get(city, phenix_locations.get("Columbus", []))
    profiles = []

    for loc_url in urls:
        log.info(f"  Loading Phenix location: {loc_url}")
        try:
            await page.goto(loc_url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            links = await page.query_selector_all("a[href]")
            for link in links:
                href = await link.get_attribute("href")
                text = await link.inner_text()
                if href and text:
                    text = text.strip()
                    if any(pattern in (href or "") for pattern in ["/professional/", "/suite/", "/stylist/"]):
                        full_url = href if href.startswith("http") else f"https://www.phenixsuites.com{href}"
                        if not any(p.get("source_url") == full_url for p in profiles):
                            profiles.append({
                                "name": text,
                                "source_url": full_url,
                                "source_site": "Phenix Salon Suites",
                                "location_url": loc_url,
                                "specialty": "",
                            })
        except Exception as e:
            log.error(f"  Failed to load {loc_url}: {e}")
            continue

    return profiles


async def scrape_profile(page, profile: dict) -> dict:
    """Scrape detailed info from an individual profile page."""
    url = profile["source_url"]
    log.info(f"    Scraping profile: {profile['name']} — {url}")

    try:
        await page.goto(url, wait_until="networkidle", timeout=20000)
        await page.wait_for_timeout(1500)
    except Exception as e:
        log.error(f"    Failed to load profile {url}: {e}")
        return profile

    # Extract all text content for analysis
    body_text = await page.inner_text("body")

    # Extract email addresses from page text and mailto links
    emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", body_text)
    mailto_links = await page.query_selector_all("a[href^='mailto:']")
    for ml in mailto_links:
        href = await ml.get_attribute("href")
        if href and "mailto:" in href:
            email = href.replace("mailto:", "").split("?")[0].strip()
            if email and email not in emails:
                emails.append(email)

    # Extract phone numbers
    phones = re.findall(r"(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}", body_text)
    tel_links = await page.query_selector_all("a[href^='tel:']")
    for tl in tel_links:
        href = await tl.get_attribute("href")
        if href and "tel:" in href:
            phone = href.replace("tel:", "").strip()
            if phone and phone not in phones:
                phones.append(phone)

    # Extract social media links
    social_links = {}
    all_links = await page.query_selector_all("a[href]")
    for link in all_links:
        href = await link.get_attribute("href")
        if href:
            if "instagram.com" in href:
                social_links["instagram"] = href
            elif "facebook.com" in href:
                social_links["facebook"] = href
            elif "tiktok.com" in href:
                social_links["tiktok"] = href
            elif "twitter.com" in href or "x.com" in href:
                social_links["twitter"] = href
            elif "yelp.com" in href:
                social_links["yelp"] = href

    # Extract website links (non-social external links)
    website = ""
    for link in all_links:
        href = await link.get_attribute("href")
        if href and href.startswith("http") and "solasalonstudios.com" not in href and "salonlofts.com" not in href and "mysalonsuite.com" not in href and "phenixsuites.com" not in href and "instagram.com" not in href and "facebook.com" not in href and "tiktok.com" not in href and "twitter.com" not in href and "google.com" not in href:
            if not website:
                website = href

    # Determine specialty from page content
    specialty_keywords = [
        "colorist", "hair color", "balayage", "highlights", "ombre", "color correction",
        "stylist", "haircut", "hair stylist", "blowout", "extensions",
        "nail tech", "nail artist", "mani", "pedi", "gel nails",
        "esthetician", "facial", "skin care", "skincare", "waxing", "lashes", "lash lift",
        "massage", "massage therapist", "body work",
        "makeup", "makeup artist", "bridal",
        "barber", "men's cut", "fade",
    ]
    text_lower = body_text.lower()
    specialties_found = [kw for kw in specialty_keywords if kw in text_lower]

    # Extract booking link
    booking_url = ""
    for link in all_links:
        href = await link.get_attribute("href")
        text = await link.inner_text()
        if href and any(b in (text or "").lower() for b in ["book", "schedule", "appointment"]):
            booking_url = href if href.startswith("http") else ""
            break

    # Extract address
    address = ""
    # Look for address-like patterns
    addr_match = re.search(r"\d+\s+[A-Za-z\s]+\s*(?:St|Ave|Blvd|Dr|Rd|Ln|Ct|Way|Pkwy|Pl|Cir|Hwy)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}", body_text)
    if addr_match:
        address = addr_match.group(0)

    # Build enriched profile
    profile.update({
        "email": emails[0] if emails else "",
        "all_emails": "; ".join(emails) if emails else "",
        "phone": phones[0] if phones else "",
        "all_phones": "; ".join(phones) if phones else "",
        "website": website,
        "instagram": social_links.get("instagram", ""),
        "facebook": social_links.get("facebook", ""),
        "tiktok": social_links.get("tiktok", ""),
        "twitter": social_links.get("twitter", ""),
        "specialty": ", ".join(specialties_found[:5]) if specialties_found else "",
        "address": address,
        "booking_url": booking_url,
        "is_colorist": any(kw in text_lower for kw in ["color", "colorist", "balayage", "highlight", "ombre"]),
    })

    return profile


async def run_scraper(
    sources: list[str],
    city: str = "Columbus",
    discover_only: bool = False,
    max_profiles: int = 100,
    scrape_from_file: str = "",
):
    """Main scraper entry point."""
    from playwright.async_api import async_playwright

    all_profiles = []
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Load profiles from file if specified
    if scrape_from_file:
        log.info(f"Loading profile URLs from: {scrape_from_file}")
        with open(scrape_from_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("|")
                    url = parts[0]
                    site = parts[1] if len(parts) > 1 else "unknown"
                    all_profiles.append({
                        "name": "",
                        "source_url": url,
                        "source_site": site,
                        "location_url": "",
                        "specialty": "",
                    })

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        # Phase 1: Discover profiles
        if not scrape_from_file:
            log.info(f"\n{'='*60}")
            log.info(f"Phase 1: Discovering profiles in {city}")
            log.info(f"{'='*60}")

            discover_funcs = {
                "sola": discover_sola_profiles,
                "lofts": discover_salon_lofts_profiles,
                "mysalonsuite": discover_mysalonsuite_profiles,
                "phenix": discover_phenix_profiles,
            }

            for source_key in sources:
                if source_key not in discover_funcs:
                    log.warning(f"Unknown source: {source_key}")
                    continue
                log.info(f"\nDiscovering {source_key} profiles...")
                try:
                    profiles = await discover_funcs[source_key](page, city)
                    log.info(f"  Found {len(profiles)} profile URLs")
                    all_profiles.extend(profiles)
                except Exception as e:
                    log.error(f"  Discovery failed for {source_key}: {e}")

            # Save discovered URLs
            urls_path = OUTPUT_DIR / f"{city.lower()}_discovered_urls_{timestamp}.txt"
            with open(urls_path, "w") as f:
                for p in all_profiles:
                    f.write(f"{p['source_url']}|{p['source_site']}\n")
            log.info(f"Saved {len(all_profiles)} discovered URLs to {urls_path}")

        if discover_only:
            log.info(f"\nDiscover-only mode. Found {len(all_profiles)} profile URLs.")
            print(f"\n📋 Discovered {len(all_profiles)} profile URLs")
            print(f"Saved to: {urls_path}")
            print(f"\nRun again with --scrape-profiles {urls_path} to scrape details")
            await browser.close()
            return all_profiles

        # Phase 2: Scrape individual profiles
        log.info(f"\n{'='*60}")
        log.info(f"Phase 2: Scraping {min(len(all_profiles), max_profiles)} profiles")
        log.info(f"{'='*60}")

        scraped = []
        for i, profile in enumerate(all_profiles[:max_profiles]):
            log.info(f"  [{i+1}/{min(len(all_profiles), max_profiles)}] {profile.get('name', 'Unknown')}")
            enriched = await scrape_profile(page, profile)
            scraped.append(enriched)
            # Be polite — wait between requests
            await asyncio.sleep(2)

        await browser.close()

    # Save results
    _save_results(scraped, city, timestamp)

    # Print summary
    print(f"\n{'='*60}")
    print(f"🎨 COLORgenius Lead Scraper Results — {city}")
    print(f"{'='*60}")
    print(f"Total leads: {len(scraped)}")

    colorists = [l for l in scraped if l.get("is_colorist")]
    with_email = [l for l in scraped if l.get("email")]
    with_phone = [l for l in scraped if l.get("phone")]
    with_instagram = [l for l in scraped if l.get("instagram")]

    print(f"Colorists: {len(colorists)}")
    print(f"With email: {len(with_email)}")
    print(f"With phone: {len(with_phone)}")
    print(f"With Instagram: {len(with_instagram)}")
    print(f"{'='*60}\n")

    if colorists:
        print("🎨 Colorist leads (top priority):")
        for c in colorists[:15]:
            contact = c.get("email") or c.get("phone") or c.get("instagram") or "no contact"
            print(f"  • {c.get('name', '?')} — {c.get('specialty', '?')} — {contact}")

    return scraped


def _save_results(leads: list[dict], city: str, timestamp: str):
    """Save results to CSV and JSON."""
    # CSV
    csv_path = OUTPUT_DIR / f"{city.lower()}_leads_{timestamp}.csv"
    if leads:
        fieldnames = [
            "name", "specialty", "is_colorist", "email", "all_emails",
            "phone", "all_phones", "website", "instagram", "facebook",
            "tiktok", "twitter", "address", "booking_url",
            "source_site", "source_url", "location_url",
        ]
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for lead in leads:
                row = {k: lead.get(k, "") for k in fieldnames}
                writer.writerow(row)
        log.info(f"Saved {len(leads)} leads to {csv_path}")

    # JSON
    json_path = OUTPUT_DIR / f"{city.lower()}_leads_{timestamp}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)
    log.info(f"Saved raw data to {json_path}")


SOURCES = ["sola", "lofts", "mysalonsuite", "phenix"]


def main():
    parser = argparse.ArgumentParser(
        description="COLORgenius Booth Rental Lead Scraper — Find beauty pros on booth rental sites"
    )
    parser.add_argument(
        "--source",
        choices=SOURCES + ["all"],
        default="all",
        help="Which booth rental site to scrape",
    )
    parser.add_argument("--city", default="Columbus", help="City to search")
    parser.add_argument(
        "--discover-only",
        action="store_true",
        help="Only discover profile URLs, don't scrape details",
    )
    parser.add_argument(
        "--scrape-profiles",
        type=str,
        default="",
        help="Scrape profiles from a URL file (from discover-only run)",
    )
    parser.add_argument(
        "--max-profiles",
        type=int,
        default=100,
        help="Maximum profiles to scrape (default: 100)",
    )

    args = parser.parse_args()
    sources = SOURCES if args.source == "all" else [args.source]

    asyncio.run(run_scraper(
        sources=sources,
        city=args.city,
        discover_only=args.discover_only,
        max_profiles=args.max_profiles,
        scrape_from_file=args.scrape_profiles,
    ))


if __name__ == "__main__":
    main()