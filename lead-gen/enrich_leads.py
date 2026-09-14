"""
COLORgenius Lead Enricher — Multi-Source Email Discovery
Discovers emails from: personal websites, Instagram bios, Google search, and Yelp/other directories.

Usage:
    python enrich_leads.py input.csv output.csv
    
Input CSV must have: name, source_url, specialty, tier
Output adds: email, email_source, website, instagram, yelp_url
"""

import csv
import re
import json
import time
import argparse
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote, urljoin

# ── Email regex ──
EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')

def search_google(query: str, count: int = 5) -> list[dict]:
    """Use ScrapeGraph search to find results."""
    try:
        from scrapegraphai.sdk import ScrapeGraphAI
        client = ScrapeGraphAI(api_key="")  # self-hosted
        result = client.search(query=query, num_results=count)
        return result.get("results", []) if isinstance(result, dict) else []
    except Exception:
        return []

def extract_emails_from_text(text: str) -> list[str]:
    """Find all email addresses in text."""
    return list(set(EMAIL_RE.findall(text)))

def slugify_name(name: str) -> str:
    """Convert name to URL slug like booth rental sites use."""
    return name.lower().replace(" ", "_").replace("-", "_").strip("_")

def find_personal_website(name: str, city: str) -> dict:
    """Search for a stylist's personal website."""
    results = {
        "website": "",
        "email": "",
        "email_source": "",
    }
    
    queries = [
        f'"{name}" hair stylist Columbus Ohio website',
        f'"{name}" hair colorist Columbus site',
    ]
    
    for query in queries:
        try:
            from scrapegraphai.sdk import ScrapeGraphAI
            client = ScrapeGraphAI(api_key="")
            resp = client.search(query=query, num_results=5)
            if isinstance(resp, dict):
                for r in resp.get("results", []):
                    url = r.get("url", "")
                    title = r.get("title", "")
                    snippet = r.get("snippet", "")
                    # Skip booth rental sites — we already have those
                    skip_domains = ["solasalonstudios.com", "salonlofts.com", 
                                    "mysalonsuite.com", "phenixsuitesalon.com",
                                    "facebook.com", "instagram.com", "yelp.com",
                                    "google.com", "tiktok.com"]
                    if any(d in url for d in skip_domains):
                        continue
                    # This looks like a personal website
                    results["website"] = url
                    # Check snippet for email
                    emails = extract_emails_from_text(snippet)
                    if emails:
                        results["email"] = emails[0]
                        results["email_source"] = "google_snippet"
                        return results
                    # Try scraping the website for email
                    try:
                        resp2 = client.scrape(website_url=url, output_format="markdown")
                        if isinstance(resp2, dict):
                            text = resp2.get("markdown", "") or resp2.get("content", "")
                            emails = extract_emails_from_text(text)
                            if emails:
                                results["email"] = emails[0]
                                results["email_source"] = "website_contact"
                                return results
                    except Exception:
                        pass
                    return results
        except Exception:
            continue
    
    return results

def find_instagram(name: str, city: str) -> dict:
    """Search for a stylist's Instagram profile and extract email from bio."""
    results = {
        "instagram": "",
        "email": "",
        "email_source": "",
    }
    
    queries = [
        f'"{name}" hair stylist Columbus Ohio Instagram',
        f'site:instagram.com "{name}" hair Columbus',
    ]
    
    for query in queries:
        try:
            from scrapegraphai.sdk import ScrapeGraphAI
            client = ScrapeGraphAI(api_key="")
            resp = client.search(query=query, num_results=3)
            if isinstance(resp, dict):
                for r in resp.get("results", []):
                    url = r.get("url", "")
                    if "instagram.com" in url:
                        # Normalize to profile URL
                        ig_match = re.search(r'instagram\.com/([a-zA-Z0-9_.]+)', url)
                        if ig_match:
                            handle = ig_match.group(1)
                            if handle.lower() not in ["p", "reel", "stories", "explore"]:
                                results["instagram"] = f"https://instagram.com/{handle}"
                                # Check snippet for email
                                snippet = r.get("snippet", "")
                                emails = extract_emails_from_text(snippet)
                                if emails:
                                    results["email"] = emails[0]
                                    results["email_source"] = "instagram_bio"
                                    return results
        except Exception:
            continue
    
    return results

def find_yelp(name: str, city: str) -> dict:
    """Search for a stylist's Yelp listing."""
    results = {
        "yelp_url": "",
        "email": "",
        "email_source": "",
    }
    
    query = f'"{name}" hair stylist Columbus Ohio site:yelp.com'
    
    try:
        from scrapegraphai.sdk import ScrapeGraphAI
        client = ScrapeGraphAI(api_key="")
        resp = client.search(query=query, num_results=3)
        if isinstance(resp, dict):
            for r in resp.get("results", []):
                url = r.get("url", "")
                if "yelp.com" in url and "/biz/" in url:
                    results["yelp_url"] = url
                    return results
    except Exception:
        pass
    
    return results

def enrich_lead(lead: dict, city: str) -> dict:
    """Enrich a single lead with emails from multiple sources."""
    name = lead.get("name", "")
    specialty = lead.get("specialty", "")
    
    best_email = ""
    best_source = ""
    
    # 1. Check source page (booth rental profile) — already tried, rarely has email
    # 2. Find personal website
    print(f"  🔍 Website search: {name}")
    web_result = find_personal_website(name, city)
    if web_result.get("email"):
        best_email = web_result["email"]
        best_source = web_result["email_source"]
    if web_result.get("website"):
        lead["website"] = web_result["website"]
    
    # 3. Find Instagram (bio may have email)
    if not best_email:
        print(f"  🔍 Instagram search: {name}")
        ig_result = find_instagram(name, city)
        if ig_result.get("email"):
            best_email = ig_result["email"]
            best_source = ig_result["email_source"]
        if ig_result.get("instagram"):
            lead["instagram"] = ig_result["instagram"]
    elif not lead.get("instagram"):
        # Still try to find IG even if we have email
        ig_result = find_instagram(name, city)
        if ig_result.get("instagram"):
            lead["instagram"] = ig_result["instagram"]
    
    # 4. Find Yelp listing
    if not best_email:
        print(f"  🔍 Yelp search: {name}")
        yelp_result = find_yelp(name, city)
        if yelp_result.get("yelp_url"):
            lead["yelp_url"] = yelp_result["yelp_url"]
    
    # 5. Try ScrapeGraph extract on source_url if we still don't have email
    if not best_email and lead.get("source_url"):
        print(f"  🔍 Profile extraction: {name}")
        try:
            from scrapegraphai.sdk import ScrapeGraphAI
            client = ScrapeGraphAI(api_key="")
            resp = client.extract(
                website_url=lead["source_url"],
                user_prompt="Find the email address, Instagram handle, and personal website URL of this hair stylist or beauty professional.",
                mode="js"
            )
            if isinstance(resp, dict):
                text = json.dumps(resp)
                emails = extract_emails_from_text(text)
                if emails:
                    best_email = emails[0]
                    best_source = "profile_extraction"
                # Try to find IG handle
                ig_match = re.search(r'instagram\.com/([a-zA-Z0-9_.]+)', text)
                if ig_match and not lead.get("instagram"):
                    handle = ig_match.group(1)
                    if handle.lower() not in ["p", "reel", "stories", "explore"]:
                        lead["instagram"] = f"https://instagram.com/{handle}"
        except Exception:
            pass
    
    if best_email:
        lead["email"] = best_email
        lead["email_source"] = best_source
    else:
        lead["email"] = ""
        lead["email_source"] = "not_found"
    
    # Rate limit
    time.sleep(2)
    return lead

def main():
    parser = argparse.ArgumentParser(description="COLORgenius Lead Enricher")
    parser.add_argument("input", help="Input CSV file")
    parser.add_argument("output", help="Output CSV file")
    parser.add_argument("--city", default="Columbus Ohio", help="City for search context")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of leads to enrich (0=all)")
    parser.add_argument("--skip-has-email", action="store_true", help="Skip leads that already have emails")
    args = parser.parse_args()
    
    # Read input CSV
    leads = []
    with open(args.input, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            leads.append(dict(row))
    
    print(f"📋 Loaded {len(leads)} leads from {args.input}")
    
    if args.skip_has_email:
        before = len(leads)
        leads = [l for l in leads if not l.get("email")]
        print(f"  Skipping {before - len(leads)} leads that already have emails")
    
    if args.limit > 0:
        leads = leads[:args.limit]
        print(f"  Limiting to {args.limit} leads")
    
    # Enrich each lead
    for i, lead in enumerate(leads):
        print(f"\n[{i+1}/{len(leads)}] {lead['name']}")
        lead = enrich_lead(lead, args.city)
        
        if lead.get("email"):
            print(f"  ✅ Found email: {lead['email']} (via {lead['email_source']})")
        else:
            print(f"  ❌ No email found")
    
    # Write output
    fieldnames = ["name", "source", "source_url", "specialty", "tier", "tier_label",
                   "email", "email_source", "phone", "instagram", "website", "yelp_url", "notes"]
    with open(args.output, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for lead in leads:
            writer.writerow(lead)
    
    # Summary
    with_emails = sum(1 for l in leads if l.get("email"))
    print(f"\n{'='*60}")
    print(f"📊 Enrichment Complete")
    print(f"  Total leads: {len(leads)}")
    print(f"  With emails: {with_emails}")
    print(f"  Without emails: {len(leads) - with_emails}")
    print(f"  Email rate: {with_emails/len(leads)*100:.1f}%" if leads else "  No leads")
    print(f"  Output: {args.output}")

if __name__ == "__main__":
    main()