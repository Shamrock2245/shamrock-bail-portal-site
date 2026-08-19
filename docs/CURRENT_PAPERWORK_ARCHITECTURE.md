# Current Paperwork Architecture — DocuSeal Only

**Status:** Current production architecture  
**Effective date:** 2026-08-19  
**Applies to:** Wix/Velo, Google Apps Script, Netlify paperwork UI, Super CRM, member portals, staff tooling, Telegram, and outbound communications

> **Canonical rule:** DocuSeal is the sole active signing provider. A signing session may be issued only by authorized staff through Super CRM after the required case validations. Wix is a secure launchpad, not a packet factory.

## Purpose and non-negotiable boundary

This document replaces obsolete current-state descriptions of direct SignNow workflows. It does not rewrite archived materials that accurately preserve historical implementation records. Any new development, support procedure, user-facing message, or automation must follow the architecture below.

| System | Permitted responsibility | Prohibited responsibility |
|---|---|---|
| **Wix/Velo public site** | Public education, conversion CTAs, county resources, and authenticated routing | Collecting sensitive paperwork data in public markup or exposing member pages to indexing |
| **Wix/Velo portal** | Authenticate the user, open `SigningLightbox`, and host the Netlify iframe shell | Creating a DocuSeal submission, generating a signing URL, sending a provider invite, or bypassing staff approval |
| **Netlify paperwork app** | PIN verification, identity capture, remaining-field collection, and controlled presentation of an existing staff-issued signing session | Issuing an unapproved packet or trusting client-supplied links as authorization |
| **Super CRM** | Validate Match and BondCase, confirm surety and POA, validate recipient, obtain staff approval, and issue the DocuSeal packet | Delegating packet authority to a browser, Wix page, or legacy GAS sender |
| **DocuSeal** | Host the individual signing form and return submission/submitter state | Replace the business validation required before packet issuance |
| **GAS and legacy tooling** | Maintain historical records and fail closed on retired direct actions | Revive SignNow routes, direct packet factories, or unverified outbound signing links |

DocuSeal models a signature request as a **submission**. An individual signer URL is created through the submission workflow and is provider-side data; API keys and issuance permissions must remain backend-only.[1] [2]

## Required signing sequence

A user must first enter an authenticated, private portal context. The secure launchpad may then collect the necessary consent, PIN verification, identity materials, and remaining information. **This does not itself authorize a signing packet.**

Only authorized staff may complete the following sequence in Super CRM:

1. Confirm the validated **Match** and bound **BondCase**.
2. Confirm the selected surety is explicit and valid.
3. Confirm the assigned POA tier and all required recipient details.
4. Complete staff approval.
5. Create or release the DocuSeal packet in Super CRM.
6. Make the resulting staff-issued DocuSeal signer session available through the existing secure paperwork experience.

The current Wix side intentionally hosts the Netlify paperwork popup inside `SigningLightbox`. The popup can display DocuSeal only when a packet already exists. This prevents a public page, old direct route, or stale link from creating a new packet.

```text
Authenticated portal user
  → Wix SigningLightbox
    → Netlify paperwork app (PIN, ID/selfie, remaining fields)
      → Super CRM validates Match + BondCase + surety + POA + recipient + staff approval
        → DocuSeal staff-issued signing session
```

## Implementation controls in this repository

The table records the current controls maintained in this repository.

| Control | Location | Expected behavior |
|---|---|---|
| Secure launchpad configuration | `src/public/portal-config.js` | Defines the Netlify paperwork host; no DocuSeal credential is stored in Wix code |
| Paperwork lightbox | `src/lightboxes/SigningLightbox.js` | Opens the iframe and passes minimal session context; cannot create a packet |
| Indemnitor sign action | `src/pages/portal-indemnitor.k53on.js` | Opens the secure launchpad instead of following a historical provider URL |
| Defendant sign action | `src/pages/portal-defendant.skg9y.js` | Uses the same launchpad and presents staff-review status if it cannot open |
| Staff portal direct packet actions | `src/pages/portal-staff.qs9dx.js` | Fail closed and direct staff to Super CRM; Wix does not send Phase 1 or Phase 2 paperwork |
| Legacy integration abstraction | `src/backend/signing-methods.jsw` | Blocks legacy direct email, SMS, kiosk, and print issuer routes while retaining read-only compatibility helpers |
| GAS route guard | `backend-gas/LegacyPaperworkGuard.js` | Blocks retired direct actions without creating a packet, link, payment request, client contact, or mutation |

## Historical compatibility policy

The automation ecosystem has historical field names such as `signNowDocumentId`, `signNowIndemnitorLink`, and legacy collection names. These values are **read-only historical compatibility data**. They must not be renamed casually because the shared mapping and downstream systems depend on stable data contracts.

Historical references may remain in archived reports, migration notes, old collection field names, and guarded compatibility code. They are not evidence of an active SignNow workflow. When a current document mentions the signing system, it must name **DocuSeal via Super CRM** and preserve the staff-gated issuance rule.

## Safety requirements for future changes

New code must not add a DocuSeal token to frontend code, Wix public configuration, page metadata, JSON-LD, `llms.txt`, browser storage, or URL parameters. A raw signing URL is sensitive operational data and must not appear in public SEO content, public feeds, crawlable sitemaps, analytics event properties, or client-visible logs.

A direct signing link may be delivered only after it is already staff-issued and validated. DocuSeal provides embedded-form options, but an embedded experience does not remove the need for backend-controlled authorization and issuance.[2]

## Verification checklist

| Check | Expected result |
|---|---|
| Public page crawler check | No paperwork data, provider link, member-session information, or protected portal content is indexable |
| Portal start action | Opens `SigningLightbox` and the Netlify paperwork app; no direct provider packet is created |
| No active staff-issued packet | User sees a staff-review state rather than a forged or stale signing link |
| Approved packet | Netlify can present the verified, existing DocuSeal signer session |
| Legacy Phase 1/Phase 2 or direct sender action | Fails closed without sending paperwork or mutating case data |
| Historical CMS records | Continue to be readable without renaming fields or breaking downstream schema consumers |

## References

[1]: https://www.docuseal.com/docs/api "DocuSeal API Reference — Submissions"
[2]: https://www.docuseal.com/docs/embedded/form/js "DocuSeal Docs — Embedded Signing Form"
[3]: https://dev.wix.com/docs/develop-websites "Wix Docs — Extend Websites with Velo"
[4]: https://dev.wix.com/docs/api-reference "Wix API Reference"
