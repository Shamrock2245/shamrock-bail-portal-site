#!/usr/bin/env python3
"""
Phase 4: Post-Fix Validation
- Re-crawl top priority pages (County, City, Contact, Home) to ensure clean 200s
- Verify redirect rules are working correctly
- Generate GSC re-indexing guidance
"""

import requests
import json
import csv
import time
from urllib.parse import urlparse

OUTPUT_DIR = "/home/ubuntu/redirect_audit"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ShamrockAuditBot/1.0; +https://shamrockbailbonds.biz)",
}

# Priority pages to validate
PRIORITY_PAGES = [
    # Core pages
    ("Home", "https://www.shamrockbailbonds.biz/"),
    ("How Bail Works", "https://www.shamrockbailbonds.biz/how-bail-works"),
    ("How to Become a Bondsman", "https://www.shamrockbailbonds.biz/how-to-become-a-bondsman"),
    ("Contact", "https://www.shamrockbailbonds.biz/contact"),
    ("About", "https://www.shamrockbailbonds.biz/about"),
    ("Blog", "https://www.shamrockbailbonds.biz/blog"),
    ("Terms of Service", "https://www.shamrockbailbonds.biz/terms-of-service"),
    ("Testimonials", "https://www.shamrockbailbonds.biz/testimonials"),
    
    # Portal pages
    ("Portal Landing", "https://www.shamrockbailbonds.biz/portal-landing"),
    ("Portal Indemnitor", "https://www.shamrockbailbonds.biz/portal-indemnitor"),
    ("Portal Defendant", "https://www.shamrockbailbonds.biz/portal-defendant"),
    
    # Key county pages (top markets)
    ("Lee County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/lee"),
    ("Collier County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/collier"),
    ("Charlotte County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/charlotte"),
    ("Sarasota County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/sarasota"),
    ("Manatee County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/manatee"),
    ("Hillsborough County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/hillsborough"),
    ("Miami-Dade County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/miami-dade"),
    ("Broward County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/broward"),
    ("Palm Beach County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/palmbeach"),
    ("Orange County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/orange"),
    ("Duval County", "https://www.shamrockbailbonds.biz/florida-bail-bonds/duval"),
    
    # Previously broken pages (should now redirect)
    ("OLD: /bail-bonds/hendry", "https://www.shamrockbailbonds.biz/bail-bonds/hendry"),
    ("OLD: /bail-bonds/pinellas", "https://www.shamrockbailbonds.biz/bail-bonds/pinellas"),
    ("OLD: /bail-bonds/stlucie", "https://www.shamrockbailbonds.biz/bail-bonds/stlucie"),
    ("OLD: /bail-online", "https://www.shamrockbailbonds.biz/bail-online"),
    ("OLD: /blank-3", "https://www.shamrockbailbonds.biz/blank-3"),
    ("OLD: /blank", "https://www.shamrockbailbonds.biz/blank"),
    ("OLD: /home-1", "https://www.shamrockbailbonds.biz/home-1"),
]

session = requests.Session()
session.headers.update(HEADERS)

def check_url(name, url):
    """Check a URL and return its status."""
    chain = []
    current = url
    
    for _ in range(10):
        try:
            resp = session.get(current, allow_redirects=False, timeout=15)
            status = resp.status_code
            
            if 300 <= status < 400 and 'Location' in resp.headers:
                next_url = resp.headers['Location']
                if next_url.startswith('/'):
                    p = urlparse(current)
                    next_url = f"{p.scheme}://{p.netloc}{next_url}"
                chain.append({"url": current, "status": status, "target": next_url})
                current = next_url
            else:
                return {
                    "name": name,
                    "original_url": url,
                    "final_url": current,
                    "final_status": status,
                    "hops": len(chain),
                    "chain": chain,
                    "result": get_result(status, len(chain), name),
                }
        except Exception as e:
            return {
                "name": name,
                "original_url": url,
                "final_url": current,
                "final_status": None,
                "hops": len(chain),
                "chain": chain,
                "result": f"ERROR: {e}",
            }
    
    return {
        "name": name,
        "original_url": url,
        "final_url": current,
        "final_status": None,
        "hops": len(chain),
        "chain": chain,
        "result": "Too many redirects",
    }


def get_result(status, hops, name):
    if status == 200 and hops == 0:
        return "PASS - Clean 200"
    elif status == 200 and hops == 1:
        if name.startswith("OLD:"):
            return "PASS - Correctly redirects (1 hop)"
        return "WARN - Unexpected redirect (1 hop)"
    elif status == 200 and hops >= 2:
        return "WARN - Redirect chain (needs cleanup)"
    elif status == 404:
        return "FAIL - 404 Not Found"
    elif status == 301 or status == 302:
        return f"INFO - Redirects ({status})"
    else:
        return f"WARN - HTTP {status}"


print("=== PHASE 4: POST-FIX VALIDATION ===\n")
print(f"Checking {len(PRIORITY_PAGES)} priority pages...\n")

results = []
for name, url in PRIORITY_PAGES:
    result = check_url(name, url)
    results.append(result)
    status_icon = "✓" if "PASS" in result["result"] else ("✗" if "FAIL" in result["result"] else "⚠")
    print(f"  {status_icon} [{result['final_status']}] {name}")
    if result['hops'] > 0:
        print(f"      → {result['hops']} hop(s) → {result['final_url']}")
    time.sleep(0.2)

# Summary
passes = sum(1 for r in results if "PASS" in r["result"])
fails = sum(1 for r in results if "FAIL" in r["result"])
warns = sum(1 for r in results if "WARN" in r["result"])

print(f"\n=== VALIDATION SUMMARY ===")
print(f"  PASS: {passes}/{len(results)}")
print(f"  FAIL: {fails}/{len(results)}")
print(f"  WARN: {warns}/{len(results)}")

# Write CSV
with open(f"{OUTPUT_DIR}/phase4_validation.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "original_url", "final_url", "final_status", "hops", "result"])
    writer.writeheader()
    for r in results:
        writer.writerow({
            "name": r["name"],
            "original_url": r["original_url"],
            "final_url": r["final_url"],
            "final_status": r["final_status"],
            "hops": r["hops"],
            "result": r["result"],
        })

# Save JSON
with open(f"{OUTPUT_DIR}/phase4_validation.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nFiles written: phase4_validation.csv, phase4_validation.json")
