# Project Metrics & KPIs - Shamrock Bail Suite

Key Performance Indicators to track the success of the Shamrock ecosystem.

## 1. Growth Metrics
- **Leads Captured:** Total number of new arrest records ingested per day.
- **Qualification Rate:** % of scrapped records that meet the "Hot Lead" (Score ≥ 70) threshold.
- **Geographic Coverage:** Number of Florida counties with active, daily-automated scrapers.

## 2. Conversion Metrics
- **CTA Click-Through Rate:** % of site visitors who click "Call Now" or "Start Bail Online".
- **Call Conversion:** % of initiated calls that turn into an active bond application.
- **Paperwork Completion Time:** Average time from "SignNow Initiated" to "SignNow Completed".

## 3. Operational Efficiency
- **Scraper Uptime:** % of scheduled scraper runs that complete without error.
- **Response Time:** Time from "Arrest Captured" to "Agent Notified".
- **Data Accuracy:** % of records with valid Mugshot URLs and Charges.

## 4. Business Impact
- **Cost Per Lead:** Scraper infrastructure & API costs divided by total qualified leads.
- **ROI Per County:** Bond premiums collected vs. the cost of maintaining a county's scraper/routing.

## 5. Dashboarding
All metrics are aggregated weekly from the `AnalyticsEvents` and `CallLogs` sheets into a central **Operations Dashboard**.

> [!TIP]
> Use the `METRICS.md` to guide conversion rate optimization (CRO) on the Wix frontend.
