#!/usr/bin/env python3
"""
Comprehensive site crawler for shamrockbailbonds.biz
Discovers all URLs, checks status codes, traces redirect chains,
and identifies canonical/sitemap issues.
"""

import requests
import json
import csv
import time
from urllib.parse import urlparse, urljoin, urlunparse
from bs4 import BeautifulSoup
from collections import deque

BASE_URL = "https://www.shamrockbailbonds.biz"
SITEMAP_URL = f"{BASE_URL}/sitemap.xml"
OUTPUT_DIR = "/home/ubuntu/redirect_audit"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ShamrockAuditBot/1.0; +https://shamrockbailbonds.biz)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Known URLs from GSC data (full_redirect_analysis.json) + known county pages
SEED_URLS_FROM_GSC = [
    "/bail-online",
    "/blank-4",
    "/_api/v1/access-tokens",
    "/bail-bonds/hendry",
    "/bail-bonds/pinellas",
    "/bail-bonds/stlucie",
    "/bail-bonds/suwannee",
    "/bail-bonds/levy",
    "/bail-bonds/polk",
    "/bail-bonds/clay",
    "/blank-3",
    "/blank",
    "/home-1",
    "/_functions/sitemap",
]

# All 67 Florida counties to check for county pages
FLORIDA_COUNTIES = [
    "alachua","baker","bay","bradford","brevard","broward","calhoun","charlotte",
    "citrus","clay","collier","columbia","desoto","dixie","duval","escambia",
    "flagler","franklin","gadsden","gilchrist","glades","gulf","hamilton","hardee",
    "hendry","hernando","highlands","hillsborough","holmes","indian-river","jackson",
    "jefferson","lafayette","lake","lee","leon","levy","liberty","madison","manatee",
    "marion","martin","miami-dade","monroe","nassau","okaloosa","okeechobee","orange",
    "osceola","palm-beach","pasco","pinellas","putnam","santa-rosa","sarasota",
    "seminole","st-johns","st-lucie","stlucie","sumter","suwannee","taylor","union",
    "volusia","wakulla","walton","washington"
]


def normalize_url(url):
    """Normalize URL to remove trailing slashes and fragments."""
    parsed = urlparse(url)
    path = parsed.path.rstrip('/') or '/'
    return urlunparse((parsed.scheme, parsed.netloc, path, '', parsed.query, ''))


def is_internal(url):
    """Check if URL belongs to the target domain."""
    parsed = urlparse(url)
    return parsed.netloc in ('www.shamrockbailbonds.biz', 'shamrockbailbonds.biz', '')


def trace_redirects(url, session, max_hops=10):
    """Trace the full redirect chain for a URL."""
    chain = []
    current_url = url
    final_status = None
    error = None

    for _ in range(max_hops):
        try:
            resp = session.get(current_url, allow_redirects=False, timeout=15)
            status = resp.status_code

            if 300 <= status < 400 and 'Location' in resp.headers:
                next_url = resp.headers['Location']
                if next_url.startswith('/'):
                    parsed = urlparse(current_url)
                    next_url = f"{parsed.scheme}://{parsed.netloc}{next_url}"
                chain.append({
                    "url": current_url,
                    "status_code": status,
                    "target": next_url
                })
                current_url = next_url
            else:
                final_status = status
                break
        except requests.exceptions.RequestException as e:
            error = str(e)
            break

    return {
        "original_url": url,
        "chain": chain,
        "hops": len(chain),
        "final_url": current_url,
        "final_status": final_status,
        "error": error
    }


def get_canonical(html_content, page_url):
    """Extract canonical URL from page HTML."""
    try:
        soup = BeautifulSoup(html_content, 'lxml')
        canonical = soup.find('link', rel='canonical')
        if canonical and canonical.get('href'):
            return canonical['href']
    except Exception:
        pass
    return None


def fetch_sitemap_urls(session):
    """Fetch all URLs from the XML sitemap."""
    urls = []
    try:
        resp = session.get(SITEMAP_URL, timeout=15)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'lxml-xml')
            # Handle sitemap index
            sitemaps = soup.find_all('sitemap')
            if sitemaps:
                for sitemap in sitemaps:
                    loc = sitemap.find('loc')
                    if loc:
                        sub_resp = session.get(loc.text.strip(), timeout=15)
                        if sub_resp.status_code == 200:
                            sub_soup = BeautifulSoup(sub_resp.text, 'lxml-xml')
                            for url_tag in sub_soup.find_all('url'):
                                loc_tag = url_tag.find('loc')
                                if loc_tag:
                                    urls.append(loc_tag.text.strip())
            else:
                for url_tag in soup.find_all('url'):
                    loc_tag = url_tag.find('loc')
                    if loc_tag:
                        urls.append(loc_tag.text.strip())
    except Exception as e:
        print(f"Sitemap fetch error: {e}")
    return urls


def crawl_site():
    """Main crawl function - discovers and checks all URLs."""
    session = requests.Session()
    session.headers.update(HEADERS)

    visited = set()
    to_visit = deque()
    all_results = []

    # Start with homepage
    to_visit.append(BASE_URL + "/")

    # Add GSC seed URLs
    for path in SEED_URLS_FROM_GSC:
        full_url = BASE_URL + path
        to_visit.append(full_url)

    # Add county pages (both /bail-bonds/county and /county patterns)
    for county in FLORIDA_COUNTIES:
        to_visit.append(f"{BASE_URL}/bail-bonds/{county}")
        to_visit.append(f"{BASE_URL}/{county}")

    # Add known page patterns
    known_pages = [
        "/", "/how-bail-works", "/how-to-become-a-bondsman",
        "/contact", "/about", "/blog", "/faq",
        "/florida-sheriffs-clerks", "/florida-sheriffs", "/florida-clerks",
        "/bail-bonds", "/members", "/member-area", "/login",
        "/start-bail-paperwork", "/bail-school", "/become-a-bondsman",
        "/services", "/payment", "/pay-online",
        "/sitemap", "/privacy-policy", "/terms",
    ]
    for page in known_pages:
        to_visit.append(BASE_URL + page)

    # Fetch sitemap URLs
    print("Fetching sitemap...")
    sitemap_urls = fetch_sitemap_urls(session)
    print(f"Found {len(sitemap_urls)} URLs in sitemap")
    for url in sitemap_urls:
        to_visit.append(url)

    print(f"Starting crawl with {len(to_visit)} seed URLs...")

    crawl_count = 0
    max_crawl = 500  # Safety limit

    while to_visit and crawl_count < max_crawl:
        url = to_visit.popleft()

        # Normalize
        norm_url = normalize_url(url)
        if norm_url in visited:
            continue
        if not is_internal(url):
            continue

        visited.add(norm_url)
        crawl_count += 1

        print(f"[{crawl_count}] Checking: {url}")

        # Trace redirects
        result = trace_redirects(url, session)
        result["in_sitemap"] = url in sitemap_urls or norm_url in [normalize_url(u) for u in sitemap_urls]

        # If final page is 200, get canonical
        canonical = None
        if result["final_status"] == 200:
            try:
                page_resp = session.get(result["final_url"], timeout=15)
                canonical = get_canonical(page_resp.text, result["final_url"])

                # Extract internal links for further crawling
                soup = BeautifulSoup(page_resp.text, 'lxml')
                for a_tag in soup.find_all('a', href=True):
                    href = a_tag['href']
                    if href.startswith('/'):
                        full_link = BASE_URL + href
                        norm_link = normalize_url(full_link)
                        if norm_link not in visited:
                            to_visit.append(full_link)
                    elif href.startswith('http') and is_internal(href):
                        norm_link = normalize_url(href)
                        if norm_link not in visited:
                            to_visit.append(href)
            except Exception:
                pass

        result["canonical"] = canonical
        all_results.append(result)

        time.sleep(0.3)  # Be polite

    print(f"\nCrawl complete. Checked {len(all_results)} URLs.")
    return all_results, sitemap_urls


def categorize_results(results, sitemap_urls):
    """Categorize URLs by issue type."""
    sitemap_set = set(normalize_url(u) for u in sitemap_urls)

    categories = {
        "404_not_found": [],
        "redirect_chains": [],  # Multi-hop redirects
        "redirect_single": [],  # Single-hop redirects (301/302)
        "canonical_mismatch": [],
        "in_sitemap_but_redirecting": [],
        "in_sitemap_but_404": [],
        "clean_200": [],
        "other_errors": [],
    }

    for r in results:
        url = r["original_url"]
        norm_url = normalize_url(url)
        final_status = r["final_status"]
        hops = r["hops"]
        canonical = r.get("canonical")

        if final_status == 404 or (final_status is None and r.get("error")):
            categories["404_not_found"].append(r)
            if norm_url in sitemap_set:
                categories["in_sitemap_but_404"].append(r)
        elif hops >= 2:
            categories["redirect_chains"].append(r)
            if norm_url in sitemap_set:
                categories["in_sitemap_but_redirecting"].append(r)
        elif hops == 1:
            categories["redirect_single"].append(r)
            if norm_url in sitemap_set:
                categories["in_sitemap_but_redirecting"].append(r)
        elif final_status == 200:
            # Check canonical mismatch
            if canonical and normalize_url(canonical) != norm_url and normalize_url(canonical) != normalize_url(r["final_url"]):
                categories["canonical_mismatch"].append(r)
            else:
                categories["clean_200"].append(r)
        else:
            categories["other_errors"].append(r)

    return categories


if __name__ == "__main__":
    import os
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    results, sitemap_urls = crawl_site()

    # Save raw results
    with open(f"{OUTPUT_DIR}/crawl_results_raw.json", 'w') as f:
        json.dump(results, f, indent=2)

    # Save sitemap URLs
    with open(f"{OUTPUT_DIR}/sitemap_urls.json", 'w') as f:
        json.dump(sitemap_urls, f, indent=2)

    # Categorize
    categories = categorize_results(results, sitemap_urls)

    # Save categories
    with open(f"{OUTPUT_DIR}/crawl_categories.json", 'w') as f:
        json.dump(categories, f, indent=2)

    # Print summary
    print("\n=== CRAWL SUMMARY ===")
    for cat, items in categories.items():
        print(f"  {cat}: {len(items)}")

    print(f"\nTotal URLs checked: {len(results)}")
    print(f"Sitemap URLs found: {len(sitemap_urls)}")
