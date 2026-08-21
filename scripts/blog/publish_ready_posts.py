#!/usr/bin/env python3
"""
Polish + publish docs/blog-posts-ready-to-publish/*.md to Wix Blog.

- Professional tone pass (metadata, disclaimer, CTA consistency)
- Markdown → Ricos rich content
- Create draft posts (bulk where possible)
- Publish day-0 post immediately; leave rest as drafts for calendar cadence
- Write publish-calendar.json for Google Calendar + human ops

Canonical categories (site):
  Bail Bonds, How Bail Bonds Work, Florida Legal Updates, County Spotlight, Bail Bond Tips
"""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POSTS_DIR = ROOT / "docs" / "blog-posts-ready-to-publish"
OUT_DIR = ROOT / "docs" / "blog-posts-ready-to-publish" / "_publish-run"
SITE_ID = "a00e3857-675a-493b-91d8-a1dbc5e7c499"
CLIENT_ID = "6f95cec8-3e98-48b9-b4e5-1fb92fcd9973"
MEMBER_ID = "2c0869f3-97e5-4b39-a629-31e1eea40b37"  # Brendan O'Neal
START = date(2026, 8, 6)  # publish calendar start
TZ = "America/New_York"

CATEGORIES = {
    "Bail Bonds": "b149c1e9-25b1-4c51-a236-c70ebfeb7de5",
    "How Bail Bonds Work": "174b07df-f139-470d-8cda-b3b9df88a045",
    "Florida Legal Updates": "cd48b96c-f242-4c5b-b4b4-11ef15731e80",
    "County Spotlight": "1ddbc7ab-5518-43a3-a914-f902e02c7820",
    "Bail Bond Tips": "95332c04-dc15-4127-8a66-029c411047d6",
}

# Map ready posts → category + skip if near-dupe of live post
# action: publish | draft_only | skip_exists
SCHEDULE = [
    {
        "file": "01-how-fast-can-shamrock-get-someone-out.md",
        "category": "How Bail Bonds Work",
        "action": "skip_exists",
        "exists_note": "Similar live: /single-post/how-fast-can-shamrock-bail-bonds-get-someone-out-of-jail-in-fort-myers",
    },
    {
        "file": "02-complete-guide-fort-myers-bail-bonds-2026.md",
        "category": "County Spotlight",
        "action": "skip_exists",
        "exists_note": "Similar live: The 2026 Complete Guide to Fort Myers Bail Bonds",
    },
    {
        "file": "03-bail-bonds-at-night-holidays.md",
        "category": "Bail Bond Tips",
        "action": "skip_exists",
        "exists_note": "Similar live: Can You Bail Someone Out of Jail at Night in Florida?",
    },
    {
        "file": "04-what-is-an-indemnitor-cosigner-guide.md",
        "category": "How Bail Bonds Work",
        "action": "publish",
    },
    {
        "file": "05-how-to-bail-someone-out-with-no-money.md",
        "category": "Bail Bond Tips",
        "action": "publish",
    },
    {
        "file": "06-immigration-bonds-florida-guide.md",
        "category": "Bail Bonds",
        "action": "publish",
    },
    {
        "file": "07-dui-bail-bonds-florida.md",
        "category": "Bail Bonds",
        "action": "skip_exists",
        "exists_note": "Similar live: Bail Bonds in Fort Myers for DUI Arrests",
    },
    {
        "file": "08-no-bond-hold-florida-what-to-do.md",
        "category": "Florida Legal Updates",
        "action": "publish",
    },
    {
        "file": "09-bail-bond-collateral-what-shamrock-accepts.md",
        "category": "How Bail Bonds Work",
        "action": "publish",  # distinct angle: what Shamrock accepts
    },
    {
        "file": "10-lee-county-vs-collier-county-bail-bonds.md",
        "category": "County Spotlight",
        "action": "publish",
    },
    {
        "file": "11-florida-bail-bond-laws-explained.md",
        "category": "Florida Legal Updates",
        "action": "skip_exists",
        "exists_note": "Similar live: Florida Bail Bond Laws: 2026 Updates",
    },
    {
        "file": "12-domestic-violence-bail-bonds-florida.md",
        "category": "Bail Bonds",
        "action": "publish",
    },
]

DISCLAIMER = (
    "This advisory publication is provided for institutional information and general educational purposes under Florida law. "
    "It does not constitute formal legal counsel. Bail bond requirements, statutory holds, and judicial release procedures "
    "are governed by Florida Statutes Chapters 903 and 648 and local judicial circuit administrative orders. "
    "For case-specific underwriting and immediate 24/7 jail release assistance, contact Shamrock Bail Bonds at (239) 332-2245 "
    "or consult a licensed Florida criminal defense attorney."
)

CTA = (
    "Need immediate assistance securing release for a loved one in Florida? "
    "Shamrock Bail Bonds provides 24/7 licensed bail underwriting and digital paperwork statewide. "
    "Call our dispatch desk at (239) 332-2245 or initiate your secure digital intake online at shamrockbailbonds.biz."
)


def load_token() -> str:
    path = Path.home() / f".wix/auth/{SITE_ID}.json"
    data = json.loads(path.read_text())
    issued = data.get("issuedAt") or 0
    expires = data.get("expiresIn") or 0
    if time.time() > issued + expires - 120:
        # refresh site token
        acc = json.loads((Path.home() / ".wix/auth/account.json").read_text())
        body = {
            "clientId": CLIENT_ID,
            "grantType": "refresh_token",
            "refreshToken": acc["refreshToken"],
            "siteId": SITE_ID,
        }
        resp = http_json("https://manage.wix.com/oauth2/token", body, extra_headers={
            "X-XSRF-TOKEN": "nocheck",
            "Cookie": "XSRF-TOKEN=nocheck",
            "User-Agent": "wix-cli",
        }, auth=None)
        data = {
            "accessToken": resp["access_token"],
            "refreshToken": resp.get("refresh_token", acc["refreshToken"]),
            "expiresIn": resp.get("expires_in", 900),
            "issuedAt": int(time.time()),
        }
        path.write_text(json.dumps(data))
    return data["accessToken"]


def http_json(url: str, body: dict | None = None, method: str | None = None, auth: str | None = "", extra_headers: dict | None = None):
    headers = {"Content-Type": "application/json", "wix-site-id": SITE_ID}
    if auth is not None:
        if auth == "":
            pass
        else:
            headers["Authorization"] = auth if not auth.startswith("Oauth") and not auth.startswith("Bearer") else auth
            if not headers["Authorization"].startswith("Bearer") and headers["Authorization"].startswith("Oauth"):
                headers["Authorization"] = headers["Authorization"]  # Wix accepts OauthNG tokens raw
    if extra_headers:
        headers.update(extra_headers)
    data = None if body is None else json.dumps(body).encode()
    m = method or ("POST" if body is not None else "GET")
    req = urllib.request.Request(url, data=data, headers=headers, method=m)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        raise RuntimeError(f"HTTP {e.code} {url}: {err[:800]}") from e


def text_node(text: str, bold: bool = False, italic: bool = False):
    decorations = []
    if bold:
        decorations.append({"type": "BOLD", "fontWeightValue": 700})
    if italic:
        decorations.append({"type": "ITALIC", "italicData": True})
    return {"type": "TEXT", "textData": {"text": text, "decorations": decorations}}


def parse_inline(text: str) -> list:
    """Parse **bold**, *italic*, [label](url) into TEXT nodes with decorations."""
    nodes = []
    pattern = re.compile(
        r"(\*\*[^*]+\*\*|\*[^*]+\*|\[([^\]]+)\]\(([^)]+)\)|`[^`]+`)"
    )
    pos = 0
    for m in pattern.finditer(text):
        if m.start() > pos:
            nodes.append(text_node(text[pos:m.start()]))
        token = m.group(0)
        if token.startswith("**"):
            nodes.append(text_node(token[2:-2], bold=True))
        elif token.startswith("*"):
            nodes.append(text_node(token[1:-1], italic=True))
        elif token.startswith("["):
            label, url = m.group(2), m.group(3)
            nodes.append({
                "type": "TEXT",
                "textData": {
                    "text": label,
                    "decorations": [{
                        "type": "LINK",
                        "linkData": {
                            "link": {"url": url, "target": "BLANK", "rel": {"nofollow": False}}
                        }
                    }]
                }
            })
        elif token.startswith("`"):
            nodes.append(text_node(token[1:-1]))
        pos = m.end()
    if pos < len(text):
        nodes.append(text_node(text[pos:]))
    if not nodes:
        nodes = [text_node(text)]
    return nodes


def paragraph(text: str) -> dict:
    return {
        "type": "PARAGRAPH",
        "nodes": parse_inline(text),
        "paragraphData": {},
    }


def heading(text: str, level: int = 2) -> dict:
    return {
        "type": "HEADING",
        "nodes": parse_inline(re.sub(r"^#+\s*", "", text)),
        "headingData": {"level": level, "textStyle": {"textAlignment": "AUTO"}},
    }


def bullet_list(items: list[str]) -> dict:
    return {
        "type": "BULLETED_LIST",
        "nodes": [
            {
                "type": "LIST_ITEM",
                "nodes": [{
                    "type": "PARAGRAPH",
                    "nodes": parse_inline(item),
                    "paragraphData": {},
                }],
            }
            for item in items
        ],
        "bulletedListData": {},
    }


def ordered_list(items: list[str]) -> dict:
    return {
        "type": "ORDERED_LIST",
        "nodes": [
            {
                "type": "LIST_ITEM",
                "nodes": [{
                    "type": "PARAGRAPH",
                    "nodes": parse_inline(item),
                    "paragraphData": {},
                }],
            }
            for item in items
        ],
        "orderedListData": {},
    }


def divider() -> dict:
    return {
        "type": "DIVIDER",
        "nodes": [],
        "dividerData": {
            "lineStyle": "SINGLE",
            "width": "LARGE",
            "alignment": "CENTER",
        },
    }


def md_to_ricos(body: str) -> dict:
    lines = body.splitlines()
    nodes = []
    i = 0
    bullet_buf: list[str] = []
    ordered_buf: list[str] = []
    para_buf: list[str] = []

    def flush_para():
        nonlocal para_buf
        if para_buf:
            text = " ".join(para_buf).strip()
            if text:
                nodes.append(paragraph(text))
            para_buf = []

    def flush_lists():
        nonlocal bullet_buf, ordered_buf
        flush_para()
        if bullet_buf:
            nodes.append(bullet_list(bullet_buf))
            bullet_buf = []
        if ordered_buf:
            nodes.append(ordered_list(ordered_buf))
            ordered_buf = []

    while i < len(lines):
        line = lines[i]
        raw = line.rstrip()
        stripped = raw.strip()

        # table rows → bullets
        if stripped.startswith("|") and "|" in stripped[1:]:
            flush_lists()
            # skip separator rows
            if re.match(r"^\|[\s\-:|]+\|$", stripped):
                i += 1
                continue
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            if cells:
                nodes.append(paragraph(" · ".join(cells)))
            i += 1
            continue

        if not stripped:
            flush_lists()
            i += 1
            continue

        if stripped == "---":
            flush_lists()
            nodes.append(divider())
            i += 1
            continue

        if stripped.startswith("### "):
            flush_lists()
            nodes.append(heading(stripped[4:], 3))
            i += 1
            continue
        if stripped.startswith("## "):
            flush_lists()
            nodes.append(heading(stripped[3:], 2))
            i += 1
            continue
        if stripped.startswith("# "):
            flush_lists()
            # top title handled outside
            i += 1
            continue

        m_ord = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        if m_ord:
            flush_para()
            if bullet_buf:
                nodes.append(bullet_list(bullet_buf))
                bullet_buf = []
            ordered_buf.append(m_ord.group(2))
            i += 1
            continue

        m_bul = re.match(r"^[-*]\s+(.+)$", stripped)
        if m_bul:
            flush_para()
            if ordered_buf:
                nodes.append(ordered_list(ordered_buf))
                ordered_buf = []
            bullet_buf.append(m_bul.group(1))
            i += 1
            continue

        # normal text
        if bullet_buf or ordered_buf:
            flush_lists()
        para_buf.append(stripped)
        i += 1

    flush_lists()
    return {"nodes": nodes}


def polish_markdown(raw: str, publish_label: str) -> tuple[str, str, str]:
    """Return title, excerpt, polished body (without H1)."""
    lines = raw.splitlines()
    title = "Untitled"
    body_start = 0
    for idx, line in enumerate(lines):
        if line.startswith("# "):
            title = line[2:].strip()
            body_start = idx + 1
            break

    # Drop old meta line Published: ...
    rest = lines[body_start:]
    cleaned = []
    for line in rest:
        if re.match(r"^\*\*Published:\*\*", line.strip()):
            continue
        cleaned.append(line)

    body = "\n".join(cleaned).strip()

    # Enterprise Institutional Meta Block
    meta = f"**Published:** {publish_label} | **Editorial Board:** Shamrock Legal Intelligence | **Regulatory Review:** Licensed Florida Bail Specialist (F.S. Ch. 648)"
    if not body.startswith("**Published:**"):
        body = meta + "\n\n---\n\n" + body

    # Ensure Executive Summary remains; add disclaimer + CTA at end if missing
    lower = body.lower()
    if "not legal advice" not in lower and "formal legal counsel" not in lower:
        body += f"\n\n---\n\n## Institutional Legal Advisory\n\n{DISCLAIMER}\n"
    if "(239) 332-2245" not in body[-800:]:
        body += f"\n\n## 24/7 Immediate Jail Release Assistance\n\n{CTA}\n"

    # Excerpt from Executive Summary / Short Answer if present
    excerpt = ""
    m = re.search(r"## (?:Executive Summary|The Short Answer|Key Takeaways)\s*\n+(.+?)(?:\n---|\n## )", body, re.S)
    if m:
        excerpt = re.sub(r"\*\*|__|`|#", "", m.group(1)).strip()
        excerpt = re.sub(r"\s+", " ", excerpt)[:480]
    if not excerpt:
        excerpt = f"{title}. Authoritative Florida bail bond intelligence and procedural guidance from Shamrock Bail Bonds."

    # Institutional tone upgrades
    replacements = [
        (r"\bright now\b", "today"),
        (r"\bCall anyway\b", "Contact our dispatch desk"),
        (r"\bthe real deal\b", "rigorous statutory accreditation"),
        (r"## The Short Answer", "## Executive Summary & Key Takeaways"),
    ]
    for pat, rep in replacements:
        body = re.sub(pat, rep, body, flags=re.I)

    return title, excerpt, body


def build_draft(title: str, excerpt: str, body: str, category_id: str) -> dict:
    rich = md_to_ricos(body)
    return {
        "title": title[:200],
        "excerpt": excerpt[:500],
        "memberId": MEMBER_ID,
        "categoryIds": [category_id],
        "commentingEnabled": True,
        "language": "en",
        "richContent": rich,
        "seoData": {
            "tags": [
                {
                    "type": "title",
                    "children": title[:60] if len(title) > 60 else title,
                    "custom": False,
                    "disabled": False,
                },
                {
                    "type": "meta",
                    "props": {"name": "description", "content": excerpt[:160]},
                    "children": "",
                    "custom": False,
                    "disabled": False,
                },
            ]
        },
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    token = load_token()
    results = []
    publish_queue = []  # (day_offset, draft_payload, meta)

    day_idx = 0
    for item in SCHEDULE:
        path = POSTS_DIR / item["file"]
        if not path.exists():
            results.append({"file": item["file"], "status": "missing"})
            continue

        pub_date = START + timedelta(days=day_idx)
        publish_label = pub_date.strftime("%B %d, %Y")
        raw = path.read_text(encoding="utf-8")
        title, excerpt, body = polish_markdown(raw, publish_label)

        # Write polished source back (professional pass)
        polished_path = OUT_DIR / f"polished-{item['file']}"
        polished_md = f"# {title}\n\n{body}\n"
        polished_path.write_text(polished_md, encoding="utf-8")
        # Also update original folder with polished professional version
        path.write_text(polished_md, encoding="utf-8")

        cat_id = CATEGORIES[item["category"]]
        entry = {
            "file": item["file"],
            "title": title,
            "category": item["category"],
            "scheduled_date": pub_date.isoformat(),
            "action": item["action"],
            "excerpt": excerpt,
        }

        if item["action"] == "skip_exists":
            entry["status"] = "skipped_near_duplicate"
            entry["note"] = item.get("exists_note", "")
            results.append(entry)
            day_idx += 1
            continue

        draft = build_draft(title, excerpt, body, cat_id)
        publish_queue.append((day_idx, draft, entry))
        day_idx += 1

    # Create posts: first publishable immediately, rest as drafts
    first_done = False
    for day_offset, draft, entry in publish_queue:
        try:
            # create as draft first
            should_publish = (not first_done) and entry["action"] == "publish"
            payload = {"draftPost": draft, "publish": should_publish, "fieldsets": ["URL"]}
            resp = http_json(
                "https://www.wixapis.com/blog/v3/draft-posts",
                payload,
                auth=token,
            )
            draft_post = resp.get("draftPost") or resp
            draft_id = draft_post.get("id")
            entry["draft_id"] = draft_id
            entry["url"] = (draft_post.get("url") or {})
            if isinstance(entry["url"], dict):
                base = entry["url"].get("base", "https://www.shamrockbailbonds.biz")
                path = entry["url"].get("path", "")
                entry["public_url"] = f"{base}{path}" if path else None
            else:
                entry["public_url"] = None

            if should_publish:
                entry["status"] = "published"
                first_done = True
                # If API created draft without publishing when publish:true failed soft
                if draft_post.get("status") not in ("PUBLISHED", None) and draft_id:
                    try:
                        pub = http_json(
                            f"https://www.wixapis.com/blog/v3/draft-posts/{draft_id}/publish",
                            {},
                            auth=token,
                        )
                        entry["post_id"] = pub.get("postId")
                        entry["status"] = "published"
                    except Exception as pe:
                        entry["status"] = "draft_created_publish_failed"
                        entry["error"] = str(pe)[:300]
            else:
                entry["status"] = "draft_scheduled"
            print(f"OK {entry['status']}: {entry['title'][:70]}")
        except Exception as e:
            entry["status"] = "error"
            entry["error"] = str(e)[:500]
            print(f"ERR {entry['title'][:50]}: {e}")
            # refresh token once on auth errors
            if "401" in str(e) or "403" in str(e):
                token = load_token()
        results.append(entry)
        time.sleep(0.8)  # be gentle on API

    # Calendar plan (all 12 days)
    calendar = []
    for i, item in enumerate(SCHEDULE):
        d = START + timedelta(days=i)
        matching = next((r for r in results if r.get("file") == item["file"]), {})
        calendar.append({
            "date": d.isoformat(),
            "file": item["file"],
            "title": matching.get("title") or item["file"],
            "status": matching.get("status"),
            "public_url": matching.get("public_url"),
            "draft_id": matching.get("draft_id"),
            "action": matching.get("action") or item["action"],
            "note": matching.get("note") or matching.get("error") or item.get("exists_note"),
            "category": item["category"],
        })

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "site_id": SITE_ID,
        "start_date": START.isoformat(),
        "results": results,
        "calendar": calendar,
    }
    (OUT_DIR / "publish-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (OUT_DIR / "publish-calendar.json").write_text(json.dumps(calendar, indent=2), encoding="utf-8")

    # Human-readable schedule
    lines = [
        "# Bail Blog Publish Calendar",
        f"Start: {START.isoformat()} · Timezone: {TZ}",
        "",
        "| Date | Status | Title | URL / Note |",
        "|------|--------|-------|------------|",
    ]
    for c in calendar:
        url = c.get("public_url") or c.get("draft_id") or "—"
        note = (c.get("note") or "")[:80]
        lines.append(
            f"| {c['date']} | {c.get('status')} | {c.get('title','')[:50]} | {url if isinstance(url, str) and url.startswith('http') else note} |"
        )
    (OUT_DIR / "PUBLISH_CALENDAR.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\nWrote", OUT_DIR / "publish-report.json")
    print("Published/drafted counts:",
          sum(1 for r in results if r.get("status") == "published"),
          "published,",
          sum(1 for r in results if r.get("status") == "draft_scheduled"),
          "drafts,",
          sum(1 for r in results if r.get("status") == "skipped_near_duplicate"),
          "skipped")


if __name__ == "__main__":
    main()
