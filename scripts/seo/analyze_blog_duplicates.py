#!/usr/bin/env python3
"""
Analyze Blog Duplicates and Thin Posts
Processes docs/seo-baseline/live-2026-10-23.json to find duplicates,
thin posts, and canonical facts violations.
Generates docs/blog-dedupe.csv and draft merged posts.
"""

import os
import sys
import json
import csv
import re
from collections import defaultdict
from difflib import SequenceMatcher

def clean_slug(url):
    slug = url.split("/single-post/")[-1].strip("/")
    slug_clean = re.sub(r"-\d+$", "", slug)
    slug_clean = re.sub(r"-copy(-\d+)?$", "", slug_clean)
    return slug_clean

def get_shingles(text, k=3):
    words = re.findall(r"\b[a-zA-Z0-9]+\b", text.lower())
    if len(words) < k:
        return set(words)
    return set(" ".join(words[i:i+k]) for i in range(len(words) - k + 1))

def jaccard_similarity(set1, set2):
    if not set1 or not set2:
        return 0.0
    return len(set1 & set2) / len(set1 | set2)

def text_similarity(t1, t2):
    s1 = get_shingles(t1, 3)
    s2 = get_shingles(t2, 3)
    return jaccard_similarity(s1, s2)

def main():
    json_path = "docs/seo-baseline/live-2026-10-23.json"
    if not os.path.exists(json_path):
        print(f"File {json_path} does not exist yet. Please wait for crawl to finish.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Filter blog posts
    posts = [item for item in data if "/single-post/" in item["url"]]
    print(f"Total blog posts found: {len(posts)}")

    # Check canonical facts violations across all posts
    violations = []
    for p in posts:
        url = p["url"]
        h1 = p.get("h1", "")
        desc = p.get("meta_description", "")
        # Check text if available, or title/desc
        text_check = f"{p.get('title', '')} {desc} {' '.join(p.get('h2_list', []))}"
        
        if "955-0301" in text_check or "9550301" in text_check:
            violations.append({"url": url, "issue": "Mentions 955-0301 in public copy"})
        if "breton" in text_check.lower():
            violations.append({"url": url, "issue": "Mentions the retired office street"})
        if "accredited" in text_check.lower() or "bankers" in text_check.lower():
            violations.append({"url": url, "issue": "Mentions retired surety (Accredited/Bankers)"})
        if "lobby tablet" in text_check.lower() or "staff kiosk" in text_check.lower():
            violations.append({"url": url, "issue": "Mentions retired Lobby Tablet / Staff kiosk"})

    print(f"Total canonical violations flagged in metadata/headings: {len(violations)}")

    # Group posts by title/slug/similarity
    # Pass 1: exact normalized slug base
    slug_groups = defaultdict(list)
    for p in posts:
        base = clean_slug(p["url"])
        slug_groups[base].append(p)

    duplicate_groups = []
    group_id = 1

    processed_urls = set()

    # Find slug-based duplicates
    for base, group in slug_groups.items():
        if len(group) > 1:
            duplicate_groups.append({
                "group_id": f"DUP-{group_id:02d}",
                "base_slug": base,
                "posts": group,
                "reason": "Slug suffix variant (-1, -2, -copy)"
            })
            for p in group:
                processed_urls.add(p["url"])
            group_id += 1

    # Pass 2: High title or content similarity across remaining
    unmatched = [p for p in posts if p["url"] not in processed_urls]
    for i in range(len(unmatched)):
        for j in range(i + 1, len(unmatched)):
            p1 = unmatched[i]
            p2 = unmatched[j]
            t1 = p1.get("title", "")
            t2 = p2.get("title", "")
            h1_1 = p1.get("h1", "")
            h1_2 = p2.get("h1", "")
            
            title_sim = SequenceMatcher(None, t1.lower(), t2.lower()).ratio()
            h1_sim = SequenceMatcher(None, h1_1.lower(), h1_2.lower()).ratio()
            
            if title_sim > 0.85 or h1_sim > 0.85:
                # Group them
                found_g = None
                for g in duplicate_groups:
                    g_urls = [p["url"] for p in g["posts"]]
                    if p1["url"] in g_urls or p2["url"] in g_urls:
                        found_g = g
                        break
                if found_g:
                    if p1["url"] not in [p["url"] for p in found_g["posts"]]:
                        found_g["posts"].append(p1)
                    if p2["url"] not in [p["url"] for p in found_g["posts"]]:
                        found_g["posts"].append(p2)
                else:
                    duplicate_groups.append({
                        "group_id": f"DUP-{group_id:02d}",
                        "base_slug": clean_slug(p1["url"]),
                        "posts": [p1, p2],
                        "reason": f"Title/H1 similarity ({title_sim:.2f})"
                    })
                    group_id += 1

    print(f"Total duplicate groups identified: {len(duplicate_groups)}")

    # Flag thin posts
    thin_posts = [p for p in posts if p.get("word_count", 0) < 300]
    print(f"Thin posts (< 300 words): {len(thin_posts)}")

    # Write docs/blog-dedupe.csv
    csv_path = "docs/blog-dedupe.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "group_id",
            "canonical_url",
            "duplicate_url",
            "similarity",
            "clicks_each",
            "unique_content_worth_merging",
            "action",
            "canonical_title",
            "duplicate_title",
            "canonical_words",
            "duplicate_words"
        ])

        for g in duplicate_groups:
            gid = g["group_id"]
            # Pick canonical: prefer post without suffix, highest word count, oldest lastmod
            def score_post(p):
                score = 0
                slug = p["url"].split("/single-post/")[-1]
                if not re.search(r"-\d+$|-copy", slug):
                    score += 50
                score += min(p.get("word_count", 0) / 10, 50)
                score += p.get("inbound_internal_links_count", 0) * 5
                return score

            sorted_posts = sorted(g["posts"], key=score_post, reverse=True)
            canonical = sorted_posts[0]
            duplicates = sorted_posts[1:]

            for dup in duplicates:
                sim = SequenceMatcher(None, canonical.get("title", ""), dup.get("title", "")).ratio()
                writer.writerow([
                    gid,
                    canonical["url"],
                    dup["url"],
                    f"{sim:.2f}",
                    "0 (pending GSC export)",
                    f"Check section differences in H2: {'; '.join([h for h in dup.get('h2_list', []) if h not in canonical.get('h2_list', [])])}",
                    "Merge unique content into canonical; add 301; unpublish duplicate after 301 is active",
                    canonical.get("title", ""),
                    dup.get("title", ""),
                    canonical.get("word_count", 0),
                    dup.get("word_count", 0)
                ])

    print(f"Saved {csv_path}")

    # Save summary report in markdown
    md_path = "docs/seo-baseline/blog-audit-summary.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Blog Duplicate & Content Quality Audit\n\n")
        f.write(f"- **Total Blog Posts Audited**: {len(posts)}\n")
        f.write(f"- **Duplicate Groups Found**: {len(duplicate_groups)}\n")
        f.write(f"- **Total Posts in Duplicate Groups**: {sum(len(g['posts']) for g in duplicate_groups)}\n")
        f.write(f"- **Thin Posts (<300 words)**: {len(thin_posts)}\n")
        f.write(f"- **Canonical Fact Violations Flagged**: {len(violations)}\n\n")

        f.write("## Duplicate Groups Details\n\n")
        for g in duplicate_groups:
            f.write(f"### Group {g['group_id']}: `{g['base_slug']}`\n")
            f.write(f"- **Reason**: {g['reason']}\n")
            for p in g["posts"]:
                f.write(f"  - `{p['url']}` (Words: {p.get('word_count', 0)}, H1: {p.get('h1', '')})\n")
            f.write("\n")

        if thin_posts:
            f.write("## Thin Posts (<300 words)\n\n")
            for tp in thin_posts:
                f.write(f"- `{tp['url']}` — Words: {tp.get('word_count', 0)}, Title: {tp.get('title', '')}\n")
            f.write("\n")

        if violations:
            f.write("## Canonical Brand & Fact Violations in Metadata\n\n")
            for v in violations:
                f.write(f"- `{v['url']}`: {v['issue']}\n")
            f.write("\n")

    print(f"Saved summary report to {md_path}")

if __name__ == "__main__":
    main()
