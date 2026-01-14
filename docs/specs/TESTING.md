# Testing & Verification - Shamrock Bail Suite

Protocols for ensuring the accuracy and reliability of the Shamrock ecosystem.

## 1. Scraper Verification
Every scraper runner must produce a `walkthrough.md` with:
- **Sample Output:** A JSON snippet showing at least 2 normalized records.
- **Column Count:** Confirmation of exact 34-column alignment.
- **Deduplication Test:** Confirmation that re-running the scraper doesn't create duplicate rows.

## 2. Lead Scoring Validation
Verify the `LeadScorer` logic by feeding test data:
- **Input:** Record with $2,000 bond, Battery charge, 1 day old.
- **Expected:** Score ≥ 70, Status = "Hot".
- **Input:** Record with $0 bond, "Released" status.
- **Expected:** Status = "Disqualified".

## 3. Frontend UI Testing
- **Auth Flow:** Verify Defendant/Indemnitor portal routing.
- **Geolocation:** Use browser dev tools to spoof different Florida lat/long coordinates and verify phone number swapping.
- **CTA Buttons:** Verify all call buttons initiate a `tel:` link on single-click.

## 4. Integration Testing
- **SignNow:** Use the SignNow Sandbox to initiate a mockup bond package. Verify that the "Document Viewed" status pings the Master Sheet.
- **Slack:** Run a test lead through the pipeline and confirm the notification appears in the alerts channel.

## 5. Regression Testing
Before every major release, verify:
- [ ] Master Page still loads correctly.
- [ ] Mobile navigation still functions.
- [ ] Database credentials haven't expired.

> [!TIP]
> Use the `TESTING.md` as a checklist for every Pull Request. No PR should be merged without a passing verification report.
