# Charlotte County Scraper Setup Guide

## 🚨 Cloudflare Challenge

The Charlotte County arrest database (`https://inmates.charlottecountyfl.revize.com/`) is protected by **Cloudflare bot detection**, which blocks automated scraping. This is a common security measure.

---

## 🎯 Solution Options

### Option 1: Manual Cookie Transfer (RECOMMENDED - Easiest)

**How it works:** Get past Cloudflare in your browser, copy the cookies, and use them in the scraper.

**Steps:**

1. **Open the site in your browser:**
   - Go to: https://inmates.charlottecountyfl.revize.com/
   - Complete the Cloudflare challenge (checkbox or wait)
   - Wait until the arrest database loads

2. **Copy your cookies:**
   - **Chrome:** F12 → Application → Cookies → inmates.charlottecountyfl.revize.com
   - **Firefox:** F12 → Storage → Cookies → inmates.charlottecountyfl.revize.com
   - Copy all cookie values into this format:
     ```
     cf_clearance=VALUE1; __cf_bm=VALUE2; other_cookie=VALUE3
     ```

3. **Store cookies in Apps Script:**
   - Open your Google Sheet
   - Extensions → Apps Script
   - In the console at bottom, run:
     ```javascript
     setCloudfl areCookies('cf_clearance=YOUR_VALUE_HERE; __cf_bm=YOUR_VALUE_HERE');
     ```

4. **Run the scraper:**
   - Menu: **🟩 Bail Suite → Arrests (Charlotte) → ▶️ Run now**

**Limitations:**
- Cookies expire after ~30 minutes to 24 hours
- You'll need to refresh them periodically
- Can be automated with a browser extension

---

### Option 2: Puppeteer/Playwright (Advanced)

**How it works:** Use a headless browser to bypass Cloudflare, then extract data.

**Requirements:**
- External server (not Apps Script)
- Node.js with Puppeteer or Playwright
- Proxy service (optional, for better success rate)

**Implementation:**
1. Set up Node.js server
2. Install Puppeteer: `npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth`
3. Create scraper script that:
   - Launches headless Chrome
   - Navigates to Charlotte County site
   - Waits for Cloudflare to pass
   - Extracts arrest data
   - Returns JSON to Apps Script via API

**Cost:** $5-20/month for server

---

### Option 3: Cloudflare Bypass Service (Paid)

**How it works:** Use a third-party service that handles Cloudflare challenges.

**Services:**
- **ScraperAPI** - https://www.scraperapi.com/ ($49/month)
- **Bright Data** - https://brightdata.com/ ($500/month)
- **Oxylabs** - https://oxylabs.io/ ($99/month)

**Implementation:**
```javascript
var apiKey = 'YOUR_SCRAPER_API_KEY';
var url = 'https://inmates.charlottecountyfl.revize.com/';
var apiUrl = 'http://api.scraperapi.com?api_key=' + apiKey + '&url=' + encodeURIComponent(url);

var response = UrlFetchApp.fetch(apiUrl);
var html = response.getContentText();
```

---

### Option 4: Alternative Data Source (Best Long-Term)

**Check if Charlotte County has:**
- Public API
- RSS feed
- Data portal
- FTP server with daily exports

**Where to check:**
- Charlotte County IT department
- Florida public records request
- Data.gov or local open data portals

---

## 🔧 Current Scraper Status

### ✅ What's Built:
- Complete scraper infrastructure
- Same scoring logic as Lee County
- Separate county tab structure
- Deduplication by County + Booking_Number
- Slack notifications
- 30-minute trigger system
- Search link generation

### ⚠️ What's Missing:
- Cloudflare bypass (choose option above)
- HTML parsing logic (waiting for site access)

---

## 📋 Once Cloudflare is Bypassed

### Step 1: Access the Site
Use one of the methods above to get the HTML content.

### Step 2: Inspect the HTML Structure
1. View page source
2. Find the arrest records (likely in a `<table>` or `<div>` list)
3. Identify field selectors:
   - Full Name
   - DOB
   - Booking Number
   - Booking Date
   - Charges
   - Bond Amount
   - Bond Type
   - etc.

### Step 3: Implement Parsing
Update the `parseCharlotteHTML_()` function in `ArrestScraper_CharlotteCounty.js`:

```javascript
function parseCharlotteHTML_(html) {
  var arrests = [];
  
  // Example: Parse table rows
  var rows = html.match(/<tr class="arrest-row">.*?<\/tr>/gs);
  
  if (!rows) return arrests;
  
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    
    var arrest = {
      Full_Name: extractField(row, /<td class="name">(.*?)<\/td>/),
      DOB: extractField(row, /<td class="dob">(.*?)<\/td>/),
      Booking_Number: extractField(row, /<td class="booking">(.*?)<\/td>/),
      // ... etc
    };
    
    // Normalize and enrich
    arrest.Last_Name = parseLastName_(arrest.Full_Name);
    arrest.DOB = normalizeDate_(arrest.DOB);
    
    var searchLinks = generateSearchLinks_(arrest.Full_Name);
    arrest.Google_Search = searchLinks.Google_Search;
    arrest.Facebook_Search = searchLinks.Facebook_Search;
    arrest.TruePeopleSearch = searchLinks.TruePeopleSearch;
    
    arrests.push(arrest);
  }
  
  return arrests;
}

function extractField(html, regex) {
  var match = html.match(regex);
  return match ? match[1].trim() : '';
}
```

### Step 4: Test
```javascript
runCharlotteCountyScrape();
```

---

## 🚀 Deployment

```bash
cd /Users/brendan/Desktop/shamrock-automations
git pull origin main
clasp push
```

Then:
1. **Set up Cloudflare bypass** (choose option above)
2. **Run scraper:** Menu → 🟩 Bail Suite → Arrests (Charlotte) → ▶️ Run now
3. **Install trigger:** Menu → 🟩 Bail Suite → Arrests (Charlotte) → ⏰ Install 30-min trigger
4. **Check results:** Open Qualified_Arrests spreadsheet → "Charlotte County Qualified Arrests" tab

---

## 📊 Expected Results

### Qualified_Arrests Spreadsheet Structure:

**Tab: "Charlotte County Qualified Arrests"**

| Column | Description |
|--------|-------------|
| County | "Charlotte" |
| Full_Name | Title case |
| Last_Name | Extracted from full name |
| DOB | YYYY-MM-DD |
| Booking_Number | Unique ID |
| Booking_Date | YYYY-MM-DD |
| Status | In Custody / Released |
| Charges | Pipe-separated |
| Bond_Amount | Numeric |
| Bond_Type | String |
| Court_Date | YYYY-MM-DD |
| Court_Time | HH:MM:SS |
| Address | Street |
| City | City |
| State | FL |
| ZIP | ZIP code |
| Lead_Score | 0-100 |
| Lead_Status | Hot/Warm/Cold |
| Google_Search | Search URL |
| Facebook_Search | Search URL |
| TruePeopleSearch | Search URL |
| Detail_URL | Arrest detail page |
| Ingested_At | Timestamp |

---

## 🔄 Workflow

1. **Scraper runs** (every 30 min)
2. **Fetches arrests** (last 72 hours)
3. **Scores arrests** (same logic as Lee County)
4. **Filters qualified** (score >= 70)
5. **Writes to sheet** (Charlotte County tab)
6. **Deduplicates** (County + Booking_Number)
7. **Sends Slack** (new qualified arrests)

---

## 🎯 Next Steps

### Immediate:
1. Choose Cloudflare bypass method
2. Get site access
3. Inspect HTML structure
4. Implement parsing logic

### Future:
1. Add more counties (same pattern)
2. Consolidate dashboard across counties
3. Automate cookie refresh
4. Build county comparison reports

---

## 💡 Recommendations

**For now (quick start):**
- Use **Option 1 (Manual Cookie Transfer)**
- Refresh cookies daily
- Set reminder to update cookies

**For long-term (production):**
- Investigate **Option 4 (Alternative Data Source)**
- Contact Charlotte County IT
- Request API access or data feed
- File public records request if needed

**For scale (6-8 counties):**
- Invest in **Option 2 (Puppeteer server)**
- One server can handle all counties
- More reliable than cookies
- Can run 24/7 unattended

---

## 🆘 Troubleshooting

### "Failed to fetch Charlotte County data (Cloudflare block)"
- Cookies expired → Refresh cookies (Option 1)
- Cloudflare updated → Try different bypass method
- IP blocked → Use proxy service

### "No arrests found"
- Site structure changed → Update parsing logic
- Date range issue → Check HOURS_BACK config
- No arrests in timeframe → Normal, wait for next run

### "Qualified arrests: 0"
- Scoring too strict → Lower MIN_SCORE threshold
- No high-value arrests → Normal variation
- Scoring function missing → Check LeadScoring.js

---

## 📞 Support

If you need help with:
- Cloudflare bypass setup
- HTML parsing
- Cookie management
- Alternative data sources

Let me know and I can provide more specific guidance!

