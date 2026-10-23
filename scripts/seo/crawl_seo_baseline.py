#!/usr/bin/env python3
"""
Crawl Live Site for SEO Baseline
Crawl all URLs from sitemaps and auxiliary pages, extract SEO fields, build internal link graph.
Saves to docs/seo-baseline/live-2026-10-23.json and live-2026-10-23.csv
"""

import os
import sys
import time
import json
import csv
import re
import urllib.request
import urllib.error
import urllib.parse
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from datetime import datetime

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
BASE_DOMAIN = "www.shamrockbailbonds.biz"
ROOT_URL = f"https://{BASE_DOMAIN}"

SITEMAP_INDEX = f"{ROOT_URL}/sitemap.xml"

AUXILIARY_URLS = [
    f"{ROOT_URL}/first-appearance",
    f"{ROOT_URL}/communication-preferences",
    f"{ROOT_URL}/data-deletion",
    f"{ROOT_URL}/portal-defendant",
    f"{ROOT_URL}/portal-indemnitor",
    f"{ROOT_URL}/portal-staff",
]

def normalize_url(url):
    """Normalize URL by stripping fragment and trailing slash (except root)."""
    if not url:
        return ""
    parsed = urllib.parse.urlparse(url)
    netloc = parsed.netloc.lower()
    if netloc == "shamrockbailbonds.biz":
        netloc = "www.shamrockbailbonds.biz"
    path = parsed.path
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    return urllib.parse.urlunparse((parsed.scheme or "https", netloc or BASE_DOMAIN, path, "", parsed.query, ""))

def determine_page_type(url):
    norm = normalize_url(url).lower()
    path = urllib.parse.urlparse(norm).path
    if "/single-post/" in path or path == "/blog" or path.startswith("/blog-category/"):
        return "blog"
    if path.startswith("/florida-bail-bonds/") or path == "/florida-bail-bonds":
        return "county"
    if path.startswith("/portal-"):
        return "portal"
    if path in ["/privacy-policy", "/terms-and-conditions", "/communication-preferences", "/data-deletion"]:
        return "legal"
    return "static"

def fetch_sitemap_urls():
    """Fetch all URLs and lastmod from sitemap index and child sitemaps."""
    url_map = {} # url -> lastmod
    print(f"Fetching sitemap index: {SITEMAP_INDEX}")
    req = urllib.request.Request(SITEMAP_INDEX, headers={"User-Agent": USER_AGENT})
    try:
        content = urllib.request.urlopen(req, timeout=15).read()
        root = ET.fromstring(content)
        ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        child_sitemaps = [elem.text.strip() for elem in root.findall(".//ns:loc", ns)]
    except Exception as e:
        print(f"Error fetching sitemap index: {e}")
        child_sitemaps = [
            f"{ROOT_URL}/pages-sitemap.xml",
            f"{ROOT_URL}/blog-posts-sitemap.xml",
            f"{ROOT_URL}/blog-categories-sitemap.xml",
            f"{ROOT_URL}/dynamic-florida-bail-bonds_p_e7cdf976_0d00_4377_927c_fa4cc08037be_0_5000-sitemap.xml"
        ]

    for sm_url in child_sitemaps:
        print(f"Fetching child sitemap: {sm_url}")
        try:
            req = urllib.request.Request(sm_url, headers={"User-Agent": USER_AGENT})
            content = urllib.request.urlopen(req, timeout=15).read()
            sm_root = ET.fromstring(content)
            for u in sm_root.findall(".//ns:url", ns):
                loc = u.find("ns:loc", ns)
                lastmod = u.find("ns:lastmod", ns)
                if loc is not None and loc.text:
                    n_url = normalize_url(loc.text.strip())
                    l_mod = lastmod.text.strip() if (lastmod is not None and lastmod.text) else ""
                    url_map[n_url] = l_mod
        except Exception as e:
            print(f"Error reading sitemap {sm_url}: {e}")

    for aux in AUXILIARY_URLS:
        n_aux = normalize_url(aux)
        if n_aux not in url_map:
            url_map[n_aux] = ""

    print(f"Total unique URLs to crawl: {len(url_map)}")
    return url_map

def extract_page_data(url, lastmod):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    item = {
        "url": url,
        "http_status": None,
        "final_url": url,
        "title": "",
        "meta_description": "",
        "canonical": "",
        "meta_robots": "",
        "h1": "",
        "h1_count": 0,
        "h2_list": [],
        "og_title": "",
        "og_description": "",
        "og_image": "",
        "json_ld_types": [],
        "word_count": 0,
        "internal_links_out": [],
        "image_count": 0,
        "images_missing_alt": 0,
        "last_modified": lastmod,
        "page_type": determine_page_type(url)
    }

    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            item["http_status"] = res.status
            item["final_url"] = normalize_url(res.url)
            html = res.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        item["http_status"] = e.code
        return item
    except Exception as e:
        item["http_status"] = 0
        return item

    try:
        soup = BeautifulSoup(html, "html.parser")

        if soup.title and soup.title.string:
            item["title"] = soup.title.string.strip()

        for m in soup.find_all("meta"):
            name = (m.get("name") or "").lower().strip()
            prop = (m.get("property") or "").lower().strip()
            content = (m.get("content") or "").strip()
            if name == "description":
                item["meta_description"] = content
            elif name == "robots":
                item["meta_robots"] = content
            elif prop == "og:title":
                item["og_title"] = content
            elif prop == "og:description":
                item["og_description"] = content
            elif prop == "og:image":
                item["og_image"] = content

        can_tag = soup.find("link", rel="canonical")
        if can_tag and can_tag.get("href"):
            item["canonical"] = can_tag.get("href").strip()

        h1_tags = [h.get_text(separator=" ", strip=True) for h in soup.find_all("h1")]
        item["h1_count"] = len(h1_tags)
        item["h1"] = h1_tags[0] if h1_tags else ""

        h2_tags = [h.get_text(separator=" ", strip=True) for h in soup.find_all("h2")]
        item["h2_list"] = h2_tags

        json_ld_types = set()
        for s in soup.find_all("script", type="application/ld+json"):
            if not s.string:
                continue
            try:
                data = json.loads(s.string)
                def collect_types(obj):
                    if isinstance(obj, dict):
                        t = obj.get("@type")
                        if isinstance(t, list):
                            for x in t:
                                if isinstance(x, str): json_ld_types.add(x)
                        elif isinstance(t, str):
                            json_ld_types.add(t)
                        if "@graph" in obj:
                            collect_types(obj["@graph"])
                        for v in obj.values():
                            if isinstance(v, (dict, list)):
                                collect_types(v)
                    elif isinstance(obj, list):
                        for el in obj:
                            collect_types(el)
                collect_types(data)
            except Exception:
                pass
        item["json_ld_types"] = sorted(list(json_ld_types))

        # Images
        imgs = soup.find_all("img")
        item["image_count"] = len(imgs)
        item["images_missing_alt"] = sum(1 for img in imgs if not (img.get("alt") or "").strip())

        # Word count from text
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        visible_text = soup.get_text(separator=" ", strip=True)
        item["word_count"] = len(visible_text.split())

        # Internal links out
        links_out = set()
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith("#") or href.startswith("tel:") or href.startswith("mailto:") or href.startswith("javascript:"):
                continue
            parsed_href = urllib.parse.urlparse(href)
            if not parsed_href.netloc or parsed_href.netloc in ["shamrockbailbonds.biz", "www.shamrockbailbonds.biz"]:
                # internal
                full = urllib.parse.urljoin(url, href)
                norm_full = normalize_url(full)
                if norm_full.startswith(ROOT_URL):
                    links_out.add(norm_full)
        item["internal_links_out"] = sorted(list(links_out))

    except Exception as e:
        print(f"Error parsing {url}: {e}")

    return item

def main():
    os.makedirs("docs/seo-baseline", exist_ok=True)
    url_map = fetch_sitemap_urls()

    results = []
    total = len(url_map)
    print(f"Beginning crawl of {total} URLs (1 req/sec)...")

    for i, (url, lastmod) in enumerate(url_map.items(), 1):
        item = extract_page_data(url, lastmod)
        results.append(item)
        if i % 10 == 0 or i == total:
            print(f"[{i}/{total}] Crawled: {url} -> Status: {item['http_status']}, H1: '{item['h1'][:30]}', Words: {item['word_count']}")
        time.sleep(1.0)

    # Compute inbound links
    inbound_map = {item["url"]: [] for item in results}
    for item in results:
        src = item["url"]
        for target in item["internal_links_out"]:
            if target in inbound_map:
                inbound_map[target].append(src)

    for item in results:
        u = item["url"]
        inbound = inbound_map.get(u, [])
        item["inbound_internal_links"] = inbound
        item["inbound_internal_links_count"] = len(inbound)
        item["internal_links_out_count"] = len(item["internal_links_out"])

    json_path = "docs/seo-baseline/live-2026-10-23.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"Saved JSON baseline to {json_path}")

    csv_path = "docs/seo-baseline/live-2026-10-23.csv"
    fieldnames = [
        "url",
        "http_status",
        "final_url",
        "title",
        "meta_description",
        "canonical",
        "meta_robots",
        "h1",
        "h1_count",
        "h2_list",
        "og_title",
        "og_description",
        "og_image",
        "json_ld_types",
        "word_count",
        "internal_links_out_count",
        "internal_links_out",
        "inbound_internal_links_count",
        "inbound_internal_links",
        "image_count",
        "images_missing_alt",
        "last_modified",
        "page_type"
    ]

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(fieldnames)
        for r in results:
            writer.writerow([
                r["url"],
                r["http_status"],
                r["final_url"],
                r["title"],
                r["meta_description"],
                r["canonical"],
                r["meta_robots"],
                r["h1"],
                r["h1_count"],
                " | ".join(r["h2_list"]),
                r["og_title"],
                r["og_description"],
                r["og_image"],
                ", ".join(r["json_ld_types"]),
                r["word_count"],
                r["internal_links_out_count"],
                "; ".join(r["internal_links_out"]),
                r["inbound_internal_links_count"],
                "; ".join(r["inbound_internal_links"]),
                r["image_count"],
                r["images_missing_alt"],
                r["last_modified"],
                r["page_type"]
            ])
    print(f"Saved CSV baseline to {csv_path}")

if __name__ == "__main__":
    main()
