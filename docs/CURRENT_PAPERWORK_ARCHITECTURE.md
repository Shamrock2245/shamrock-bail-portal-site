# Current Paperwork Architecture — DocuSeal Finalization with Client Intake

**Status:** Current production architecture  
**Effective date:** 2026-08-19  
**Applies to:** Wix/Velo, Netlify paperwork UI, Super CRM, Google Apps Script, member portals, staff tooling, Telegram, and outbound communications

> **Canonical rule:** **DocuSeal is the sole active signing provider.** A client may complete a secure intake before a defendant, bond amount, or final case is known. Only authorized staff may reconcile that intake to a bond and issue final DocuSeal paperwork.

## Purpose and non-negotiable boundary

This document supersedes obsolete current-state descriptions of direct SignNow workflows. It preserves historical field names and records where downstream compatibility requires them, but all new work follows the current model below.

| System | Permitted responsibility | Prohibited responsibility |
|---|---|---|
| **Wix/Velo public site** | Public education, conversion CTAs, county resources, and authenticated routing | Collecting sensitive paperwork data in public markup or exposing protected content to indexing |
| **Wix/Velo portal** | Authenticate the user and open `SigningLightbox` as the private intake launchpad | Creating a DocuSeal submission, generating a signing URL, sending a provider invite, or requiring a case match before client intake |
| **Netlify paperwork app** | Ask the client’s role, perform PIN verification, scan ID, show extracted information for review, collect role-specific fields, and record the staff-review acknowledgment | Creating an unapproved final packet, assigning a bond amount, or treating a client-selected role as final case reconciliation |
| **Super CRM** | Store each independently completed intake, reconcile defendants and indemnitors later, attach any number of indemnitors to a bond, validate Match/BondCase/surety/POA, and issue DocuSeal only after staff approval | Delegating packet authority to a browser, Wix page, legacy GAS sender, or automatic ID-only workflow |
| **DocuSeal** | Host the individual final signing form and return submission/submitter state | Replace staff’s case, party, financial, surety, and POA validation |
| **GAS and legacy tooling** | Maintain historical records and fail closed on retired direct actions | Revive SignNow routes, direct packet factories, or unverified outbound signing links |

DocuSeal models a signature request as a **submission**. Its individual signer URL is provider-side data; API keys and packet-issuance permissions remain backend-only.[1] [2]

## Client intake sequence

A client may be a defendant, a primary indemnitor, or an additional indemnitor. The experience begins with a role choice and ID scan; it does **not** ask the client to guess a final bond amount, power number, charges, court information, or a finalized defendant match.

1. The authenticated member opens the private paperwork launchpad.
2. The user answers: **“Are you the defendant or an indemnitor?”**
3. The user verifies their mobile number with a PIN and scans their government ID.
4. The app parses the ID and puts the extracted name, date of birth, driver-license number, and address into the correct **defendant** or **indemnitor** fields for review.
5. The user supplies only the role-specific information they know and acknowledges that the finished bond package will be reviewed and completed by staff.
6. Super CRM saves an independent, staff-deferred intake record. It requires **no defendant, bond amount, final case, POA, or DocuSeal packet**.
7. Staff later confirms the right bond and attaches the appropriate defendant and any number of indemnitor intake records. Only then may staff create or release a final DocuSeal packet.

The client sees a plain-language notice throughout the intake:

> **This is your secure intake, not the final bond contract.** A Shamrock bondsman will verify the case, connect the right parties, and complete staff-only items such as the bond amount, charges, court details, surety information, and power number. The final paperwork may look different from this intake.

## Deferred matching and multiple indemnitors

Each indemnitor submission is intentionally independent. A pre-need packet may therefore be completed before staff knows which defendant or bond will be associated with it. A bond may later receive multiple independently verified indemnitor records; the workflow does not force five people into a single prematurely formalized packet.

| Situation | Client experience | Staff action | DocuSeal status |
|---|---|---|---|
| **Defendant known, final bond not ready** | Defendant completes only their own verified intake | Match to case when staff confirms it | Not created |
| **Pre-need indemnitor, defendant unknown** | Indemnitor completes their own ID-first intake | Attach to the eventual bond if appropriate | Not created |
| **Several indemnitors for one bond** | Each person completes a separate indemnitor intake | Attach each verified intake to the same bond without overwriting prior indemnitors | Not created until all required decisions are complete |
| **Validated bond ready for final documents** | Client receives the normal private DocuSeal signing experience | Confirm case, parties, amount, surety, POA, and approvals | Staff-issued only |

The intake records retain the established defendant and indemnitor field vocabulary, including the `Def*`, `Ind*`, and reference mappings used by the automation ecosystem. Match metadata records that reconciliation is **staff-deferred**; it never fabricates a defendant or bond amount.

## Final signing sequence

Only authorized staff may complete this sequence in Super CRM:

1. Confirm the correct defendant and BondCase.
2. Attach all required indemnitor records and validate the intended parties.
3. Confirm the selected surety, bond amount, and assigned POA tier.
4. Complete staff approval and final document preparation.
5. Create or release the DocuSeal packet in Super CRM.
6. Make the verified, staff-issued signer session available through the existing secure paperwork launchpad.

```text
Authenticated portal user
  → Wix SigningLightbox
    → Netlify client intake (role → PIN → ID scan → review → acknowledgment)
      → Super CRM stores independent client intake
        → Staff reconciles defendant + one or more indemnitors + final bond details
          → Staff-issued DocuSeal signing session, when required
```

## Implementation controls

| Control | Location | Expected behavior |
|---|---|---|
| Secure launchpad configuration | `src/public/portal-config.js` | Defines the Netlify paperwork host; no DocuSeal credential is stored in Wix code |
| Paperwork lightbox | `src/lightboxes/SigningLightbox.js` | Opens the role-aware intake by default and exposes final DocuSeal only when a staff-issued session already exists |
| Member launch action | `src/pages/portal-indemnitor.k53on.js` | Opens the secure launchpad without silently forcing a defendant/indemnitor selection |
| Netlify paperwork app | `paperwork/` in `shamrock-telegram-app` | Collects role, PIN, ID scan, reviewed role-specific fields, and staff-review acknowledgment |
| PIN portal intake handler | `dashboard/routers/pin_portal.py` in Super CRM | Stores independent deferred intake records; it does not create a case or packet |
| Staff reconciliation endpoint | `POST /api/intakes/{intake_id}/attach-to-bond` in Super CRM | Attaches a saved client intake to an existing bond; repeated calls support multiple indemnitors and never issue paperwork |
| Staff portal direct packet actions | `src/pages/portal-staff.qs9dx.js` | Fail closed and direct staff to Super CRM; Wix does not send Phase 1 or Phase 2 paperwork |
| Legacy integration abstraction | `src/backend/signing-methods.jsw` | Blocks legacy direct issuer routes while retaining read-only compatibility helpers |
| GAS route guard | `backend-gas/LegacyPaperworkGuard.js` | Blocks retired direct actions without creating a packet, link, payment request, client contact, or mutation |

## Historical compatibility and security policy

The automation ecosystem has historical field names such as `signNowDocumentId`, `signNowIndemnitorLink`, and legacy collection names. These values remain **read-only historical compatibility data**. They must not be renamed casually because downstream systems depend on stable data contracts.

New code must not add a DocuSeal token to frontend code, Wix public configuration, page metadata, JSON-LD, `llms.txt`, browser storage, or URL parameters. A raw signing URL is sensitive operational data and must not appear in public SEO content, public feeds, crawlable sitemaps, analytics event properties, or client-visible logs.

## Verification checklist

| Check | Expected result |
|---|---|
| Role prompt | Client chooses defendant or indemnitor before ID collection; the choice determines only the intake field group, not a final legal match |
| ID parse and review | Extracted identity values populate only the selected role’s fields and remain reviewable before save |
| No case or amount available | Intake is saved and queued for staff; no fabricated match, financial value, or DocuSeal submission is created |
| Multiple indemnitors | Each person has an independent intake; staff can attach each one to the later bond without overwriting prior records |
| Approved packet | Netlify can present the verified, existing staff-issued DocuSeal signer session |
| Legacy direct sender action | Fails closed without sending paperwork or mutating case data |
| Public crawler check | No paperwork data, provider link, member-session information, or protected portal content is indexable |

## References

[1]: https://www.docuseal.com/docs/api "DocuSeal API Reference — Submissions"
[2]: https://www.docuseal.com/docs/embedded/form/js "DocuSeal Docs — Embedded Signing Form"
[3]: https://dev.wix.com/docs/develop-websites "Wix Docs — Extend Websites with Velo"
[4]: https://dev.wix.com/docs/api-reference "Wix API Reference"
