#!/usr/bin/env python3
"""
Shamrock Bail Bonds — Google Indexing API Bulk Submission Script
================================================================
Submits all site URLs to the Google Indexing API in bulk.
Signals Google to crawl and re-index pages immediately with priority.

Features:
  - Dynamically discovers all canonical URLs from the live sitemap index
  - Prioritizes high-impact pages (Home, About, Services, SWFL Core, All 67 Counties)
  - Auto-resolves service_account.json key path
  - Handles daily rate limiting (default limit: 200 URLs/day per Google quota)
  - Saves detailed JSON and Markdown reports

Usage:
  python3 scripts/seo/bulk_indexing_submit.py [--dry-run] [--limit N]
"""

import json
import time
import sys
import os
import re
import urllib.request
import urllib.error
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
    os.system("pip3 install google-auth google-auth-httplib2 google-api-python-client requests -q")
    import google.auth
    import google.auth.transport.requests
    from google.oauth2 import service_account
    import requests as req_lib

# ── Configuration ─────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent

# Search candidates for service_account.json
KEY_CANDIDATES = [
    SCRIPT_DIR / "service_account.json",
    REPO_ROOT / "service_account.json",
    Path("service_account.json"),
    Path(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")) if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") else None
]

INDEXING_API_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
SCOPES = ["https://www.googleapis.com/auth/indexing"]

SITE_URL = "https://www.shamrockbailbonds.biz"
SITEMAP_INDEX = f"{SITE_URL}/sitemap.xml"
USER_AGENT = "Mozilla/5.0 (compatible; ShamrockBailGoogleSubmitter/2.0; +https://www.shamrockbailbonds.biz)"

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

# Static high-priority seed URLs
CORE_PAGES = [
    f"{SITE_URL}/",
    f"{SITE_URL}/about",
    f"{SITE_URL}/contact",
    f"{SITE_URL}/how-bail-works",
    f"{SITE_URL}/first-appearance",
    f"{SITE_URL}/bail-school",
    f"{SITE_URL}/how-to-become-a-bondsman",
    f"{SITE_URL}/testimonials",
    f"{SITE_URL}/blog",
    f"{SITE_URL}/terms-and-conditions",
    f"{SITE_URL}/terms-of-service",
    f"{SITE_URL}/privacy-policy"
]

SWFL_COUNTIES = ["lee", "collier", "charlotte", "hendry", "desoto", "sarasota", "manatee"]


def find_service_account_path() -> Path:
    for candidate in KEY_CANDIDATES:
        if candidate and candidate.exists():
            return candidate
    return SCRIPT_DIR / "service_account.json"


def fetch_url_text(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8")


def normalize_url(url: str) -> str:
    url = url.strip()
    if url == f"{SITE_URL}/" or url == SITE_URL:
        return f"{SITE_URL}/"
    return url.rstrip("/")


def discover_all_urls(verbose: bool = False):
    urls = []
    seen = set()

    for p in CORE_PAGES:
        norm = normalize_url(p)
        if norm not in seen:
            urls.append(norm)
            seen.add(norm)

    child_sitemaps = []
    try:
        index_xml = fetch_url_text(SITEMAP_INDEX)
        locs = re.findall(r"<loc>\s*([^<]+)\s*</loc>", index_xml)
        for loc in locs:
            loc = loc.strip()
            if loc.endswith(".xml") and loc not in child_sitemaps:
                child_sitemaps.append(loc)
    except Exception as e:
        if verbose:
            print(f"⚠️ Sitemap fetch fallback: {e}")

    if not child_sitemaps:
        child_sitemaps = [
            f"{SITE_URL}/pages-sitemap.xml",
            f"{SITE_URL}/dynamic-florida-bail-bonds_p_e7cdf976_0d00_4377_927c_fa4cc08037be_0_5000-sitemap.xml",
            f"{SITE_URL}/blog-posts-sitemap.xml",
            f"{SITE_URL}/blog-categories-sitemap.xml"
        ]

    for sm_url in child_sitemaps:
        try:
            xml_text = fetch_url_text(sm_url)
            locs = re.findall(r"<loc>\s*([^<]+)\s*</loc>", xml_text)
            for loc in locs:
                loc = loc.strip()
                if not loc.startswith(SITE_URL):
                    continue
                if any(pat.search(loc) for pat in DISALLOWED_PATTERNS):
                    continue
                norm = normalize_url(loc)
                if norm not in seen:
                    seen.add(norm)
                    urls.append(norm)
        except Exception as e:
            if verbose:
                print(f"⚠️ Skipped {sm_url}: {e}")

    # Prioritization scoring:
    # 0 = Homepage
    # 1 = About & Core Static
    # 2 = SWFL Core Counties
    # 3 = Other FL Counties
    # 4 = City Landings / First Appearance County Hubs
    # 5 = Blog Posts
    # 6 = Categories & Legal
    def priority_score(u: str) -> int:
        if u == f"{SITE_URL}/" or u == SITE_URL:
            return 0
        if any(u.endswith(x) for x in ["/about", "/contact", "/how-bail-works", "/first-appearance"]):
            return 1
        for c in SWFL_COUNTIES:
            if f"/florida-bail-bonds/{c}" in u:
                return 2
        if "/florida-bail-bonds/" in u:
            return 3
        if "/single-post/" in u:
            return 5
        return 4

    urls.sort(key=priority_score)
    return urls


def get_access_token(key_path: Path):
    if not key_path.exists():
        print(f"\n❌ ERROR: Service account key not found at: {key_path}")
        print("   Please ensure service_account.json exists in scripts/seo/")
        sys.exit(1)

    credentials = service_account.Credentials.from_service_account_file(
        str(key_path),
        scopes=SCOPES
    )
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    return credentials.token


def submit_url(url: str, token: str, notification_type: str = "URL_UPDATED") -> dict:
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


def run_bulk_submission(dry_run: bool = False, limit: int = 200):
    print("=" * 70)
    print("🚀 Shamrock Bail Bonds — Google Indexing API Bulk Submitter")
    print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Mode: {'DRY RUN (no requests)' if dry_run else 'LIVE'}")
    print(f"   Max URL Limit: {limit}")
    print("=" * 70)

    key_path = find_service_account_path()
    if not dry_run:
        print(f"🔑 Using Service Account Key: {key_path}")
        token = get_access_token(key_path)
        print("   ✅ Authentication successful.\n")
    else:
        token = "DRY_RUN_TOKEN"

    print("📡 Discovering live URLs from sitemap index...")
    all_urls = discover_all_urls()
    print(f"✅ Discovered {len(all_urls)} canonical URLs.")

    urls_to_submit = all_urls[:limit]
    print(f"🎯 Submitting top {len(urls_to_submit)} prioritized URLs (Quota Cap: {limit})...\n")

    results = []
    success_count = 0
    error_count = 0
    quota_exceeded = False

    for i, url in enumerate(urls_to_submit, 1):
        print(f"[{i:3d}/{len(urls_to_submit)}] Submitting: {url[:75]:<75} ... ", end="", flush=True)

        if dry_run:
            result = {"url": url, "status_code": 200, "response": {}, "success": True}
            print("✅ DRY RUN")
            success_count += 1
        else:
            try:
                result = submit_url(url, token)
                if result["success"]:
                    print("✅ 200 OK")
                    success_count += 1
                elif result["status_code"] == 429:
                    print("⚠️ 429 Quota Exceeded (stopping batch)")
                    error_count += 1
                    quota_exceeded = True
                    results.append(result)
                    break
                else:
                    err_msg = result["response"].get("error", {}).get("message", "Unknown error")
                    print(f"❌ {result['status_code']} — {err_msg[:60]}")
                    error_count += 1
            except Exception as e:
                result = {"url": url, "status_code": 0, "response": {"error": str(e)}, "success": False}
                print(f"❌ Error: {e}")
                error_count += 1

            # Throttle to stay within Google rate limits (~60/min)
            time.sleep(1.05)

        results.append(result)

    # ── Reports ────────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  SUBMISSION RESULTS")
    print(f"  ✅ Successful: {success_count} / {len(urls_to_submit)}")
    if error_count > 0:
        print(f"  ❌ Errors:     {error_count} / {len(urls_to_submit)}")
    if quota_exceeded:
        print("  ℹ️  Daily Google Indexing API quota limit (200/day) reached. Remaining URLs can be submitted tomorrow.")
    print("=" * 70)

    # Save JSON Report
    report_json = SCRIPT_DIR / "gsc_submission_report.json"
    report_data = {
        "submitted_at": datetime.now().isoformat(),
        "total_discovered": len(all_urls),
        "submitted_count": len(results),
        "successful": success_count,
        "errors": error_count,
        "quota_exceeded": quota_exceeded,
        "results": results
    }
    with open(report_json, "w") as f:
        json.dump(report_data, f, indent=2)

    # Save Markdown Report
    report_md = SCRIPT_DIR / "gsc_submission_report.md"
    with open(report_md, "w") as f:
        f.write("# Google Indexing API Submission Report\n\n")
        f.write(f"- **Submitted At**: {report_data['submitted_at']}\n")
        f.write(f"- **Total Discovered**: {len(all_urls)}\n")
        f.write(f"- **Processed**: {len(results)}\n")
        f.write(f"- **Successful (200 OK)**: {success_count}\n")
        f.write(f"- **Errors**: {error_count}\n")
        f.write(f"- **Quota Exceeded**: {'Yes' if quota_exceeded else 'No'}\n\n")
        f.write("### Submitted URLs Sample\n\n")
        for r in results[:25]:
            status = "✅ 200 OK" if r["success"] else f"❌ {r['status_code']}"
            f.write(f"- `{r['url']}`: {status}\n")

    print(f"\n📄 Reports saved:")
    print(f"   ↳ {report_json}")
    print(f"   ↳ {report_md}")

    return results


if __name__ == "__main__":
    dry_run_mode = "--dry-run" in sys.argv
    limit_val = 200
    for idx, arg in enumerate(sys.argv):
        if arg == "--limit" and idx + 1 < len(sys.argv):
            try:
                limit_val = int(sys.argv[idx + 1])
            except ValueError:
                pass
    run_bulk_submission(dry_run=dry_run_mode, limit=limit_val)
