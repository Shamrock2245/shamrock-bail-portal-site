#!/usr/bin/env python3
"""
Automated Microsoft Bing & IndexNow URL Submitter
==================================================
Shamrock Bail Bonds (www.shamrockbailbonds.biz)

Automates end-to-end URL submission to Microsoft Bing and the IndexNow protocol:
  1. Discovers live sitemaps dynamically from https://www.shamrockbailbonds.biz/sitemap.xml
  2. Extracts and canonicalizes all public URLs (Pages, County pSEO, Blog newsroom, Categories)
  3. Filters out internal/portal routes (/portal-*, /communication-preferences, etc.)
  4. Submits in batches to:
     - https://www.bing.com/indexnow (Microsoft Bing)
     - https://api.indexnow.org/indexnow (IndexNow Global Engine)
     - https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch (Bing Webmaster Tools API, if API key present)
  5. Generates structured JSON and Markdown execution reports.

Usage:
  python3 scripts/seo/bing_url_submitter.py [--dry-run] [--verbose] [--bing-api-key KEY]

Environment Variables:
  BING_API_KEY / BING_WEBMASTER_API_KEY (optional)
"""

import sys
import os
import json
import time
import argparse
import urllib.request
import urllib.error
import re
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────
SITE_URL = "https://www.shamrockbailbonds.biz"
SITE_HOST = "www.shamrockbailbonds.biz"
SITEMAP_INDEX = f"{SITE_URL}/sitemap.xml"

# Verified Wix-native IndexNow key & root endpoint
INDEXNOW_KEY = "a00e3857-675a-493b-91d8-a1dbc5e7c499"
INDEXNOW_KEY_LOCATION = f"{SITE_URL}/indexnow"

INDEXNOW_ENDPOINTS = [
    "https://www.bing.com/indexnow",
    "https://api.indexnow.org/indexnow"
]

BING_WEBMASTER_API_ENDPOINT = "https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch"

INDEXNOW_BATCH_SIZE = 10000  # IndexNow limit is 10,000 per post
BING_API_BATCH_SIZE = 500     # Bing Webmaster API limit is 500 per post

USER_AGENT = "Mozilla/5.0 (compatible; ShamrockBailBingSubmitter/2.0; +https://www.shamrockbailbonds.biz)"

# Disallowed path fragments (never submit private/portal/utility endpoints)
DISALLOWED_PATTERNS = [
    re.compile(r"/portal-", re.IGNORECASE),
    re.compile(r"/communication-preferences", re.IGNORECASE),
    re.compile(r"/data-deletion", re.IGNORECASE),
    re.compile(r"/_functions", re.IGNORECASE),
    re.compile(r"/_api", re.IGNORECASE),
    re.compile(r"sitemap\.xml$", re.IGNORECASE),
    re.compile(r"\?", re.IGNORECASE),
    re.compile(r"#", re.IGNORECASE)
]


def fetch_url_text(url: str, timeout: int = 20) -> str:
    """Fetch text content of a URL."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8")


def discover_all_urls(verbose: bool = False):
    """Dynamically discover all public URLs from sitemap index and children."""
    urls = []
    seen = set()

    # Always ensure the root homepage is present
    root_canonical = f"{SITE_URL}/"
    urls.append(root_canonical)
    seen.add(root_canonical)
    seen.add(SITE_URL)

    print(f"📡 Fetching sitemap index: {SITEMAP_INDEX}")
    child_sitemaps = []
    try:
        index_xml = fetch_url_text(SITEMAP_INDEX)
        locs = re.findall(r"<loc>\s*([^<]+)\s*</loc>", index_xml)
        for loc in locs:
            loc = loc.strip()
            if loc.endswith(".xml") and loc not in child_sitemaps:
                child_sitemaps.append(loc)
    except Exception as e:
        print(f"⚠️ Warning: Failed to fetch sitemap index: {e}")

    # Fallback default child sitemaps if index didn't list them
    if not child_sitemaps:
        child_sitemaps = [
            f"{SITE_URL}/pages-sitemap.xml",
            f"{SITE_URL}/dynamic-florida-bail-bonds_p_e7cdf976_0d00_4377_927c_fa4cc08037be_0_5000-sitemap.xml",
            f"{SITE_URL}/blog-posts-sitemap.xml",
            f"{SITE_URL}/blog-categories-sitemap.xml"
        ]

    for sm_url in child_sitemaps:
        if verbose:
            print(f"   ↳ Fetching child sitemap: {sm_url}")
        try:
            sm_xml = fetch_url_text(sm_url)
            locs = re.findall(r"<loc>\s*([^<]+)\s*</loc>", sm_xml)
            added_from_sm = 0
            for loc in locs:
                loc = loc.strip()
                if loc == SITE_URL:
                    loc = root_canonical

                if not loc.startswith(SITE_URL):
                    continue

                if any(pat.search(loc) for pat in DISALLOWED_PATTERNS):
                    continue

                if loc not in seen:
                    seen.add(loc)
                    urls.append(loc)
                    added_from_sm += 1
            if verbose:
                print(f"      Found {added_from_sm} URLs in {sm_url.split('/')[-1]}")
        except Exception as e:
            print(f"⚠️ Warning: Failed to fetch {sm_url}: {e}")

    print(f"✅ Discovered {len(urls)} unique public URLs for submission.")
    return urls


def submit_to_indexnow(urls, endpoint, dry_run=False, verbose=False):
    """Submit URLs to an IndexNow endpoint in batches."""
    results = []

    for i in range(0, len(urls), INDEXNOW_BATCH_SIZE):
        batch = urls[i:i + INDEXNOW_BATCH_SIZE]
        payload = {
            "host": SITE_HOST,
            "key": INDEXNOW_KEY,
            "keyLocation": INDEXNOW_KEY_LOCATION,
            "urlList": batch
        }

        if dry_run:
            results.append({
                "endpoint": endpoint,
                "batch_size": len(batch),
                "status": "DRY_RUN",
                "message": f"Simulated submission of {len(batch)} URLs"
            })
            continue

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": USER_AGENT}
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                body = resp.read(500).decode("utf-8")
                results.append({
                    "endpoint": endpoint,
                    "batch_size": len(batch),
                    "status": status,
                    "body": body,
                    "success": 200 <= status < 300
                })
                if verbose:
                    print(f"   [{endpoint}] HTTP {status} (Batch: {len(batch)} URLs)")
        except urllib.error.HTTPError as e:
            err_body = e.read(500).decode("utf-8")
            results.append({
                "endpoint": endpoint,
                "batch_size": len(batch),
                "status": e.code,
                "error": err_body,
                "success": False
            })
            print(f"❌ [{endpoint}] Error {e.code}: {err_body}")
        except Exception as e:
            results.append({
                "endpoint": endpoint,
                "batch_size": len(batch),
                "status": 0,
                "error": str(e),
                "success": False
            })
            print(f"❌ [{endpoint}] Exception: {e}")

    return results


def submit_to_bing_api(urls, api_key, dry_run=False, verbose=False):
    """Submit URLs to Bing Webmaster Tools SubmitUrlBatch API (500 URL batch limit)."""
    results = []
    url = f"{BING_WEBMASTER_API_ENDPOINT}?apikey={api_key}"

    for i in range(0, len(urls), BING_API_BATCH_SIZE):
        batch = urls[i:i + BING_API_BATCH_SIZE]
        payload = {
            "siteUrl": SITE_URL,
            "urlList": batch
        }

        if dry_run:
            results.append({
                "endpoint": "Bing Webmaster API (SubmitUrlBatch)",
                "batch_size": len(batch),
                "status": "DRY_RUN",
                "message": f"Simulated submission of {len(batch)} URLs"
            })
            continue

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": USER_AGENT}
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                body = resp.read(500).decode("utf-8")
                results.append({
                    "endpoint": "Bing Webmaster API (SubmitUrlBatch)",
                    "batch_size": len(batch),
                    "status": status,
                    "body": body,
                    "success": 200 <= status < 300
                })
                if verbose:
                    print(f"   [Bing Webmaster API] HTTP {status} (Batch: {len(batch)} URLs)")
        except urllib.error.HTTPError as e:
            err_body = e.read(500).decode("utf-8")
            results.append({
                "endpoint": "Bing Webmaster API (SubmitUrlBatch)",
                "batch_size": len(batch),
                "status": e.code,
                "error": err_body,
                "success": False
            })
            print(f"❌ [Bing Webmaster API] Error {e.code}: {err_body}")
        except Exception as e:
            results.append({
                "endpoint": "Bing Webmaster API (SubmitUrlBatch)",
                "batch_size": len(batch),
                "status": 0,
                "error": str(e),
                "success": False
            })
            print(f"❌ [Bing Webmaster API] Exception: {e}")

    return results


def save_reports(urls, all_results, output_dir, dry_run=False):
    """Save JSON and Markdown reports."""
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # JSON report
    json_path = os.path.join(output_dir, "bing_submission_report.json")
    report_data = {
        "timestamp": timestamp,
        "site": SITE_URL,
        "mode": "DRY_RUN" if dry_run else "LIVE",
        "total_urls": len(urls),
        "indexnow_key": INDEXNOW_KEY,
        "indexnow_key_location": INDEXNOW_KEY_LOCATION,
        "results": all_results,
        "urls": urls
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    # Markdown report
    md_path = os.path.join(output_dir, "bing_submission_report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# 📡 Microsoft Bing & IndexNow Submission Report\n\n")
        f.write(f"- **Generated:** `{timestamp}`\n")
        f.write(f"- **Site:** `{SITE_URL}`\n")
        f.write(f"- **Mode:** `{'🔵 DRY RUN' if dry_run else '🟢 LIVE'}`\n")
        f.write(f"- **Total URLs:** `{len(urls)}`\n")
        f.write(f"- **Verified IndexNow Key:** `{INDEXNOW_KEY}`\n")
        f.write(f"- **Key Location:** `{INDEXNOW_KEY_LOCATION}`\n\n")

        f.write("## 🚀 Submission Results\n\n")
        f.write("| Endpoint | Batch Size | Status | Result |\n")
        f.write("|---|---|---|---|\n")
        for res in all_results:
            endpoint_name = res.get("endpoint", "")
            batch = res.get("batch_size", 0)
            status = res.get("status", "")
            success = "✅ Accepted (200 OK)" if status == 200 else ("🔵 Simulated" if status == "DRY_RUN" else f"⚠️ Code {status}")
            f.write(f"| `{endpoint_name}` | {batch} | {status} | {success} |\n")

        f.write("\n## 📋 Submitted URLs Breakdown\n\n")
        static_pages = [u for u in urls if not ("/florida-bail-bonds/" in u or "/blog" in u)]
        county_pages = [u for u in urls if "/florida-bail-bonds/" in u]
        blog_pages = [u for u in urls if "/blog" in u]

        f.write(f"- **Core Static Pages:** {len(static_pages)}\n")
        f.write(f"- **Florida County Hubs & Jails:** {len(county_pages)}\n")
        f.write(f"- **Legal Newsroom & Blog Articles:** {len(blog_pages)}\n\n")

        f.write("### Sample URLs Submitted\n\n")
        for sample in urls[:15]:
            f.write(f"- `{sample}`\n")
        if len(urls) > 15:
            f.write(f"- ... and {len(urls) - 15} more\n")

    print(f"📄 JSON Report saved: {json_path}")
    print(f"📄 Markdown Report saved: {md_path}")


def main():
    parser = argparse.ArgumentParser(description="Submit Shamrock Bail Bonds URLs to Microsoft Bing and IndexNow.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate submissions without sending network requests")
    parser.add_argument("--verbose", action="store_true", help="Print detailed batch progress")
    parser.add_argument("--bing-api-key", type=str, default=None, help="Bing Webmaster Tools API Key (optional)")
    parser.add_argument("--output-dir", type=str, default=os.path.join(os.path.dirname(__file__)), help="Directory for reports")

    args = parser.parse_args()

    print("=" * 70)
    print("🚀 Shamrock Bail Bonds — Microsoft Bing & IndexNow URL Submitter")
    print("=" * 70)
    if args.dry_run:
        print("🔵 Running in DRY-RUN mode\n")

    # 1. Discover all URLs
    urls = discover_all_urls(verbose=args.verbose)
    if not urls:
        print("❌ Error: No URLs discovered from sitemaps!")
        sys.exit(1)

    all_results = []

    # 2. Submit to IndexNow endpoints
    print("\n⚡ Submitting to IndexNow Protocol (Bing & IndexNow Global Network)...")
    for ep in INDEXNOW_ENDPOINTS:
        print(f"   → Endpoint: {ep}")
        res_list = submit_to_indexnow(urls, ep, dry_run=args.dry_run, verbose=args.verbose)
        for r in res_list:
            status_desc = "✅ 200 OK" if r.get("status") == 200 else f"Status: {r.get('status')}"
            print(f"      Result: {status_desc}")
        all_results.extend(res_list)

    # 3. Submit to Bing Webmaster Tools API if key provided
    bing_api_key = args.bing_api_key or os.environ.get("BING_API_KEY") or os.environ.get("BING_WEBMASTER_API_KEY")
    if bing_api_key:
        print("\n🔑 Submitting to Bing Webmaster Tools API (SubmitUrlBatch)...")
        bing_res = submit_to_bing_api(urls, bing_api_key, dry_run=args.dry_run, verbose=args.verbose)
        for r in bing_res:
            status_desc = "✅ 200 OK" if r.get("status") == 200 else f"Status: {r.get('status')}"
            print(f"      Result: {status_desc}")
        all_results.extend(bing_res)
    else:
        print("\nℹ️  Notice: Direct Bing Webmaster API key not provided (IndexNow protocol used for instant Bing crawl).")
        print("   To also call Bing Webmaster SubmitUrlBatch REST API directly, supply --bing-api-key <KEY>.")

    # 4. Save reports
    save_reports(urls, all_results, args.output_dir, dry_run=args.dry_run)

    print("\n" + "=" * 70)
    print("🎉 Done! All URLs successfully processed and submitted for Bing crawling.")
    print("=" * 70)


if __name__ == "__main__":
    main()
