# Project Glossary - Shamrock Bail Suite

Common terminology used across the Shamrock ecosystem.

| Term | Definition |
| :--- | :--- |
| **ArrestRecord** | The base data object containing 34 points of data for a single arrest. |
| **Booking Number** | The unique identifier for an arrest, used as the Primary Key across all systems. |
| **County Slug** | Lowercase, hyphenated county name used for URLs and routing (e.g., `palm-beach`). |
| **Hot Lead** | A prospect with a Lead Score ≥ 70, requiring immediate agent follow-up. |
| **Indemnitor** | The person co-signing the bond for the defendant (also referred to as the Co-signer). |
| **Lead Status** | Classification of a lead (Hot, Warm, Cold, Disqualified). |
| **Master Sheet** | The central Google Sheet database (`121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E`). |
| **Premium** | The fee paid to Shamrock for posting a bond (typically 10% in Florida). |
| **Scraper Runner** | The CI/CD script (GitHub Action) that executes the scrapers. |
| **SheetWriter** | The technical service that pushes normalized data to the Master Sheet. |
| **SignNow Workflow** | The digital document chain from "Initiated" to "Completed". |
| **Velo** | The JavaScript-based development platform for Wix. |
