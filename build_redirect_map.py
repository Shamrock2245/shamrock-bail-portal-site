#!/usr/bin/env python3
"""
Build the Redirect Mapping Sheet from crawl results.
Produces:
  1. redirect_mapping_sheet.csv  - Full audit sheet (Original URL, Target, Status, Hops, Issue, Action)
  2. wix_bulk_redirects_FINAL.csv - Clean Wix bulk import format (Old URL, New URL)
  3. canonical_issues.csv        - Pages with canonical mismatches
  4. sitemap_audit.csv           - Sitemap URL status check
  5. redirect_audit_report.md    - Human-readable summary report
"""

import json
import csv
import os
from urllib.parse import urlparse

OUTPUT_DIR = "/home/ubuntu/redirect_audit"
REPO_DIR = "/home/ubuntu/shamrock-bail-portal-site"

# Load crawl data
with open(f"{OUTPUT_DIR}/crawl_results_raw.json") as f:
    raw = json.load(f)

with open(f"{OUTPUT_DIR}/crawl_categories.json") as f:
    cats = json.load(f)

with open(f"{OUTPUT_DIR}/sitemap_urls.json") as f:
    sitemap_urls = json.load(f)

sitemap_set = set(sitemap_urls)


def get_path(url):
    p = urlparse(url)
    path = p.path
    if p.query:
        path += f"?{p.query}"
    return path or "/"


def classify_issue(r):
    """Determine the SEO issue type for a URL."""
    status = r["final_status"]
    hops = r["hops"]
    url = r["original_url"]
    
    if status == 404 or (status is None and r.get("error")):
        return "404 Not Found"
    elif hops >= 2:
        return "Redirect Chain (2+ hops)"
    elif hops == 1:
        chain = r.get("chain", [])
        if chain:
            code = chain[0]["status_code"]
            return f"{code} Redirect"
        return "Redirect"
    elif status == 200:
        return "OK (200)"
    else:
        return f"HTTP {status}"


def recommend_action(r, url):
    """Recommend the fix action for each URL."""
    status = r["final_status"]
    hops = r["hops"]
    path = get_path(url)
    
    # Skip query-string portal URLs - they're dynamic
    if "portal-landing?county=" in url:
        return "No action needed (dynamic query param)"
    
    # Skip blog hashtags/tags - Wix-managed
    if "/blog/hashtags/" in url or "/blog/tags/" in url:
        return "No action needed (Wix blog taxonomy)"
    
    # Skip blog archive pages
    if "/blog/archive/" in url or "/blog/page/" in url:
        return "No action needed (Wix blog pagination)"
    
    if status == 404:
        # Determine best redirect target
        if "/bail-bonds/" in url:
            county = path.split("/bail-bonds/")[-1].rstrip("/")
            # Check if /florida-bail-bonds/county exists
            return f"301 → /florida-bail-bonds/{county} (or / if county page doesn't exist)"
        elif "/blank" in url or "/home-1" in url or "/bail-online" in url:
            return "301 → / (homepage)"
        else:
            return "301 → / (homepage fallback)"
    
    elif hops >= 2:
        return f"Collapse to single-hop 301 → {r['final_url']}"
    
    elif hops == 1:
        chain = r.get("chain", [])
        if chain and chain[0]["status_code"] == 301:
            return f"Already 301 → {r['final_url']} (verify target is correct)"
        elif chain and chain[0]["status_code"] == 302:
            return f"Change 302 to 301 → {r['final_url']}"
        return "Review redirect"
    
    return "No action needed"


# ─── 1. Build full mapping sheet ───────────────────────────────────────────
print("Building redirect mapping sheet...")

mapping_rows = []
wix_import_rows = []

# Priority pages to highlight
PRIORITY_PAGES = {
    "/", "/how-bail-works", "/how-to-become-a-bondsman",
    "/contact", "/about", "/blog", "/faq",
    "/florida-bail-bonds", "/members", "/portal-landing",
    "/portal-indemnitor", "/portal-defendant",
    "/florida-sheriffs-clerks", "/terms-of-service", "/testimonials",
}

for r in raw:
    url = r["original_url"]
    path = get_path(url)
    status = r["final_status"]
    hops = r["hops"]
    final_url = r["final_url"]
    chain = r.get("chain", [])
    canonical = r.get("canonical", "")
    in_sitemap = url in sitemap_set
    issue = classify_issue(r)
    action = recommend_action(r, url)
    is_priority = path in PRIORITY_PAGES

    # Redirect chain detail
    chain_detail = " → ".join([
        f"{c['url']} ({c['status_code']})" for c in chain
    ]) if chain else ""

    row = {
        "Original URL": url,
        "Path": path,
        "Final URL": final_url,
        "Final Status": status if status else "Error",
        "Hops": hops,
        "Issue Type": issue,
        "Redirect Chain": chain_detail,
        "Canonical Tag": canonical or "",
        "In Sitemap": "Yes" if in_sitemap else "No",
        "Priority Page": "Yes" if is_priority else "No",
        "Recommended Action": action,
    }
    mapping_rows.append(row)

    # Build Wix import list
    # Only add paths that need redirects (404s and broken chains)
    # Skip: root domain, query strings (Wix can't redirect those), API paths, blog taxonomy
    skip_patterns = [
        "portal-landing?county=",
        "/blog/hashtags/",
        "/blog/tags/",
        "/blog/archive/",
        "/blog/page/",
        "/_api/",
        "/_functions/",
        "/product-page/",
    ]
    should_skip = any(p in url for p in skip_patterns)
    
    if not should_skip and path and path != "/":
        if status == 404:
            # Determine best target
            if "/bail-bonds/" in path:
                county = path.split("/bail-bonds/")[-1].rstrip("/")
                # We'll use the florida-bail-bonds path as target
                new_target = f"/florida-bail-bonds/{county}"
            else:
                new_target = "/"
            wix_import_rows.append({"Old URL": path, "New URL": new_target})
        
        elif hops >= 2:
            # Collapse chain to single hop
            if final_url and "shamrockbailbonds.biz" in final_url:
                new_target = get_path(final_url)
            else:
                new_target = final_url
            wix_import_rows.append({"Old URL": path, "New URL": new_target})

# Sort: priority pages first, then 404s, then redirects
mapping_rows.sort(key=lambda x: (
    0 if x["Priority Page"] == "Yes" else 1,
    0 if "404" in x["Issue Type"] else (1 if "Redirect" in x["Issue Type"] else 2),
    x["Original URL"]
))

# Write full mapping sheet
fieldnames = [
    "Original URL", "Path", "Final URL", "Final Status", "Hops",
    "Issue Type", "Redirect Chain", "Canonical Tag",
    "In Sitemap", "Priority Page", "Recommended Action"
]
with open(f"{OUTPUT_DIR}/redirect_mapping_sheet.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(mapping_rows)

print(f"  → redirect_mapping_sheet.csv ({len(mapping_rows)} rows)")

# ─── 2. Wix bulk import CSV ────────────────────────────────────────────────
# Deduplicate
seen_old = set()
deduped_wix = []
for row in wix_import_rows:
    if row["Old URL"] not in seen_old:
        seen_old.add(row["Old URL"])
        deduped_wix.append(row)

with open(f"{OUTPUT_DIR}/wix_bulk_redirects_FINAL.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Old URL", "New URL"])
    writer.writeheader()
    writer.writerows(deduped_wix)

# Also copy to repo
with open(f"{REPO_DIR}/wix_bulk_redirects_FINAL.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Old URL", "New URL"])
    writer.writeheader()
    writer.writerows(deduped_wix)

print(f"  → wix_bulk_redirects_FINAL.csv ({len(deduped_wix)} redirect rules)")

# ─── 3. Canonical issues sheet ─────────────────────────────────────────────
canonical_rows = []
for r in cats["canonical_mismatch"]:
    url = r["original_url"]
    canonical = r.get("canonical", "")
    canonical_rows.append({
        "Page URL": url,
        "Declared Canonical": canonical,
        "Issue": "Canonical points to different URL than page",
        "Action": "Verify canonical is intentional; if not, update in Wix SEO settings"
    })

with open(f"{OUTPUT_DIR}/canonical_issues.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Page URL", "Declared Canonical", "Issue", "Action"])
    writer.writeheader()
    writer.writerows(canonical_rows)

print(f"  → canonical_issues.csv ({len(canonical_rows)} pages)")

# ─── 4. Sitemap audit ──────────────────────────────────────────────────────
url_status_map = {r["original_url"]: r for r in raw}

sitemap_audit_rows = []
for surl in sitemap_urls:
    r = url_status_map.get(surl)
    if r:
        status = r["final_status"]
        hops = r["hops"]
        issue = classify_issue(r)
    else:
        status = "Not crawled"
        hops = 0
        issue = "Not checked"
    
    sitemap_audit_rows.append({
        "Sitemap URL": surl,
        "HTTP Status": status,
        "Hops": hops,
        "Issue": issue,
        "Action": "Remove from sitemap" if (status == 404 or hops > 0) else "OK"
    })

with open(f"{OUTPUT_DIR}/sitemap_audit.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Sitemap URL", "HTTP Status", "Hops", "Issue", "Action"])
    writer.writeheader()
    writer.writerows(sitemap_audit_rows)

print(f"  → sitemap_audit.csv ({len(sitemap_audit_rows)} sitemap URLs)")

# ─── 5. Summary statistics ─────────────────────────────────────────────────
total = len(raw)
count_404 = len(cats["404_not_found"])
count_chains = len(cats["redirect_chains"])
count_single = len(cats["redirect_single"])
count_canonical = len(cats["canonical_mismatch"])
count_ok = len(cats["clean_200"])
sitemap_redirecting = len(cats["in_sitemap_but_redirecting"])
sitemap_404 = len(cats["in_sitemap_but_404"])

# Breakdown of 404s
bail_bonds_404 = [r for r in cats["404_not_found"] if "/bail-bonds/" in r["original_url"]]
florida_bail_bonds_404 = [r for r in cats["404_not_found"] if "/florida-bail-bonds/" in r["original_url"]]
other_404 = [r for r in cats["404_not_found"] 
             if "/bail-bonds/" not in r["original_url"] 
             and "/florida-bail-bonds/" not in r["original_url"]
             and "/blog/" not in r["original_url"]
             and "portal-landing?county=" not in r["original_url"]]

blog_404 = [r for r in cats["404_not_found"] if "/blog/" in r["original_url"]]
portal_404 = [r for r in cats["404_not_found"] if "portal-landing?county=" in r["original_url"]]

print(f"\n=== SUMMARY ===")
print(f"Total URLs audited: {total}")
print(f"Clean 200s: {count_ok}")
print(f"404 Not Found: {count_404}")
print(f"  - /bail-bonds/[county] 404s: {len(bail_bonds_404)}")
print(f"  - /florida-bail-bonds/[county] 404s: {len(florida_bail_bonds_404)}")
print(f"  - Blog/taxonomy 404s: {len(blog_404)}")
print(f"  - Portal query 404s: {len(portal_404)}")
print(f"  - Other 404s: {len(other_404)}")
print(f"Redirect chains (2+ hops): {count_chains}")
print(f"Single redirects (1 hop): {count_single}")
print(f"Canonical mismatches: {count_canonical}")
print(f"Sitemap URLs with redirects: {sitemap_redirecting}")
print(f"Sitemap URLs with 404s: {sitemap_404}")
print(f"Wix bulk import rules generated: {len(deduped_wix)}")

# Return stats for report
stats = {
    "total": total,
    "count_404": count_404,
    "bail_bonds_404": len(bail_bonds_404),
    "florida_bail_bonds_404": len(florida_bail_bonds_404),
    "blog_404": len(blog_404),
    "portal_404": len(portal_404),
    "other_404": len(other_404),
    "count_chains": count_chains,
    "count_single": count_single,
    "count_canonical": count_canonical,
    "count_ok": count_ok,
    "sitemap_redirecting": sitemap_redirecting,
    "sitemap_404": sitemap_404,
    "wix_rules": len(deduped_wix),
    "sitemap_total": len(sitemap_urls),
    "other_404_urls": [r["original_url"] for r in other_404],
    "redirect_single_details": cats["redirect_single"],
    "redirect_chain_details": cats["redirect_chains"],
}

with open(f"{OUTPUT_DIR}/summary_stats.json", "w") as f:
    json.dump(stats, f, indent=2)

print("\nAll files written successfully.")
