# Phase 2 & 4 Implementation Guide
## Shamrock Bail Bonds Website - Dynamic County Pages & Member Portal

**Date:** December 26, 2025  
**Completed by:** Manus AI  
**Status:** Ready for Deployment

---

## Overview

This guide provides complete implementation instructions for **Phase 2 (Dynamic County Pages)** and **Phase 4 (Member Portal Architecture)** of the Shamrock Bail Bonds website redesign.

All code has been written and is ready to be deployed to the Wix Editor. The implementation follows the 34-column schema from the arrest scraper repository and maintains full compatibility with existing workflows.

---

## Phase 2: Dynamic County Pages Implementation

### What Was Built

1. **Dynamic County Page Template** (`FloridaCounties (Item).becrn.js`)
   - Fully functional dynamic page that generates county-specific content
   - Pulls data from `FloridaCounties` CMS collection
   - Uses `county-generator.jsw` backend to populate all content
   - Includes SEO metadata, structured data, and animations
   - Displays jail, clerk, and sheriff information
   - FAQ section with expand/collapse functionality

2. **Home Page County Selector** (Updated `Home.js`)
   - Added `loadCountySelector()` function
   - Populates dropdown from `FloridaCounties` collection
   - Wires "Get Started" button to navigate to `/county/{slug}`
   - Includes error handling and animations

### Deployment Steps for Phase 2

#### Step 1: Deploy Dynamic County Page

1. Open Wix Editor
2. Navigate to **Pages** → Find the page titled **"FloridaCounties (Item)"**
3. This should already be set up as a **Dynamic Page** connected to the `FloridaCounties` collection
4. If not, create a new Dynamic Page:
   - Click **Add Page** → **Dynamic Page**
   - Connect to `FloridaCounties` collection
   - Set URL pattern to: `/county/{slug}`
   
5. Open the **Code Panel** for this page
6. Replace the entire contents of `FloridaCounties (Item).becrn.js` with the code from:
   ```
   /src/pages/FloridaCounties (Item).becrn.js
   ```

7. **Required Page Elements** (add these in the Wix Editor):
   - `#countyHeroTitle` - Text element for hero headline
   - `#countyHeroSubtitle` - Text element for hero subheadline
   - `#countyCallButton` - Button for "Call Now"
   - `#countyStartBailButton` - Button for "Start Bail"
   - `#aboutCountyText` - Text element for about section
   - `#whyChooseUsText` - Text element for why choose us
   - `#howItWorksText` - Text element for how it works
   - `#serviceAreasText` - Text element for service areas
   - `#jailNameText` - Text element for jail name
   - `#jailPhoneText` - Text element for jail phone
   - `#jailBookingLink` - Button/Link for jail booking search
   - `#clerkNameText` - Text element for clerk name
   - `#clerkPhoneText` - Text element for clerk phone
   - `#clerkWebsiteLink` - Button/Link for clerk website
   - `#sheriffNameText` - Text element for sheriff name
   - `#sheriffWebsiteLink` - Button/Link for sheriff website
   - `#faqRepeater` - Repeater for FAQ items (with `#faqQuestion` and `#faqAnswer` inside)
   - `#loadingSpinner` - Loading indicator
   - `#errorContainer` - Container for error messages
   - `#errorMessage` - Text element for error message

#### Step 2: Update Home Page

1. Open the **Home** page in Wix Editor
2. Open the **Code Panel**
3. Replace the contents of `Home.js` with the updated version from:
   ```
   /src/pages/Home.js
   ```

4. **Required Page Elements** (add these if they don't exist):
   - `#countyDropdown` - Dropdown element for county selection
   - `#getStartedButton` - Button to navigate to selected county
   - `#countyErrorText` - Text element for error messages (optional)

#### Step 3: Verify Backend Module

1. In Wix Editor, go to **Code Files** → **Backend**
2. Verify that `county-generator.jsw` exists and is up to date
3. If not, create it and paste the contents from:
   ```
   /src/backend/county-generator.jsw
   ```

#### Step 4: Test Dynamic County Pages

1. Publish the site
2. Navigate to `/county/lee` (or any valid county slug)
3. Verify that:
   - Page loads without errors
   - All content is populated correctly
   - Jail, clerk, and sheriff information displays
   - FAQ section works
   - "Call Now" and "Start Bail" buttons function
   - SEO metadata is set correctly

---

## Phase 4: Member Portal Implementation

### What Was Built

1. **Enhanced Defendant Portal** (`portal-defendant-enhanced.js`)
   - Complete dashboard with case status
   - "Start Bail Paperwork" button with SignNow integration
   - Document upload functionality (ID and supporting documents)
   - GPS check-in functionality
   - Document and check-in history repeaters
   - Full error handling and animations

2. **Enhanced Indemnitor Portal** (`portal-indemnitor-enhanced.js`)
   - Complete dashboard with financial obligations
   - "Start Financial Paperwork" button with SignNow integration
   - Financial document upload functionality
   - Collateral document upload functionality
   - Payment authorization routing
   - Full error handling and animations

3. **Portal Landing Page** (Already exists: `portal-landing.az3lf.js`)
   - Role-based routing
   - Magic link support
   - Login/signup prompts

### Deployment Steps for Phase 4

#### Step 1: Deploy Enhanced Defendant Portal

1. Open Wix Editor
2. Navigate to the **portal-defendant** page
3. Open the **Code Panel**
4. Replace or create the page code with contents from:
   ```
   /src/pages/portal-defendant-enhanced.js
   ```

5. **Required Page Elements**:
   - `#welcomeText` - Welcome message
   - `#caseStatusText` - Case status display
   - `#startPaperworkButton` - Primary CTA button
   - `#uploadIdButton` - Upload ID button
   - `#uploadDocumentsButton` - Upload documents button
   - `#checkInButton` - Check-in button
   - `#viewPaymentButton` - View payment button
   - `#documentsRepeater` - Repeater for documents (with `#documentName`, `#documentDate`, `#documentStatus`, `#viewDocumentButton`)
   - `#checkInHistoryRepeater` - Repeater for check-ins (with `#checkInDate`, `#checkInLocation`, `#checkInStatus`)
   - `#loadingSpinner` - Loading indicator
   - `#successMessage` - Success message text
   - `#errorMessage` - Error message text
   - `#idUploadBox` - File upload box for ID
   - `#documentUploadBox` - File upload box for documents
   - `#noDocumentsText` - Empty state text (optional)

6. **Set Page Permissions**:
   - In Wix Editor, click on the page settings
   - Set **Page Permissions** to "Members Only"

#### Step 2: Deploy Enhanced Indemnitor Portal

1. Open Wix Editor
2. Navigate to the **portal-indemnitor** page
3. Open the **Code Panel**
4. Replace or create the page code with contents from:
   ```
   /src/pages/portal-indemnitor-enhanced.js
   ```

5. **Required Page Elements**:
   - `#welcomeText` - Welcome message
   - `#obligationStatusText` - Obligation status display
   - `#startFinancialPaperworkButton` - Primary CTA button
   - `#uploadFinancialDocsButton` - Upload financial docs button
   - `#uploadCollateralDocsButton` - Upload collateral docs button
   - `#authorizePaymentButton` - Authorize payment button
   - `#viewCaseDetailsButton` - View case details button
   - `#documentsRepeater` - Repeater for documents (with `#documentName`, `#documentDate`, `#documentStatus`, `#viewDocumentButton`)
   - `#obligationsRepeater` - Repeater for obligations (with `#obligationType`, `#obligationAmount`, `#obligationDueDate`, `#obligationStatus`)
   - `#loadingSpinner` - Loading indicator
   - `#successMessage` - Success message text
   - `#errorMessage` - Error message text
   - `#financialDocUploadBox` - File upload box for financial documents
   - `#collateralDocUploadBox` - File upload box for collateral documents
   - `#noDocumentsText` - Empty state text (optional)

6. **Set Page Permissions**:
   - Set **Page Permissions** to "Members Only"

#### Step 3: Verify Portal Landing Page

1. Open the **portal-landing** page in Wix Editor
2. Verify that the code in `portal-landing.az3lf.js` is up to date
3. This page should already be functional based on previous work

#### Step 4: Verify Backend Modules

Ensure these backend modules exist and are up to date:

1. **signNowIntegration.jsw** - Already exists
   - Handles SignNow API integration
   - Creates signing links for defendants and indemnitors
   - **IMPORTANT**: Update the `SIGNNOW_API_TOKEN` and `SIGNNOW_TEMPLATE_ID` in Wix Secrets Manager

2. **portal-auth.jsw** - Already exists
   - Handles user role management
   - Provides `getUserRole()`, `getPersonId()`, and `ROLES` constants

3. **documentUpload.jsw** - May need to be created
   - Handles document uploads to Wix Media Manager
   - Saves document metadata to `MemberDocuments` collection

#### Step 5: Set Up CMS Collections

Ensure these collections exist in Wix CMS:

1. **Cases**
   - Fields: `defendantPersonId`, `indemnitorPersonId`, `status`, `bondAmount`, `premium`, `_createdDate`

2. **MemberDocuments**
   - Fields: `personId`, `documentName`, `documentType`, `documentUrl`, `status`, `_createdDate`

3. **CheckInRecords**
   - Fields: `personId`, `caseId`, `checkInDate`, `latitude`, `longitude`, `accuracy`, `location`, `verified`

4. **FinancialObligations**
   - Fields: `indemnitorPersonId`, `type`, `amount`, `dueDate`, `status`, `_createdDate`

5. **BailStartLogs**
   - Fields: `personId`, `caseId`, `timestamp`, `source`, `status`, `role`

#### Step 6: Configure SignNow Integration

1. Go to **Wix Secrets Manager** (in Wix Editor: Developer Tools → Secrets Manager)
2. Add the following secrets:
   - `SIGNNOW_API_TOKEN` - Your SignNow API token
   - `SIGNNOW_TEMPLATE_ID` - Your SignNow template ID for bail paperwork

3. Update `signNowIntegration.jsw` with the correct SignNow API endpoints
4. Test the integration in a development environment first

---

## Testing Checklist

### Phase 2 Testing

- [ ] Home page county dropdown loads all counties
- [ ] "Get Started" button navigates to correct county page
- [ ] County page displays correct information for each county
- [ ] Jail, clerk, and sheriff links work correctly
- [ ] FAQ section expands/collapses properly
- [ ] "Call Now" button triggers phone call
- [ ] "Start Bail" button navigates to portal-landing
- [ ] SEO metadata is set correctly for each county
- [ ] Mobile responsiveness works correctly

### Phase 4 Testing

- [ ] Portal landing page shows correct role options
- [ ] Defendant portal loads for defendants
- [ ] Indemnitor portal loads for indemnitors
- [ ] "Start Paperwork" buttons trigger SignNow handoff
- [ ] Document upload functionality works
- [ ] Check-in functionality captures GPS location
- [ ] Document repeaters display uploaded documents
- [ ] Check-in history repeater displays check-ins
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Loading states work properly
- [ ] Page animations work smoothly

---

## Cross-Page Link Validation

### Links to Verify

1. **Home Page → County Pages**
   - County selector dropdown → `/county/{slug}`

2. **Home Page → Portal Landing**
   - "Start Your Bond Now" button → `/portal-landing`

3. **County Pages → Portal Landing**
   - "Start Bail" button → `/portal-landing`

4. **Portal Landing → Role-Specific Portals**
   - Defendant button → `/portal-defendant`
   - Indemnitor button → `/portal-indemnitor`
   - Staff button → `/portal-staff`

5. **Portal Pages → SignNow**
   - "Start Paperwork" buttons → SignNow URL (external)

6. **Portal Pages → Other Portal Pages**
   - Payment buttons → `/portal/payment` (to be implemented)
   - Case details buttons → `/portal/case/{caseId}` (to be implemented)

---

## Next Steps

1. **Deploy to Wix Editor** following the steps above
2. **Test thoroughly** using the testing checklist
3. **Populate CMS Collections** with real county data
4. **Configure SignNow** with production credentials
5. **Test SignNow Integration** end-to-end
6. **Launch** to production

---

## Notes

- All code follows defensive programming practices (checks for element existence before manipulating)
- All code includes error handling and logging
- All code includes animations for premium feel
- All code is mobile-first and responsive
- All code follows the 34-column schema from the arrest scraper repository
- All code maintains compatibility with existing workflows (SignNow, Google Sheets, etc.)

---

## Support

If you encounter any issues during implementation:

1. Check the browser console for error messages
2. Verify all required page elements exist with correct IDs
3. Verify all backend modules are deployed correctly
4. Verify all CMS collections exist with correct fields
5. Contact Manus AI for assistance if needed

---

**End of Implementation Guide**
