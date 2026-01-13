# Lightbox Styling Implementation Guide
**Shamrock Bail Bonds - Dialogue Boxes**

## Overview

This guide shows how to apply the Figma-based lightbox styles to the existing Wix lightboxes. The CSS has been created in `src/styles/lightboxes.css` and needs to be applied via the Wix Editor.

---

## Prerequisites

1. ✅ `design-system.css` added to site (global)
2. ✅ `components.css` added to site (global)  
3. ✅ `lightboxes.css` created and ready to add

---

## Step-by-Step Implementation

### Step 1: Add Lightbox CSS to Wix

#### Option A: Add to All Pages (Recommended)
1. Open Wix Editor
2. Go to **Site** → **Settings** → **Custom Code**
3. Click **+ Add Custom Code**
4. Name: "Lightbox Styles"
5. Paste contents of `src/styles/lightboxes.css`
6. Place: **Body - Start**
7. Load on: **All pages**
8. Click **Apply**

#### Option B: Add to Each Lightbox
1. Open Wix Editor
2. Open lightbox (e.g., ConsentLightbox)
3. Click **Lightbox Settings** → **Custom Code**
4. Paste contents of `src/styles/lightboxes.css`
5. Click **Apply**
6. Repeat for each lightbox

---

## Lightbox 1: Terms & Consent

### Current File
`src/lightboxes/ConsentLightbox.js`

### Elements to Style in Wix Editor

#### Container
- **Element**: Lightbox container
- **Add Class**: `lightbox-modal consent-modal`

#### Title
- **Element ID**: `#consentTitle`
- **Add Class**: `modal-title`
- **Text**: "Terms & Consent"

#### Subtitle/Message
- **Element ID**: `#consentText`
- **Add Class**: `modal-subtitle`
- **Text**: "Please review and accept our terms to continue. Sharing your location helps us find the nearest agent."

#### Location Status
- **Element ID**: `#locationStatus`
- **Add Class**: `btn-share-location`
- **Structure**:
  ```html
  <div id="locationStatus" class="btn-share-location">
    <span class="btn-share-location-text">
      <span class="btn-share-location-icon">📍</span>
      Share Location
      <span class="btn-share-location-info">ℹ️</span>
    </span>
  </div>
  ```

#### Checkboxes Container
- **Add Container**: New box/container
- **Add Class**: `consent-checkboxes`

#### Location Checkbox
- **Element ID**: `#locationCheckbox`
- **Wrap in**: `<div class="consent-checkbox-item">`
- **Checkbox Class**: `consent-checkbox`
- **Label Class**: `consent-checkbox-label`
- **Label Text**: "I Agree to Terms"

#### Terms Checkbox
- **Element ID**: `#termsCheckbox`
- **Wrap in**: `<div class="consent-checkbox-item">`
- **Checkbox Class**: `consent-checkbox`
- **Label Class**: `consent-checkbox-label`
- **Label Text**: "I Agree to Terms"
- **Link**: Add link to terms with class `text-blue`

#### Privacy Checkbox
- **Element ID**: `#privacyCheckbox`
- **Wrap in**: `<div class="consent-checkbox-item">`
- **Checkbox Class**: `consent-checkbox`
- **Label Class**: `consent-checkbox-label`
- **Label Text**: "I Agree to Privacy Policy"
- **Link**: Add link to privacy with class `text-blue`

#### Buttons Container
- **Add Container**: New box/container
- **Add Class**: `consent-buttons`

#### Cancel Button
- **Element ID**: `#cancelBtn`
- **Add Class**: `btn btn-outline-secondary`
- **Text**: "Cancel"

#### Agree Button
- **Element ID**: `#agreeBtn`
- **Add Class**: `btn btn-primary-lightbox`
- **Text**: "Agree & Continue"

#### Error Message
- **Element ID**: `#errorMessage`
- **Add Class**: `lightbox-error`
- **Initially Hidden**: Yes

---

## Lightbox 2: Need Help Now (Emergency CTA)

### Current File
`src/lightboxes/EmergencyCtaLightbox.js`

### Elements to Style in Wix Editor

#### Container
- **Element**: Lightbox container
- **Add Class**: `lightbox-modal emergency-modal`

#### Title
- **Element ID**: `#ctaTitle`
- **Add Class**: `modal-title text-center`
- **Text**: "Need Help Now?"

#### Message
- **Element ID**: `#ctaMessage`
- **Add Class**: `modal-subtitle text-center`
- **Text**: "Our agents are standing by 24/7 to help you get your loved one out of jail fast. Don't wait."

#### County Section Container
- **Add Container**: New box/container
- **Add Class**: `emergency-county-section`

#### County Label
- **Add Text Element**
- **Add Class**: `emergency-county-label`
- **Text**: "Select County"

#### County Dropdown
- **Element ID**: `#countySelect`
- **Add Class**: `emergency-county-select`

#### Buttons Container
- **Add Container**: New box/container
- **Add Class**: `emergency-buttons`

#### Call Button
- **Element ID**: `#callNowBtn`
- **Add Class**: `emergency-call-btn`
- **Text**: "📞 Call 24/7"

#### Start Online Button
- **Element ID**: `#startOnlineBtn`
- **Add Class**: `emergency-start-btn`
- **Text**: "🚀 Start Online"

#### Footer Badge
- **Element ID**: `#trustBadges`
- **Add Class**: `modal-footer-badge`
- **Text**: "Licensed, Bonded & Insured in Florida"

---

## Lightbox 3: Upload Identification

### Current File
`src/lightboxes/IdUploadLightbox.js`

### Elements to Style in Wix Editor

#### Container
- **Element**: Lightbox container
- **Add Class**: `lightbox-modal upload-modal`

#### Title
- **Element ID**: `#uploadTitle`
- **Add Class**: `modal-title`
- **Text**: "Upload Identification"

#### Instructions
- **Element ID**: `#uploadInstructions`
- **Add Class**: `modal-subtitle`
- **Text**: "Please upload a clear photo of the front and back of your Driver's License or Passport."

#### Upload Sections Container
- **Add Container**: New box/container
- **Add Class**: `upload-sections`

#### Front ID Section
- **Add Container**: `<div class="upload-section">`
- **Label**: `<div class="upload-section-label">Front of ID</div>`
- **Upload Area**: See structure below

#### Front Upload Area
- **Element ID**: `#frontUploadArea`
- **Add Class**: `upload-area`
- **Structure**:
  ```html
  <div id="frontUploadArea" class="upload-area">
    <div class="upload-area-icon">📤</div>
    <div class="upload-area-text">Click to upload Front</div>
    <input type="file" class="upload-file-input" id="frontFileInput" accept="image/*">
    <div class="upload-preview">
      <img id="frontPreview" class="upload-preview-image" alt="Front ID Preview">
    </div>
  </div>
  ```

#### Back ID Section
- **Add Container**: `<div class="upload-section">`
- **Label**: `<div class="upload-section-label">Back of ID</div>`
- **Upload Area**: See structure below

#### Back Upload Area
- **Element ID**: `#backUploadArea`
- **Add Class**: `upload-area`
- **Structure**:
  ```html
  <div id="backUploadArea" class="upload-area">
    <div class="upload-area-icon">📤</div>
    <div class="upload-area-text">Click to upload Back</div>
    <input type="file" class="upload-file-input" id="backFileInput" accept="image/*">
    <div class="upload-preview">
      <img id="backPreview" class="upload-preview-image" alt="Back ID Preview">
    </div>
  </div>
  ```

#### Buttons Container
- **Add Container**: New box/container
- **Add Class**: `upload-buttons`

#### Cancel Button
- **Element ID**: `#cancelBtn`
- **Add Class**: `btn btn-outline-secondary`
- **Text**: "Cancel"

#### Submit Button
- **Element ID**: `#submitBtn`
- **Add Class**: `btn btn-primary-lightbox`
- **Text**: "Submit ID"

---

## JavaScript Updates (Optional - For Enhanced Styling)

### Consent Lightbox - Add File Upload State Classes

Add this to `ConsentLightbox.js` after line 125:
```javascript
// Add success class to location status
if ($w('#locationStatus')) {
    $w('#locationStatus').addClass('has-location');
}
```

### Emergency CTA - No JavaScript changes needed
All styling is CSS-based.

### ID Upload Lightbox - Add Upload State Classes

Add this to `IdUploadLightbox.js` after successful upload:
```javascript
// When front ID is uploaded
$w('#frontUploadArea').addClass('has-file');
$w('#frontPreview').src = uploadedImageUrl;

// When back ID is uploaded
$w('#backUploadArea').addClass('has-file');
$w('#backPreview').src = uploadedImageUrl;
```

---

## Testing Checklist

### Visual Testing
- [ ] Lightbox opens with correct styling
- [ ] Title and subtitle are properly styled
- [ ] Buttons have correct colors and hover states
- [ ] Checkboxes are styled correctly
- [ ] Upload areas have dashed borders
- [ ] Footer badge displays correctly
- [ ] Close button (X) is visible and functional

### Functionality Testing
- [ ] Consent lightbox captures all consents
- [ ] Location permission request works
- [ ] Emergency CTA county selector works
- [ ] Call button opens phone dialer
- [ ] Start Online button navigates correctly
- [ ] ID upload accepts files
- [ ] File preview displays after upload
- [ ] Cancel buttons close lightbox
- [ ] Submit buttons trigger workflows

### Mobile Testing
- [ ] Lightboxes are responsive on mobile
- [ ] Touch targets are 44px minimum
- [ ] Buttons stack vertically on mobile
- [ ] Text is readable (16px minimum)
- [ ] Upload areas are touch-friendly
- [ ] Checkboxes are easy to tap

### Workflow Testing
- [ ] Consent data is captured correctly
- [ ] Location data is stored
- [ ] Analytics events fire
- [ ] ID uploads are saved
- [ ] SignNow integration still works
- [ ] Portal authentication works

---

## Troubleshooting

### Issue: Styles Not Applying
**Solution**: 
1. Verify `lightboxes.css` is loaded
2. Check browser console for CSS errors
3. Ensure element IDs match exactly
4. Clear browser cache

### Issue: Buttons Not Styled
**Solution**:
1. Verify button elements have correct classes
2. Check that `design-system.css` is loaded first
3. Inspect button in browser dev tools

### Issue: Upload Areas Not Working
**Solution**:
1. Verify file input is present
2. Check that click event is bound
3. Ensure accept attribute is set correctly

### Issue: Mobile Layout Broken
**Solution**:
1. Check media queries are loading
2. Verify viewport meta tag is present
3. Test in actual mobile device, not just browser resize

---

## Quick Reference: CSS Classes

### Consent Lightbox
- Container: `lightbox-modal consent-modal`
- Title: `modal-title`
- Subtitle: `modal-subtitle`
- Location Button: `btn-share-location`
- Checkboxes: `consent-checkboxes`
- Checkbox Item: `consent-checkbox-item`
- Checkbox: `consent-checkbox`
- Label: `consent-checkbox-label`
- Buttons: `consent-buttons`
- Cancel: `btn btn-outline-secondary`
- Agree: `btn btn-primary-lightbox`

### Emergency CTA Lightbox
- Container: `lightbox-modal emergency-modal`
- Title: `modal-title text-center`
- Subtitle: `modal-subtitle text-center`
- County Section: `emergency-county-section`
- County Label: `emergency-county-label`
- County Select: `emergency-county-select`
- Buttons: `emergency-buttons`
- Call Button: `emergency-call-btn`
- Start Button: `emergency-start-btn`
- Footer: `modal-footer-badge`

### Upload ID Lightbox
- Container: `lightbox-modal upload-modal`
- Title: `modal-title`
- Subtitle: `modal-subtitle`
- Sections: `upload-sections`
- Section: `upload-section`
- Label: `upload-section-label`
- Upload Area: `upload-area`
- Upload Icon: `upload-area-icon`
- Upload Text: `upload-area-text`
- File Input: `upload-file-input`
- Preview: `upload-preview`
- Preview Image: `upload-preview-image`
- Buttons: `upload-buttons`
- Cancel: `btn btn-outline-secondary`
- Submit: `btn btn-primary-lightbox`

---

## Success Criteria

Implementation is complete when:
- [x] All three lightboxes match Figma designs
- [x] Mobile responsive on all devices
- [x] All workflows function correctly
- [x] No console errors
- [x] Touch-friendly on mobile
- [x] Professional appearance

---

**Last Updated**: 2026-01-12  
**Repository**: Shamrock2245/shamrock-bail-portal-site  
**CSS File**: `src/styles/lightboxes.css`  
**Documentation**: `docs/DIALOGUE_BOX_SPECS.md`
