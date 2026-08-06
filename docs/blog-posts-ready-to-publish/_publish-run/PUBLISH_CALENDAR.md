# Bail Blog Publish Calendar

**Start:** 2026-08-06 · **Timezone:** America/New_York  
**Source folder:** `docs/blog-posts-ready-to-publish/`  
**Publisher script:** `scripts/blog/publish_ready_posts.py`  
**Google Calendar:** 12 all-day events on `admin@shamrockbailbonds.biz` primary calendar

## Cadence

| Date | Action | Title | Status |
|------|--------|-------|--------|
| **2026-08-06** | LIVE + promote | What Is an Indemnitor? The Co-Signer's Complete Guide to Bail Bonds | ✅ Published |
| 2026-08-07 | Publish draft | How to Bail Someone Out of Jail Without Any Money | Draft ready |
| 2026-08-08 | Publish draft | Bail Bonds for Immigration Detainees in Florida | Draft ready |
| 2026-08-09 | Publish draft | What Is a "No Bond" Hold in Florida | Draft ready |
| 2026-08-10 | Publish draft | Bail Bond Collateral: What Shamrock Accepts | Draft ready |
| 2026-08-11 | Publish draft | Lee County vs. Collier County Bail Bonds | Draft ready |
| 2026-08-12 | Publish draft | Domestic Violence Bail Bonds in Florida | Draft ready |
| 2026-08-13 | Promote existing | How Fast Can Shamrock Get Someone Out (near-dupe live) | Skip re-publish |
| 2026-08-14 | Promote existing | Fort Myers Complete Guide 2026 (already live) | Skip re-publish |
| 2026-08-15 | Promote existing | Night & Holiday Bail Bonds (already live) | Skip re-publish |
| 2026-08-16 | Promote existing | DUI Bail Bonds (already live) | Skip re-publish |
| 2026-08-17 | Promote existing | Florida Bail Bond Laws (already live) | Skip re-publish |

## Live today

https://www.shamrockbailbonds.biz/single-post/what-is-an-indemnitor-the-co-signer-s-complete-guide-to-bail-bonds

## How to publish each draft day

1. Open [Wix Blog](https://manage.wix.com/dashboard/a00e3857-675a-493b-91d8-a1dbc5e7c499/blog) → **Drafts**
2. Find the title for that calendar day
3. Click **Publish**
4. Optional: share to social

Or via API (site token required):

```bash
POST https://www.wixapis.com/blog/v3/draft-posts/{draftPostId}/publish
```

Draft IDs are in `publish-report.json` and each Google Calendar event description.

## Professional polish applied

All 12 source markdown files were updated with:

- Current publish-date metadata
- Consistent educational disclaimer (not legal advice)
- Closing CTA with phone + site
- Light tone cleanup for professional voice

## Why 5 were not re-published

Near-duplicate posts already exist on the live blog. Re-publishing would cannibalize SEO. Calendar days for those titles are **promote existing** social shares instead.
