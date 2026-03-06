# Rules & Prime Directives

These are the unalterable laws governing the digital operations of Shamrock Bail Bonds. Any code changes, system designs, or automation deployments MUST adhere to these directives.

## The Laws
1. **Wix is the Clipboard**: It collects data and passes it back. It does NOT own the heavy lifting.
2. **GAS is the Factory**: All PDF generation, webhook processing, heavy logic, and long-poling happens in Google Apps Script.
3. **Secrets are Sacred**: API Keys live in **Wix Secrets Manager** or GAS **Script Properties**. Never in frontend code. Never printed in logs.
4. **10DLC Compliance**: All SMS/WhatsApp messaging must be compliant. No spam. Explicit opt-in required (Path B consent).
5. **Finish the Factory**: Don't redesign what works. Connect existing pipes to new outputs rather than inventing a new framework.

## Defensive Coding & Security
1. **Idempotency is Required**: Every webhook or form submission must be safe to process twice. Case Files/Magic Links should verify `Booking_Number` + `County` or `Case_ID` before insertion.
2. **Wrappers Only**: In Wix frontend, always use `safeGetValue()` and `safeOnClick()`. Avoid raw `$w()` manipulations to prevent UI crashes if an element ID changes.
3. **Ghost ID Check**: Verify Wix Element IDs against `docs/ELEMENT-ID-CHEATSHEET.md` before writing logic.
4. **Redact PII in Logs**: Emails and phone numbers must be redacted in operational logs to ensure legal compliance.

## Schema Governance
- The `IntakeQueue` schema and GAS payload schemas are legally binding and tied to PDF documents. 
- Do not randomly rename JSON payload keys. Any schema changes must map correctly to the SignNow template coordinates.
