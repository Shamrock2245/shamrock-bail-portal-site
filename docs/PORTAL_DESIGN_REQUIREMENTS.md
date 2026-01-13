# Portal Design Requirements
**Shamrock Bail Bonds Portal System**

## Critical Branding Requirements

### Logo Usage
- **USE**: Shamrock Bail Bonds logo with badge icon
- **DO NOT USE**: VW logo or any other branding
- **Location**: All portal pages, landing page, member dashboards

### Branding Elements
- Logo: Shamrock badge with clover
- Tagline: "Fort Myers Since 2012"
- Colors: Navy (#1B3A5F), Blue (#0066CC), Gold (#FDB913)

---

## Portal Pages to Style

### 1. Portal Landing Page
**File**: `src/pages/portal-landing.bagfn.js`

**Current Elements to Preserve**:
- Role selection (Defendant, Indemnitor, Staff)
- Login/signup forms
- Custom authentication logic

**Design Updates Needed**:
- Apply Figma visual design
- Replace any VW branding with Shamrock logo
- Use Shamrock color scheme
- Mobile-optimized layout
- Clear role selection cards

### 2. Defendant Portal
**File**: `src/pages/portal-defendant.skg9y.js`

**Current Elements to Preserve**:
- Dashboard with case information
- Document upload functionality
- Court date tracking
- Location check-in
- SignNow integration triggers

**Design Updates Needed**:
- Apply Figma dashboard design
- Shamrock branding throughout
- Mobile-friendly card layout
- Clear action buttons

### 3. Indemnitor Portal
**File**: `src/pages/portal-indemnitor.k53on.js`

**Current Elements to Preserve**:
- Dashboard with defendant information
- Payment tracking
- Document access
- Communication features

**Design Updates Needed**:
- Apply Figma dashboard design
- Shamrock branding throughout
- Mobile-friendly layout
- Clear information hierarchy

### 4. Staff Portal
**File**: `src/pages/portal-staff.qs9dx.js`

**Current Elements to Preserve**:
- Case management dashboard
- Lead scoring display
- Defendant details repeater
- Analytics tracking
- Admin controls

**Design Updates Needed**:
- Apply Figma admin dashboard design
- Shamrock branding throughout
- Data tables with proper styling
- Action buttons for workflows

---

## Lightboxes to Style

### Emergency CTA Lightbox
**Current Design** (from Figma site):
- White card with rounded corners
- "Need Help Now?" heading
- County selector dropdown
- Two buttons: "Call 24/7" (blue) and "Start Online" (white outline)
- "Licensed, Bonded & Insured in Florida" footer text

**Elements to Preserve**:
- Programmatic triggering for first-time visitors
- County selection functionality
- Call and start bail actions

**Design Updates**:
- Apply exact Figma styling
- Shamrock branding
- Mobile-optimized

### Consent Lightbox
**Purpose**: Capture consent for location tracking and metadata

**Elements to Preserve**:
- Legal consent text
- Checkbox for agreement
- Accept/Decline buttons
- Integration with location-tracker.js

**Design Updates**:
- Apply Figma styling
- Clear, readable consent text
- Professional legal appearance

### ID Upload Lightbox
**Purpose**: Allow users to upload government-issued ID

**Elements to Preserve**:
- File upload functionality
- Image preview
- Validation
- Integration with document storage

**Design Updates**:
- Apply Figma styling
- Clear upload area
- Progress indicator
- Success confirmation

### Signing Lightbox
**Purpose**: Initiate SignNow signing process

**Elements to Preserve**:
- SignNow API integration
- Document preparation
- Webhook handling
- Status tracking

**Design Updates**:
- Apply Figma styling
- Clear instructions
- Progress indicator
- Professional appearance

### Help Lightbox
**Purpose**: Provide support information

**Elements to Preserve**:
- Contact information
- FAQ links
- Support options

**Design Updates**:
- Apply Figma styling
- Easy-to-read layout
- Quick access to help

### Cancel Lightbox
**Purpose**: Confirm cancellation actions

**Elements to Preserve**:
- Confirmation logic
- Warning message
- Confirm/Go Back buttons

**Design Updates**:
- Apply Figma styling
- Clear warning design
- Prevent accidental clicks

---

## Workflow Elements to Preserve

### 1. SignNow Integration
**Files**:
- `src/backend/signnow-webhooks.web.js`
- `src/lightboxes/SigningLightbox.js`
- `src/backend/integrations.web.js`

**Workflow**:
1. User completes intake
2. ID uploaded via lightbox
3. Consent captured via lightbox
4. Document generated in background
5. Signing lightbox opens with SignNow embed
6. Webhooks handle completion
7. Status updated in portal

**Design Action**: Style lightboxes only, preserve all logic

### 2. Location Tracking
**Files**:
- `src/public/geolocation-client.js`
- `src/public/location-tracker.js`

**Workflow**:
1. Consent lightbox captures permission
2. GPS data collected on schedule
3. Data stored in UserLocations collection
4. Displayed in staff portal
5. Used for compliance tracking

**Design Action**: Style consent lightbox, preserve tracking logic

### 3. Portal Authentication
**Files**:
- `src/pages/portal-landing.bagfn.js`
- `src/pages/Custom Login.v4636.js`

**Workflow**:
1. User selects role (Defendant/Indemnitor/Staff)
2. Login or signup
3. Custom role-based authentication
4. Redirect to appropriate dashboard
5. Session management

**Design Action**: Style landing page and login forms, preserve auth logic

### 4. Document Management
**Files**:
- Various backend files for document handling

**Workflow**:
1. Documents uploaded via lightboxes
2. Stored in Wix Media Manager
3. Linked to member profiles
4. Accessible in portals
5. Used in SignNow process

**Design Action**: Style upload interfaces, preserve storage logic

---

## Design System Application

### Colors (Shamrock Brand)
```css
--primary-navy: #1B3A5F;
--action-blue: #0066CC;
--shamrock-gold: #FDB913;
--white: #FFFFFF;
--off-white: #F8F9FA;
--near-black: #212529;
--dark-gray: #343A40;
--success-green: #28A745;
--warning-red: #DC3545;
```

### Typography
```css
--heading-font: 'Poppins', sans-serif;
--body-font: 'Inter', sans-serif;
--heading-weight: 600-700;
--body-weight: 400;
```

### Components
- **Buttons**: Primary (blue), Secondary (gold), Outline (white)
- **Cards**: White background, rounded corners, subtle shadow
- **Forms**: Clean inputs, proper labels, validation states
- **Tables**: Striped rows, hover states, sortable headers
- **Modals/Lightboxes**: Centered, backdrop blur, smooth animations

---

## Mobile-First Requirements

All portal pages and lightboxes must be:
- ✅ Fully responsive on mobile devices
- ✅ Touch-friendly (44px minimum touch targets)
- ✅ Fast loading (under 3 seconds)
- ✅ Readable text (16px minimum body text)
- ✅ Easy navigation
- ✅ Proper form inputs for mobile keyboards

---

## Implementation Priority

### Phase 1: Branding Correction
1. Replace any VW branding with Shamrock logo
2. Update color scheme throughout
3. Apply Shamrock typography
4. Test on all pages

### Phase 2: Portal Landing Page
1. Apply Figma design to landing page
2. Style role selection cards
3. Style login/signup forms
4. Test authentication flow

### Phase 3: Dashboard Pages
1. Style Defendant dashboard
2. Style Indemnitor dashboard
3. Style Staff dashboard
4. Test all workflows

### Phase 4: Lightboxes
1. Style Emergency CTA lightbox
2. Style Consent lightbox
3. Style ID Upload lightbox
4. Style Signing lightbox
5. Style Help lightbox
6. Style Cancel lightbox
7. Test all triggers

### Phase 5: Testing & Deployment
1. End-to-end workflow testing
2. Mobile device testing
3. Cross-browser testing
4. Performance testing
5. Deploy to production

---

## Quality Checklist

### Branding
- [ ] Shamrock logo on all pages
- [ ] No VW or other branding
- [ ] Correct color scheme
- [ ] Proper typography
- [ ] "Fort Myers Since 2012" tagline

### Functionality
- [ ] All workflows function correctly
- [ ] SignNow integration works
- [ ] Location tracking works
- [ ] Portal authentication works
- [ ] Document uploads work
- [ ] Lightboxes trigger correctly

### Design
- [ ] Matches Figma designs
- [ ] Mobile responsive
- [ ] Touch-friendly
- [ ] Professional appearance
- [ ] Consistent styling

### Performance
- [ ] Fast page loads
- [ ] No console errors
- [ ] Smooth animations
- [ ] Optimized images
- [ ] Efficient code

---

## Notes

1. **Logo Priority**: The Shamrock logo must replace any VW branding immediately
2. **Workflow Preservation**: All existing workflows are critical and must remain functional
3. **Mobile-First**: Design for mobile first, then scale up
4. **Testing**: Test every workflow after styling changes
5. **Documentation**: Update code comments with Figma design references

---

## Files to Update

### CSS Files
- `src/styles/portal-landing.css` (NEW)
- `src/styles/portal-dashboards.css` (NEW)
- `src/styles/lightboxes.css` (UPDATE)
- `src/styles/global.css` (UPDATE - branding)

### JavaScript Files (Styling Only)
- `src/pages/portal-landing.bagfn.js` (ADD CSS CLASSES)
- `src/pages/portal-defendant.skg9y.js` (ADD CSS CLASSES)
- `src/pages/portal-indemnitor.k53on.js` (ADD CSS CLASSES)
- `src/pages/portal-staff.qs9dx.js` (ADD CSS CLASSES)
- All lightbox files (ADD CSS CLASSES)

**Important**: Only add CSS classes and styling. Do NOT change logic or workflows.

---

## Success Criteria

Implementation is successful when:
1. ✅ Shamrock branding throughout (no VW)
2. ✅ Figma designs applied to all portals
3. ✅ All workflows function correctly
4. ✅ Mobile experience is excellent
5. ✅ SignNow integration works end-to-end
6. ✅ Location tracking captures data
7. ✅ Portal authentication works for all roles
8. ✅ Lightboxes trigger at correct times
9. ✅ No console errors
10. ✅ Professional, modern appearance

---

**Repository**: Shamrock2245/shamrock-bail-portal-site  
**Branch**: main  
**Contact**: admin@shamrockbailbonds.biz
