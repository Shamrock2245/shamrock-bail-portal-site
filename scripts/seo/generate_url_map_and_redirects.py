#!/usr/bin/env python3
"""
Generate Studio Cutover URL Map & Redirects CSV
Ensures zero lost URLs, resolves redirect chains and loops,
and formats the bulk import file for Wix URL Redirect Manager.
"""

import os
import re
import sys
import json
import csv
import urllib.parse
from collections import defaultdict

ROOT_URL = "https://www.shamrockbailbonds.biz"

KNOWN_REDIRECT_ENTRIES = [
    {"from": "/florida-bail-bonds", "to": "/florida-bail-bonds-1", "reason": "Wix static page cannot share prefix with dynamic router. Mirrors live."},
    {"from": "/florida-counties", "to": "/florida-bail-bonds-1", "reason": "Legacy directory alias."},
    {"from": "/home", "to": "/", "reason": "Normalize homepage."},
    {"from": "/how-to-become-a-bondsman", "to": "/bail-school#become-a-bondsman", "reason": "Consolidated bail school career section."},
    {"from": "/florida-bail-bonds-lee", "to": "/florida-bail-bonds/lee", "reason": "County slug normalization."},
    {"from": "/lee-county-bail-bonds", "to": "/florida-bail-bonds/lee", "reason": "County slug normalization."},
    {"from": "/fort-myers-bail-bonds", "to": "/florida-bail-bonds/fort-myers", "reason": "City landing page slug."},
    {"from": "/portal-landing-1", "to": "/portal-landing", "reason": "Duplicate portal slug cleanup."},
    {"from": "/portal-landing-2", "to": "/portal-landing", "reason": "Duplicate portal slug cleanup."},
    {"from": "/bail-school-1", "to": "/bail-school", "reason": "Duplicate bail school slug cleanup."},
    {"from": "/locations", "to": "/florida-bail-bonds-1", "reason": "County locations directory alias."},
    {"from": "/portal-staff", "to": "/portal-landing", "reason": "Staff portal retired; shamrock-leads is the only staff tool."},
    {"from": "/terms", "to": "/terms-and-conditions", "reason": "Short URL alias."},
    {"from": "/terms-of-use", "to": "/terms-and-conditions", "reason": "Standard legal alias."},
    {"from": "/terms-of-service", "to": "/terms-and-conditions", "reason": "Standard legal alias."},
    {"from": "/first-appearance-hub", "to": "/first-appearance", "reason": "Old first appearance hub slug."},
    {"from": "/login", "to": "/portal-landing", "reason": "User login alias."},
    {"from": "/portal", "to": "/portal-landing", "reason": "Short portal alias."},
    {"from": "/members", "to": "/portal-landing", "reason": "Wix members default alias."},
    {"from": "/member-area", "to": "/portal-landing", "reason": "Wix member area alias."},
    {"from": "/start-bail-paperwork", "to": "/portal-landing", "reason": "Intake portal entry point."},
    {"from": "/testimonials-1", "to": "/testimonials", "reason": "Duplicate testimonials page cleanup."},
    {"from": "/copy-of-home", "to": "/", "reason": "Template artifact slug cleanup."}
]

TODO_ENTRIES = [
    {"from": "/make-a-payment", "to": "TODO-VERIFY (SwipeSimple external payment link or /portal-indemnitor)", "reason": "Awaiting Brendan decision: direct SwipeSimple link vs portal payment"},
    {"from": "/payment", "to": "TODO-VERIFY (SwipeSimple external payment link or /portal-indemnitor)", "reason": "Awaiting Brendan decision: direct SwipeSimple link vs portal payment"},
    {"from": "/espanol", "to": "TODO-VERIFY (/ or dedicated Spanish landing page)", "reason": "Awaiting Brendan decision: redirect to homepage vs Spanish landing"},
    {"from": "/spanish", "to": "TODO-VERIFY (/ or dedicated Spanish landing page)", "reason": "Awaiting Brendan decision: redirect to homepage vs Spanish landing"}
]

COUNTY_SUFFIX_REASON = (
    "County suffix alias from DASHBOARD_URL_REDIRECTS. 301 to the live county page."
)
PUBLISH_TIME_NOTE = "remove page at publish time (Brendan publishes)"
FRAGMENT_FALLBACK = "FALLBACK: use /bail-school if Wix Redirect Manager rejects the fragment."
MY_ORDERS_NOTE = "Unmapped target to verify: /myorders. Do not guess a new target."

def load_florida_county_slugs(path="src/backend/seo-redirects.js"):
    """Same 67 slugs as FLORIDA_COUNTY_SLUGS / DASHBOARD_URL_REDIRECTS."""
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    match = re.search(r"export const FLORIDA_COUNTY_SLUGS = \[(.*?)\];", text, re.S)
    if not match:
        raise SystemExit(f"Could not read FLORIDA_COUNTY_SLUGS from {path}")
    slugs = re.findall(r"'([^']+)'", match.group(1))
    if len(slugs) != 67 or len(set(slugs)) != 67:
        raise SystemExit(f"Expected 67 unique Florida county slugs, found {len(slugs)}")
    return slugs

def append_note(reason, note):
    reason = (reason or "").rstrip()
    if note in reason:
        return reason
    if not reason.endswith("."):
        reason += "."
    return reason + " " + note

def apply_redirect_notes(from_path, reason):
    """Notes the Wix import CSV cannot store (it has only Old URL, New URL)."""
    if from_path in ("/home", "/portal-staff"):
        return append_note(reason, PUBLISH_TIME_NOTE)
    if from_path in ("/how-to-become-a-bondsman", "/become-a-bondsman"):
        return append_note(reason, FRAGMENT_FALLBACK)
    if from_path == "/my-orders":
        return append_note(reason, MY_ORDERS_NOTE)
    return reason

def load_blog_dedupe_redirects(path="docs/blog-dedupe.csv"):
    """301s for duplicate posts marked 'add 301' in the dedupe audit.

    Unpublishing those URLs without a redirect would turn indexed posts into 404s.
    """
    entries = []
    if not os.path.exists(path):
        print(f"WARNING: {path} not found. Duplicate blog 301s will be missing.")
        return entries
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            action = (row.get("action") or "").lower()
            if "add 301" not in action:
                continue
            src = normalize_path(row.get("duplicate_url") or "")
            dest = normalize_path(row.get("canonical_url") or "")
            if not src or src == dest:
                continue
            group_id = (row.get("group_id") or "").strip()
            entries.append({
                "from": src,
                "to": dest,
                "reason": f"Blog dedupe {group_id}: 301 duplicate to canonical before unpublish".strip(),
            })
    return entries

def normalize_path(path):
    if not path:
        return "/"
    p = path.strip()
    if p.startswith("http://") or p.startswith("https://"):
        parsed = urllib.parse.urlparse(p)
        p = parsed.path
    if not p.startswith("/"):
        p = "/" + p
    if p != "/" and p.endswith("/"):
        p = p[:-1]
    return p

def main():
    json_path = "docs/seo-baseline/live-2026-10-23.json"
    redirects_csv_path = "docs/seo-baseline/live-redirects.csv"

    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found. Please wait for crawl to finish.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        baseline_data = json.load(f)

    print(f"Loaded {len(baseline_data)} baseline pages from crawl.")

    # Load existing Wix redirects
    existing_redirects = []
    if os.path.exists(redirects_csv_path):
        with open(redirects_csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_redirects.append({
                    "from": normalize_path(row["from"]),
                    "to": normalize_path(row["to"]),
                    "reason": f"Existing Wix redirect ({row.get('source', 'REDIRECTOR')})"
                })
    print(f"Loaded {len(existing_redirects)} existing redirects.")

    # Combine redirect maps
    raw_redirect_map = {} # from_path -> (to_path, reason)
    for r in existing_redirects:
        raw_redirect_map[r["from"]] = (r["to"], r["reason"])

    for k in KNOWN_REDIRECT_ENTRIES:
        raw_redirect_map[normalize_path(k["from"])] = (normalize_path(k["to"]), k["reason"])

    # Dedupe 301s win over a crawled "keep" so unpublishing a duplicate cannot 404 it.
    blog_dedupe_redirects = load_blog_dedupe_redirects()
    for k in blog_dedupe_redirects:
        raw_redirect_map[k["from"]] = (k["to"], k["reason"])
    print(f"Loaded {len(blog_dedupe_redirects)} blog-dedupe 301s.")

    # /bail-bonds/{slug}-county 404s before the Velo router. The dashboard
    # redirect list is the source for the live /florida-bail-bonds/{slug} target.
    county_suffix = 0
    for slug in load_florida_county_slugs():
        raw_redirect_map["/bail-bonds/" + slug + "-county"] = (
            "/florida-bail-bonds/" + slug,
            COUNTY_SUFFIX_REASON,
        )
        county_suffix += 1
    print(f"Added {county_suffix} county-suffix 301s.")

    # Resolve redirect chains and check loops
    resolved_redirects = {} # from_path -> (final_to_path, reason)
    for from_p, (to_p, reason) in raw_redirect_map.items():
        curr = to_p
        visited = [from_p]
        chain_detected = False
        while curr in raw_redirect_map and curr != "/":
            if curr in visited:
                print(f"WARNING: Loop detected for {from_p} -> {curr}")
                break
            visited.append(curr)
            curr = raw_redirect_map[curr][0]
            chain_detected = True
        
        final_reason = reason
        if chain_detected:
            final_reason += f" (Resolved chain: {' -> '.join(visited)})"
        resolved_redirects[from_p] = (curr, final_reason)

    for from_p, (to_p, reason) in list(resolved_redirects.items()):
        resolved_redirects[from_p] = (to_p, apply_redirect_notes(from_p, reason))

    print(f"Total resolved redirects: {len(resolved_redirects)}")

    # Build master URL map
    # Columns: old_url, studio_url, action (keep|301|noindex|retire), reason, protected (y/n), clicks, impressions
    url_map_rows = []

    # 1. Live crawled URLs
    crawled_paths = set()
    for item in baseline_data:
        url = item["url"]
        path = normalize_path(url)
        crawled_paths.add(path)
        status = item.get("http_status")
        robots = item.get("meta_robots", "")

        is_protected = "y" if status == 200 else "n"

        if path in resolved_redirects:
            dest, reason = resolved_redirects[path]
            url_map_rows.append({
                "old_url": f"{ROOT_URL}{path}" if path != "/" else ROOT_URL,
                "studio_url": f"{ROOT_URL}{dest}" if dest != "/" else ROOT_URL,
                "action": "301",
                "reason": reason,
                "protected": is_protected,
                "clicks": 0,
                "impressions": 0
            })
        elif "noindex" in robots.lower() or path in ["/portal-defendant", "/portal-indemnitor", "/portal-staff"]:
            url_map_rows.append({
                "old_url": f"{ROOT_URL}{path}" if path != "/" else ROOT_URL,
                "studio_url": f"{ROOT_URL}{path}" if path != "/" else ROOT_URL,
                "action": "noindex" if "portal" in path else "keep",
                "reason": "Member/portal surface or existing noindex rule",
                "protected": is_protected,
                "clicks": 0,
                "impressions": 0
            })
        else:
            url_map_rows.append({
                "old_url": f"{ROOT_URL}{path}" if path != "/" else ROOT_URL,
                "studio_url": f"{ROOT_URL}{path}" if path != "/" else ROOT_URL,
                "action": "keep",
                "reason": f"Active public {item['page_type']} page. Preserves exact path.",
                "protected": is_protected,
                "clicks": 0,
                "impressions": 0
            })

    # 2. Add redirected paths that were not crawled as active 200s
    for from_p, (to_p, reason) in sorted(resolved_redirects.items()):
        if from_p not in crawled_paths:
            url_map_rows.append({
                "old_url": f"{ROOT_URL}{from_p}",
                "studio_url": f"{ROOT_URL}{to_p}" if to_p != "/" else ROOT_URL,
                "action": "301",
                "reason": reason,
                "protected": "y", # Protect all known historical URLs
                "clicks": 0,
                "impressions": 0
            })

    # 3. Add TODO entries for Brendan
    for todo in TODO_ENTRIES:
        url_map_rows.append({
            "old_url": f"{ROOT_URL}{todo['from']}",
            "studio_url": todo["to"],
            "action": "TODO-VERIFY",
            "reason": todo["reason"],
            "protected": "y",
            "clicks": 0,
            "impressions": 0
        })

    # Write docs/studio-cutover-url-map.csv
    url_map_path = "docs/studio-cutover-url-map.csv"
    with open(url_map_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["old_url", "studio_url", "action", "reason", "protected", "clicks", "impressions"],
            lineterminator="\n",
        )
        writer.writeheader()
        for r in url_map_rows:
            writer.writerow(r)
    print(f"Saved master URL map to {url_map_path} ({len(url_map_rows)} rows)")

    # Write docs/studio-cutover-redirects.csv for Wix URL Redirect Manager bulk import
    # Format: Old URL, New URL (only 301 actions)
    redirects_import_path = "docs/studio-cutover-redirects.csv"
    redirect_count = 0
    with open(redirects_import_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(["Old URL", "New URL"])
        for from_p, (to_p, reason) in sorted(resolved_redirects.items()):
            # Wix bulk import takes relative paths
            writer.writerow([from_p, to_p])
            redirect_count += 1
    print(f"Saved Wix bulk import redirects to {redirects_import_path} ({redirect_count} redirects)")

    # Build internal links fix list for Grok Bot
    # Check if any crawled page contains internal links to a path that is in resolved_redirects
    broken_links = defaultdict(list)
    for item in baseline_data:
        src = item["url"]
        for target in item.get("internal_links_out", []):
            t_path = normalize_path(target)
            if t_path in resolved_redirects:
                final_dest, _ = resolved_redirects[t_path]
                broken_links[src].append((t_path, final_dest))

    fix_list_path = "docs/studio-internal-links-to-fix.md"
    with open(fix_list_path, "w", encoding="utf-8") as f:
        f.write("# Internal Links to Fix in Wix Studio Canvas\n\n")
        f.write("> **Directive for Grok Bot:** Every internal link on the Studio site must point directly to the FINAL canonical URL, never through a 301 redirect.\n\n")
        f.write(f"- **Total Pages with Outdated Internal Links**: {len(broken_links)}\n\n")
        
        if not broken_links:
            f.write("All crawled internal links already point directly to final canonical destinations!\n")
        else:
            for page, link_fixes in sorted(broken_links.items()):
                f.write(f"### Page: `{page}`\n")
                f.write("| Current Link on Page | Must Change To (Final Canonical URL) |\n")
                f.write("|---|---|\n")
                for old_link, new_dest in set(link_fixes):
                    f.write(f"| `{old_link}` | `{new_dest}` |\n")
                f.write("\n")

    print(f"Saved internal link fix instructions to {fix_list_path}")

if __name__ == "__main__":
    main()
