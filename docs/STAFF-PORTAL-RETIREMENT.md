# Wix Staff Portal & Lobby Tablet — RETIRED (2026-09-27)

**Owner decision:** the Shamrock CRM (`https://leads.shamrockbailbonds.biz`) is
the **only** staff tool. The Wix Staff Portal page and its Lobby Tablet walk-in
engine are retired. The lobby tablet itself stays in use, staff-overseen, but
runs the **CRM kiosk mode** (`/sign/{packet}/{role}?mode=kiosk`, 3-minute idle
reset, neutral `/kiosk` home, `/done?kiosk=1` auto-reset).

## What changed in code (this branch — nothing deleted)
| File | Change |
|---|---|
| `src/pages/portal-staff.qs9dx.js` | `STAFF_PORTAL_RETIRED = true`: on load the page clears the Wix session token and redirects to the CRM. The Lobby Tablet launcher is no longer called. Old code kept for rollback. |
| `src/backend/lobby-tablet-service.jsw` | `startWalkInPacket`, `markReadyForSuperCrm`, `searchOpenLeadsForTablet` return `{success:false, retired:true}`. |
| `src/backend/intakeQueue.jsw` | Slack "View in Dashboard" button → CRM instead of the dead `/staff-portal` URL. |

## Editor removals needed (manual, owner/Editor access)
Do these **after** the code above is live, so staff who still have the old link
are redirected rather than hitting an error:
1. **Site menu / header / footer:** remove any "Staff Portal", "Staff Login",
   "Lobby Tablet" or "Command Center" links.
2. **Page `portal-staff` (Staff Portal):** set to *hidden from menu* and
   *noindex* (already noindex in code). Do **not** delete yet — keep it as the
   redirect target for 30 days, then delete.
3. On that page, remove the Lobby Tablet section elements:
   `#btnStartWalkInWizard`, `#btnHandTabletToClient`, `#btnLobbyScanId`,
   `#btnQuickScanDL`, `#btnLobbyAttachLead`, `#inputLobbyLeadSearch`,
   `#btnMarkReadySuperCrm`, `#btnApproveForIssuance`, and the Command Center
   iframe `#staffPortal`.
4. **Portal landing / access codes:** staff roles still route to
   `/portal-staff` (`portal-landing.bagfn.js`, `routers.js`, `accessCodes.jsw`,
   `Portal.hslzo.js`). Leave as-is until step 2's 30 days are up; the page now
   forwards to the CRM.
5. **Lightboxes** used only by staff screens (e.g. `StaffPromptLightbox`):
   remove after the page is deleted.
6. Revoke any staff Wix access codes that were only for the Staff Portal.

## Rollback
Set `STAFF_PORTAL_RETIRED = false` and `LOBBY_TABLET_RETIRED = false`, publish.
