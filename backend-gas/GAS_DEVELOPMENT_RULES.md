# GAS Backend — Development Rules

> **Last Updated:** April 17, 2026
> **Audience:** AI agents and developers editing the `backend-gas/` codebase
> **Severity:** These rules are non-negotiable. Violating them breaks production.

---

## 1. The Golden Rules

### Code.js Is Sacred
- `Code.js` owns `doPost()` and `doGet()`. **Never create parallel entry points.**
- All new HTTP endpoints are action strings routed through `Code.js`.
- Never add business logic directly to `Code.js` — add it in a handler file, then call it from `Code.js`.

### UnifiedMenuSystem.js Owns `onOpen()`
- **Only one file** may define `function onOpen()`: `UnifiedMenuSystem.js`.
- If you see `onOpen()` in any other file, it's a bug — remove it.
- Menu items use the `menu_*` wrapper pattern for toast notifications.

### TriggerSetup.js Owns All Triggers
- **All triggers** are defined in the `TRIGGER_REGISTRY` array in `TriggerSetup.js`.
- Never create triggers with `ScriptApp.newTrigger()` anywhere else.
- To add a new trigger, add an entry to `TRIGGER_REGISTRY` and run "Reinstall All Triggers" from the menu.

---

## 2. How To: Common Tasks

### Add a New Scraper (County)

1. **Create the file**: `ArrestScraper_[County]County.js`
2. **Implement**: Must export a `run[County]Scraper()` function
3. **Schema**: Output must match the 35-column standard (see `SCRAPER_NOTES.md`)
4. **Dedup**: Use `Booking_Number` + `County` as the unique key — never duplicate rows
5. **Register**: Add the function to `ArrestScraperList.js`
6. **Add to TheScout**: Include in `runAllCountyScrapers()` in `TheScout.js`
7. **Add trigger** (optional): Add to `TRIGGER_REGISTRY` in `TriggerSetup.js`
8. **Add menu item**: Add under `📡 Arrest Scrapers` submenu in `UnifiedMenuSystem.js`
9. **Update docs**: Add to `GAS_FILE_MAP.md` and `GAS_AUTOMATION_GUIDE.md`

### Add a New Code.js Action (POST)

1. **Choose auth level**:
   - Pre-auth (no API key): Add before the API key check block
   - Authenticated: Add after `routeAuthenticatedAction()`
2. **Add the route**: `if (data.action === 'your_action') { return yourHandler(data); }`
3. **Create handler**: Put logic in the appropriate handler file, not in `Code.js`
4. **Return format**: Always return `createJsonResponse({...})` or `createErrorResponse(...)`
5. **Update docs**: Add to `GAS_AUTOMATION_GUIDE.md` Section 1

### Add a New Node-RED Handler (GET)

1. **Add function** to `NodeRedHandlers.js`: `function handleYourAction(data) { ... }`
2. **Register route** in `Code_Helpers.js` → `handleGetAction()` switch/if block
3. **Return format**: Always return `ContentService.createTextOutput(JSON.stringify({...}))`
4. **Update docs**: Add to `GAS_AUTOMATION_GUIDE.md` Section 3

### Add a New Telegram Bot Command

1. **Add handler** in the appropriate `Telegram_*.js` file
2. **Register command** in `Telegram_Webhook.js` routing
3. **Set bot command** via Telegram Bot API (use `setMyCommands()`)
4. **Update Shannon KB** if the command relates to bail info: `docs/shannon-knowledge-base.txt`

### Add a New Menu Item

1. **Add to correct submenu** in `UnifiedMenuSystem.js`
2. **Create wrapper function**: `function menu_yourAction() { ... }` in `UnifiedMenuSystem.js`
3. **Pattern**: Wrapper shows toast → calls real function → shows completion toast
4. **If it needs a dialog**: Add HTML dialog in `MenuDialogs.js`

### Add a New Script Property

1. **Set via GAS Script Editor**: File → Project Settings → Script Properties
2. **Access**: `PropertiesService.getScriptProperties().getProperty('KEY')`
3. **Never hardcode** the value in JS — always read from properties
4. **Update docs**: Add to `GAS_AUTOMATION_GUIDE.md` Section 4

---

## 3. Deployment Protocol

### Standard Deploy (Same URL)
```bash
cd backend-gas/
npx @google/clasp push -f
npx @google/clasp deploy -i AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z -d "V### - Description"
```

> [!CAUTION]
> **Never create a NEW deployment** unless explicitly instructed. A new deployment generates a new Web App URL, which requires updating `GAS_WEB_APP_URL` in Wix Secrets Manager, Netlify env vars, and Node-RED config. Always use the existing deployment ID above.

### Post-Deploy Checklist
- [ ] Open the Google Sheet and verify the ☘️ Shamrock Automation menu loads
- [ ] Run "🩺 Run System Health Check" from the menu
- [ ] Verify triggers are active: "🔧 View Active Triggers"
- [ ] Check Slack for any error notifications
- [ ] Test one action end-to-end (e.g., run a scraper)

### Version Numbering
- Current: V429+ (increments automatically)
- Description format: `"V### - [Category]: [Brief description]"`
- Example: `"V430 - Scraper: Add Broward County scraper"`

---

## 4. Code Patterns

### Response Builders
```javascript
// Success
return createJsonResponse({ status: 'success', data: result });

// Error
return createErrorResponse('Descriptive message', ERROR_CODES.SOME_CODE);
```

### Toast Notifications (Menu)
```javascript
function menu_doSomething() {
  SpreadsheetApp.getActive().toast('Starting...', '☘️ Shamrock', 3);
  try {
    actualFunction();
    SpreadsheetApp.getActive().toast('Done!', '✅ Complete', 5);
  } catch (e) {
    SpreadsheetApp.getActive().toast('Error: ' + e.message, '❌ Failed', 10);
  }
}
```

### Idempotent Writes
```javascript
// Always check for existing record before inserting
const existing = sheet.getDataRange().getValues().find(
  row => row[COL.BOOKING] === bookingNumber && row[COL.COUNTY] === county
);
if (existing) return; // Skip duplicate
```

### Slack Notifications
```javascript
SlackNotifier.send({
  channel: '#leads',
  text: `New lead: ${name} (${county})`,
  blocks: [/* optional rich format */]
});
```

---

## 5. Forbidden Patterns

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Put business logic in `Code.js` | Create a handler file, call from `Code.js` |
| Add `onOpen()` in any file except `UnifiedMenuSystem.js` | Add menu items to `UnifiedMenuSystem.js` |
| Create triggers with `ScriptApp.newTrigger()` outside `TriggerSetup.js` | Add to `TRIGGER_REGISTRY` |
| Hardcode API keys in JS files | Use `PropertiesService.getScriptProperties()` |
| Hardcode Sheet IDs in JS files | Use `CONFIG.js` constants or Script Properties |
| Use `Logger.log()` for production logging | Use `console.log()` (appears in Stackdriver) |
| Create a new GAS deployment | Use the existing deployment ID |
| Delete a file without checking imports | `grep` for the filename across all `.js` files first |
| Rename IntakeQueue columns | Requires full migration plan (see RULES.md Rule 5) |
| Show "Loading..." text to users | Use spinners, toasts, or progress indicators |

---

## 6. Testing

### Quick Smoke Test
From the ☘️ Shamrock Automation menu:
1. **Health Check**: `⚙️ System > Run System Health Check`
2. **Trigger Status**: `⚙️ System > View Active Triggers`

### Manual Function Test
In the GAS Script Editor:
1. Select function from dropdown
2. Click "Run"
3. Check Execution Log for errors
4. Check Google Sheet for data changes

### Integration Test
Use `Test_*.js` files for end-to-end tests:
- `Test_Integrations.js` — Full integration suite
- `Test_Suite.js` — Comprehensive test runner
- `Test_Slack.js` — Slack webhook verification
- `Test_PDF_Hydration.js` — PDF field mapping validation

---

## 7. Debugging

### Stackdriver Logs
- All `console.log()` / `console.error()` output goes to Stackdriver
- View: GAS Editor → Executions → Click a run → View logs
- Or: Google Cloud Console → Logging → Filter by GAS project

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 403 from Wix | `GAS_API_KEY` mismatch | Compare Wix Secrets vs Script Properties |
| Menu doesn't load | Another `onOpen()` exists | Search for `function onOpen` across all files |
| Trigger not firing | Trigger not installed | Run "Reinstall All Triggers" |
| Duplicate rows in sheet | Missing dedup check | Add `Booking_Number + County` check |
| "Authorization required" | New scope needed | Re-authorize from GAS Editor |
| SignNow token expired | Token refresh failed | Run `refreshSignNowToken()` manually |

---

> [!TIP]
> **Before making ANY change**, ask yourself:
> 1. Does this change `Code.js`? → Update the routing table in `GAS_AUTOMATION_GUIDE.md`
> 2. Does this add a file? → Update `GAS_FILE_MAP.md`
> 3. Does this add a trigger? → Add to `TRIGGER_REGISTRY` in `TriggerSetup.js`
> 4. Does this add a script property? → Update `GAS_AUTOMATION_GUIDE.md` Section 4
> 5. Could this break existing functionality? → Test with `SystemHealthCheck.js` first
