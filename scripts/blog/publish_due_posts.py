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

CALENDAR_DIR = ROOT / "docs" / "blog-posts-ready-to-publish" / "2026-10-october-november-calendar"
CALENDAR_JSON = CALENDAR_DIR / "publish-calendar.json"
CALENDAR_MD = CALENDAR_DIR / "PUBLISH_CALENDAR.md"


def get_eastern_today() -> date:
    """Returns today's date in America/New_York (UTC-4 during EDT)."""
    # Offset -4 hours for EDT
    utc_now = datetime.now(timezone.utc)
    from datetime import timedelta
    edt_now = utc_now - timedelta(hours=4)
    return edt_now.date()


def load_calendar() -> list[dict]:
    if not CALENDAR_JSON.exists():
        raise FileNotFoundError(f"Calendar not found at {CALENDAR_JSON}")
    return json.loads(CALENDAR_JSON.read_text(encoding="utf-8"))


def save_calendar(calendar: list[dict]):
    CALENDAR_JSON.write_text(json.dumps(calendar, indent=2), encoding="utf-8")
    update_markdown_table(calendar)


def update_markdown_table(calendar: list[dict]):
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
    for item in calendar:
        day = item.get("day")
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
    total = len(calendar)
    live = sum(1 for c in calendar if c.get("status") == "PUBLISHED_LIVE")
    scheduled = sum(1 for c in calendar if c.get("status") == "DRAFT_SCHEDULED")
    lines.append(f"**Progress**: {live}/{total} Published Live · {scheduled} Scheduled Drafts Remaining")
    lines.append(f"*Last updated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}*")
    CALENDAR_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def publish_draft(draft_id: str, token: str) -> dict:
    url = f"https://www.wixapis.com/blog/v3/draft-posts/{draft_id}/publish"
    return http_json(url, {}, method="POST", auth=token)


def main():
    parser = argparse.ArgumentParser(description="Publish due scheduled blog drafts to Wix")
    parser.add_argument("--dry-run", action="store_true", help="Preview due posts without making API changes")
    parser.add_argument("--date", type=str, help="Target date YYYY-MM-DD (defaults to today in America/New_York)")
    parser.add_argument("--status", action="store_true", help="Print calendar status summary and exit")
    parser.add_argument("--force-id", type=str, help="Publish specific draft ID regardless of date")
    args = parser.parse_args()

    calendar = load_calendar()

    if args.status:
        total = len(calendar)
        live = sum(1 for c in calendar if c.get("status") == "PUBLISHED_LIVE")
        scheduled = sum(1 for c in calendar if c.get("status") == "DRAFT_SCHEDULED")
        print(f"\n☘️ Shamrock Bail Bonds Editorial Calendar Status:")
        print(f"   Total Posts:     {total}")
        print(f"   Published Live:  {live}")
        print(f"   Scheduled Drafts:{scheduled}")
        print(f"   Target Window:   {calendar[0]['date']} to {calendar[-1]['date']}\n")
        for item in calendar:
            st = "🟢 LIVE     " if item.get("status") == "PUBLISHED_LIVE" else "⏳ SCHEDULED"
            print(f"   [{item['date']}] {st} Day {item['day']:02d}: {item['title'][:55]}")
        return

    today = date.fromisoformat(args.date) if args.date else get_eastern_today()
    print(f"\n☘️ Checking scheduled blog posts for date: {today.isoformat()} (EDT/New York)")

    due_posts = []
    for item in calendar:
        if args.force_id and item.get("draft_id") == args.force_id:
            due_posts.append(item)
            continue
        item_date = date.fromisoformat(item["date"])
        if item.get("status") == "DRAFT_SCHEDULED" and item_date <= today:
            due_posts.append(item)

    if not due_posts:
        print(f"✓ No posts are currently due for publication (all posts scheduled for {today.isoformat()} or earlier are up to date).")
        return

    print(f"Found {len(due_posts)} post(s) due for publication:")
    for post in due_posts:
        print(f"  • Day {post['day']:02d} ({post['date']}): {post['title']}")

    if args.dry_run:
        print("\n[DRY RUN] No API requests sent. Use without --dry-run to publish.")
        return

    # Authenticate and publish
    print("\nAuthenticating with Wix Blog API...")
    token = load_token()
    published_count = 0
    errors = []

    for post in due_posts:
        draft_id = post["draft_id"]
        title = post["title"]
        print(f"\nPublishing Day {post['day']:02d}: '{title}' (draft: {draft_id})...")
        try:
            res = publish_draft(draft_id, token)
            post_id = res.get("postId") or draft_id
            post["status"] = "PUBLISHED_LIVE"
            post["post_id"] = post_id
            post["published_at"] = datetime.now(timezone.utc).isoformat()
            published_count += 1
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
                    print(f"  ✅ SUCCESS on retry: Published live as post ID {post_id}")
                except Exception as retry_err:
                    post["publish_error"] = str(retry_err)[:300]
                    errors.append((draft_id, str(retry_err)))
            else:
                post["publish_error"] = err_msg[:300]
                errors.append((draft_id, err_msg))

    save_calendar(calendar)
    print(f"\nUpdated {CALENDAR_JSON.name} and {CALENDAR_MD.name}")
    print(f"Successfully published: {published_count}/{len(due_posts)}")

    if errors:
        print(f"Encountered {len(errors)} error(s):")
        for draft_id, err in errors:
            print(f"  • {draft_id}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
