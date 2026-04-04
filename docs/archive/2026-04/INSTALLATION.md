# Apps Script Installation Guide

## Overview

This guide will help you install the Apps Script components for the SWFL Arrest Scrapers system into your Google Sheets project.

## Project Information

- **Google Account:** admin@shamrockbailbonds.biz
- **Sheet ID:** 121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E
- **Sheet URL:** https://docs.google.com/spreadsheets/d/121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E/edit
- **Apps Script Project:** https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit

## Files to Install

The following files need to be added to your Apps Script project:

1. **ComprehensiveMenuSystem.gs** - Main menu system with all scraper functions
2. **Form.html** - Booking information form interface
3. **FormDataHandler.gs** - Backend handler for form data submission
4. **MenuIntegration.gs** - (Optional) Legacy menu integration code

## Installation Steps

### Step 1: Open Apps Script Editor

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E/edit
2. Click **Extensions** → **Apps Script**
3. This will open the Apps Script editor

### Step 2: Add ComprehensiveMenuSystem.gs

1. In the Apps Script editor, click the **+** button next to "Files"
2. Select **Script**
3. Name it: `ComprehensiveMenuSystem`
4. Copy the entire contents of `ComprehensiveMenuSystem.gs` from this directory
5. Paste it into the editor
6. Click **Save** (Ctrl+S or Cmd+S)

### Step 3: Add Form.html

1. Click the **+** button next to "Files"
2. Select **HTML**
3. Name it: `Form`
4. Copy the entire contents of `Form.html` from this directory
5. Paste it into the editor
6. Click **Save**

### Step 4: Add FormDataHandler.gs

1. Click the **+** button next to "Files"
2. Select **Script**
3. Name it: `FormDataHandler`
4. Copy the entire contents of `FormDataHandler.gs` from this directory
5. Paste it into the editor
6. Click **Save**

### Step 5: Remove or Update Existing onOpen() Function

**Important:** You can only have ONE `onOpen()` function in your Apps Script project.

If you have an existing `onOpen()` function in another file (like `Code.gs`):

**Option A: Replace it**
- Delete or comment out the old `onOpen()` function
- The new one in `ComprehensiveMenuSystem.gs` will be used

**Option B: Merge them**
- Combine the menu items from both functions into one
- Keep only one `onOpen()` function

### Step 6: Test the Installation

1. Close the Apps Script editor
2. Reload your Google Sheet (refresh the page)
3. You should see a new menu called **🟩 Bail Suite** in the menu bar
4. Click on it to verify all menu items are present:
   - 📍 Run Individual Scrapers (submenu)
   - 🚀 Run All Scrapers
   - 📋 Open Booking Form
   - ⏰ Manage Triggers (submenu)
   - 📊 View Status (submenu)
   - ℹ️ About / Help

### Step 7: Test the Booking Form

1. Click **🟩 Bail Suite** → **📋 Open Booking Form**
2. The form should open in a modal dialog
3. Try filling out the form and submitting it
4. Check if a new sheet called "Manual_Bookings" is created
5. Verify the data appears in that sheet

## Menu Features

### Run Individual Scrapers
- Lee County
- Collier County
- Hendry County
- Charlotte County
- Manatee County
- Sarasota County
- DeSoto County

Each scraper can be run manually from the menu.

### Run All Scrapers
Triggers all county scrapers at once.

### Open Booking Form
Opens the HTML form for manually entering booking information.

### Manage Triggers
- **Install Hourly Triggers** - Set up automatic hourly scraper runs
- **View Active Triggers** - See all active time-based triggers
- **Disable All Triggers** - Remove all automated triggers

### View Status
- **View Scraper Logs** - Navigate to the Logs sheet
- **View Qualified Arrests** - Navigate to the Qualified_Arrests sheet
- **Check Sheet Status** - Display sheet statistics

## Configuration

If you need to customize the configuration, edit the `CONFIG` object at the top of `ComprehensiveMenuSystem.gs`:

```javascript
var CONFIG = {
  SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
  GITHUB_REPO_URL: 'https://github.com/Shamrock2245/swfl-arrest-scrapers',
  APPS_SCRIPT_URL: 'https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit',
  
  // Optional: Configure webhooks for automated triggers
  WEBHOOK_URL: '', // e.g., 'https://your-webhook-url.com/trigger'
  
  // County tabs
  COUNTIES: {
    LEE: 'Lee',
    COLLIER: 'Collier',
    // ... etc
  }
};
```

## Webhook Integration (Optional)

If you want the menu items to automatically trigger the Node.js scrapers:

1. Set up a webhook endpoint (e.g., using Google Cloud Functions, AWS Lambda, or a custom server)
2. Update the `WEBHOOK_URL` in the CONFIG object
3. The webhook will receive POST requests with this payload:
   ```json
   {
     "county": "lee",
     "action": "scrape",
     "timestamp": "2025-11-24T08:30:00.000Z"
   }
   ```

## Troubleshooting

### Menu doesn't appear after installation
- Reload the Google Sheet (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
- Check if there are multiple `onOpen()` functions (only one is allowed)
- Check the Apps Script execution log for errors

### Form doesn't open
- Make sure `Form.html` is named exactly "Form" (without the .html extension)
- Check that `FormDataHandler.gs` is also installed
- Check the Apps Script execution log for errors

### Scrapers don't run
- The menu items show instructions for running Node.js scrapers
- To actually run them, you need to either:
  - Run the Node.js scripts locally: `node scrapers/lee.js`
  - Set up GitHub Actions
  - Configure a webhook endpoint

### Permission errors
- Make sure you're signed in as admin@shamrockbailbonds.biz
- Grant necessary permissions when prompted
- Check that the sheet is shared with the correct service account

## Next Steps

After installation:

1. ✅ Test all menu items
2. ✅ Test the booking form
3. ✅ Set up hourly triggers if desired
4. ✅ Configure webhook integration (optional)
5. ✅ Run a test scraper to verify data flow
6. ✅ Check the Logs sheet for execution history

## Support

For issues or questions:
- Check the GitHub repository: https://github.com/Shamrock2245/swfl-arrest-scrapers
- Review the main README.md for system architecture
- Check the Apps Script execution logs for detailed error messages

---

**Last Updated:** November 24, 2025  
**Version:** 2.0  
**Account:** admin@shamrockbailbonds.biz
