#!/usr/bin/env python3
"""
SEO Auditor for Shamrock Bail Bonds
=====================================
Crawls every page and audits:
  - Title tags, meta descriptions, canonical URLs
  - Robots meta tags, Open Graph tags
  - JSON-LD structured data validity
  - County-specific schemas (LocalBusiness, FAQ, Service, Breadcrumb)

Usage:
  python3 scripts/seo/seo_auditor.py [--sample N] [--output-dir DIR]

Output:
  - seo_audit_report.md    (Full markdown report)
  - seo_audit_results.csv  (Machine-readable results)
"""

import csv
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import List, Optional, Dict
from urllib.parse import urljoin
import requests

# ─── Configuration ────────────────────────────────────────────────────────────
SITE_URL = "https://www.shamrockbailbonds.biz"
PHONE = "+1-239-332-2245"
MAX_WORKERS = 5  # Concurrent requests
REQUEST_TIMEOUT = 20

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

STATIC_PAGES = [
    "/", "/about", "/contact", "/how-bail-works",
    "/how-to-become-a-bondsman", "/blog", "/testimonials",
    "/terms-of-service", "/privacy-policy"
]


# ─── HTML Parser ──────────────────────────────────────────────────────────────
class SEOHTMLParser(HTMLParser):
    """Parse HTML to extract SEO-relevant elements."""
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False
        self.meta_description = ""
        self.canonical = ""
        self.robots = ""
        self.og_tags: Dict[str, str] = {}
        self.json_ld: List[dict] = []
        self._current_script_type = None
        self._script_data = ""
        self.h1_texts: List[str] = []
        self.in_h1 = False
        self._h1_buf = ""

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "h1":
            self.in_h1 = True
            self._h1_buf = ""
        elif tag == "meta":
            name = attr.get("name", "").lower()
            prop = attr.get("property", "").lower()
            content = attr.get("content", "")
            if name == "description":
                self.meta_description = content
            elif name == "robots":
                self.robots = content
            elif prop.startswith("og:"):
                self.og_tags[prop] = content
        elif tag == "link":
            rel = attr.get("rel", "")
            if rel == "canonical":
                self.canonical = attr.get("href", "")
        elif tag == "script":
            stype = attr.get("type", "")
            if stype == "application/ld+json":
                self._current_script_type = "ld+json"
                self._script_data = ""

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        elif tag == "h1":
            self.in_h1 = False
            if self._h1_buf.strip():
                self.h1_texts.append(self._h1_buf.strip())
        elif tag == "script" and self._current_script_type == "ld+json":
            self._current_script_type = None
            try:
                data = json.loads(self._script_data)
                if isinstance(data, list):
                    self.json_ld.extend(data)
                else:
                    self.json_ld.append(data)
            except json.JSONDecodeError:
                pass

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_h1:
            self._h1_buf += data
        if self._current_script_type == "ld+json":
            self._script_data += data


# ─── Data Classes ─────────────────────────────────────────────────────────────
@dataclass
class AuditResult:
    url: str
    page_type: str  # static, county, blog
    status_code: int = 0
    load_time_ms: int = 0
    title: str = ""
    title_length: int = 0
    meta_description: str = ""
    desc_length: int = 0
    canonical: str = ""
    robots: str = ""
    h1_count: int = 0
    og_title: bool = False
    og_description: bool = False
    og_image: bool = False
    og_url: bool = False
    json_ld_count: int = 0
    json_ld_types: str = ""
    has_local_business: bool = False
    has_faq: bool = False
    has_breadcrumb: bool = False
    has_service: bool = False
    has_organization: bool = False
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


# ─── Auditor ──────────────────────────────────────────────────────────────────
def audit_page(url: str, page_type: str) -> AuditResult:
    """Audit a single page for SEO issues."""
    result = AuditResult(url=url, page_type=page_type)

    try:
        start = time.time()
        resp = requests.get(url, timeout=REQUEST_TIMEOUT, headers={
            "User-Agent": "ShamrockSEOAuditor/1.0"
        })
        result.load_time_ms = int((time.time() - start) * 1000)
        result.status_code = resp.status_code

        if resp.status_code != 200:
            result.errors.append(f"HTTP {resp.status_code}")
            return result

        html = resp.text
        parser = SEOHTMLParser()
        parser.feed(html)

        # Title
        result.title = parser.title.strip()
        result.title_length = len(result.title)
        if not result.title:
            result.errors.append("Missing <title>")
        elif result.title_length < 30:
            result.warnings.append(f"Title too short ({result.title_length} chars)")
        elif result.title_length > 65:
            result.warnings.append(f"Title too long ({result.title_length} chars)")

        # Meta description
        result.meta_description = parser.meta_description
        result.desc_length = len(result.meta_description)
        if not result.meta_description:
            result.errors.append("Missing meta description")
        elif result.desc_length < 50:
            result.warnings.append(f"Meta desc too short ({result.desc_length} chars)")
        elif result.desc_length > 160:
            result.warnings.append(f"Meta desc too long ({result.desc_length} chars)")

        # Canonical
        result.canonical = parser.canonical
        if not result.canonical:
            result.warnings.append("Missing canonical URL")
        elif result.canonical != url and result.canonical != url.rstrip("/"):
            result.warnings.append(f"Canonical mismatch: {result.canonical}")

        # Robots
        result.robots = parser.robots
        if "noindex" in result.robots.lower():
            result.errors.append("Page is set to noindex!")

        # H1
        result.h1_count = len(parser.h1_texts)
        if result.h1_count == 0:
            result.warnings.append("No H1 tag found")
        elif result.h1_count > 1:
            result.warnings.append(f"Multiple H1 tags ({result.h1_count})")

        # OG tags
        result.og_title = "og:title" in parser.og_tags
        result.og_description = "og:description" in parser.og_tags
        result.og_image = "og:image" in parser.og_tags
        result.og_url = "og:url" in parser.og_tags
        missing_og = []
        if not result.og_title: missing_og.append("og:title")
        if not result.og_description: missing_og.append("og:description")
        if not result.og_image: missing_og.append("og:image")
        if missing_og:
            result.warnings.append(f"Missing OG tags: {', '.join(missing_og)}")

        # JSON-LD
        all_types = []
        for schema in parser.json_ld:
            schema_type = schema.get("@type", "")
            if isinstance(schema_type, list):
                all_types.extend(schema_type)
            else:
                all_types.append(schema_type)

            # Check @graph
            if "@graph" in schema:
                for item in schema["@graph"]:
                    t = item.get("@type", "")
                    if isinstance(t, list):
                        all_types.extend(t)
                    else:
                        all_types.append(t)

        result.json_ld_count = len(parser.json_ld)
        result.json_ld_types = ", ".join(set(all_types)) if all_types else ""
        result.has_organization = "Organization" in all_types
        result.has_local_business = any(t in all_types for t in ["LocalBusiness", "BailBondBusiness"])
        result.has_faq = "FAQPage" in all_types
        result.has_breadcrumb = "BreadcrumbList" in all_types
        result.has_service = "Service" in all_types

        if not all_types:
            result.warnings.append("No JSON-LD structured data")

        # County-specific checks
        if page_type == "county":
            if not result.has_local_business:
                result.errors.append("Missing LocalBusiness schema (county page)")
            if not result.has_faq:
                result.warnings.append("Missing FAQPage schema (county page)")
            if not result.has_breadcrumb:
                result.warnings.append("Missing BreadcrumbList schema (county page)")

    except requests.Timeout:
        result.errors.append("Request timed out")
    except requests.ConnectionError:
        result.errors.append("Connection failed")
    except Exception as e:
        result.errors.append(f"Error: {str(e)[:100]}")

    return result


def collect_urls():
    """Collect all URLs to audit."""
    urls = []
    for path in STATIC_PAGES:
        full = SITE_URL if path == "/" else f"{SITE_URL}{path}"
        urls.append((full, "static"))
    for slug in FLORIDA_COUNTY_SLUGS:
        urls.append((f"{SITE_URL}/florida-bail-bonds/{slug}", "county"))
    return urls


# ─── Report Generator ────────────────────────────────────────────────────────
def generate_markdown_report(results: List[AuditResult], output_dir: str):
    """Generate a comprehensive markdown report."""
    path = os.path.join(output_dir, "seo_audit_report.md")

    total = len(results)
    ok = sum(1 for r in results if not r.errors)
    errors_total = sum(len(r.errors) for r in results)
    warnings_total = sum(len(r.warnings) for r in results)
    non_200 = [r for r in results if r.status_code != 200]
    missing_title = [r for r in results if not r.title]
    missing_desc = [r for r in results if not r.meta_description]
    missing_jsonld = [r for r in results if r.json_ld_count == 0]

    with open(path, "w") as f:
        f.write("# 🔍 SEO Audit Report — Shamrock Bail Bonds\n\n")
        f.write(f"**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Site:** {SITE_URL}\n")
        f.write(f"**Pages Audited:** {total}\n\n")

        # Score card
        score = int((ok / total) * 100) if total else 0
        f.write("## 📊 Score Card\n\n")
        f.write(f"| Metric | Value |\n|---|---|\n")
        f.write(f"| Pages Audited | {total} |\n")
        f.write(f"| Clean (no errors) | {ok} ({score}%) |\n")
        f.write(f"| Total Errors | {errors_total} |\n")
        f.write(f"| Total Warnings | {warnings_total} |\n")
        f.write(f"| Non-200 Status | {len(non_200)} |\n")
        f.write(f"| Missing Title | {len(missing_title)} |\n")
        f.write(f"| Missing Meta Desc | {len(missing_desc)} |\n")
        f.write(f"| Missing JSON-LD | {len(missing_jsonld)} |\n\n")

        # Critical issues
        if errors_total > 0:
            f.write("## 🚨 Critical Errors\n\n")
            f.write("| Page | Type | Error |\n|---|---|---|\n")
            for r in results:
                for err in r.errors:
                    short_url = r.url.replace(SITE_URL, "")
                    f.write(f"| `{short_url or '/'}` | {r.page_type} | {err} |\n")
            f.write("\n")

        # Non-200 pages
        if non_200:
            f.write("## ❌ Non-200 Status Codes\n\n")
            for r in non_200:
                short = r.url.replace(SITE_URL, "")
                f.write(f"- `{short or '/'}` → **{r.status_code}**\n")
            f.write("\n")

        # Warnings summary
        if warnings_total > 0:
            f.write("## ⚠️ Warnings\n\n")
            f.write("<details><summary>Click to expand all warnings</summary>\n\n")
            f.write("| Page | Warning |\n|---|---|\n")
            for r in results:
                for w in r.warnings:
                    short = r.url.replace(SITE_URL, "")
                    f.write(f"| `{short or '/'}` | {w} |\n")
            f.write("\n</details>\n\n")

        # County page schema coverage
        county_results = [r for r in results if r.page_type == "county"]
        if county_results:
            f.write("## 🏛️ County Page Schema Coverage\n\n")
            lb = sum(1 for r in county_results if r.has_local_business)
            faq = sum(1 for r in county_results if r.has_faq)
            bc = sum(1 for r in county_results if r.has_breadcrumb)
            svc = sum(1 for r in county_results if r.has_service)
            f.write(f"| Schema | Pages w/ Schema | Coverage |\n|---|---|---|\n")
            f.write(f"| LocalBusiness | {lb}/{len(county_results)} | {int(lb/len(county_results)*100)}% |\n")
            f.write(f"| FAQPage | {faq}/{len(county_results)} | {int(faq/len(county_results)*100)}% |\n")
            f.write(f"| BreadcrumbList | {bc}/{len(county_results)} | {int(bc/len(county_results)*100)}% |\n")
            f.write(f"| Service | {svc}/{len(county_results)} | {int(svc/len(county_results)*100)}% |\n\n")

        # Load time summary
        valid = [r for r in results if r.load_time_ms > 0]
        if valid:
            avg_ms = sum(r.load_time_ms for r in valid) // len(valid)
            slowest = max(valid, key=lambda r: r.load_time_ms)
            f.write("## ⏱️ Performance\n\n")
            f.write(f"- **Average load time:** {avg_ms}ms\n")
            short = slowest.url.replace(SITE_URL, "")
            f.write(f"- **Slowest page:** `{short or '/'}` ({slowest.load_time_ms}ms)\n\n")

    print(f"📄 Report: {path}")
    return path


def generate_csv(results: List[AuditResult], output_dir: str):
    """Generate CSV with audit results."""
    path = os.path.join(output_dir, "seo_audit_results.csv")

    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "URL", "Type", "Status", "Load(ms)", "Title", "Title Len",
            "Meta Desc", "Desc Len", "Canonical", "Robots", "H1 Count",
            "OG:title", "OG:desc", "OG:image", "JSON-LD Count", "Schema Types",
            "LocalBiz", "FAQ", "Breadcrumb", "Service", "Errors", "Warnings"
        ])
        for r in results:
            writer.writerow([
                r.url, r.page_type, r.status_code, r.load_time_ms,
                r.title[:60], r.title_length, r.meta_description[:60],
                r.desc_length, r.canonical, r.robots, r.h1_count,
                r.og_title, r.og_description, r.og_image,
                r.json_ld_count, r.json_ld_types,
                r.has_local_business, r.has_faq, r.has_breadcrumb, r.has_service,
                "; ".join(r.errors), "; ".join(r.warnings)
            ])

    print(f"📊 CSV: {path}")
    return path


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    sample = None

    if "--sample" in sys.argv:
        idx = sys.argv.index("--sample")
        if idx + 1 < len(sys.argv):
            sample = int(sys.argv[idx + 1])

    if "--output-dir" in sys.argv:
        idx = sys.argv.index("--output-dir")
        if idx + 1 < len(sys.argv):
            output_dir = sys.argv[idx + 1]

    print("🔍 Shamrock Bail Bonds — SEO Auditor")
    print("=" * 60)

    # Collect URLs
    all_urls = collect_urls()
    if sample:
        # Take a sample: first few static + first few county
        static = [u for u in all_urls if u[1] == "static"][:3]
        county = [u for u in all_urls if u[1] == "county"][:sample]
        all_urls = static + county

    print(f"📋 Auditing {len(all_urls)} pages...")
    types_count = {}
    for _, t in all_urls:
        types_count[t] = types_count.get(t, 0) + 1
    for t, c in sorted(types_count.items()):
        print(f"   • {t}: {c}")

    # Audit pages with thread pool
    results: List[AuditResult] = []
    done = 0
    total = len(all_urls)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(audit_page, url, ptype): (url, ptype)
                   for url, ptype in all_urls}

        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            done += 1
            status = "✅" if not result.errors else "❌"
            short = result.url.replace(SITE_URL, "") or "/"
            print(f"   [{done}/{total}] {status} {short} ({result.status_code}, {result.load_time_ms}ms)")

    # Sort by URL for consistent reporting
    results.sort(key=lambda r: r.url)

    # Generate reports
    print(f"\n📝 Generating reports...")
    generate_markdown_report(results, output_dir)
    generate_csv(results, output_dir)

    # Summary
    ok = sum(1 for r in results if not r.errors)
    errors = sum(len(r.errors) for r in results)
    warnings = sum(len(r.warnings) for r in results)
    print(f"\n{'=' * 60}")
    print(f"✅ Audit complete: {ok}/{total} pages clean")
    print(f"   🚨 {errors} errors, ⚠️  {warnings} warnings")
    print(f"   📄 Reports saved to: {output_dir}")


if __name__ == "__main__":
    main()
