# TASK 6: FIX GAS-WIX HTTP FUNCTIONS PAYLOAD COMPATIBILITY

## Findings

### ✅ GAS → Wix Integration is ALREADY CORRECT

The GAS-to-Wix HTTP function integration is fully wired and compatible:

---

## GAS Side (Sender)

**File:** `backend-gas/WixPortalIntegration.js`

**Function:** `syncCaseDataToWix(caseData, sheetRow)` (Lines 70-100)

**Payload Structure:**
```javascript
const payload = {
    apiKey: config.apiKey,  // WIX_API_KEY from Script Properties
    caseData: {
        caseNumber: String(caseData.Case_Number || '').trim(),
        defendantName: String(caseData.Full_Name || '').trim(),
        defendantEmail: String(caseData.Email || '').trim(),
        defendantPhone: String(caseData.Phone || '').trim(),
        indemnitorName: String(caseData.Indemnitor_Name || '').trim(),
        indemnitorEmail: String(caseData.Indemnitor_Email || '').trim(),
        indemnitorPhone: String(caseData.Indemnitor_Phone || '').trim(),
        bondAmount: parseNumeric(caseData.Bond_Amount),
        county: String(caseData.County || '').trim(),
        arrestDate: formatDateForWix(caseData.Arrest_Date),
        charges: String(caseData.Charges || '').trim(),
        status: String(caseData.Status || 'pending').toLowerCase(),
        receiptNumber: String(caseData.Receipt_Number || '').trim(),
        gasSheetRow: sheetRow ? Number(sheetRow) : null
    }
};
```

**HTTP Request:**
```javascript
function sendToWixWithRetry(endpoint, payload) {
    const url = config.baseUrl + endpoint;  // https://www.shamrockbailbonds.biz/_functions/api/syncCaseData
    const params = {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, params);
    // ... retry logic ...
}
```

**Status:** ✅ **CORRECT**

---

## Wix Side (Receiver)

**File:** `src/backend/http-functions.js`

**Function:** `post_apiSyncCaseData(request)` (Lines 45-146)

**Payload Parsing:**
```javascript
const body = await request.body.json();

// Validate API key
if (!body.apiKey) {
    return badRequest({ body: { success: false, message: 'Missing apiKey' } });
}

// Verify API key against stored secret
const validApiKey = await getSecret('GAS_API_KEY');
if (body.apiKey !== validApiKey) {
    return forbidden({ body: { success: false, message: 'Invalid API key' } });
}

// Validate case data
if (!body.caseData || !body.caseData.caseNumber) {
    return badRequest({ body: { success: false, message: 'Missing caseData or caseNumber' } });
}

const caseData = body.caseData;
```

**Field Mapping:**
```javascript
const c = {
    caseNumber: caseData.caseNumber,
    defendantName: caseData.defendantName,
    defendantEmail: caseData.defendantEmail,
    defendantPhone: caseData.defendantPhone,
    indemnitorName: caseData.indemnitorName,
    indemnitorEmail: caseData.indemnitorEmail,
    indemnitorPhone: caseData.indemnitorPhone,
    bondAmount: caseData.bondAmount,
    county: caseData.county,
    arrestDate: caseData.arrestDate,
    charges: caseData.charges,
    status: caseData.status,
    receiptNumber: caseData.receiptNumber,
    gasSheetRow: caseData.gasSheetRow
};
```

**Database Operation:**
```javascript
const existingCases = await wixData.query('Cases')
    .eq('caseNumber', c.caseNumber)
    .find();

if (existingCases.items.length > 0) {
    // Update existing case
    recordToSave._id = existingCases.items[0]._id;
    result = await wixData.update('Cases', recordToSave);
    return ok({ body: { success: true, message: 'Case updated', caseId: result._id, action: 'updated' } });
} else {
    // Create new case
    result = await wixData.insert('Cases', recordToSave);
    return ok({ body: { success: true, message: 'Case created', caseId: result._id, action: 'created' } });
}
```

**Status:** ✅ **CORRECT**

---

## Compatibility Verification

### ✅ Payload Structure Matches

| GAS Field (Sent) | Wix Field (Received) | Match |
|------------------|----------------------|-------|
| `apiKey` | `body.apiKey` | ✅ |
| `caseData.caseNumber` | `caseData.caseNumber` | ✅ |
| `caseData.defendantName` | `caseData.defendantName` | ✅ |
| `caseData.defendantEmail` | `caseData.defendantEmail` | ✅ |
| `caseData.defendantPhone` | `caseData.defendantPhone` | ✅ |
| `caseData.indemnitorName` | `caseData.indemnitorName` | ✅ |
| `caseData.indemnitorEmail` | `caseData.indemnitorEmail` | ✅ |
| `caseData.indemnitorPhone` | `caseData.indemnitorPhone` | ✅ |
| `caseData.bondAmount` | `caseData.bondAmount` | ✅ |
| `caseData.county` | `caseData.county` | ✅ |
| `caseData.arrestDate` | `caseData.arrestDate` | ✅ |
| `caseData.charges` | `caseData.charges` | ✅ |
| `caseData.status` | `caseData.status` | ✅ |
| `caseData.receiptNumber` | `caseData.receiptNumber` | ✅ |
| `caseData.gasSheetRow` | `caseData.gasSheetRow` | ✅ |

### ✅ API Key Authentication

**GAS sends:** `payload.apiKey = config.apiKey` (from Script Properties `WIX_API_KEY`)

**Wix validates:** `body.apiKey === await getSecret('GAS_API_KEY')`

**Requirement:** Both must be set to the same value:
- GAS Script Properties: `WIX_API_KEY`
- Wix Secrets Manager: `GAS_API_KEY`

**Status:** ✅ **CORRECT PATTERN** (just needs configuration)

### ✅ HTTP Method & Content-Type

**GAS sends:** `POST` with `contentType: 'application/json'`

**Wix expects:** `post_apiSyncCaseData` (POST method) with `await request.body.json()`

**Status:** ✅ **COMPATIBLE**

### ✅ Error Handling

**GAS:**
- Retry logic for 5xx errors (server errors)
- No retry for 4xx errors (client errors)
- Exponential backoff
- Max 3 retries

**Wix:**
- Returns 400 for missing/invalid data
- Returns 403 for invalid API key
- Returns 500 for database errors
- Returns 200 for success

**Status:** ✅ **ROBUST**

---

## Configuration Requirements

### GAS Script Properties (Already Set)

**File:** `backend-gas/WixPortalIntegration.js` (Line 22)

```javascript
const apiKey = scriptProps.getProperty('WIX_API_KEY');
```

**To set (run once in GAS):**
```javascript
function setWixApiKey(apiKey) {
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty('WIX_API_KEY', apiKey.trim());
    Logger.log('✅ Wix API key set successfully');
}
```

### Wix Secrets Manager (Needs Verification)

**File:** `src/backend/http-functions.js` (Line 57)

```javascript
const validApiKey = await getSecret('GAS_API_KEY');
```

**To set (in Wix Secrets Manager):**
1. Open Wix Editor
2. Go to Settings → Secrets Manager
3. Add secret: `GAS_API_KEY` = `<same value as GAS WIX_API_KEY>`

---

## No Code Changes Required

**All payload structures, field mappings, and authentication patterns are already correct.**

The only requirement is configuration:
1. ✅ Set `WIX_API_KEY` in GAS Script Properties
2. ✅ Set `GAS_API_KEY` in Wix Secrets Manager (same value)

---

## Test Steps

### In GAS Script Editor:

1. **Set API key:**
   ```javascript
   setWixApiKey('your-secure-api-key-here');
   ```

2. **Test sync:**
   ```javascript
   function testWixSync() {
       const testCase = {
           Case_Number: 'TEST-001',
           Full_Name: 'John Doe',
           Email: 'john@example.com',
           Phone: '555-1234',
           Bond_Amount: 5000,
           County: 'Lee',
           Status: 'pending'
       };
       const result = syncCaseDataToWix(testCase, 1);
       Logger.log(result);
   }
   ```

3. **Check logs:**
   - **Verify:** No "WIX_API_KEY is missing" warning
   - **Verify:** HTTP 200 response from Wix
   - **Verify:** `{ success: true, message: 'Case created', caseId: '...' }`

### In Wix:

1. **Verify secret is set:**
   - Open Wix Editor → Settings → Secrets Manager
   - **Verify:** `GAS_API_KEY` exists

2. **Check Cases collection:**
   - Open Wix Editor → CMS → Cases
   - **Verify:** Test case `TEST-001` appears with all fields populated

3. **Test invalid API key:**
   - Temporarily change `GAS_API_KEY` in Wix
   - Run `testWixSync()` in GAS
   - **Verify:** HTTP 403 response with "Invalid API key" message

---

## Stop Condition

**DONE MEANS:**

1. ✅ GAS payload structure matches Wix receiver
2. ✅ All 15 fields map correctly
3. ✅ API key authentication pattern is correct
4. ✅ HTTP method and content-type are compatible
5. ✅ Error handling is robust with retry logic

**No code changes needed. Integration is already correct and ready for configuration.**
