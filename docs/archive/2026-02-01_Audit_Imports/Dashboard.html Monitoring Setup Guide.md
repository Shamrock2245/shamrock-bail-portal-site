# Dashboard.html Monitoring Setup Guide
**Date:** February 01, 2026  
**Purpose:** Enable monitoring of new intakes from Wix portal in Dashboard.html

---

## 📊 CURRENT DASHBOARD CAPABILITIES

### What Dashboard.html Already Does:
1. ✅ **County Arrest Scraping** - Monitors Florida county booking blotters
2. ✅ **SignNow Status Tracking** - Tracks document signing status
3. ✅ **Manual Refresh** - "Refresh Status" buttons for county stats and SignNow
4. ✅ **Auto-fill from Spreadsheet** - Populates form data from INJECTED_DATA
5. ✅ **Toast Notifications** - Shows status updates to user

### What's Missing:
❌ **IntakeQueue Monitoring** - No automatic polling of Wix IntakeQueue collection
❌ **Real-time Notifications** - No alerts when new intake submitted
❌ **Auto-refresh** - Manual refresh only, no automatic polling

---

## 🎯 MONITORING REQUIREMENTS

### User's Need:
> "Monitor Dashboard.html for new intakes"

### What This Means:
1. **Poll IntakeQueue** - Check Wix CMS for new submissions
2. **Show Notifications** - Alert when new intake arrives
3. **Display Intake Data** - Show defendant/indemnitor info in dashboard
4. **Enable Quick Action** - Allow staff to process intake → generate docs

---

## 🔧 IMPLEMENTATION OPTIONS

### Option 1: Add IntakeQueue Tab to Dashboard (Recommended)
**Pros:**
- Native to Dashboard.html
- Uses existing UI patterns
- Staff can see all intakes in one place
- Can add "Process" button to trigger document generation

**Implementation:**
1. Add new tab "Intake Queue" to Dashboard.html
2. Fetch IntakeQueue data from Wix via backend API
3. Display in table format (similar to SignNow status table)
4. Add refresh button + auto-refresh every 30 seconds
5. Show toast notification when new intake detected

**Code Location:** `/home/ubuntu/swfl-arrest-scrapers/apps_script/Dashboard.html`

---

### Option 2: Wix Backend Webhook to GAS
**Pros:**
- Real-time push notifications
- No polling overhead
- Instant alerts

**Implementation:**
1. Wix backend sends webhook to GAS when intake submitted
2. GAS stores in Script Properties or Sheet
3. Dashboard polls GAS for new intakes
4. Show notification in Dashboard

**Code Location:** 
- Wix: `/home/ubuntu/shamrock-bail-portal-site/src/backend/intakeQueue.jsw`
- GAS: New webhook handler in Apps Script

---

### Option 3: Email Notifications (Simplest)
**Pros:**
- No Dashboard changes needed
- Works on mobile
- Instant notifications

**Implementation:**
1. Wix backend sends email when intake submitted
2. Staff checks email
3. Opens Dashboard to process

**Code Location:** `/home/ubuntu/shamrock-bail-portal-site/src/backend/intakeQueue.jsw`

---

## ✅ RECOMMENDED APPROACH

**Hybrid: Option 1 + Option 3**

### Phase 1: Email Notifications (5 minutes)
Add email notification to existing `submitIntakeForm` function in Wix backend:

```javascript
// In /home/ubuntu/shamrock-bail-portal-site/src/backend/intakeQueue.jsw
import { sendEmail } from 'backend/email-service';

export async function submitIntakeForm(formData) {
    // ... existing code ...
    
    // After successful save to IntakeQueue:
    await sendEmail({
        to: 'staff@shamrockbailbonds.biz',
        subject: `New Intake: ${formData.defendantName}`,
        body: `
            New intake submitted!
            
            Defendant: ${formData.defendantName}
            Indemnitor: ${formData.indemnitorName}
            County: ${formData.county}
            Case ID: ${savedItem._id}
            
            Open Dashboard to process: [Dashboard Link]
        `
    });
    
    return { success: true, caseId: savedItem._id };
}
```

### Phase 2: Dashboard IntakeQueue Tab (30 minutes)
Add new tab to Dashboard.html to display IntakeQueue:

**Steps:**
1. Add "Intake Queue" tab button (line ~1300 in Dashboard.html)
2. Create `#intake-tab` div with table structure
3. Add `fetchIntakeQueue()` function to call Wix API
4. Add `refreshIntakeQueue()` button
5. Add auto-refresh with `setInterval(refreshIntakeQueue, 30000)`
6. Show toast when new intake detected

**Code Template:**
```javascript
// Add to Dashboard.html after line 2800
async function fetchIntakeQueue() {
    try {
        const response = await fetch('https://www.wixapis.com/wix-data/v2/items/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + WIX_API_KEY,
                'wix-site-id': 'a00e3857-675a-493b-91d8-a1dbc5e7c499'
            },
            body: JSON.stringify({
                dataCollectionId: 'IntakeQueue',
                query: {
                    sort: [{ fieldName: '_createdDate', order: 'desc' }],
                    paging: { limit: 50 }
                }
            })
        });
        
        const data = await response.json();
        displayIntakeQueue(data.items);
    } catch (error) {
        console.error('Error fetching intake queue:', error);
        showToast('Error loading intake queue', 'error');
    }
}

function displayIntakeQueue(intakes) {
    const container = document.getElementById('intake-queue-container');
    
    if (intakes.length === 0) {
        container.innerHTML = '<p>No pending intakes</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Case ID</th><th>Defendant</th><th>Indemnitor</th>';
    html += '<th>County</th><th>Submitted</th><th>Action</th>';
    html += '</tr></thead><tbody>';
    
    intakes.forEach(intake => {
        html += `<tr>
            <td>${intake.caseId}</td>
            <td>${intake.defendantName}</td>
            <td>${intake.indemnitorName}</td>
            <td>${intake.county}</td>
            <td>${new Date(intake._createdDate).toLocaleString()}</td>
            <td><button class="btn btn-sm btn-primary" onclick="processIntake('${intake._id}')">Process</button></td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function processIntake(intakeId) {
    // TODO: Trigger document generation workflow
    showToast('Processing intake...', 'info');
}

// Auto-refresh every 30 seconds
setInterval(fetchIntakeQueue, 30000);
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Immediate (Email Notifications):
- [ ] Add email service to Wix backend
- [ ] Update `submitIntakeForm` to send email
- [ ] Test with real intake submission
- [ ] Configure staff email address

### Short-term (Dashboard Tab):
- [ ] Add "Intake Queue" tab to Dashboard.html
- [ ] Implement `fetchIntakeQueue()` function
- [ ] Add Wix API credentials to GAS Script Properties
- [ ] Create table display for intakes
- [ ] Add "Process" button functionality
- [ ] Test auto-refresh

### Long-term (Advanced Features):
- [ ] Add filters (by county, date, status)
- [ ] Add search functionality
- [ ] Add bulk processing
- [ ] Add intake → case conversion workflow
- [ ] Add mobile-optimized dashboard view

---

## 🔐 SECURITY CONSIDERATIONS

### Wix API Access from Dashboard:
1. **Store API Key Securely** - Use GAS Script Properties
2. **Validate Requests** - Check user authentication
3. **Rate Limiting** - Don't poll too frequently (30s minimum)
4. **CORS** - Wix API should allow GAS domain

### Email Notifications:
1. **Don't Include PII** - Use case ID, not full details
2. **Secure Links** - Use authenticated Dashboard URL
3. **Spam Prevention** - Only send on new intake, not updates

---

## 🎯 NEXT STEPS

### Option A: Quick Win (Email Only)
**Time:** 10 minutes  
**Impact:** Immediate notifications  
**Action:** Add email notification to Wix backend

### Option B: Full Solution (Email + Dashboard)
**Time:** 45 minutes  
**Impact:** Complete monitoring system  
**Action:** Implement both email and dashboard tab

### Option C: User Decides
**Question:** Which approach do you prefer?
1. Email notifications only (quick)
2. Dashboard tab only (centralized)
3. Both (recommended)

---

## 📝 NOTES

- Dashboard.html is a Google Apps Script HTML file
- It already has refresh patterns for county stats and SignNow
- Adding IntakeQueue follows the same pattern
- Wix API key is already configured in environment
- Auto-refresh should be configurable (default 30s)
- Toast notifications already implemented and working

---

## ✅ RECOMMENDED IMMEDIATE ACTION

**Add email notifications first** (10 minutes), then assess if dashboard tab is needed based on volume of intakes.

If staff receives 5+ intakes per day, dashboard tab becomes essential.  
If staff receives <5 intakes per day, email notifications may be sufficient.
