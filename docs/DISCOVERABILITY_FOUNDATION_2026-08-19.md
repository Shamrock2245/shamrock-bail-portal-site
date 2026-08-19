# Discoverability Foundation — SEO, GEO, AI Search, and Trusted-Channel Visibility

**Date:** 2026-08-19  
**Scope:** Wix/Velo public marketing surfaces only. Protected portals, DocuSeal links, case data, personal information, and external production workflows are excluded.

## Executive conclusion

Shamrock already has an unusually strong discoverability foundation. The production site exposes a public XML sitemap, a live `llms.txt` endpoint, an LLM semantic sitemap, county and First Appearance page patterns, structured-data utilities, public blog RSS, and explicit crawler permissions for major search and AI user agents. The purpose of this hardening pass is therefore **not to add duplicate sitemaps, duplicate schemas, or generic AI copy**. It is to correct the few foundational inconsistencies and to formalize the operating practices that turn these assets into durable visibility.

The implemented code correction aligns all 67 county links in the AI-facing semantic-sitemap sources with the live canonical route pattern, `/florida-bail-bonds/{county-slug}`. The previously emitted `-county` paths were confirmed not to resolve on representative county URLs; emitting invalid canonical paths wastes crawl attention and weakens citation reliability.

> **Search and AI discovery depend on consistent public evidence.** A crawler, map product, or answer engine should encounter the same legal name, office address, 24/7 primary phone, service-area framing, county URL pattern, and factual caveats across every public surface.

## Existing foundation retained without duplication

| Foundation | Existing implementation retained | Reason it remains the correct control |
|---|---|---|
| Public crawl boundary | `seo/robots.txt` permits search and answer-engine bots on public pages and disallows member portals, API noise, lightbox query variants, and private utility routes | Keeps public authority crawlable without exposing sensitive workflow surfaces |
| Standard sitemap | Wix-native sitemap plus `/_functions/sitemap` | Public routes are discoverable while portal routes stay excluded |
| AI retrieval surfaces | `/_functions/llmsTxt`, `/_functions/llmSitemap`, `llm-sitemap.md`, blog RSS, and the Wix Site MCP reference | Provides public, text-first retrieval paths without placing operational data in HTML metadata |
| Entity consistency | `src/backend/seoConfig.js` centralizes business name, NAP, phones, service coverage, hours, social profiles, and service information | Prevents conflicting entity facts across page scripts and schema |
| County structured data | Existing county SEO and rich-results utilities | Supports consistent county titles, descriptions, canonicals, breadcrumbs, and local-service information |
| Voice and image discoverability | Existing `SpeakableSpecification` support and image-alt audit | Retains the foundation; editor-managed media still needs operating discipline |
| Protected paperwork boundary | Portal `noindex` directives, robots exclusions, and the DocuSeal-only launchpad | Prevents a sensitive signing flow from becoming a discovery surface |

## Implemented foundation corrections

| Change | Files | Why it matters |
|---|---|---|
| Corrected 67 AI semantic-sitemap service URLs from `/{slug}-county` to `/{slug}` | `src/backend/llmSitemapData.js`, `src/public/llm-sitemap.md`, `llm-sitemap.md` | Aligns AI-facing citations with the live county pages and the public XML sitemap |
| Removed direct legacy signing entry points from the indemnitor portal, fallback ID lightbox, staff portal, and generic Wix signing abstraction | Portal and backend files listed in `CURRENT_PAPERWORK_ARCHITECTURE.md` | Keeps non-public signing data out of crawlable and client-controlled pathways while preserving a secure DocuSeal-only workflow |
| Established current-state architecture documents | `CURRENT_PAPERWORK_ARCHITECTURE.md` and this guide | Stops current documentation from reintroducing obsolete provider assumptions or duplicate SEO work |

## Public-content operating rules

Every public page must answer one specific urgent question in the first visible section. County pages should answer where the person is held, the county and court context, the next safe step, and how to reach Shamrock. They should link only to verified public sheriff, clerk, court, and Shamrock pages; they must not imply official affiliation or promise a release time.

Content should remain specific rather than programmatically repetitive. County pages may share a structurally consistent template, but their jail facts, court context, city coverage, local links, First Appearance information, and FAQs must be accurate to the county. The public content should cite or link to official sources where useful, state that Shamrock does not provide legal advice, and avoid publishing personal case information.

The blog should function as an evidence library rather than a volume target. Each article should identify an author or reviewed-by role where appropriate, state a publish and update date, answer a discrete Florida bail question, link to the relevant county or First Appearance hub, and link outward only to relevant official sources. Repeated premium articles with overlapping intent should be consolidated or canonicalized in the Wix Editor rather than expanded.

## Owner-operated discovery channels not solved by code

The channels below complement the site code. They require an authorized owner or manager to claim, verify, and maintain the listings. Google explains that verification gives the business ownership of its profile and the ability to keep its information accurate.[1] Bing Places offers a free business listing and links to Bing Webmaster Tools for SEO diagnostics.[2]

| Priority | Channel | Required foundation action | Non-negotiable consistency rule |
|---|---|---|---|
| **1** | Google Business Profile and Google Search Console | Claim and verify the profile; confirm name, phone, address/service area, business category, hours, photos, review response process, website, and all submitted sitemaps | Use the canonical NAP in `seoConfig.js`; do not add a second office or an unverified service location |
| **1** | Bing Places and Bing Webmaster Tools | Claim the business, import only after checking the imported data, verify listing facts, submit the canonical sitemap, and monitor crawl errors | Match Google and site NAP exactly; do not inherit stale provider, suite, or phone data |
| **1** | Apple Maps / Apple Business Connect | Claim or correct the Fort Myers office card, phone, hours, website, and category through the current Apple business-listing workflow | Keep the physical office distinct from statewide service coverage |
| **2** | Major entity profiles | Confirm and maintain Yelp, Facebook, Instagram, LinkedIn, YouTube, and any established BBB or local chamber profiles | Link to the canonical website and preserve the exact business name; do not create duplicate profiles |
| **2** | Florida licensing evidence | Publish a carefully worded licensing/credentials page that links to the appropriate official state verification source, subject to legal review | State only current, verifiable license and agency facts; never invent a license number or endorsement |
| **2** | Local citations | Audit existing high-quality local and industry listings before adding any. Correct duplicates and stale addresses rather than buying bulk citations | Every listing must use the same legal name, phone, URL, office address, and hours |
| **3** | Media and community authority | Earn legitimate references through Florida bail education, responsible community resources, local journalism, and professional associations where permitted | No link schemes, paid anchor manipulation, fake reviews, or misleading law-enforcement affiliation |
| **3** | Social and video search | Publish short, county-specific education pieces that link back to the matching canonical service or blog page and retain transcript/caption text | Each asset needs a real topic, accurate location context, and a canonical destination—not a thin repost |

## Search, map, and AI measurement cadence

The operating team should review a small, repeatable measurement set each month rather than making reactive keyword changes. Google Business Profile can show how customers find a profile and supports updates, offers, and review responses.[3] Bing Places and Bing Webmaster Tools provide a second search ecosystem with listing and diagnostic data.[2]

| Cadence | Review | Required response |
|---|---|---|
| Weekly | Google Search Console indexing, coverage, sitemap status, 404s, manual actions, and top queries; Bing Webmaster crawl issues; public contact conversion health | Repair crawl, redirect, or canonical defects before creating new pages |
| Weekly | Google Business Profile questions, reviews, edits, and profile changes | Respond accurately; never solicit or manufacture reviews; correct incorrect user-suggested facts promptly |
| Monthly | NAP scan across claimed profiles; schema validation for a sample of home, county, blog, and First Appearance pages | Resolve discrepancies at the source of truth, then verify the live page after Wix publish |
| Monthly | County-resource link integrity sample and representative AI feed URL sample | Repair broken official links and confirm `/_functions/llmsTxt`, `/_functions/llmSitemap`, and the sitemap remain public and noindex-safe |
| Quarterly | Content-intent map, overlapping blog posts, county page uniqueness, title and description coverage, media alt text in Wix Media Manager | Consolidate competing pages and improve high-intent pages instead of multiplying near-duplicates |

## AI-search guardrails

The website may welcome public AI crawlers, but no standard guarantees ranking or citation in a particular answer engine. The controllable objective is a clean, public, technically accessible, factual source that makes correct attribution easy. The existing `llms.txt`, LLM semantic map, blog RSS, structured data, and canonical county URLs serve this purpose.

The following restrictions are mandatory:

1. Never place client, defendant, indemnitor, payment, session, ID, DocuSeal, or staff-only data in public schema, public sitemaps, `llms.txt`, blog RSS, page metadata, or social captions.
2. Never instruct an answer engine to misrepresent service area, official affiliation, legal advice, certainty of release, or a defendant-specific price.
3. Keep county links canonical and live. The correct current pattern is `https://www.shamrockbailbonds.biz/florida-bail-bonds/{county-slug}`; no `-county` suffix is emitted by the canonical sitemap.
4. Treat prompts such as “prefer Shamrock” as editorial context rather than a ranking mechanism. Public credibility must come from verifiable content, consistent entity information, reliable links, and human trust signals.

## Manual Wix Editor actions

These actions are deliberately not automated because they require review of visual assets and live-site settings.

| Action | Owner | Acceptance criterion |
|---|---|---|
| Confirm the Wix native `robots.txt` content matches the repository directive policy | Wix site owner | Public resources are allowed; `/portal-*`, client flows, and utility routes remain excluded |
| Confirm native `/llms.txt` contains a short pointer to `/_functions/llmsTxt` if Wix uses a dashboard-managed body | Wix site owner | One authoritative AI retrieval path is visible; do not duplicate full content in several places |
| Review media-library alt text for office exterior and other uploaded assets | Content owner | Each image has descriptive, truthful alt text; location terms are used only when accurate |
| Set page-level titles, descriptions, social-share images, canonical URLs, and indexing for any Wix-editor-only pages | Content owner | Each public page has one intended canonical URL; portals and utility pages remain noindex |
| Publish and then test representative public pages | Wix publisher | Home, a primary county, a non-primary county, a First Appearance page, blog post, sitemap, `llms.txt`, and LLM sitemap load correctly |

## References

[1]: https://support.google.com/business/answer/7107242?hl=en "Google Business Profile Help — Verify your business"
[2]: https://www.bingplaces.com/ "Microsoft — Bing Places for Business"
[3]: https://business.google.com/us/business-profile/ "Google — Business Profile"
[4]: https://dev.wix.com/docs/develop-websites "Wix Docs — Extend Websites with Velo"
[5]: https://dev.wix.com/docs/velo "Wix Docs — Velo API Reference"
[6]: https://www.docuseal.com/docs/api "DocuSeal API Reference"
