# Workflow Mapping - Shamrock Bail Bonds
**Complete Integration Map**

## Overview

This document maps all critical workflows in the Shamrock Bail Bonds automation system, showing how components interact and what must be preserved during the Figma design implementation.

---

## Workflow 1: New User Bail Process (End-to-End)

### Entry Points
1. **Public Website** → "Start Bail Process" button
2. **Emergency CTA Lightbox** → "Start Online" button
3. **County Page** → "Start Bail Process" button

### Flow Diagram
```
[User Clicks "Start Bail"] 
    ↓
[Redirect to /members/start-bail]
    ↓
[Portal Landing Page]
    ↓
[Access Code Entry OR Magic Link]
    ↓
[Session Created with Role]
    ↓
[Redirect to Appropriate Portal]
    ↓
[Defendant/Indemnitor Dashboard]
    ↓
[ID Upload Lightbox Triggered]
    ↓
[User Uploads Government ID]
    ↓
[Consent Lightbox Triggered]
    ↓
[User Accepts Location Tracking]
    ↓
[Location Tracking Starts]
    ↓
[Staff Reviews in Staff Portal]
    ↓
[Staff Triggers Document Generation]
    ↓
[SignNow Documents Prepared]
    ↓
[Signing Lightbox Triggered]
    ↓
[User Signs via SignNow Embed]
    ↓
[Webhook Confirms Completion]
    ↓
[Status Updated in Portal]
    ↓
[Process Complete]
```

### Files Involved
- **Entry**: All public pages with CTA buttons
- **Auth**: `portal-auth.js`, `session-manager.js`, `portal-landing.bagfn.js`
- **Portals**: `portal-defendant.skg9y.js`, `portal-indemnitor.k53on.js`
- **Lightboxes**: `IdUploadLightbox.js`, `ConsentLightbox.js`, `SigningLightbox.js`
- **Backend**: `signnow-webhooks.web.js`, `integrations.web.js`
- **Tracking**: `geolocation-client.js`, `location-tracker.js`

### Critical Preservation Points
1. ✅ All CTA buttons must link to `/members/start-bail`
2. ✅ Portal landing page auth logic must remain unchanged
3. ✅ Lightbox triggering sequence must be preserved
4. ✅ SignNow integration must remain functional
5. ✅ Location tracking must continue working

---

## Workflow 2: Portal Authentication System

### Authentication Flow
```
[User Arrives at Portal Landing]
    ↓
[Check for Existing Session]
    ↓
    ├─ [Valid Session] → [Redirect to Portal]
    └─ [No/Invalid Session] → [Show Login Options]
        ↓
        ├─ [Access Code Entry]
        │   ↓
        │   [Validate Code via Backend]
        │   ↓
        │   [Create Session Token]
        │   ↓
        │   [Store in Browser Storage]
        │   ↓
        │   [Redirect to Role-Specific Portal]
        │
        └─ [Magic Link in URL]
            ↓
            [Validate Token via Backend]
            ↓
            [Create Session Token]
            ↓
            [Store in Browser Storage]
            ↓
            [Redirect to Role-Specific Portal]
```

### Role-Based Routing
```
Session Role = "defendant" → /portal-defendant
Session Role = "indemnitor" → /portal-indemnitor
Session Role = "staff" → /portal-staff
```

### Files Involved
- **Frontend**: `portal-landing.bagfn.js`
- **Backend**: `portal-auth.js` (backend/portal-auth.web.js)
- **Utility**: `session-manager.js` (public/session-manager.js)
- **Portals**: `portal-defendant.skg9y.js`, `portal-indemnitor.k53on.js`, `portal-staff.qs9dx.js`

### Session Management
- **Storage**: Browser storage via `wix-storage-frontend`
- **Token Format**: Custom session token (not Wix Members)
- **Validation**: Server-side validation on each portal load
- **Expiration**: Configurable (default: 24 hours)

### Critical Preservation Points
1. ✅ Custom auth system (NOT Wix Members)
2. ✅ Three distinct roles with separate portals
3. ✅ Session token storage and validation
4. ✅ Magic link handling
5. ✅ Role-based routing logic

---

## Workflow 3: SignNow Document Signing

### Document Generation & Signing Flow
```
[Staff Reviews Case in Staff Portal]
    ↓
[Staff Clicks "Generate Documents"]
    ↓
[Backend Prepares Document Data]
    ↓
[SignNow API Called]
    ↓
[Documents Created in SignNow]
    ↓
[Signing URLs Generated]
    ↓
[Signing Lightbox Triggered for User]
    ↓
[User Opens Signing Lightbox]
    ↓
[SignNow Embed Loads in Lightbox]
    ↓
[User Signs Documents]
    ↓
[SignNow Sends Webhook to Backend]
    ↓
[Webhook Handler Processes Event]
    ↓
[Database Updated with Signed Status]
    ↓
[User Portal Shows "Signed" Status]
    ↓
[Staff Portal Shows "Complete" Status]
    ↓
[Signed PDFs Stored]
```

### Files Involved
- **Lightbox**: `SigningLightbox.js`
- **Backend**: `signnow-webhooks.web.js`, `integrations.web.js`
- **Trigger**: `lightbox-controller.js`
- **Staff Portal**: `portal-staff.qs9dx.js`

### SignNow Integration Points
1. **API Authentication**: OAuth tokens managed in backend
2. **Document Templates**: Pre-configured in SignNow
3. **Field Mapping**: Data mapped to document fields
4. **Webhook URL**: Configured in SignNow dashboard
5. **Event Handling**: `document.signed`, `document.viewed`, etc.

### Critical Preservation Points
1. ✅ SignNow API integration must remain functional
2. ✅ Webhook handler must process events correctly
3. ✅ Signing lightbox must embed SignNow correctly
4. ✅ Status updates must propagate to all portals
5. ✅ Signed documents must be stored properly

---

## Workflow 4: Location Tracking & Compliance

### Location Tracking Flow
```
[User Starts Bail Process]
    ↓
[Consent Lightbox Triggered]
    ↓
[User Reads Consent Text]
    ↓
    ├─ [User Accepts]
    │   ↓
    │   [Consent Stored in Database]
    │   ↓
    │   [Location Tracking Enabled]
    │   ↓
    │   [GPS Data Collected on Schedule]
    │   ↓
    │   [Data Stored in UserLocations Collection]
    │   ↓
    │   [Staff Can View in Staff Portal]
    │
    └─ [User Declines]
        ↓
        [Process Halted]
        ↓
        [Staff Notified]
```

### Tracking Schedule
- **Initial**: Immediate GPS capture after consent
- **Recurring**: Configurable (default: daily check-in)
- **Trigger**: Background process or user portal visit
- **Storage**: UserLocations CMS collection

### Files Involved
- **Lightbox**: `ConsentLightbox.js`
- **Client**: `geolocation-client.js` (public/geolocation-client.js)
- **Tracker**: `location-tracker.js` (public/location-tracker.js)
- **Staff Portal**: `portal-staff.qs9dx.js`

### Data Captured
- Latitude/Longitude
- Timestamp
- Accuracy
- Device information
- User ID
- Case ID

### Critical Preservation Points
1. ✅ Consent must be captured before tracking
2. ✅ GPS data must be accurate and timestamped
3. ✅ Data must be stored in UserLocations collection
4. ✅ Staff must be able to view location history
5. ✅ Tracking must work on mobile devices

---

## Workflow 5: Lead Scoring & Analytics

### Lead Scoring Flow
```
[User Interacts with Site]
    ↓
[Actions Tracked]
    ↓
    ├─ Page Views
    ├─ Button Clicks
    ├─ Form Submissions
    ├─ Time on Site
    └─ Return Visits
        ↓
        [Lead Scorer Calculates Score]
        ↓
        [Score Stored in Database]
        ↓
        [Staff Portal Displays Score]
        ↓
        [High Scores Highlighted]
```

### Scoring Factors
- **Page Views**: +5 points per page
- **CTA Clicks**: +10 points
- **Form Submissions**: +20 points
- **Time on Site**: +1 point per minute
- **Return Visits**: +15 points
- **Document Upload**: +30 points
- **Consent Given**: +25 points

### Files Involved
- **Scorer**: `lead-scorer.js` (public/lead-scorer.js)
- **Dashboard**: `bailBondDashboard.js` (public/bailBondDashboard.js)
- **Staff Portal**: `portal-staff.qs9dx.js`

### Analytics Events Tracked
- `Emergency_CTA_View`
- `Emergency_CTA_Call_Click`
- `Emergency_CTA_Start_Click`
- `County_Page_View`
- `Start_Bail_Click`
- `Portal_Login`
- `ID_Upload_Complete`
- `Consent_Given`
- `Document_Signed`

### Critical Preservation Points
1. ✅ All tracking events must continue firing
2. ✅ Lead scoring algorithm must remain functional
3. ✅ Staff portal must display scores correctly
4. ✅ High-value leads must be highlighted
5. ✅ Analytics data must be stored properly

---

## Workflow 6: Lightbox Triggering System

### Lightbox Controller Logic
```
[Page Loads]
    ↓
[Lightbox Controller Initializes]
    ↓
[Check User State]
    ↓
    ├─ [First-Time Visitor] → [Emergency CTA after 30s]
    ├─ [Returning User, No Session] → [Emergency CTA on exit intent]
    ├─ [Logged In, No ID] → [ID Upload immediately]
    ├─ [ID Uploaded, No Consent] → [Consent immediately]
    ├─ [Consent Given, Documents Ready] → [Signing when triggered]
    └─ [Staff Action] → [Defendant Details when clicked]
```

### Trigger Conditions
| Lightbox | Trigger Condition | Timing |
|----------|------------------|---------|
| Emergency CTA | First-time visitor | 30 seconds after page load |
| Emergency CTA | Exit intent | On mouse leave viewport |
| ID Upload | Logged in, no ID uploaded | Immediately on portal load |
| Consent | ID uploaded, no consent | Immediately after ID upload |
| Signing | Documents ready | When staff triggers or auto |
| Defendant Details | Staff clicks row | Immediately on click |

### Files Involved
- **Controller**: `lightbox-controller.js` (public/lightbox-controller.js)
- **All Lightboxes**: `src/lightboxes/*.js`

### Critical Preservation Points
1. ✅ Lightbox controller must remain functional
2. ✅ Trigger conditions must be preserved
3. ✅ Timing must be minimally invasive
4. ✅ User state detection must work correctly
5. ✅ Lightboxes must open/close properly

---

## Workflow 7: Document Management

### Document Upload & Storage Flow
```
[User Opens ID Upload Lightbox]
    ↓
[User Selects File]
    ↓
[File Validated (type, size)]
    ↓
[File Uploaded to Wix Media Manager]
    ↓
[File URL Stored in Member Profile]
    ↓
[Thumbnail Generated]
    ↓
[Success Message Shown]
    ↓
[Lightbox Closes]
    ↓
[Next Workflow Step Triggered]
```

### Document Types
- **Government ID**: Driver's license, passport, state ID
- **Proof of Address**: Utility bill, lease agreement
- **Collateral Documents**: Property deed, vehicle title
- **Court Documents**: Bail paperwork, court orders

### Storage
- **Location**: Wix Media Manager
- **Metadata**: Stored in MemberProfiles collection
- **Access**: Role-based (defendant, indemnitor, staff)
- **Retention**: Per legal requirements

### Files Involved
- **Lightbox**: `IdUploadLightbox.js`
- **Backend**: Document handling in backend files
- **Portals**: All portal pages (document display)

### Critical Preservation Points
1. ✅ File upload must work on all devices
2. ✅ Validation must prevent invalid files
3. ✅ Storage must be secure
4. ✅ Metadata must link to correct member
5. ✅ Documents must be accessible in portals

---

## Integration Points Summary

### External Services
1. **SignNow**: Document signing platform
2. **Google Drive**: Backup document storage (optional)
3. **Wix Media Manager**: Primary document storage
4. **Wix CMS**: Data storage (Counties, Members, etc.)

### Internal Systems
1. **Custom Auth**: Role-based authentication
2. **Session Management**: Browser storage tokens
3. **Location Tracking**: GPS data collection
4. **Lead Scoring**: Analytics and scoring
5. **Lightbox Controller**: Programmatic triggers

### Data Collections (Wix CMS)
- **FloridaCounties**: County information
- **MemberProfiles**: User data
- **UserLocations**: GPS tracking data
- **AnalyticsEvents**: Event tracking
- **CallLogs**: Communication logs
- **Documents**: Document metadata

---

## Design Implementation Guidelines

### What Can Be Changed
✅ Visual styling (colors, fonts, spacing)  
✅ Layout and positioning  
✅ Button appearances  
✅ Card designs  
✅ Typography  
✅ Icons and images  
✅ Animations and transitions  

### What CANNOT Be Changed
❌ Workflow logic  
❌ API integrations  
❌ Authentication system  
❌ Data storage structure  
❌ Lightbox triggering conditions  
❌ Event tracking  
❌ Role-based routing  
❌ Session management  

### Safe Implementation Approach
1. Add CSS classes to existing elements
2. Create new CSS files for styling
3. Do NOT modify JavaScript logic
4. Test each workflow after styling changes
5. Verify on mobile devices
6. Check console for errors

---

## Testing Checklist

After implementing Figma designs, test:

### Authentication
- [ ] Portal landing page loads
- [ ] Access code entry works
- [ ] Magic link login works
- [ ] Session persists across pages
- [ ] Role-based routing works
- [ ] Logout works

### Lightboxes
- [ ] Emergency CTA triggers correctly
- [ ] ID Upload opens and functions
- [ ] Consent captures agreement
- [ ] Signing embeds SignNow correctly
- [ ] Defendant Details displays data
- [ ] All lightboxes close properly

### SignNow
- [ ] Documents generate correctly
- [ ] Signing URLs are valid
- [ ] Embed loads in lightbox
- [ ] Signatures are captured
- [ ] Webhooks process events
- [ ] Status updates in portals

### Location Tracking
- [ ] Consent lightbox appears
- [ ] GPS data is captured
- [ ] Data stores in UserLocations
- [ ] Staff can view locations
- [ ] Tracking works on mobile

### Lead Scoring
- [ ] Events are tracked
- [ ] Scores calculate correctly
- [ ] Staff portal displays scores
- [ ] High scores are highlighted

### General
- [ ] All pages load without errors
- [ ] Mobile responsive design works
- [ ] Buttons are clickable
- [ ] Forms submit correctly
- [ ] Links navigate properly
- [ ] No console errors

---

**Last Updated**: 2026-01-12  
**Repository**: Shamrock2245/shamrock-bail-portal-site  
**Contact**: admin@shamrockbailbonds.biz
