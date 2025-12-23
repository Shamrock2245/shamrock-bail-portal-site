# Operations Guide (OPS) - Shamrock Bail Suite

Operational procedures for maintaining the Shamrock Bail Suite ecosystem.

## 1. Monitoring the Pipeline
- **Daily Check:** Verify the `ingestion_log` tab in the Master Sheet for any scraper failures.
- **Lead Flow:** Ensure "Hot" leads are appearing in the "Qualified" tab of the Master Sheet.
- **Slack Alerts:** Confirm that `#alerts-shamrock` is receiving lead notifications.

## 2. Managing Counties
- **Activating a New County:**
  1. Add county details to the `FloridaCounties` Wix Collection.
  2. Set `active = true`.
  3. Ensure a phone number is assigned in `phone-registry.json`.
  4. (Optional) Deploy a dedicated scraper runner if not already covered.

## 3. Handling Errors
- **Scraper Timeout:** Most county sites have periodic downtime. If a scraper fails 3 times in a row, notify the Lead Developer.
- **Geocoding Failures:** If user location cannot be detected, the system falls back to the primary Lee County line automatically.
- **SignNow Errors:** Common causes include expired tokens or missing mandatory fields in the Master Sheet.

## 4. Database Maintenance
- **Archiving:** Records older than 180 days should be moved to the `Archive` sheet to maintain speed.
- **Validation:** Periodically run the `Data Validator` script in Google Apps Script to check for broken `Mugshot_URL`s.

## 5. Security Protocols
- **Credential Rotation:** Rotate the Google Service Account key every 6 months.
- **Access Control:** Only authorized Shamrock staff should have "Editor" access to the Master Sheet.

> [!CAUTION]
> Never manually delete rows in the Master Sheet's "Live" tabs. Use the "Disqualified" or "Archive" status instead.
