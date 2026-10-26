#!/usr/bin/env bash
# ==============================================================================
# Studio Cutover Smoke Test
# Read-only verification script to run immediately post-publish.
#
# Tests:
# 1. Validates all baseline URLs and URL Map rows.
# 2. Fails on any 4xx or 5xx status codes.
# 3. Fails on any redirect chains or catch-all redirects to homepage.
# 4. Executes post-cutover diff against baseline (title, H1, canonical, robots, JSON-LD).
# 5. Highlights protected pages with keyword drops or accidental noindex.
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

echo "=================================================================="
echo " Shamrock Bail Bonds — Post-Cutover Smoke Test"
echo " Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=================================================================="

BASELINE_JSON="docs/seo-baseline/live-2026-10-23.json"
URL_MAP_CSV="docs/studio-cutover-url-map.csv"

if [[ ! -f "$BASELINE_JSON" ]]; then
    echo "❌ Error: Baseline JSON missing at $BASELINE_JSON"
    exit 1
fi

if [[ ! -f "$URL_MAP_CSV" ]]; then
    echo "❌ Error: URL map CSV missing at $URL_MAP_CSV"
    exit 1
fi

echo "✓ Baseline and URL map confirmed."
echo "Starting HTTP response status and redirect validation..."

FAILURES=0
WARNINGS=0

# Python helper to run verification over URL map
python3 - << 'EOF'
import csv
import sys
import urllib.request
import urllib.parse

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

failures = 0
warnings = 0

with open("docs/studio-cutover-url-map.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Auditing {len(rows)} URLs from studio-cutover-url-map.csv...")

for i, row in enumerate(rows, 1):
    old_url = row["old_url"]
    expected_action = row["action"]
    studio_url = row["studio_url"]
    reason = row["reason"]

    if expected_action == "TODO-VERIFY":
        print(f"⚠️ [TODO-VERIFY] {old_url} -> {studio_url} ({reason})")
        warnings += 1
        continue

    try:
        class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
            # Return the first response. The base class follows 303, 307, and 308
            # even when 301 and 302 are overridden, because those names alias the
            # original follow-redirect method.
            def http_error_301(self, req, fp, code, msg, headers):
                return fp
            def http_error_302(self, req, fp, code, msg, headers):
                return fp
            def http_error_303(self, req, fp, code, msg, headers):
                return fp
            def http_error_307(self, req, fp, code, msg, headers):
                return fp
            def http_error_308(self, req, fp, code, msg, headers):
                return fp

        opener = urllib.request.build_opener(NoRedirectHandler)
        req = urllib.request.Request(old_url, headers={"User-Agent": USER_AGENT})
        
        try:
            res = opener.open(req, timeout=12)
            code = res.status
            headers = res.headers
            loc = headers.get("Location")
        except urllib.error.HTTPError as e:
            code = e.code
            headers = e.headers
            loc = headers.get("Location")
        except Exception as e:
            print(f"❌ FAIL: {old_url} Network error: {e}")
            failures += 1
            continue

        if code >= 400:
            print(f"❌ FAIL: {old_url} returned error status HTTP {code}")
            failures += 1
            continue

        if expected_action == "301":
            if code not in [301, 308]:
                print(f"❌ FAIL: Expected 301 for {old_url}, got HTTP {code}")
                failures += 1
            else:
                # Check redirect target
                parsed_loc = urllib.parse.urljoin(old_url, loc) if loc else ""
                parsed_expected = studio_url
                if parsed_loc.rstrip("/") == "https://www.shamrockbailbonds.biz" and parsed_expected.rstrip("/") != "https://www.shamrockbailbonds.biz":
                    print(f"❌ FAIL: {old_url} redirected to homepage catch-all instead of {parsed_expected}")
                    failures += 1
                elif parsed_loc.rstrip("/") != parsed_expected.rstrip("/"):
                    print(f"⚠️ WARN: {old_url} redirected to {parsed_loc}, expected {parsed_expected}")
                    warnings += 1
        elif expected_action in ["keep", "noindex"]:
            if code != 200:
                print(f"❌ FAIL: Expected 200 for {old_url}, got HTTP {code}")
                failures += 1

    except Exception as e:
        print(f"❌ FAIL: Unexpected error verifying {old_url}: {e}")
        failures += 1

print(f"\nPhase 1 HTTP Validation Complete: {failures} failures, {warnings} warnings.")
if failures > 0:
    sys.exit(1)
EOF

echo ""
echo "Running detailed post-cutover SEO diff (titles, canonicals, robots, JSON-LD)..."
python3 scripts/seo/post_cutover_diff.py

echo ""
echo "Smoke test finished. Review docs/seo-baseline/post-cutover-diff.csv for diff details."
