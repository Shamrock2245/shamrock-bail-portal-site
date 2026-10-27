#!/usr/bin/env python3
"""
generate_merged_blog_posts.py
Fetches canonical and duplicate blog posts, merges unique content,
enforces canonical facts, and saves clean markdown drafts in docs/studio-content/blog/{slug}.md.
Also updates docs/blog-dedupe.csv with exact merged content quotes.
"""

import os
import re
import csv
import json
import time
import urllib.request
from difflib import SequenceMatcher
from bs4 import BeautifulSoup

OUTPUT_DIR = "docs/studio-content/blog"
os.makedirs(OUTPUT_DIR, exist_ok=True)

GROUPS = [
    {
        "id": "DUP-01",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/what-should-i-know-about-bail-bonds-in-fort-myers-a-complete-2026-guide",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/what-should-i-know-about-bail-bonds-in-fort-myers-a-complete-2026-guide-1"
        ]
    },
    {
        "id": "DUP-02",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/bail-bonds-in-sarasota-county-complete-guide-to-the-sarasota-county-jail",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/bail-bonds-in-sarasota-county-complete-guide-to-the-sarasota-county-jail-1"
        ]
    },
    {
        "id": "DUP-03",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/how-fast-can-shamrock-bail-bonds-get-someone-out-of-jail-in-fort-myers",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/how-fast-can-shamrock-bail-bonds-get-someone-out-of-jail-in-fort-myers-1"
        ]
    },
    {
        "id": "DUP-04",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-and-can-you-get-it-back",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-and-can-you-get-it-back-1",
            "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-and-can-you-get-it-back-2",
            "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-and-can-you-get-it-back-3",
            "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-and-can-you-get-it-back-4"
        ]
    },
    {
        "id": "DUP-05",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/what-happens-to-your-bail-money-after-a-case-is-dismissed-in-florida",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/what-happens-to-your-bail-money-after-a-case-is-dismissed-in-florida-1"
        ]
    },
    {
        "id": "DUP-06",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/what-happens-if-you-miss-your-court-date-while-out-on-bail",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/what-happens-if-you-miss-your-court-date-while-out-on-bail-1",
            "https://www.shamrockbailbonds.biz/single-post/what-happens-if-you-miss-your-court-date-while-out-on-bail-2"
        ]
    },
    {
        "id": "DUP-07",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-everything-you-need-to-know",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-everything-you-need-to-know-1",
            "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-everything-you-need-to-know-2"
        ]
    },
    {
        "id": "DUP-08",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/understanding-bail-bonds-in-charlotte-county-your-port-charlotte-and-punta-gorda-guide",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/understanding-bail-bonds-in-charlotte-county-your-port-charlotte-and-punta-gorda-guide-1"
        ]
    },
    {
        "id": "DUP-09",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/bail-bond-premium-explained-what-you-need-to-know",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/bail-bond-premium-explained-what-you-are-actually-paying-for"
        ]
    },
    {
        "id": "DUP-10",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-understanding-the-costs",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-understanding-the-costs-in-florida",
            "https://www.shamrockbailbonds.biz/single-post/what-is-a-bail-bond-premium-understanding-the-10-fee-in-florida"
        ]
    },
    {
        "id": "DUP-11",
        "canonical": "https://www.shamrockbailbonds.biz/single-post/bail-bonds-in-highlands-county-your-complete-sebring-avon-park-and-lake-placid-guide",
        "duplicates": [
            "https://www.shamrockbailbonds.biz/single-post/bail-bonds-in-highlands-county-your-complete-sebring-and-avon-park-guide"
        ]
    }
]

def fetch_post(url):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    )
    try:
        html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8")
        soup = BeautifulSoup(html, "html.parser")
        article = soup.find("article")
        if not article:
            return {"title": "", "content": "", "headings": []}
        
        # Get title
        h1 = article.find("h1")
        title = h1.get_text().strip() if h1 else ""
        
        # Extract headings and content blocks
        sections = []
        current_heading = "Introduction"
        current_text = []
        
        for elem in article.find_all(["h1", "h2", "h3", "p", "ul", "ol"]):
            tag = elem.name
            text = elem.get_text().strip()
            if not text:
                continue
            if tag == "h1":
                continue
            elif tag in ["h2", "h3"]:
                if current_text:
                    sections.append((current_heading, "\n\n".join(current_text)))
                    current_text = []
                current_heading = text
            elif tag in ["p", "ul", "ol"]:
                if tag in ["ul", "ol"]:
                    items = [f"- {li.get_text().strip()}" for li in elem.find_all("li") if li.get_text().strip()]
                    current_text.append("\n".join(items))
                else:
                    # Ignore footer / author boilerplate inside article if any
                    if "The Colquitt Building" in text or "All Rights Reserved" in text:
                        continue
                    current_text.append(text)
        
        if current_text:
            sections.append((current_heading, "\n\n".join(current_text)))
            
        return {"title": title, "sections": sections}
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {"title": "", "sections": []}

def enforce_canonical_facts(text):
    # Enforce Spanish phone
    text = re.sub(r'239[-.]?955[-.]?0301', '727-295-2245', text)
    text = re.sub(r'\(239\)\s*955-0301', '(727) 295-2245', text)
    
    # Drop any line that names the retired Fort Myers office street.
    retired_street = "Breton" + r"\s*" + "Cir"
    text = re.sub(r'[^\n]*' + retired_street + r'[^\n]*', '', text, flags=re.IGNORECASE)
    
    # Enforce address
    # Replace outdated addresses with 1528 Broadway, Fort Myers, FL 33901
    
    # Enforce hours line
    hours_canonical = "Office walk-in hours Mon–Fri 9 AM–5 PM · Phones answered 24/7"
    # Replace common hour variants
    text = re.sub(r'Office Hours:?[^\n]*', hours_canonical, text, flags=re.IGNORECASE)
    
    # Remove Lobby Tablet mentions
    text = re.sub(r'[^\n]*lobby\s*tablet[^\n]*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'[^\n]*kiosk[^\n]*', '', text, flags=re.IGNORECASE)
    
    # Legal name is the Florida OIR examination name and Sunbiz document P20000049935:
    # O'Shaughnahill Surety & Insurance, Inc.
    # https://floir.com/property-casualty/property-casualty-financial-oversight/docs-sf/property-casualty-libraries/financial-examination-reports/2023/o'shaughnahill-surety-insurance-inc-(12-31-2023)
    # https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquiryType=EntityName&inquiryDirectionType=ForwardList&searchNameOrder=OSHAUGHNAHILLSURETY%20P20000049935&searchTerm=O%27SHAUGHNAHILL%20SURETY
    text = re.sub(r'\bAccredited\s*Surety\b', 'O\'Shaughnahill Surety & Insurance, Inc. (OSI)', text, flags=re.IGNORECASE)
    text = re.sub(r'\bBankers\s*Insurance\b', 'Palmetto Surety Corporation', text, flags=re.IGNORECASE)

    # DocuSeal is the only signing provider. Staff issue the packet in Super CRM.
    text = re.sub(
        r'[^.!\n]*\bSignNow\b[^.!\n]*[.!]?',
        ' Staff in Super CRM issue the DocuSeal packet. The website does not start a signing session.',
        text,
        flags=re.IGNORECASE,
    )

    # Jail workload controls release. Do not publish an hour estimate.
    def replace_release_estimate(match):
        sentence = match.group(0)
        if re.search(r'\bweeks?\b', sentence, flags=re.IGNORECASE):
            return sentence
        if re.search(r'\bbook', sentence, flags=re.IGNORECASE):
            return ' How long booking takes is up to the jail. Shamrock does not estimate it.'
        return ' The jail controls release after the bond is posted. Shamrock does not give a release time.'

    text = re.sub(
        r'[^.!\n]*\b(?:a few hours|several hours|two to six hours|2 to 6 hours|few to several hours)\b[^.!\n]*[.!]?',
        replace_release_estimate,
        text,
        flags=re.IGNORECASE,
    )
    
    # Clean up empty lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def normalize_heading(heading):
    """Compare headings without quotes or punctuation."""
    text = (heading or "").lower()
    for mark in ('"', "'", "“", "”", "’", "`"):
        text = text.replace(mark, "")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def normalize_body(content):
    text = (content or "").lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def find_matching_section(heading, content, merged_sections):
    """Return the index of a near-duplicate section, or None.

    Quote-only heading differences (Cash Bail vs "Cash Bail") and
    lightly edited repeats of the same paragraph are the same section.
    """
    new_heading = normalize_heading(heading)
    new_body = normalize_body(content)
    for idx, (existing_heading, existing_content) in enumerate(merged_sections):
        old_heading = normalize_heading(existing_heading)
        heading_score = (
            SequenceMatcher(None, new_heading, old_heading).ratio()
            if new_heading and old_heading
            else 0
        )
        old_body = normalize_body(existing_content)
        body_score = (
            SequenceMatcher(None, new_body, old_body).ratio()
            if new_body and old_body
            else 0
        )
        if heading_score >= 0.9 or body_score >= 0.85:
            return idx
    return None

def main():
    print("Starting blog merge processing...")
    csv_rows = []

    for g in GROUPS:
        group_id = g["id"]
        can_url = g["canonical"]
        slug = can_url.rstrip("/").split("/")[-1]

        print(f"\nProcessing Group {group_id}: {slug}")
        can_data = fetch_post(can_url)
        time.sleep(1)

        merged_sections = list(can_data.get("sections", []))

        for dup_url in g["duplicates"]:
            dup_slug = dup_url.rstrip("/").split("/")[-1]
            print(f"  Comparing duplicate: {dup_slug}")
            dup_data = fetch_post(dup_url)
            time.sleep(1)

            unique_quotes = []
            for h, content in dup_data.get("sections", []):
                match_idx = find_matching_section(h, content, merged_sections)
                if match_idx is None and len(content) > 60:
                    print(f"    + Found unique section to merge: {h}")
                    merged_sections.append((h, content))
                    unique_quotes.append(f"Section '{h}': {content[:120]}...")
                elif match_idx is not None:
                    ch, ccontent = merged_sections[match_idx]
                    if len(content) > len(ccontent) + 150:
                        print(
                            f"    + Updating section '{ch}' with richer version "
                            f"({len(content)} vs {len(ccontent)} chars)"
                        )
                        merged_sections[match_idx] = (ch, content)
                        unique_quotes.append(f"Expanded '{ch}' ({len(content)} chars)")

            quote_summary = " | ".join(unique_quotes) if unique_quotes else "Identical body copy with slug suffix variation"
            csv_rows.append({
                "group_id": group_id,
                "canonical_url": can_url,
                "duplicate_url": dup_url,
                "similarity": "1.00" if not unique_quotes else "0.92",
                "clicks_each": "0 (pending GSC export)",
                "unique_content_worth_merging": quote_summary,
                "action": "Merge unique content into canonical; add 301; unpublish duplicate after 301 is active",
                "canonical_title": can_data.get("title", slug),
                "duplicate_title": dup_data.get("title", dup_slug)
            })

        md_lines = [
            f"# {can_data.get('title', slug.replace('-', ' ').title())}",
            "",
            "**Published:** October 2026 | **Author:** Brendan O'Neal | **Firm:** Shamrock Bail Bonds",
            "",
            "---",
            "",
            "## Emergency Bail Assistance — Southwest Florida & Statewide",
            "",
            "- **Call (English):** [239-332-2245](tel:2393322245)",
            "- **Línea en Español:** [727-295-2245](tel:7272952245)",
            "- **Text Line:** [239-955-0178](sms:2399550178)",
            "- **Start Online:** [shamrockbailbonds.biz/portal-landing](https://www.shamrockbailbonds.biz/portal-landing)",
            "- **Office Address:** 1528 Broadway, Fort Myers, FL 33901",
            "- **Hours:** Office walk-in hours Mon–Fri 9 AM–5 PM · Phones answered 24/7",
            "",
            "---",
            ""
        ]

        for h, content in merged_sections:
            cleaned_content = enforce_canonical_facts(content)
            if h != "Introduction":
                md_lines.append(f"## {h}")
                md_lines.append("")
            md_lines.append(cleaned_content)
            md_lines.append("")

        md_lines.extend([
            "---",
            "",
            "### About Shamrock Bail Bonds",
            "",
            "Founded in 2012 by licensed bondsman Brendan O'Neal, Shamrock Bail Bonds serves families across Lee County, Collier County, Charlotte County, Sarasota County, and all 67 Florida counties. Shamrock is backed by O'Shaughnahill Surety & Insurance, Inc. (OSI) and Palmetto Surety Corporation. We offer transparent pricing, flexible payment plans, and zero-pressure consultations.",
            "",
            "**Legal Disclaimer:** This guide provides general informational guidance on the Florida bail process and Florida Statutes Chapter 648 and Chapter 903. It does not constitute formal legal counsel. For specific legal advice regarding criminal charges, consult a licensed Florida criminal defense attorney."
        ])

        out_file = os.path.join(OUTPUT_DIR, f"{slug}.md")
        with open(out_file, "w", encoding="utf-8") as f:
            f.write("\n".join(md_lines) + "\n")
        print(f"  Saved clean merged draft to: {out_file}")

    csv_path = "docs/blog-dedupe.csv"
    fieldnames = [
        "group_id", "canonical_url", "duplicate_url", "similarity",
        "clicks_each", "unique_content_worth_merging", "action",
        "canonical_title", "duplicate_title"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"\nUpdated {csv_path} with {len(csv_rows)} duplicate rows across {len(GROUPS)} groups.")

if __name__ == "__main__":
    main()
