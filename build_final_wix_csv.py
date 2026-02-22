#!/usr/bin/env python3
"""
Build the definitive Wix bulk redirect import CSV.
All /bail-bonds/[county] → /florida-bail-bonds/[county] (since all FBB pages are 200)
All /[county] → /florida-bail-bonds/[county] (since county pages don't exist at root)
Legacy blank/home pages → correct targets
"""

import json
import csv
from urllib.parse import urlparse

OUTPUT_DIR = "/home/ubuntu/redirect_audit"
REPO_DIR = "/home/ubuntu/shamrock-bail-portal-site"

with open(f"{OUTPUT_DIR}/crawl_results_raw.json") as f:
    raw = json.load(f)

# Build set of existing /florida-bail-bonds/ pages
fbb_200 = set()
for r in raw:
    if '/florida-bail-bonds/' in r['original_url'] and r['final_status'] == 200:
        county = r['original_url'].split('/florida-bail-bonds/')[-1].rstrip('/')
        fbb_200.add(county)

print(f"Active /florida-bail-bonds/ pages: {len(fbb_200)}")

# Slug normalization map: hyphenated/alternate → canonical FBB slug
SLUG_MAP = {
    'indian-river': 'indianriver',
    'palm-beach': 'palmbeach',
    'st-johns': 'stjohns',
    'st-lucie': 'stlucie',
    'stlucie': 'stlucie',
    'miami-dade': 'miami-dade',  # already correct
    'santa-rosa': 'santa-rosa',  # already correct
}

def resolve_county_slug(slug):
    """Resolve a county slug to its canonical FBB path slug."""
    return SLUG_MAP.get(slug, slug)

# Skip patterns - these should NOT have redirect rules
SKIP_PATTERNS = [
    "portal-landing?county=",
    "/blog/hashtags/",
    "/blog/tags/",
    "/blog/archive/",
    "/blog/page/",
    "/_api/",
    "/_functions/",
    "/product-page/",
    "/florida-bail-bonds/",  # These are the targets, not sources
    "/single-post/",         # Blog posts - let them 404 naturally or be fixed in Wix
    "/blog/categories/",
]

# Build redirect rules
redirect_rules = []
seen = set()

def add_rule(old_path, new_url):
    if old_path not in seen and old_path != new_url and old_path != '/':
        seen.add(old_path)
        redirect_rules.append({"Old URL": old_path, "New URL": new_url})

for r in raw:
    url = r['original_url']
    final_status = r['final_status']
    hops = r['hops']
    chain = r.get('chain', [])
    
    # Skip if matches any skip pattern
    if any(p in url for p in SKIP_PATTERNS):
        continue
    
    parsed = urlparse(url)
    path = parsed.path
    if parsed.query:
        path += f"?{parsed.query}"
    
    # Skip root
    if not path or path == '/':
        continue
    
    # Case 1: /bail-bonds/[county] → /florida-bail-bonds/[county]
    if '/bail-bonds/' in path:
        county_raw = path.split('/bail-bonds/')[-1].rstrip('/')
        county = resolve_county_slug(county_raw)
        if county in fbb_200:
            add_rule(path, f"/florida-bail-bonds/{county}")
        else:
            add_rule(path, "/")
    
    # Case 2: /[county-name] 404s → /florida-bail-bonds/[county]
    elif final_status == 404 and path.count('/') == 1:
        county_slug_raw = path.lstrip('/')
        county_slug = resolve_county_slug(county_slug_raw)
        
        # Check if this county exists in florida-bail-bonds
        if county_slug in fbb_200:
            add_rule(path, f"/florida-bail-bonds/{county_slug}")
        else:
            # Map known missing pages to relevant destinations
            target_map = {
                'faq': '/how-bail-works',
                'florida-sheriffs-clerks': '/florida-bail-bonds',
                'florida-sheriffs': '/florida-bail-bonds',
                'florida-clerks': '/florida-bail-bonds',
                'bail-bonds': '/florida-bail-bonds',
                'members': '/portal-landing',
                'member-area': '/portal-landing',
                'login': '/portal-landing',
                'start-bail-paperwork': '/portal-landing',
                'bail-school': '/how-to-become-a-bondsman',
                'become-a-bondsman': '/how-to-become-a-bondsman',
                'services': '/',
                'payment': '/',
                'pay-online': '/',
                'sitemap': '/',
                'terms': '/terms-of-service',
            }
            target = target_map.get(county_slug_raw, '/')
            add_rule(path, target)
    
    # Case 3: Multi-hop redirect chains → collapse to single hop
    elif hops >= 2:
        final_url = r['final_url']
        if final_url and 'shamrockbailbonds.biz' in final_url:
            new_path = urlparse(final_url).path
            add_rule(path, new_path)
        elif final_url:
            add_rule(path, final_url)
    
    # Case 4: Existing single 301s that redirect to homepage but should go to county page
    elif hops == 1 and chain:
        if '/bail-bonds/' in path:
            county_raw = path.split('/bail-bonds/')[-1].rstrip('/')
            county = resolve_county_slug(county_raw)
            if county in fbb_200:
                add_rule(path, f"/florida-bail-bonds/{county}")
            else:
                add_rule(path, "/")
        # Legacy blank pages - already correct, no override needed

# Sort by Old URL for readability
redirect_rules.sort(key=lambda x: x["Old URL"])

print(f"Total redirect rules: {len(redirect_rules)}")

# Write to output dir
with open(f"{OUTPUT_DIR}/wix_bulk_redirects_FINAL.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Old URL", "New URL"])
    writer.writeheader()
    writer.writerows(redirect_rules)

# Write to repo
with open(f"{REPO_DIR}/wix_bulk_redirects_FINAL.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Old URL", "New URL"])
    writer.writeheader()
    writer.writerows(redirect_rules)

print("Written to output dir and repo.")

# Print summary by category
bail_bonds_rules = [r for r in redirect_rules if r['Old URL'].startswith('/bail-bonds/')]
county_root_rules = [r for r in redirect_rules if not r['Old URL'].startswith('/bail-bonds/') and r['New URL'].startswith('/florida-bail-bonds/')]
other_rules = [r for r in redirect_rules if r not in bail_bonds_rules and r not in county_root_rules]

print(f"\nBreakdown:")
print(f"  /bail-bonds/[county] → /florida-bail-bonds/[county]: {len(bail_bonds_rules)}")
print(f"  /[county] → /florida-bail-bonds/[county]: {len(county_root_rules)}")
print(f"  Other redirects: {len(other_rules)}")
for r in other_rules:
    print(f"    {r['Old URL']} → {r['New URL']}")
