# Blog Post Automations (one per post)

**Ideal publish time:** **9:00 AM America/New_York** (mid-morning local SEO + LLM crawl window)  
**Failsafe:** Grok one-shot at **9:05 AM ET** if Wix schedule has not fired

## Dual automation stack

| Layer | What it does |
|-------|----------------|
| **Primary — Wix native `UPDATE_SCHEDULE`** | Platform publishes the draft at the scheduled instant. Status = `SCHEDULED`. |
| **Backup — Grok task (one per post)** | At 9:05 AM ET, verifies the draft is live; force-publishes only if still unpublished. Email only on failure. |

## Per-post schedule

| Local date | 9:00 AM ET | Post | Wix draft ID | Grok automation |
|------------|------------|------|--------------|-----------------|
| 2026-08-06 | ✅ Live | Indemnitor / Co-Signer Guide | published | — |
| 2026-08-07 | SCHEDULED | Bail With Little/No Money (FL) | `0669d5bb-7542-4a14-88ce-08d9291a4260` | `blog-publish-no-money-fl` |
| 2026-08-08 | SCHEDULED | Immigration Bonds Florida | `2e7f3736-610b-4ec3-849a-5a8d00088a17` | `blog-publish-immigration-fl` |
| 2026-08-09 | SCHEDULED | No-Bond Hold Florida | `658bc7e1-c793-4170-872c-d7dc71e1ec08` | `blog-publish-no-bond-hold` |
| 2026-08-10 | SCHEDULED | Bail Collateral Shamrock Accepts | `a56002f9-4398-4280-a086-6fdfb039f098` | `blog-publish-collateral-fl` |
| 2026-08-11 | SCHEDULED | Lee vs Collier Bail Bonds | `eccad79c-a2f9-4c0b-a6e8-9ac947cb8e70` | `blog-publish-lee-vs-collier` |
| 2026-08-12 | SCHEDULED | Domestic Violence Bail FL | `10fece9b-dbf1-4fde-9371-993e7375fe46` | `blog-publish-dv-bail-fl` |

## SEO / LLM optimization applied to each scheduled draft

- Click-oriented **title** (benefit + Florida entity)
- **SEO title** ≤ 60 chars for `<title>`
- **Meta description** ≤ 160 chars with location + CTA phone
- **Keywords** (main + supporting) for Wix SEO settings
- **Hashtags** for discovery
- **Featured** flag for blog listing prominence
- **robots** meta: `index, follow, max-snippet`
- **og:title / og:description** for social/LLM card extraction
- **Author** = Shamrock Bail Bonds
- Body already has short-answer lede, H2 structure, disclaimer, CTA (citation-friendly for LLM bots)

## Manifest

See `wix-native-schedules.json` for API confirmation payloads.

## Note on near-duplicate posts (Aug 13–17)

Those titles already exist live — **no new publish automation** (avoids SEO cannibalization). Calendar events remain as **promote existing** social reminders only.
