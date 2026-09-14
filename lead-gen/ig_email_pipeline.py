#!/usr/bin/env python3
"""
COLORgenius Instagram Email Enrichment Pipeline
Uses OpenCLI (autocli) to extract emails from Instagram business profiles.

PREREQUISITES:
1. Chrome must be running with OpenCLI extension connected
2. User must be logged into Instagram in Chrome
3. autocli daemon must be running (autocli doctor to check)

USAGE:
    python3 ig_email_pipeline.py input.csv output.csv

Input CSV must have: name, instagram (handle or URL), tier
Output adds/replaces: email, ig_email_found, ig_bio, ig_followers, ig_verified
"""

import csv
import re
import subprocess
import json
import sys
import time
import argparse
from pathlib import Path

def run_autocli(args: list[str], timeout: int = 30) -> dict | None:
    """Run an autocli command and return parsed JSON output."""
    cmd = ["autocli"] + args + ["-f", "json"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode != 0:
            print(f"  ⚠️  autocli error: {result.stderr.strip()[:200]}")
            return None
        # autocli may output non-JSON lines before the JSON
        lines = result.stdout.strip().split('\n')
        for line in reversed(lines):
            line = line.strip()
            if line.startswith('[') or line.startswith('{'):
                try:
                    return json.loads(line)
                except json.JSONDecodeError:
                    continue
        # Try parsing the whole output
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            print(f"  ⚠️  Could not parse autocli output: {result.stdout[:200]}")
            return None
    except subprocess.TimeoutExpired:
        print(f"  ⚠️  autocli timed out after {timeout}s")
        return None
    except FileNotFoundError:
        print("  ❌ autocli not found. Install with: pipx install opencli")
        return None

def extract_ig_username(ig_url_or_handle: str) -> str | None:
    """Extract Instagram username from URL or handle."""
    if not ig_url_or_handle:
        return None
    # Handle full URLs
    match = re.search(r'instagram\.com/([a-zA-Z0-9_.]+)', ig_url_or_handle)
    if match:
        username = match.group(1)
        # Filter out non-profile paths
        if username.lower() not in ['p', 'reel', 'reels', 'stories', 'explore', 'accounts']:
            return username
    # Handle bare handles
    handle = ig_url_or_handle.lstrip('@')
    if re.match(r'^[a-zA-Z0-9_.]+$', handle):
        return handle
    return None

def search_instagram(name: str) -> str | None:
    """Search Instagram for a stylist by name, return username of best match."""
    print(f"  🔍 Searching IG for: {name}")
    result = run_autocli(["instagram", "search", f"{name} hair stylist Columbus Ohio"])
    if not result:
        return None
    
    # Parse search results
    users = result if isinstance(result, list) else result.get("users", result.get("results", []))
    if isinstance(users, dict):
        users = [users]
    
    if not users:
        return None
    
    # Find best match - prefer verified, then most followers
    for user in users[:5]:
        username = user.get("username", user.get("handle", ""))
        if username:
            print(f"    Found: @{username}")
            return username
    
    return None

def get_ig_profile_email(username: str) -> dict:
    """Get Instagram profile info and extract email from business profile."""
    result = {
        "email": "",
        "bio": "",
        "followers": 0,
        "verified": False,
        "is_business": False,
    }
    
    print(f"  📋 Fetching IG profile: @{username}")
    profile = run_autocli(["instagram", "profile", username])
    if not profile:
        print(f"    ❌ Could not fetch profile")
        return result
    
    # Handle both dict and list responses
    if isinstance(profile, list) and profile:
        profile = profile[0]
    
    # Extract data
    result["bio"] = profile.get("biography", profile.get("bio", ""))
    result["followers"] = profile.get("followers", profile.get("follower_count", 0))
    result["verified"] = profile.get("is_verified", profile.get("verified", False))
    result["is_business"] = profile.get("is_business", profile.get("business_account", False))
    
    # Extract email from bio text
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', result["bio"])
    if email_match:
        result["email"] = email_match.group(0)
        print(f"    ✅ Found email in bio: {result['email']}")
    
    # Business contact email (separate field on business accounts)
    business_email = profile.get("business_email", profile.get("public_email", profile.get("contact_email", "")))
    if business_email and not result["email"]:
        result["email"] = business_email
        print(f"    ✅ Found business email: {result['email']}")
    
    # Website may have contact info
    website = profile.get("website", profile.get("external_url", ""))
    if website:
        result["website_from_ig"] = website
    
    if not result["email"]:
        print(f"    ❌ No email found on profile")
    
    return result

def enrich_lead(lead: dict, city: str = "Columbus Ohio") -> dict:
    """Enrich a single lead with Instagram data."""
    name = lead.get("name", "")
    ig_input = lead.get("instagram", "")
    
    username = extract_ig_username(ig_input)
    
    if not username:
        # Try to find IG by name search
        username = search_instagram(name)
    
    if not username:
        lead["ig_email_found"] = "no_ig_found"
        return lead
    
    lead["instagram"] = f"https://www.instagram.com/{username}/"
    
    # Get profile and extract email
    profile_data = get_ig_profile_email(username)
    
    if profile_data.get("email"):
        lead["email"] = profile_data["email"]
        lead["email_source"] = "instagram_bio"
        lead["ig_email_found"] = "yes"
    else:
        lead["ig_email_found"] = "no_email_on_profile"
    
    lead["ig_bio"] = profile_data.get("bio", "")[:200]  # Truncate for CSV
    lead["ig_followers"] = profile_data.get("followers", 0)
    lead["ig_verified"] = profile_data.get("verified", False)
    lead["ig_is_business"] = profile_data.get("is_business", False)
    
    if profile_data.get("website_from_ig"):
        if not lead.get("website"):
            lead["website"] = profile_data["website_from_ig"]
    
    # Rate limit - be gentle with IG
    time.sleep(3)
    
    return lead

def main():
    parser = argparse.ArgumentParser(description="COLORgenius IG Email Enrichment Pipeline")
    parser.add_argument("input", help="Input CSV file")
    parser.add_argument("output", help="Output CSV file")
    parser.add_argument("--city", default="Columbus Ohio", help="City context for IG search")
    parser.add_argument("--limit", type=int, default=0, help="Limit leads to process (0=all)")
    parser.add_argument("--skip-has-email", action="store_true", help="Skip leads that already have emails")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    args = parser.parse_args()
    
    # Check autocli availability
    check = run_autocli(["doctor", "--json"], timeout=10)
    if not check:
        print("❌ autocli not available. Make sure Chrome is running with OpenCLI extension.")
        sys.exit(1)
    
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
    
    if args.dry_run:
        print("\n🔍 DRY RUN — showing what would be processed:")
        for i, lead in enumerate(leads):
            ig = lead.get("instagram", "NOT FOUND")
            name = lead.get("name", "")
            print(f"  [{i+1}] {name} — IG: {ig}")
        return
    
    # Enrich each lead
    email_count = 0
    for i, lead in enumerate(leads):
        print(f"\n[{i+1}/{len(leads)}] {lead['name']}")
        lead = enrich_lead(lead, args.city)
        if lead.get("ig_email_found") == "yes":
            email_count += 1
            print(f"  🎯 NEW EMAIL: {lead['email']}")
    
    # Write output
    fieldnames = list(leads[0].keys()) if leads else []
    # Add any new fields
    for field in ["ig_email_found", "ig_bio", "ig_followers", "ig_verified", "ig_is_business", "website_from_ig"]:
        if field not in fieldnames:
            fieldnames.append(field)
    
    with open(args.output, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for lead in leads:
            writer.writerow(lead)
    
    # Summary
    total = len(leads)
    found = sum(1 for l in leads if l.get("email"))
    print(f"\n{'='*60}")
    print(f"📊 Instagram Enrichment Complete")
    print(f"  Total leads processed: {total}")
    print(f"  Emails found via IG: {email_count}")
    print(f"  Total with emails: {found}")
    print(f"  Email rate: {found/total*100:.1f}%" if total else "  No leads")
    print(f"  Output: {args.output}")
    print(f"\n💡 Tips:")
    print(f"  - Re-run with --skip-has-email to only process missing ones")
    print(f"  - For DM outreach, use: autocli instagram profile USERNAME")
    print(f"  - For leads without email, consider Instagram DM outreach")

if __name__ == "__main__":
    main()