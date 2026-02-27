#!/usr/bin/env python3
"""
Bulk Google Index Submitter for Shamrock Bail Bonds
====================================================
Submits all site URLs for indexing via multiple channels:
  1. Generate a proper sitemap.xml with ALL correct URLs
  2. Ping Google & Bing to re-crawl the sitemap
  3. Submit via IndexNow API (Bing, Yandex instant indexing)
  4. Generate a Google Search Console bulk inspection list

Usage:
  python3 scripts/seo/bulk_index_submitter.py [--dry-run] [--output-dir DIR]

Output:
  - sitemap.xml              (Upload to site root or submit in GSC)
  - indexing_report.md       (Summary of all submissions)
  - gsc_url_list.txt         (Paste into GSC URL Inspection)
"""

import json
import os
import sys
import time
import hashlib
import secrets
from datetime import datetime
from urllib.parse import quote
from typing import Optional

# Optional: for HTTP requests
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    # Fallback to urllib
    import urllib.request
    import urllib.error

# ─── Configuration ────────────────────────────────────────────────────────────
SITE_URL = "https://www.shamrockbailbonds.biz"
SITE_HOST = "www.shamrockbailbonds.biz"
LAST_MOD = datetime.now().strftime("%Y-%m-%d")

# IndexNow key (we'll generate one if needed)
INDEXNOW_KEY = None  # Will be auto-generated

# All 67 Florida counties (matching actual live URL slugs)
FLORIDA_COUNTY_SLUGS = [
    "alachua", "baker", "bay", "bradford", "brevard", "broward", "calhoun",
    "charlotte", "citrus", "clay", "collier", "columbia", "desoto", "dixie",
    "duval", "escambia", "flagler", "franklin", "gadsden", "gilchrist", "glades",
    "gulf", "hamilton", "hardee", "hendry", "hernando", "highlands", "hillsborough",
    "holmes", "indianriver", "jackson", "jefferson", "lafayette", "lake", "lee",
    "leon", "levy", "liberty", "madison", "manatee", "marion", "martin", "miami-dade",
    "monroe", "nassau", "okaloosa", "okeechobee", "orange", "osceola", "palmbeach",
    "pasco", "pinellas", "polk", "putnam", "santa-rosa", "sarasota", "seminole",
    "stjohns", "stlucie", "sumter", "suwannee", "taylor", "union", "volusia",
    "wakulla", "walton", "washington"
]

# Static pages with priorities
STATIC_PAGES = [
    ("/", "1.0", "weekly"),
    ("/about", "0.7", "monthly"),
    ("/contact", "0.8", "monthly"),
    ("/how-bail-works", "0.9", "monthly"),
    ("/how-to-become-a-bondsman", "0.7", "monthly"),
    ("/blog", "0.7", "weekly"),
    ("/testimonials", "0.7", "monthly"),
    ("/terms-of-service", "0.3", "yearly"),
    ("/privacy-policy", "0.3", "yearly"),
]

# Blog posts (from sitemap_final_urls.txt)
BLOG_CATEGORIES = [
    "/blog/categories/county-spotlight",
    "/blog/categories/florida-legal-updates",
    "/blog/categories/bail-bonds",
    "/blog/categories/bail-bond-tips",
    "/blog/categories/how-bail-bonds-work",
]


# ─── URL Collection ──────────────────────────────────────────────────────────
def collect_all_urls():
    """Collect every URL that should be in the sitemap."""
    urls = []

    # 1. Static pages
    for path, priority, changefreq in STATIC_PAGES:
        full_url = SITE_URL if path == "/" else f"{SITE_URL}{path}"
        urls.append({"url": full_url, "priority": priority, "changefreq": changefreq, "type": "static"})

    # 2. County pages (67 counties)
    for slug in FLORIDA_COUNTY_SLUGS:
        urls.append({
            "url": f"{SITE_URL}/florida-bail-bonds/{slug}",
            "priority": "0.8",
            "changefreq": "monthly",
            "type": "county"
        })

    # 3. Blog category pages
    for cat in BLOG_CATEGORIES:
        urls.append({
            "url": f"{SITE_URL}{cat}",
            "priority": "0.5",
            "changefreq": "weekly",
            "type": "blog"
        })

    # 4. Blog posts from sitemap_final_urls.txt
    script_dir = os.path.dirname(os.path.abspath(__file__))
    urls_file = os.path.join(script_dir, "sitemap_final_urls.txt")

    if os.path.exists(urls_file):
        existing_urls = {u["url"] for u in urls}
        with open(urls_file) as f:
            for line in f:
                url = line.strip()
                if url and not url.startswith("#") and url not in existing_urls:
                    ptype = "blog" if "/single-post/" in url or "/blog/" in url else "static"
                    urls.append({
                        "url": url,
                        "priority": "0.6" if ptype == "blog" else "0.5",
                        "changefreq": "monthly",
                        "type": ptype
                    })
                    existing_urls.add(url)

    return urls


# ─── Sitemap Generator ───────────────────────────────────────────────────────
def generate_sitemap_xml(urls):
    """Generate a proper sitemap.xml with all URLs."""
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
    xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n'
    xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n'

    for entry in urls:
        xml += f'  <url>\n'
        xml += f'    <loc>{entry["url"]}</loc>\n'
        xml += f'    <lastmod>{LAST_MOD}</lastmod>\n'
        xml += f'    <changefreq>{entry["changefreq"]}</changefreq>\n'
        xml += f'    <priority>{entry["priority"]}</priority>\n'
        xml += f'  </url>\n'

    xml += '</urlset>\n'
    return xml


# ─── HTTP Helper ──────────────────────────────────────────────────────────────
def http_get(url):
    """Make an HTTP GET request."""
    try:
        if HAS_REQUESTS:
            resp = requests.get(url, timeout=15)
            return resp.status_code, resp.text[:200]
        else:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.status, resp.read(200).decode()
    except Exception as e:
        return 0, str(e)[:200]


def http_post_json(url, data):
    """Make an HTTP POST request with JSON body."""
    try:
        if HAS_REQUESTS:
            resp = requests.post(url, json=data, timeout=15,
                               headers={"Content-Type": "application/json"})
            return resp.status_code, resp.text[:200]
        else:
            json_data = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(url, data=json_data, method="POST")
            req.add_header("Content-Type", "application/json")
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.status, resp.read(200).decode()
    except Exception as e:
        return 0, str(e)[:200]


# ─── Submission Methods ───────────────────────────────────────────────────────
def ping_google_sitemap(dry_run=False):
    """Ping Google to re-crawl the sitemap."""
    sitemap_url = f"{SITE_URL}/sitemap.xml"
    ping_url = f"https://www.google.com/ping?sitemap={quote(sitemap_url, safe='')}"

    if dry_run:
        return "DRY_RUN", f"Would ping: {ping_url}"

    status, body = http_get(ping_url)
    return status, body


def ping_bing_sitemap(dry_run=False):
    """Ping Bing to re-crawl the sitemap."""
    sitemap_url = f"{SITE_URL}/sitemap.xml"
    ping_url = f"https://www.bing.com/ping?sitemap={quote(sitemap_url, safe='')}"

    if dry_run:
        return "DRY_RUN", f"Would ping: {ping_url}"

    status, body = http_get(ping_url)
    return status, body


def submit_indexnow(urls, dry_run=False):
    """Submit URLs via IndexNow API (Bing, Yandex, Naver, etc.)."""
    # Generate a key if not set
    global INDEXNOW_KEY
    if not INDEXNOW_KEY:
        INDEXNOW_KEY = hashlib.sha256(SITE_URL.encode()).hexdigest()[:32]

    url_list = [u["url"] for u in urls]

    payload = {
        "host": SITE_HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": f"{SITE_URL}/{INDEXNOW_KEY}.txt",
        "urlList": url_list
    }

    if dry_run:
        return "DRY_RUN", f"Would submit {len(url_list)} URLs via IndexNow", INDEXNOW_KEY

    # Submit to IndexNow (shared across Bing, Yandex, etc.)
    status, body = http_post_json("https://api.indexnow.org/indexnow", payload)
    return status, body, INDEXNOW_KEY


# ─── Report Generator ────────────────────────────────────────────────────────
def generate_report(urls, results, output_dir, dry_run=False):
    """Generate a markdown report of all submissions."""
    path = os.path.join(output_dir, "indexing_report.md")

    with open(path, "w") as f:
        f.write("# 📡 Bulk Indexing Submission Report\n\n")
        f.write(f"**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Site:** {SITE_URL}\n")
        f.write(f"**Mode:** {'🔵 DRY RUN' if dry_run else '🟢 LIVE'}\n")
        f.write(f"**Total URLs:** {len(urls)}\n\n")

        # URL breakdown
        types = {}
        for u in urls:
            types[u["type"]] = types.get(u["type"], 0) + 1

        f.write("## 📊 URL Breakdown\n\n")
        f.write("| Type | Count |\n|---|---|\n")
        for t, c in sorted(types.items()):
            f.write(f"| {t.title()} | {c} |\n")
        f.write(f"| **Total** | **{len(urls)}** |\n\n")

        # Submission results
        f.write("## 📬 Submission Results\n\n")
        f.write("| Method | Status | Details |\n|---|---|---|\n")
        for method, status, details in results:
            emoji = "✅" if status in [200, 202, "DRY_RUN"] else "❌"
            f.write(f"| {method} | {emoji} {status} | {details[:80]} |\n")
        f.write("\n")

        # Instructions
        f.write("## 📋 Next Steps\n\n")
        f.write("### 1. Upload Sitemap\n")
        f.write(f"The generated `sitemap.xml` contains all {len(urls)} URLs.\n")
        f.write("Upload it to your Wix site root or submit via Google Search Console:\n")
        f.write(f"- Go to [Google Search Console](https://search.google.com/search-console/sitemaps?resource_id={quote(SITE_URL, safe='')})\n")
        f.write(f"- Add sitemap: `sitemap.xml`\n\n")

        f.write("### 2. IndexNow Key File\n")
        if INDEXNOW_KEY:
            f.write(f"Create a file at `{SITE_URL}/{INDEXNOW_KEY}.txt` containing:\n")
            f.write(f"```\n{INDEXNOW_KEY}\n```\n")
            f.write("This verifies ownership for Bing/Yandex instant indexing.\n\n")

        f.write("### 3. Google Search Console Manual Check\n")
        f.write("For high-priority pages not yet indexed, use the URL Inspection tool:\n")
        f.write(f"- Open `gsc_url_list.txt` and paste each URL into GSC's URL Inspection bar\n")
        f.write("- Click 'Request Indexing' for each unindexed page\n")
        f.write("- **Priority pages** (do these first): Home, county pages for your core markets\n\n")

        # Full URL list
        f.write("## 📄 All Submitted URLs\n\n")
        f.write("<details><summary>Click to expand full URL list</summary>\n\n")
        for u in urls:
            f.write(f"- `{u['url']}` ({u['type']})\n")
        f.write("\n</details>\n")

    print(f"📄 Report: {path}")
    return path


def generate_gsc_url_list(urls, output_dir):
    """Generate a plain text list for GSC URL Inspection."""
    path = os.path.join(output_dir, "gsc_url_list.txt")

    # Prioritize: county pages first, then static, then blog
    priority_order = {"county": 0, "static": 1, "blog": 2}
    sorted_urls = sorted(urls, key=lambda u: priority_order.get(u["type"], 3))

    with open(path, "w") as f:
        f.write("# Google Search Console - URLs to inspect and request indexing\n")
        f.write(f"# Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Total: {len(sorted_urls)} URLs\n")
        f.write("# Priority: County pages first, then static, then blog\n\n")

        current_type = None
        for u in sorted_urls:
            if u["type"] != current_type:
                current_type = u["type"]
                f.write(f"\n# --- {current_type.upper()} PAGES ---\n")
            f.write(f"{u['url']}\n")

    print(f"📋 GSC URL list: {path}")
    return path


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    dry_run = "--dry-run" in sys.argv

    if "--output-dir" in sys.argv:
        idx = sys.argv.index("--output-dir")
        if idx + 1 < len(sys.argv):
            output_dir = sys.argv[idx + 1]

    print("📡 Shamrock Bail Bonds — Bulk Index Submitter")
    print("=" * 60)
    if dry_run:
        print("🔵 DRY RUN MODE — No actual submissions will be made\n")

    # 1. Collect URLs
    urls = collect_all_urls()
    types = {}
    for u in urls:
        types[u["type"]] = types.get(u["type"], 0) + 1

    print(f"📋 Collected {len(urls)} URLs:")
    for t, c in sorted(types.items()):
        print(f"   • {t}: {c}")

    # 2. Generate sitemap.xml
    print(f"\n📝 Generating sitemap.xml...")
    sitemap_xml = generate_sitemap_xml(urls)
    sitemap_path = os.path.join(output_dir, "sitemap.xml")
    with open(sitemap_path, "w") as f:
        f.write(sitemap_xml)
    print(f"   ✅ Saved: {sitemap_path} ({len(urls)} URLs)")

    # 3. Generate GSC URL list
    print(f"\n📋 Generating GSC URL inspection list...")
    generate_gsc_url_list(urls, output_dir)

    # 4. Submit via all channels
    print(f"\n📬 Submitting for indexing...")
    results = []

    # Ping Google
    print("   🔍 Pinging Google sitemap...")
    status, body = ping_google_sitemap(dry_run)
    results.append(("Google Sitemap Ping", status, body))
    print(f"      → {status}")

    # Ping Bing
    print("   🔍 Pinging Bing sitemap...")
    status, body = ping_bing_sitemap(dry_run)
    results.append(("Bing Sitemap Ping", status, body))
    print(f"      → {status}")

    # IndexNow (Bing + Yandex + others)
    print(f"   ⚡ Submitting {len(urls)} URLs via IndexNow...")
    status, body, key = submit_indexnow(urls, dry_run)
    results.append(("IndexNow API", status, body))
    print(f"      → {status}")

    # Generate IndexNow key file
    key_path = os.path.join(output_dir, f"{key}.txt")
    with open(key_path, "w") as f:
        f.write(key)
    print(f"   🔑 IndexNow key file: {key_path}")

    # 5. Generate report
    print(f"\n📝 Generating report...")
    generate_report(urls, results, output_dir, dry_run)

    # Summary
    print(f"\n{'=' * 60}")
    print(f"✅ Done! {len(urls)} URLs processed.")
    print(f"\n📌 IMPORTANT NEXT STEPS:")
    print(f"   1. Upload sitemap.xml to your Wix site root")
    print(f"      OR submit in Google Search Console → Sitemaps")
    print(f"   2. Upload {key}.txt to your site root for IndexNow verification")
    print(f"   3. For priority pages, use gsc_url_list.txt with GSC URL Inspection")
    print(f"\n   All files saved to: {output_dir}")


if __name__ == "__main__":
    main()
