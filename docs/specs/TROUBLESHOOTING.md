# Troubleshooting Guide - Shamrock Bail Suite

Common issues and their resolutions within the Shamrock ecosystem.

## 1. Scraper Failures
### Issue: "Selector not found"
- **Cause:** The county jail website has changed its layout.
- **Fix:** Identify the new CSS selector using browser dev tools and update the county adapter.

### Issue: "Timeout / Request Blocked"
- **Cause:** Target server is down or has implemented aggressive bot detection.
- **Fix:** Check the site manually. If it's up, try increasing the request delay or rotating the user-agent.

## 2. Geolocation & Phone Routing
### Issue: "Incorrect County Detected"
- **Cause:** User is behind a VPN or GPS accuracy is low.
- **Fix:** This is a known limitation of web-based GPS. Ensure the manual county selector is easily accessible in the UI.

### Issue: "Phone number doesn't swap"
- **Cause:** Element ID on the page doesn't match the list in `phone-injector.js`.
- **Fix:** Verify the element ID in the Wix Editor and add it to the `phoneElementIds` array if missing.

## 3. Data Sync (Sheets/CMS)
### Issue: "Duplicates in Master Sheet"
- **Cause:** Idempotency check failed or was bypassed.
- **Fix:** Audit the `Booking_Number` check in the scraper. Manually remove duplicates and re-run the deduplication script in GAS.

### Issue: "SignNow Webhook not firing"
- **Cause:** Webhook URL changed or auth token expired.
- **Fix:** Verify the webhook registration in the SignNow dashboard and update the `GAS_BACKEND_URL` in Wix Secrets.

## 4. UI/UX Issues
### Issue: "Entrance animations not playing"
- **Cause:** Element is set to "Hidden on Load" but not properly managed by `wix-animations`.
- **Fix:** Ensure the element is not "Hidden" but rather has `opacity: 0` set via the `initHomeUI` function.

> [!NOTE]
> For any issue not listed here, consult the detailed logs in the `ingestion_log` tab or the Wix Developer Console.
