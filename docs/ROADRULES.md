# Road Rules: Coding & Data Standards - Shamrock Bail Suite

These "Road Rules" are the mandatory standards for all code contributing to the Shamrock Bail Suite. 

## 1. The "Sacred" 34-Column Schema
All arrest data MUST be normalized to this exact structure before hitting the Master Sheet:

1. Scrape_Timestamp
2. County
3. Booking_Number (Primary Key)
4. Person_ID
5. Full_Name
6. First_Name
7. Middle_Name
8. Last_Name
9. DOB
10. Booking_Date
11. Booking_Time
12. Status
13. Facility
14. Race
15. Sex
15. Height
17. Weight
18. Address
19. City
20. State
21. ZIP
22. Mugshot_URL
23. Charges (Pipe | separated)
24. Bond_Amount (Numeric)
25. Bond_Paid (YES/NO)
26. Bond_Type
27. Court_Type
28. Case_Number
29. Court_Date
30. Court_Time
31. Court_Location
32. Detail_URL
33. Lead_Score (Calculated)
34. Lead_Status (Hot/Warm/Cold/Disqualified)

## 2. Lead Qualification Logic
A lead is "Qualified" (Hot) if it scores **≥ 70**.
- **Bond ≥ $500:** +30 pts
- **Bond ≥ $1,500:** +20 pts (extra)
- **Recent Arrest (≤ 2 days):** +20 pts
- **Serious Keywords:** +20 pts (Battery, DUI, Theft, etc.)

## 3. Scraper Coding Standards
- **Selectors:** Use stable CSS selectors over fragile XPaths.
- **Resilience:** Wrap page-specific extractions in `try/catch`.
- **Latency:** Respect the target server. Do not spam requests; use reasonable delays.
- **Browser State:** Cleanup browser instances (`browser.close()`) to prevent memory leaks on runner machines.

## 4. Backend (GAS/Wix) Standards
- **Defensive UI:** Always check for element existence before modifying properties in Wix Velo.
- **Secrets Management:** Use Wix Secrets or GAS Script Properties for all API keys, webhook URLs, and sheet IDs.
- **Single Click Policy:** All CTA buttons (Phone, SignNow) must be single-click to initiate action. No `onDblClick` allowed.

## 5. Branching & Commits
- Use descriptive branch names: `feature/lee-county-fix`, `fix/signnow-webhook`.
- Commit messages should be concise and follow the conventional commits style (e.g., `feat: add palm beach scraper`).

> [!WARNING]
> Any code that bypasses the lead scoring logic or bypasses the `Booking_Number` uniqueness check will be rejected.
