# Changelog - Shamrock Bail Suite

All notable changes to the Shamrock Bail Suite ecosystem will be documented in this file.

## [2.0.0] - 2026-02-27
### Added
- **Multi-indemnitor document generation system** — `DOC_GENERATION_RULES`, `DOC_ORDER`, `buildPacketManifest()` in `Telegram_Documents.js`
- **Manifest-driven signing flow** in `Dashboard.html` — replaces PDF-merge-and-upload approach
- **SignNow template unification** — all 13 templates sourced from SignNow Team Templates folder
- **Server wrappers** `server_getPacketManifest()` and `server_getSigningUrl()` in `Server_DocumentLogic.js`
- **`handleGetPacketManifest`** handler in `Telegram_Documents.js`, wired via `Code.js` router
- **`signerIndex`** support in `handleTelegramGetSigningUrl` for per-person/per-indemnitor tracking
- **DocSigningTracker** columns: `SignerRole`, `SignerIndex` with composite keys (`docId:signer-N`)
- **Live document count updates** — `updateDocumentCount()` now factors in indemnitor multiplication
- Dynamic meta text on SSA Release and Indemnity Agreement checkboxes showing copy counts

### Changed
- `generateAndSendWithWixPortal()` completely rewritten — was: merge→upload→single file; now: manifest→per-doc template copies→individual signing links
- `SIGNNOW_TEMPLATE_MAP` — all 12 IDs updated to confirmed Team Template IDs; `appearance-bond` added as 13th
- `addIndemnitor()` / `removeIndemnitor()` now trigger `updateDocumentCount()`

### Deployment
- GAS V303 @356, V304 @357
- Git: `d45d9c5` → `51992ff`

## [1.2.0] - 2025-12-23 (Today)
### Added
- Comprehensive documentation suite populated in `docs/`.
- `AGENTS.md` for AI guardrails and instructions.
- `ROADRULES.md` for mandatory coding and data standards.
- `SCHEMAS.md` for 34-column arrest data definition.
- `FLOW.md` for visual and textual process mapping.
- Operational guides (`OPS.md`, `DEPLOYMENT.md`, `TESTING.md`).
- Strategic docs (`ROADMAP.md`, `METRICS.md`).

### Fixed
- Site-wide phone routing now uses `siteHeader` and `siteFooter` public modules for better stability.
- Spanish phone "double-click" issue fixed in `phone-injector.js`.

## [1.1.0] - 2025-12-22
### Added
- Home Page wiring with defensive coding and premium animations.
- Dynamic phone selection based on geocoding.
- Support for role-based member routing.

## [1.0.0] - 2025-12-21
### Added
- Initial backend architecture (`jsw` modules).
- Geocoding and Call Tracking services.
- Preliminary Lee/Collier county data models.

> [!NOTE]
> Versions follow Semantic Versioning (Major.Minor.Patch).
