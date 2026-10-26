#!/usr/bin/env python3
"""
Post-Cutover SEO Diff
Crawls the published site, compares against docs/seo-baseline/live-2026-10-23.json,
and generates docs/seo-baseline/post-cutover-diff.csv.
Highlights keyword loss, accidental noindex, status drops, and schema regressions.
"""

import os
import sys
import json
import csv
import urllib.request
import urllib.error
from bs4 import BeautifulSoup
from difflib import SequenceMatcher

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def missing_baseline_schema_types(baseline_field, post_types):
    """Type names present before cutover and absent after it."""
    baseline_types = set()
    for part in (baseline_field or "").split(","):
        name = part.strip()
        if name:
            baseline_types.add(name)
    return sorted(baseline_types - set(post_types or []))

def apply_schema_regression(row, missing_types):
    if not missing_types:
        row["schema_diff"] = ""
        return row
    row["schema_diff"] = "MISSING " + ", ".join(missing_types)
    if row.get("risk_flag") in (None, "", "NONE"):
        row["risk_flag"] = "SCHEMA_REGRESSION"
    elif "SCHEMA_REGRESSION" not in row["risk_flag"]:
        row["risk_flag"] = row["risk_flag"] + "|SCHEMA_REGRESSION"
    return row

def main():
    baseline_json = "docs/seo-baseline/live-2026-10-23.json"
    if not os.path.exists(baseline_json):
        print(f"Error: {baseline_json} not found.")
        sys.exit(1)

    with open(baseline_json, "r", encoding="utf-8") as f:
        baseline_items = json.load(f)

    baseline_by_url = {item["url"]: item for item in baseline_items}

    diff_csv_path = "docs/seo-baseline/post-cutover-diff.csv"
    diff_rows = []

    print(f"Auditing {len(baseline_items)} URLs post-cutover...")

    for i, (url, base) in enumerate(baseline_by_url.items(), 1):
        row = {
            "url": url,
            "baseline_status": base.get("http_status"),
            "post_status": None,
            "status_match": "MATCH",
            "baseline_title": base.get("title", ""),
            "post_title": "",
            "title_diff": "",
            "baseline_h1": base.get("h1", ""),
            "post_h1": "",
            "h1_diff": "",
            "baseline_robots": base.get("meta_robots", ""),
            "post_robots": "",
            "noindex_alert": "OK",
            "baseline_canonical": base.get("canonical", ""),
            "post_canonical": "",
            "canonical_match": "MATCH",
            "baseline_json_ld": ", ".join(base.get("json_ld_types", [])),
            "post_json_ld": "",
            "schema_diff": "",
            "risk_flag": "NONE"
        }

        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=15) as res:
                row["post_status"] = res.status
                html = res.read().decode("utf-8", errors="ignore")
        except urllib.error.HTTPError as e:
            row["post_status"] = e.code
            html = ""
        except Exception as e:
            row["post_status"] = 0
            html = ""

        if row["post_status"] != row["baseline_status"]:
            row["status_match"] = f"CHANGED ({row['baseline_status']} -> {row['post_status']})"
            if row["post_status"] in [404, 500, 502, 503]:
                row["risk_flag"] = "CRITICAL_STATUS_DROP"

        if html:
            soup = BeautifulSoup(html, "html.parser")
            if soup.title and soup.title.string:
                row["post_title"] = soup.title.string.strip()

            for m in soup.find_all("meta"):
                name = (m.get("name") or "").lower().strip()
                content = (m.get("content") or "").strip()
                if name == "robots":
                    row["post_robots"] = content

            can_tag = soup.find("link", rel="canonical")
            if can_tag and can_tag.get("href"):
                row["post_canonical"] = can_tag.get("href").strip()

            h1_tags = [h.get_text(separator=" ", strip=True) for h in soup.find_all("h1")]
            row["post_h1"] = h1_tags[0] if h1_tags else ""

            post_json_types = set()
            for s in soup.find_all("script", type="application/ld+json"):
                if not s.string: continue
                try:
                    data = json.loads(s.string)
                    def collect_types(obj):
                        if isinstance(obj, dict):
                            t = obj.get("@type")
                            if isinstance(t, list):
                                for x in t:
                                    if isinstance(x, str): post_json_types.add(x)
                            elif isinstance(t, str): post_json_types.add(t)
                            if "@graph" in obj: collect_types(obj["@graph"])
                        elif isinstance(obj, list):
                            for el in obj: collect_types(el)
                    collect_types(data)
                except: pass
            row["post_json_ld"] = ", ".join(sorted(list(post_json_types)))

            # Check noindex regression
            if "noindex" in row["post_robots"].lower() and "noindex" not in row["baseline_robots"].lower():
                row["noindex_alert"] = "ACCIDENTAL_NOINDEX"
                row["risk_flag"] = "CRITICAL_ACCIDENTAL_NOINDEX"

            # Check canonical mismatch
            if row["post_canonical"] != row["baseline_canonical"]:
                row["canonical_match"] = f"CHANGED ({row['baseline_canonical']} -> {row['post_canonical']})"

            # Check keyword / title drop
            if row["baseline_title"] and row["post_title"]:
                title_sim = SequenceMatcher(None, row["baseline_title"].lower(), row["post_title"].lower()).ratio()
                if title_sim < 0.6:
                    row["title_diff"] = f"Significant Title Change ({title_sim:.2f})"
                    if row["risk_flag"] == "NONE":
                        row["risk_flag"] = "CHECK_TITLE_KEYWORD"

            # Flag schema types the baseline had and the published page dropped.
            apply_schema_regression(
                row,
                missing_baseline_schema_types(row["baseline_json_ld"], post_json_types),
            )

        diff_rows.append(row)

    with open(diff_csv_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "url", "baseline_status", "post_status", "status_match",
            "baseline_title", "post_title", "title_diff",
            "baseline_h1", "post_h1", "h1_diff",
            "baseline_robots", "post_robots", "noindex_alert",
            "baseline_canonical", "post_canonical", "canonical_match",
            "baseline_json_ld", "post_json_ld", "schema_diff", "risk_flag"
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in diff_rows:
            writer.writerow(r)

    print(f"Diff report saved to {diff_csv_path}")

if __name__ == "__main__":
    main()
