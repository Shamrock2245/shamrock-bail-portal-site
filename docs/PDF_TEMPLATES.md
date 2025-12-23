# PDF & SignNow Templates - Shamrock Bail Suite

Guidelines for managing the digital document templates used in the bail process.

## 1. Template Registry
Current active templates in SignNow and Google Drive:

| Template Name | SignNow ID | Drive File ID | Purpose |
| :--- | :--- | :--- | :--- |
| **Bail Bond Application** | `sn-template-123...` | `gd-file-abc...` | Primary intake for indemnitors |
| **Promissory Note** | `sn-template-456...` | `gd-file-def...` | Collateral and financial agreement |
| **Indemnity Agreement** | `sn-template-789...` | `gd-file-ghi...` | Legal contract between agent/indemnitor |

## 2. Mapping Fields
All templates must use a consistent naming convention for data injection:
- `{{Full_Name}}`: Defendant's name
- `{{Booking_Number}}`: Primary key from arrest record
- `{{Bond_Amount}}`: Total bond amount
- `{{Indemnitor_Name}}`: Name of the person signing
- `{{Date_Signed}}`: Auto-populated

## 3. Workflow Multi-Signer
Templates are configured for a sequential signing flow:
1. **Agent:** Initiates the packet and fills pre-records.
2. **Indemnitor:** Receives email/SMS to sign.
3. **Defendant:** Receives invite after release (if post-jail signing required).

## 4. Maintenance
- **Updating Templates:** 
  1. Modify the source Google Doc in the `TEMPLATES` Drive folder.
  2. Re-upload to SignNow and ensure field IDs match the `signnow-integration.jsw` script.
- **Testing:** Always use the "Sandbox" environment in SignNow before publishing a new template to production.

> [!IMPORTANT]
> Never change a field ID in a live template without also updating the corresponding mapping in `backend/signnow-integration.jsw`.
