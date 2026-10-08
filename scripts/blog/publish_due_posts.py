#!/usr/bin/env python3
"""
Automated Daily Blog Post Publisher for Shamrock Bail Bonds

Publishes scheduled draft posts from the 30-Day Florida Statewide Editorial Calendar
(Oct 7 - Nov 5, 2026) when their target date arrives.

Usage:
  python3 scripts/blog/publish_due_posts.py                  # Publish any due drafts (<= today ET)
  python3 scripts/blog/publish_due_posts.py --dry-run        # Preview due drafts without publishing
  python3 scripts/blog/publish_due_posts.py --date 2026-10-08 # Target specific date
  python3 scripts/blog/publish_due_posts.py --status         # Print current calendar status
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path

# Add scripts/blog to python path
ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT / "scripts" / "blog"
sys.path.insert(0, str(SCRIPTS_DIR))

from publish_ready_posts import load_token, http_json, SITE_ID

CALENDARS = [
    {
        "name": "Month 1 (Oct 7 - Nov 5, 2026)",
        "json": ROOT / "docs" / "blog-posts-ready-to-publish" / "2026-10-october-november-calendar" / "publish-calendar.json",
        "md": ROOT / "docs" / "blog-posts-ready-to-publish" / "2026-10-october-november-calendar" / "PUBLISH_CALENDAR.md",
    },
    {
        "name": "Annual 2026-2027 (Nov 6, 2026 - Oct 6, 2027)",
        "json": ROOT / "docs" / "blog-posts-ready-to-publish" / "annual-editorial-calendar-2026-2027" / "annual-calendar.json",
        "md": ROOT / "docs" / "blog-posts-ready-to-publish" / "annual-editorial-calendar-2026-2027" / "ANNUAL_EDITORIAL_CALENDAR.md",
    }
]


def get_eastern_today() -> date:
    """Returns today's date in America/New_York (UTC-4 during EDT)."""
    utc_now = datetime.now(timezone.utc)
    from datetime import timedelta
    edt_now = utc_now - timedelta(hours=4)
    return edt_now.date()


def load_all_calendars() -> list[dict]:
    """Load items from all existing calendar manifests."""
    loaded = []
    for cal in CALENDARS:
        if cal["json"].exists():
            items = json.loads(cal["json"].read_text(encoding="utf-8"))
            for it in items:
                it["_cal_name"] = cal["name"]
                it["_cal_json"] = cal["json"]
                it["_cal_md"] = cal["md"]
            loaded.append({"meta": cal, "items": items})
    return loaded


def save_calendar_manifest(cal_entry: dict):
    """Save items back to their respective json and markdown files."""
    json_path = cal_entry["meta"]["json"]
    md_path = cal_entry["meta"]["md"]
    items = cal_entry["items"]

    # Filter out internal helper keys before dumping to json
    clean_items = []
    for it in items:
        c = {k: v for k, v in it.items() if not k.startswith("_")}
        clean_items.append(c)

    json_path.write_text(json.dumps(clean_items, indent=2), encoding="utf-8")

    # Update markdown table
    if "Month 1" in cal_entry["meta"]["name"]:
        update_month1_markdown(clean_items, md_path)
    else:
        update_annual_markdown(clean_items, md_path)


def update_month1_markdown(items: list[dict], md_path: Path):
    lines = [
        "# Florida Bail Bonds Statewide Editorial Calendar (Oct 7 - Nov 5, 2026)",
        "",
        "> **Statewide Coverage**: All major Florida counties, judicial circuits, and jail facilities.",
        "> **Statutory Compliance**: Fla. Stat. Chapters 648 & 903, Fla. R. Crim. P. 3.131.",
        "> **Optimization**: AI Overviews & Perplexity GEO structured, verified high-resolution imagery.",
        "",
        "| Day | Date | County / Topic | Status | Draft / Post ID | Hero Asset |",
        "|---|---|---|---|---|---|",
    ]
    for item in items:
        day = item.get("day", 0)
        d = item.get("date")
        title = item.get("title", "")[:45]
        status = item.get("status", "")
        draft_id = item.get("draft_id", "")
        post_id = item.get("post_id", "")
        id_display = post_id if status == "PUBLISHED_LIVE" else draft_id
        hero = item.get("hero_image", "")[:28]
        status_badge = "🟢 LIVE" if status == "PUBLISHED_LIVE" else "⏳ SCHEDULED" if status == "DRAFT_SCHEDULED" else f"⚠️ {status}"
        lines.append(f"| {day} | {d} | {title} | {status_badge} | `{id_display}` | {hero} |")

    lines.append("")
    total = len(items)
    live = sum(1 for c in items if c.get("status") == "PUBLISHED_LIVE")
    scheduled = sum(1 for c in items if c.get("status") == "DRAFT_SCHEDULED")
    lines.append(f"**Progress**: {live}/{total} Published Live · {scheduled} Scheduled Drafts Remaining")
    lines.append(f"*Last updated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}*")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def update_markdown_table(calendar: list[dict], md_path: Path | None = None):
    """Backward-compatible helper for Month 1 markdown table update."""
    if md_path is None:
        md_path = ROOT / "docs" / "blog-posts-ready-to-publish" / "2026-10-october-november-calendar" / "PUBLISH_CALENDAR.md"
    update_month1_markdown(calendar, md_path)


def update_annual_markdown(items: list[dict], md_path: Path):
    lines = [
        "# Shamrock Bail Bonds — 1-Year Florida Statewide Editorial Calendar",
        "**Active Horizon:** November 6, 2026 – October 6, 2027",
        f"**Cadence:** 2 to 3 Posts per Week (~10-12 Posts/Month) · **Total Posts:** {len(items)}",
        "**Compliance:** Fla. Stat. Chapters 648 & 903, Fla. R. Crim. P. 3.131",
        "",
        "| # | Target Date | Topic / Locality | Category | Status | Draft ID | Hero Image |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in items:
        badge = "🟢 LIVE" if r.get("status") == "PUBLISHED_LIVE" else "📅 SCHEDULED" if r.get("status") == "DRAFT_SCHEDULED" else f"⚠️ {r.get('status')}"
        d_id = r.get("post_id") or r.get("draft_id", "N/A")
        hero = r.get("hero_image", "courthouse.jpg")[:24]
        lines.append(f"| {r.get('number', 0):03d} | {r['date']} | {r['title'][:45]} | {r.get('category', 'Bail Bonds')} | {badge} | `{d_id}` | {hero} |")

    lines.append("")
    total = len(items)
    live = sum(1 for c in items if c.get("status") == "PUBLISHED_LIVE")
    scheduled = sum(1 for c in items if c.get("status") == "DRAFT_SCHEDULED")
    lines.append(f"**Progress**: {live}/{total} Published Live · {scheduled} Scheduled Drafts Remaining")
    lines.append(f"*Last updated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}*")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def publish_draft(draft_id: str, token: str) -> dict:
    url = f"https://www.wixapis.com/blog/v3/draft-posts/{draft_id}/publish"
    return http_json(url, {}, method="POST", auth=token)


def main():
    parser = argparse.ArgumentParser(description="Publish due scheduled blog drafts to Wix across all editorial calendars")
    parser.add_argument("--dry-run", action="store_true", help="Preview due posts without making API changes")
    parser.add_argument("--date", type=str, help="Target date YYYY-MM-DD (defaults to today in America/New_York)")
    parser.add_argument("--status", action="store_true", help="Print calendar status summary and exit")
    parser.add_argument("--force-id", type=str, help="Publish specific draft ID regardless of date")
    args = parser.parse_args()

    calendars = load_all_calendars()
    if not calendars:
        print("❌ No calendar manifests found.")
        sys.exit(1)

    if args.status:
        grand_total = 0
        grand_live = 0
        grand_scheduled = 0

        print(f"\n☘️ Shamrock Bail Bonds — Statewide 1-Year Editorial Publishing Status")
        print("=" * 80)
        for cal in calendars:
            items = cal["items"]
            total = len(items)
            live = sum(1 for c in items if c.get("status") == "PUBLISHED_LIVE")
            scheduled = sum(1 for c in items if c.get("status") == "DRAFT_SCHEDULED")
            grand_total += total
            grand_live += live
            grand_scheduled += scheduled

            print(f"\n📅 {cal['meta']['name']}:")
            print(f"   Total Posts:      {total}")
            print(f"   Published Live:   {live} 🟢")
            print(f"   Scheduled Drafts: {scheduled} ⏳")
            if items:
                print(f"   Active Dates:     {items[0]['date']} to {items[-1]['date']}")
            print("-" * 50)
            for item in items[:5]:
                st = "🟢 LIVE     " if item.get("status") == "PUBLISHED_LIVE" else "⏳ SCHEDULED"
                num = item.get("day") or item.get("number") or 0
                print(f"   [{item['date']}] {st} #{num:02d}: {item['title'][:50]}")
            if len(items) > 5:
                print(f"   ... and {len(items)-5} more posts")

        print("=" * 80)
        print(f"GRAND TOTAL (1-Year Horizon): {grand_total} Posts | {grand_live} Live | {grand_scheduled} Scheduled in Wix")
        print("=" * 80 + "\n")
        return

    today = date.fromisoformat(args.date) if args.date else get_eastern_today()
    print(f"\n☘️ Checking scheduled blog posts for date: {today.isoformat()} (EDT/New York)")

    due_posts = []
    for cal in calendars:
        for item in cal["items"]:
            if args.force_id and item.get("draft_id") == args.force_id:
                item["_cal_ref"] = cal
                due_posts.append(item)
                continue
            item_date = date.fromisoformat(item["date"])
            if item.get("status") == "DRAFT_SCHEDULED" and item_date <= today:
                item["_cal_ref"] = cal
                due_posts.append(item)

    if not due_posts:
        print(f"✓ No posts are currently due for publication (all posts scheduled for {today.isoformat()} or earlier are up to date).")
        return

    print(f"Found {len(due_posts)} post(s) due for publication:")
    for post in due_posts:
        num = post.get("day") or post.get("number") or 0
        print(f"  • [{post.get('_cal_name', 'Calendar')}] #{num:02d} ({post['date']}): {post['title']}")

    if args.dry_run:
        print("\n[DRY RUN] No API requests sent. Use without --dry-run to publish.")
        return

    # Authenticate and publish
    print("\nAuthenticating with Wix Blog API...")
    token = load_token()
    published_count = 0
    errors = []
    modified_calendars = set()

    for post in due_posts:
        draft_id = post["draft_id"]
        title = post["title"]
        num = post.get("day") or post.get("number") or 0
        print(f"\nPublishing #{num:02d}: '{title}' (draft: {draft_id})...")
        try:
            res = publish_draft(draft_id, token)
            post_id = res.get("postId") or draft_id
            post["status"] = "PUBLISHED_LIVE"
            post["post_id"] = post_id
            post["published_at"] = datetime.now(timezone.utc).isoformat()
            published_count += 1
            modified_calendars.add(post.get("_cal_name"))
            print(f"  ✅ SUCCESS: Published live as post ID {post_id}")
            time.sleep(1.0)
        except Exception as e:
            err_msg = str(e)
            print(f"  ❌ FAILED: {err_msg}")
            # Refresh token once on auth error and retry
            if "401" in err_msg or "403" in err_msg:
                print("  Refreshing auth token and retrying once...")
                token = load_token()
                try:
                    res = publish_draft(draft_id, token)
                    post_id = res.get("postId") or draft_id
                    post["status"] = "PUBLISHED_LIVE"
                    post["post_id"] = post_id
                    post["published_at"] = datetime.now(timezone.utc).isoformat()
                    published_count += 1
                    modified_calendars.add(post.get("_cal_name"))
                    print(f"  ✅ SUCCESS on retry: Published live as post ID {post_id}")
                except Exception as retry_err:
                    post["publish_error"] = str(retry_err)[:300]
                    errors.append((draft_id, str(retry_err)))
            else:
                post["publish_error"] = err_msg[:300]
                errors.append((draft_id, err_msg))

    # Save any modified calendars
    for cal in calendars:
        if cal["meta"]["name"] in modified_calendars:
            save_calendar_manifest(cal)
            print(f"Updated {cal['meta']['json'].name} and {cal['meta']['md'].name}")

    print(f"\nSuccessfully published: {published_count}/{len(due_posts)}")

    if errors:
        print(f"Encountered {len(errors)} error(s):")
        for draft_id, err in errors:
            print(f"  • {draft_id}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
