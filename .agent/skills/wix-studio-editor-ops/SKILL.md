---
name: wix-studio-editor-ops
description: Use when building or editing pages in the Wix Studio editor (layout, breakpoints, element IDs, styling) for the Shamrock Bail Bonds site. Covers safe editing, naming, colors, mobile-first layout, verification, and what never to touch.
---

# Wix Studio Editor Ops

## Hard rules
- Work ONLY on the Studio branch "Wix studio version" (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4). Never edit the published Original-Branch or the Classic editor.
- Save only (Ctrl+S). NEVER click Publish unless the owner says yes in chat.
- Never open or restore Site History. Never type into the Comments panel.
- No CMS/app data edits (FAQ app, collections) without owner approval; app data can be shared with the live site.
- No secrets in chat, PRs, or this repo.

## Before you start
1. Load repo context: AGENTS.md, RULES.md, docs/WIX_STUDIO_SITEMAP_AND_IA.md, design/WIX-COLOR-SETUP.md.
2. Load helper skills: ui-ux-pro-max, ui-visual-validator, page-cro, form-cro, schema-markup, seo-audit.
3. Take BEFORE screenshots (mobile 390px + desktop) of the area you will change.
4. Read state through the Wix MCP when possible (media library, SEO, redirects) instead of clicking.

## Editor technique (learned the hard way)
- Keystrokes go to the canvas. Never type, Backspace, or Delete unless a text field is visibly focused; stray keys delete or move elements.
- Rename IDs: turn on Display IDs, then Layers > right-click > Rename. Use camelCase IDs (headerLogo, startBondButton).
- Hex colors: color picker > "+ Add" > type hex > Apply. Brand: green #00A86B, gold #FDB913, dark #0B1118.
- Use real mouse clicks on Layers rows; scripted (Playwright) clicks often miss.
- Size-panel number fields can revert or take wrong values: re-read the value after Enter; Ctrl+Z once if a height goes to 0.
- Grids: remove unused rows/columns instead of leaving empty bands; set mobile rows to fit content.
- Save after every meaningful step; confirm "Saving" then "Saved".

## Design standards
- Mobile-first: get 390px right, then tablet, then desktop. ~90% of clients are on phones.
- One H1 per page; question-style H2s; copy lives in the page, not injected by code.
- Primary action always obvious: Start a Bond (links to /portal-landing) and Call. Make a Payment sits near the bottom on mobile, not in the header.
- Buttons aligned, equal height (44px+ tap targets), sized to their text, no wrapping.
- Use only original brand assets from the site's Media Manager (logo, office photo). No uploads, redraws, or stock images. No duplicated headers, menus, or buttons.
- Office photo is the hero: full width, right under the header on mobile.
- Alt text on every meaningful image; empty alt for decorative ones.
- NAP: 1528 Broadway, Fort Myers, FL. Phones: (239) 332-2245; Spanish/automated (727) 295-2245; text (239) 955-0178. Hours: "Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7".
- No speed or release-time claims ("fast", "quickly", "in minutes", "instantly").

## Verify and report
1. Preview at mobile and desktop; check for overlaps, clipped text, empty bands.
2. Save AFTER screenshots next to the BEFORE ones.
3. Report: what changed, element ID list (element, ID, wired in code yes/no), screenshot paths, and confirm "Saved, not published".
