#!/usr/bin/env python3
"""
Shamrock Bail Bonds — Google Indexing API Bulk Submission Script
================================================================
This script submits all site URLs to the Google Indexing API in bulk.
The Indexing API signals Google to crawl and re-index pages immediately.

IMPORTANT: This script requires a Google Cloud service account JSON key.
See SETUP INSTRUCTIONS below before running.

SETUP INSTRUCTIONS:
-------------------
1. Go to: https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable "Web Search Indexing API" in the API Library
4. Go to IAM & Admin > Service Accounts > Create Service Account
5. Grant role: "Owner" (for Indexing API access)
6. Create a JSON key and download it
7. In Google Search Console (search.google.com/search-console):
   - Go to Settings > Users and permissions
   - Add the service account email as an OWNER
8. Place the downloaded JSON key file as: service_account.json
   in the same directory as this script
9. Run: python3 bulk_indexing_submit.py

QUOTA:
------
Default: 200 URLs/day
All 119 URLs fit within a single day's quota.
Rate limit: ~60 requests/minute (script throttles automatically)

WHAT THIS DOES:
---------------
- Sends a "URL_UPDATED" notification to Google for each URL
- Google will crawl and re-index each URL within hours to days
- This is the FASTEST way to get pages indexed without manual clicking
"""

import json
import time
import sys
import os
from datetime import datetime
from pathlib import Path

# ── Dependencies ──────────────────────────────────────────────────────────────
try:
    import google.auth
    import google.auth.transport.requests
    from google.oauth2 import service_account
    import requests as req_lib
except ImportError:
    print("Installing required packages...")
    os.system("sudo pip3 install google-auth google-auth-httplib2 google-api-python-client requests -q")
    import google.auth
    import google.auth.transport.requests
    from google.oauth2 import service_account
    import requests as req_lib

# ── Configuration ─────────────────────────────────────────────────────────────
SERVICE_ACCOUNT_FILE = "service_account.json"  # Path to your downloaded JSON key
INDEXING_API_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
SCOPES = ["https://www.googleapis.com/auth/indexing"]

# All 119 live URLs from Shamrock Bail Bonds sitemap
# Generated from: shamrockbailbonds.biz sitemap.xml (Feb 2026)
URLS = [
    # ── Static Pages (9) ──────────────────────────────────────────────────────
    "https://www.shamrockbailbonds.biz/",
    "https://www.shamrockbailbonds.biz/about",
    "https://www.shamrockbailbonds.biz/contact",
    "https://www.shamrockbailbonds.biz/how-bail-works",
    "https://www.shamrockbailbonds.biz/how-to-become-a-bondsman",
    "https://www.shamrockbailbonds.biz/portal-landing",
    "https://www.shamrockbailbonds.biz/testimonials",
    "https://www.shamrockbailbonds.biz/terms-of-service",
    "https://www.shamrockbailbonds.biz/privacy-policy",

    # ── Blog Index & Categories (6) ───────────────────────────────────────────
    "https://www.shamrockbailbonds.biz/blog",
    "https://www.shamrockbailbonds.biz/blog/categories/bail-bonds",
    "https://www.shamrockbailbonds.biz/blog/categories/bail-bond-tips",
    "https://www.shamrockbailbonds.biz/blog/categories/county-spotlight",
    "https://www.shamrockbailbonds.biz/blog/categories/florida-legal-updates",
    "https://www.shamrockbailbonds.biz/blog/categories/how-bail-bonds-work",

    # ── Blog Posts (36) ───────────────────────────────────────────────────────
    "https://www.shamrockbailbonds.biz/single-post/what-happens-after-you-post-bail-your-complete-guide-to-the-next-steps",
    "https://www.shamrockbailbonds.biz/single-post/__bail_explained",
    "https://www.shamrockbailbonds.biz/single-post/the-role-of-a-bail-bondsman",
    "https://www.shamrockbailbonds.biz/single-post/bail-bonds-in-sarasota-county-complete-guide-to-the-sarasota-county-jail",
    "https://www.shamrockbailbonds.biz/single-post/locked-up-in-lee-county-shamrock-bail-bonds-is-your-key-to-freedom-in-fort-myers",
    "https://www.shamrockbailbonds.biz/single-post/community-resources-for-legal-assistance",
    "https://www.shamrockbailbonds.biz/single-post/why-shamrock-bail-bonds-outshines-the-rest-in-the-sunshine-state",
    "https://www.shamrockbailbonds.biz/single-post/how-to-choose-a-reliable-bail-bondsman-in-southwest-florida",
    "https://www.shamrockbailbonds.biz/single-post/what-florida-s-new-2026-statewide-bond-schedule-means-for-you",
    "https://www.shamrockbailbonds.biz/single-post/understanding-bail-bonds-in-charlotte-county-your-port-charlotte-and-punta-gorda-guide",
    "https://www.shamrockbailbonds.biz/single-post/technology-in-the-bail-bond-industry",
    "https://www.shamrockbailbonds.biz/single-post/what-happens-if-you-miss-your-court-date-while-out-on-bail",
    "https://www.shamrockbailbonds.biz/single-post/bail-bonds-in-manatee-county-your-bradenton-and-palmetto-resource",
    "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-and-can-you-get-it-back-1",
    "https://www.shamrockbailbonds.biz/single-post/financial-assistance-for-bail-bonds",
    "https://www.shamrockbailbonds.biz/single-post/common-myths-about-bail-bonds",
    "https://www.shamrockbailbonds.biz/single-post/understanding-bail-bonds-in-charlotte-county-your-port-charlotte-and-punta-gorda-guide-1",
    "https://www.shamrockbailbonds.biz/single-post/how-to-choose-a-reliable-bail-bondsman-in-southwest-florida-1",
    "https://www.shamrockbailbonds.biz/single-post/customer-testimonial-how-shamrock-bail-bonds-helped-me",
    "https://www.shamrockbailbonds.biz/single-post/bail-bonds-in-collier-county-everything-you-need-to-know-about-the-naples-jail",
    "https://www.shamrockbailbonds.biz/single-post/bail-bonds-vs-cash-bail-which-is-better",
    "https://www.shamrockbailbonds.biz/single-post/the-role-of-a-bail-bondsman-1",
    "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-and-can-you-get-it-back",
    "https://www.shamrockbailbonds.biz/single-post/understanding-the-bail-bond-process-a-step-by-step-guide",
    "https://www.shamrockbailbonds.biz/single-post/how-to-find-a-reliable-bail-bondsman",
    "https://www.shamrockbailbonds.biz/single-post/bail-bonds-in-florida-what-you-need-to-know",
    "https://www.shamrockbailbonds.biz/single-post/what-to-expect-when-someone-you-love-is-arrested",
    "https://www.shamrockbailbonds.biz/single-post/the-importance-of-showing-up-to-court",
    "https://www.shamrockbailbonds.biz/single-post/how-bail-bonds-work-in-florida",
    "https://www.shamrockbailbonds.biz/single-post/rights-of-the-accused-in-florida",
    "https://www.shamrockbailbonds.biz/single-post/what-is-a-surety-bond",
    "https://www.shamrockbailbonds.biz/single-post/navigating-the-criminal-justice-system",
    "https://www.shamrockbailbonds.biz/single-post/bail-bond-payment-options",
    "https://www.shamrockbailbonds.biz/single-post/what-happens-if-you-cant-afford-bail",
    "https://www.shamrockbailbonds.biz/single-post/understanding-pre-trial-release",
    "https://www.shamrockbailbonds.biz/single-post/how-to-support-a-loved-one-through-the-bail-process",

    # ── Florida County Pages (67) ─────────────────────────────────────────────
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/alachua",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/baker",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/bay",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/bradford",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/brevard",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/broward",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/calhoun",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/charlotte",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/citrus",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/clay",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/collier",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/columbia",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/desoto",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/dixie",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/duval",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/escambia",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/flagler",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/franklin",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/gadsden",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/gilchrist",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/glades",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/gulf",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/hamilton",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/hardee",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/hendry",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/hernando",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/highlands",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/hillsborough",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/holmes",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/indian-river",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/jackson",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/jefferson",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/lafayette",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/lake",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/lee",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/leon",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/levy",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/liberty",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/madison",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/manatee",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/marion",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/martin",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/miami-dade",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/monroe",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/nassau",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/okaloosa",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/okeechobee",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/orange",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/osceola",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/palm-beach",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/pasco",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/pinellas",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/polk",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/putnam",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/santa-rosa",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/sarasota",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/seminole",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/st-johns",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/st-lucie",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/sumter",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/suwannee",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/taylor",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/union",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/volusia",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/wakulla",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/walton",
    "https://www.shamrockbailbonds.biz/florida-bail-bonds/washington",
]


def get_access_token():
    """Authenticate using service account and return a valid access token."""
    if not Path(SERVICE_ACCOUNT_FILE).exists():
        print(f"\n❌ ERROR: '{SERVICE_ACCOUNT_FILE}' not found.")
        print("   Please follow the SETUP INSTRUCTIONS at the top of this file.")
        sys.exit(1)

    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=SCOPES
    )
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    return credentials.token


def submit_url(url: str, token: str, notification_type: str = "URL_UPDATED") -> dict:
    """Submit a single URL to the Google Indexing API."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }
    payload = {
        "url": url,
        "type": notification_type,
    }
    response = req_lib.post(INDEXING_API_ENDPOINT, headers=headers, json=payload, timeout=15)
    return {
        "url": url,
        "status_code": response.status_code,
        "response": response.json() if response.content else {},
        "success": response.status_code == 200,
    }


def run_bulk_submission(dry_run: bool = False):
    """Main function to bulk-submit all URLs."""
    print("=" * 70)
    print("  Shamrock Bail Bonds — Google Indexing API Bulk Submission")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Total URLs: {len(URLS)}")
    print(f"  Mode: {'DRY RUN (no actual submissions)' if dry_run else 'LIVE'}")
    print("=" * 70)

    if not dry_run:
        print("\n🔑 Authenticating with Google...")
        token = get_access_token()
        print("   ✅ Authentication successful.\n")
    else:
        token = "DRY_RUN_TOKEN"

    results = []
    success_count = 0
    error_count = 0

    for i, url in enumerate(URLS, 1):
        print(f"[{i:3d}/{len(URLS)}] Submitting: {url[:80]}...", end="", flush=True)

        if dry_run:
            result = {"url": url, "status_code": 200, "response": {}, "success": True}
            print(" ✅ (dry run)")
        else:
            try:
                result = submit_url(url, token)
                if result["success"]:
                    print(f" ✅ 200 OK")
                    success_count += 1
                else:
                    print(f" ❌ {result['status_code']} — {result['response'].get('error', {}).get('message', 'Unknown error')}")
                    error_count += 1
            except Exception as e:
                result = {"url": url, "status_code": 0, "response": {"error": str(e)}, "success": False}
                print(f" ❌ Exception: {e}")
                error_count += 1

            # Throttle: 1 request per second to stay well within rate limits
            # (API allows ~60/min but we stay conservative)
            time.sleep(1.1)

        results.append(result)

    # ── Summary Report ─────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  SUBMISSION COMPLETE")
    print(f"  ✅ Successful: {success_count if not dry_run else len(URLS)} / {len(URLS)}")
    if not dry_run:
        print(f"  ❌ Errors:     {error_count} / {len(URLS)}")
    print("=" * 70)

    # Save results to JSON
    report_file = f"indexing_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, "w") as f:
        json.dump({
            "submitted_at": datetime.now().isoformat(),
            "total_urls": len(URLS),
            "successful": success_count,
            "errors": error_count,
            "results": results,
        }, f, indent=2)
    print(f"\n📄 Full report saved to: {report_file}")
    print("\n⏳ Next steps:")
    print("   1. Wait 24-72 hours for Google to crawl the submitted URLs")
    print("   2. Check Google Search Console > Coverage to see indexing progress")
    print("   3. Re-run this script after making significant content updates")

    return results


if __name__ == "__main__":
    # Set dry_run=True to test without actually submitting
    dry_run_mode = "--dry-run" in sys.argv
    run_bulk_submission(dry_run=dry_run_mode)
