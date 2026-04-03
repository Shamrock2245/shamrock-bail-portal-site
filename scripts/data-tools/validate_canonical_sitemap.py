#!/usr/bin/env python3
"""
Phase 3: Canonical & Sitemap Validation
- Identify pages with canonical mismatch or soft 404s
- Ensure sitewide structures (trailing slash, www/non-www) match canonical versions
- Confirm no redirecting URLs are in the Wix XML sitemap
"""

import json
import csv
from urllib.parse import urlparse, urlunparse

OUTPUT_DIR = "/home/ubuntu/redirect_audit"

with open(f"{OUTPUT_DIR}/crawl_results_raw.json") as f:
    raw = json.load(f)

with open(f"{OUTPUT_DIR}/sitemap_urls.json") as f:
    sitemap_urls = json.load(f)

with open(f"{OUTPUT_DIR}/crawl_categories.json") as f:
    cats = json.load(f)

# ─── Helper ─────────────────────────────────────────────────────────────────
def normalize(url):
    p = urlparse(url)
    path = p.path.rstrip('/') or '/'
    return urlunparse(('https', 'www.shamrockbailbonds.biz', path, '', '', ''))

# ─── Helper function ───────────────────────────────────────────────────────
def get_canonical_action(issue_type, url, canonical):
    if issue_type == "Trailing slash mismatch":
        return "Ensure Wix uses consistent trailing slash policy (no trailing slash preferred)"
    elif issue_type == "www vs non-www mismatch":
        return "Ensure all pages use www.shamrockbailbonds.biz as canonical"
    elif issue_type == "Canonical points to different page":
        if '/single-post/' in url:
            return "Verify this is intentional (blog duplicate consolidation)"
        return "Review: canonical may be incorrectly set in Wix SEO settings"
    return "Review canonical tag in Wix SEO settings"

# ─── 1. Canonical Analysis ──────────────────────────────────────────────────
print("=== CANONICAL ANALYSIS ===")

canonical_issues = []
for r in raw:
    if r['final_status'] != 200:
        continue
    url = r['original_url']
    canonical = r.get('canonical')
    if not canonical:
        continue
    norm_url = normalize(url)
    norm_canonical = normalize(canonical)
    if norm_url != norm_canonical:
        url_no_slash = url.rstrip('/')
        canonical_no_slash = canonical.rstrip('/')
        if url_no_slash == canonical_no_slash:
            issue_type = "Trailing slash mismatch"
        elif url.replace('www.', '') == canonical.replace('www.', ''):
            issue_type = "www vs non-www mismatch"
        elif urlparse(url).path != urlparse(canonical).path:
            issue_type = "Canonical points to different page"
        else:
            issue_type = "Other mismatch"
        canonical_issues.append({
            "Page URL": url,
            "Canonical Tag": canonical,
            "Issue Type": issue_type,
            "Normalized Page": norm_url,
            "Normalized Canonical": norm_canonical,
            "Action": get_canonical_action(issue_type, url, canonical)
        })

canonical_ok_count = sum(1 for r in raw if r['final_status'] == 200 and r.get('canonical') and normalize(r['original_url']) == normalize(r.get('canonical', '')))
print(f"Pages with canonical issues: {len(canonical_issues)}")
print(f"Pages with correct canonicals: {canonical_ok_count}")

# Breakdown by issue type
from collections import Counter
issue_counts = Counter(r['Issue Type'] for r in canonical_issues)
for issue, count in issue_counts.most_common():
    print(f"  {issue}: {count}")

# Write canonical issues CSV
with open(f"{OUTPUT_DIR}/canonical_issues_detailed.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Page URL", "Canonical Tag", "Issue Type", "Normalized Page", "Normalized Canonical", "Action"])
    writer.writeheader()
    writer.writerows(canonical_issues)

# ─── 2. Sitemap Validation ──────────────────────────────────────────────────
print("\n=== SITEMAP VALIDATION ===\n")

url_status_map = {r['original_url']: r for r in raw}
# Also index by normalized URL
url_status_norm = {}
for r in raw:
    url_status_norm[normalize(r['original_url'])] = r

sitemap_issues = []
sitemap_ok = []

for surl in sitemap_urls:
    r = url_status_map.get(surl) or url_status_norm.get(normalize(surl))
    
    if not r:
        sitemap_issues.append({
            "Sitemap URL": surl,
            "HTTP Status": "Not crawled",
            "Hops": 0,
            "Issue": "Not verified",
            "Action": "Manually verify this URL"
        })
        continue
    
    status = r['final_status']
    hops = r['hops']
    
    if status == 404:
        sitemap_issues.append({
            "Sitemap URL": surl,
            "HTTP Status": 404,
            "Hops": hops,
            "Issue": "404 Not Found in sitemap",
            "Action": "REMOVE from sitemap immediately"
        })
    elif hops >= 2:
        sitemap_issues.append({
            "Sitemap URL": surl,
            "HTTP Status": status,
            "Hops": hops,
            "Issue": f"Redirecting URL in sitemap ({hops} hops)",
            "Action": "Update sitemap to use final destination URL"
        })
    elif hops == 1:
        sitemap_issues.append({
            "Sitemap URL": surl,
            "HTTP Status": status,
            "Hops": hops,
            "Issue": "Redirecting URL in sitemap (1 hop)",
            "Action": "Update sitemap to use final destination URL"
        })
    elif status == 200:
        sitemap_ok.append(surl)
    else:
        sitemap_issues.append({
            "Sitemap URL": surl,
            "HTTP Status": status,
            "Hops": hops,
            "Issue": f"HTTP {status}",
            "Action": "Investigate and fix"
        })

print(f"Sitemap URLs checked: {len(sitemap_urls)}")
print(f"  Clean (200, no redirects): {len(sitemap_ok)}")
print(f"  Issues found: {len(sitemap_issues)}")
for issue in sitemap_issues[:20]:
    print(f"    [{issue['HTTP Status']}] {issue['Sitemap URL']} - {issue['Issue']}")

with open(f"{OUTPUT_DIR}/sitemap_validation.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Sitemap URL", "HTTP Status", "Hops", "Issue", "Action"])
    writer.writeheader()
    # Write issues first, then OK
    writer.writerows(sitemap_issues)
    for url in sitemap_ok:
        writer.writerow({"Sitemap URL": url, "HTTP Status": 200, "Hops": 0, "Issue": "OK", "Action": "None needed"})

# ─── 3. Trailing Slash & www Consistency Check ─────────────────────────────
print("\n=== SITEWIDE STRUCTURE CONSISTENCY ===\n")

trailing_slash_issues = []
www_issues = []

for r in raw:
    if r['final_status'] != 200:
        continue
    url = r['original_url']
    canonical = r.get('canonical', '')
    
    # Check trailing slash consistency
    if url.endswith('/') and url != 'https://www.shamrockbailbonds.biz/':
        trailing_slash_issues.append(url)
    
    # Check www consistency
    if 'shamrockbailbonds.biz' in url and 'www.' not in url:
        www_issues.append(url)

print(f"URLs with trailing slash (non-root): {len(trailing_slash_issues)}")
print(f"URLs without www prefix: {len(www_issues)}")
if www_issues:
    for u in www_issues[:10]:
        print(f"  {u}")

# ─── 4. Summary ────────────────────────────────────────────────────────────
print("\n=== PHASE 3 SUMMARY ===")
print(f"Canonical mismatches: {len(canonical_issues)}")
print(f"  - Canonical points to different page: {issue_counts.get('Canonical points to different page', 0)}")
print(f"  - Trailing slash mismatch: {issue_counts.get('Trailing slash mismatch', 0)}")
print(f"  - www vs non-www mismatch: {issue_counts.get('www vs non-www mismatch', 0)}")
print(f"Sitemap issues: {len(sitemap_issues)}")
print(f"Sitemap clean URLs: {len(sitemap_ok)}")
print(f"Trailing slash issues: {len(trailing_slash_issues)}")
print(f"Non-www URLs: {len(www_issues)}")

# Save summary
summary = {
    "canonical_issues": len(canonical_issues),
    "canonical_breakdown": dict(issue_counts),
    "sitemap_total": len(sitemap_urls),
    "sitemap_ok": len(sitemap_ok),
    "sitemap_issues": len(sitemap_issues),
    "trailing_slash_issues": len(trailing_slash_issues),
    "www_issues": len(www_issues),
}
with open(f"{OUTPUT_DIR}/phase3_summary.json", "w") as f:
    json.dump(summary, f, indent=2)

print("\nPhase 3 complete. Files written:")
print("  - canonical_issues_detailed.csv")
print("  - sitemap_validation.csv")
print("  - phase3_summary.json")
