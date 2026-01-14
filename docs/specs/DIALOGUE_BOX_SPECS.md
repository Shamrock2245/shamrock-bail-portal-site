# Dialogue Box Design Specifications
**From Figma Screenshots - Interactive Lightboxes**

## Overview

Three interactive dialogue boxes identified from Figma screenshots:
1. **Terms & Consent** - Location sharing consent
2. **Need Help Now?** - Emergency CTA
3. **Upload Identification** - ID upload

---

## 1. Terms & Consent Dialogue Box

### Visual Design
**Layout**: Centered modal, white background

**Elements**:
- **Title**: "Terms & Consent" (dark text, bold)
- **Subtitle**: "Please review and accept our terms to continue. Sharing your location helps us find the nearest agent."
- **Share Location Button**: Blue button with location icon and info icon
- **Checkboxes**:
  - "I Agree to Terms"
  - "I Agree to Privacy Policy"
- **Action Buttons**:
  - "Cancel" (gray/outline)
  - "Agree & Continue" (blue primary)

### Styling Specifications
```css
/* Modal Container */
background: white;
border-radius: 12px;
padding: 32px;
max-width: 500px;
box-shadow: 0 8px 24px rgba(27, 58, 95, 0.2);

/* Title */
font-family: 'Poppins', sans-serif;
font-size: 24px;
font-weight: 600;
color: #212529;
margin-bottom: 12px;

/* Subtitle */
font-family: 'Inter', sans-serif;
font-size: 14px;
color: #6C757D;
line-height: 1.6;
margin-bottom: 24px;

/* Share Location Button */
background: #E9ECEF;
border: 1px solid #DEE2E6;
border-radius: 8px;
padding: 12px 16px;
display: flex;
align-items: center;
gap: 8px;
margin-bottom: 24px;

/* Checkboxes */
display: flex;
flex-direction: column;
gap: 12px;
margin-bottom: 24px;

/* Checkbox Item */
display: flex;
align-items: center;
gap: 8px;

/* Checkbox Label */
font-family: 'Inter', sans-serif;
font-size: 14px;
color: #212529;

/* Button Container */
display: flex;
gap: 12px;
justify-content: flex-end;

/* Cancel Button */
background: transparent;
border: 1px solid #6C757D;
color: #6C757D;
padding: 12px 24px;
border-radius: 8px;

/* Agree Button */
background: #0066CC;
color: white;
padding: 12px 24px;
border-radius: 8px;
```

### Existing File
`src/lightboxes/ConsentLightbox.js`

### Workflow Preservation
- ✅ Consent capture for location tracking
- ✅ Terms acceptance
- ✅ Privacy policy acceptance
- ✅ Integration with location-tracker.js

---

## 2. Need Help Now? Dialogue Box

### Visual Design
**Layout**: Centered modal, white background with yellow/gold accent

**Elements**:
- **Title**: "Need Help Now?" (dark text, bold, centered)
- **Subtitle**: "Our agents are standing by 24/7 to help you get your loved one out of jail fast. Don't wait."
- **County Selector**: Dropdown with "Select a county..." placeholder
- **Primary Button**: "📞 Call 24/7" (blue, full width)
- **Secondary Button**: "🚀 Start Online" (white with blue border, full width)
- **Footer**: "✓ Licensed, Bonded & Insured in Florida" (small text, centered)

### Styling Specifications
```css
/* Modal Container */
background: white;
border-radius: 12px;
padding: 32px 24px;
max-width: 420px;
box-shadow: 0 8px 24px rgba(27, 58, 95, 0.2);
text-align: center;

/* Title */
font-family: 'Poppins', sans-serif;
font-size: 28px;
font-weight: 700;
color: #212529;
margin-bottom: 16px;

/* Subtitle */
font-family: 'Inter', sans-serif;
font-size: 15px;
color: #6C757D;
line-height: 1.6;
margin-bottom: 24px;

/* County Selector Label */
font-family: 'Inter', sans-serif;
font-size: 14px;
font-weight: 600;
color: #212529;
text-align: left;
margin-bottom: 8px;

/* County Dropdown */
width: 100%;
padding: 12px 16px;
border: 1px solid #DEE2E6;
border-radius: 8px;
font-size: 14px;
margin-bottom: 20px;

/* Call Button */
background: #0066CC;
color: white;
width: 100%;
padding: 16px;
border-radius: 8px;
font-size: 16px;
font-weight: 600;
margin-bottom: 12px;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;

/* Start Online Button */
background: white;
border: 2px solid #0066CC;
color: #0066CC;
width: 100%;
padding: 16px;
border-radius: 8px;
font-size: 16px;
font-weight: 600;
margin-bottom: 20px;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;

/* Footer Badge */
font-family: 'Inter', sans-serif;
font-size: 12px;
color: #6C757D;
display: flex;
align-items: center;
justify-content: center;
gap: 4px;
```

### Existing File
`src/lightboxes/EmergencyCtaLightbox.js`

### Workflow Preservation
- ✅ First-time visitor trigger (30 seconds)
- ✅ Exit intent trigger
- ✅ County selection
- ✅ Call action (tel: link)
- ✅ Start bail action (redirect to portal)
- ✅ Analytics tracking

---

## 3. Upload Identification Dialogue Box

### Visual Design
**Layout**: Centered modal, white background

**Elements**:
- **Title**: "Upload Identification" (dark text, bold)
- **Subtitle**: "Please upload a clear photo of the front and back of your Driver's License or Passport."
- **Front of ID Section**:
  - Label: "Front of ID"
  - Upload area with icon
  - "Click to upload Front" text
- **Back of ID Section**:
  - Label: "Back of ID"
  - Upload area with icon
  - "Click to upload Back" text
- **Action Buttons**:
  - "Cancel" (gray/outline)
  - "Submit ID" (blue primary)

### Styling Specifications
```css
/* Modal Container */
background: white;
border-radius: 12px;
padding: 32px;
max-width: 500px;
box-shadow: 0 8px 24px rgba(27, 58, 95, 0.2);

/* Title */
font-family: 'Poppins', sans-serif;
font-size: 24px;
font-weight: 600;
color: #212529;
margin-bottom: 12px;

/* Subtitle */
font-family: 'Inter', sans-serif;
font-size: 14px;
color: #6C757D;
line-height: 1.6;
margin-bottom: 24px;

/* Upload Section Label */
font-family: 'Inter', sans-serif;
font-size: 14px;
font-weight: 600;
color: #212529;
margin-bottom: 8px;

/* Upload Area */
background: #F8F9FA;
border: 2px dashed #DEE2E6;
border-radius: 8px;
padding: 40px 20px;
text-align: center;
margin-bottom: 20px;
cursor: pointer;
transition: all 0.3s ease;

/* Upload Area Hover */
background: #E9ECEF;
border-color: #0066CC;

/* Upload Icon */
width: 48px;
height: 48px;
color: #6C757D;
margin-bottom: 12px;

/* Upload Text */
font-family: 'Inter', sans-serif;
font-size: 14px;
color: #6C757D;

/* Button Container */
display: flex;
gap: 12px;
justify-content: flex-end;
margin-top: 24px;

/* Cancel Button */
background: transparent;
border: 1px solid #6C757D;
color: #6C757D;
padding: 12px 24px;
border-radius: 8px;

/* Submit Button */
background: #0066CC;
color: white;
padding: 12px 24px;
border-radius: 8px;
```

### Existing File
`src/lightboxes/IdUploadLightbox.js`

### Workflow Preservation
- ✅ File upload functionality
- ✅ Front and back ID capture
- ✅ Image validation
- ✅ Storage in Wix Media Manager
- ✅ Metadata storage in member profile
- ✅ Trigger after portal login

---

## Common Design Patterns

### Modal Backdrop
```css
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(27, 58, 95, 0.5);
backdrop-filter: blur(4px);
z-index: 500;
display: flex;
align-items: center;
justify-content: center;
padding: 20px;
```

### Close Button (X)
```css
position: absolute;
top: 16px;
right: 16px;
width: 32px;
height: 32px;
background: transparent;
border: none;
color: #6C757D;
font-size: 24px;
cursor: pointer;
```

### Mobile Responsiveness
```css
@media (max-width: 767px) {
  /* Modal Container */
  max-width: 100%;
  padding: 24px 20px;
  
  /* Title */
  font-size: 20px;
  
  /* Buttons */
  width: 100%;
  
  /* Button Container */
  flex-direction: column;
}
```

---

## Implementation Strategy

### Step 1: Create Lightbox-Specific CSS
Create `src/styles/lightboxes.css` with all three dialogue box styles

### Step 2: Update Existing Lightbox Files
Add CSS classes to existing lightbox JavaScript files:
- `ConsentLightbox.js` → Terms & Consent styling
- `EmergencyCtaLightbox.js` → Need Help Now styling
- `IdUploadLightbox.js` → Upload Identification styling

### Step 3: Preserve All Workflows
- Do NOT modify JavaScript logic
- Only add CSS classes to elements
- Test all triggers and functionality

### Step 4: Test on Mobile
- Verify responsive design
- Test touch interactions
- Ensure 44px minimum touch targets

---

## Element ID Mapping

### Terms & Consent Lightbox
| Element | ID | Class to Add |
|---------|-----|--------------|
| Container | `#consentContainer` | `lightbox-modal consent-modal` |
| Title | `#consentTitle` | `modal-title` |
| Subtitle | `#consentMessage` | `modal-subtitle` |
| Location Button | `#shareLocationBtn` | `btn-share-location` |
| Terms Checkbox | `#agreeTerms` | `consent-checkbox` |
| Privacy Checkbox | `#agreePrivacy` | `consent-checkbox` |
| Cancel Button | `#cancelBtn` | `btn btn-outline-secondary` |
| Agree Button | `#agreeBtn` | `btn btn-primary` |

### Need Help Now Lightbox
| Element | ID | Class to Add |
|---------|-----|--------------|
| Container | `#ctaContainer` | `lightbox-modal emergency-modal` |
| Title | `#ctaTitle` | `modal-title text-center` |
| Message | `#ctaMessage` | `modal-subtitle text-center` |
| County Dropdown | `#countySelect` | `form-select` |
| Call Button | `#callNowBtn` | `btn btn-primary btn-block` |
| Start Button | `#startOnlineBtn` | `btn btn-outline-primary btn-block` |
| Footer | `#trustBadges` | `modal-footer-badge` |

### Upload ID Lightbox
| Element | ID | Class to Add |
|---------|-----|--------------|
| Container | `#uploadContainer` | `lightbox-modal upload-modal` |
| Title | `#uploadTitle` | `modal-title` |
| Instructions | `#uploadInstructions` | `modal-subtitle` |
| Front Upload Area | `#frontUploadArea` | `upload-area` |
| Back Upload Area | `#backUploadArea` | `upload-area` |
| Cancel Button | `#cancelBtn` | `btn btn-outline-secondary` |
| Submit Button | `#submitBtn` | `btn btn-primary` |

---

## Success Criteria

### Visual Design
- [x] Matches Figma screenshots exactly
- [x] White background with proper shadows
- [x] Correct button colors and styles
- [x] Proper spacing and typography
- [x] Mobile responsive

### Functionality
- [x] All workflows preserved
- [x] Triggers work correctly
- [x] Forms submit properly
- [x] File uploads work
- [x] Analytics tracking intact

### Quality
- [x] No console errors
- [x] Accessible (keyboard navigation, screen readers)
- [x] Touch-friendly on mobile
- [x] Professional appearance

---

**Last Updated**: 2026-01-12  
**Source**: Figma screenshots provided by user  
**Repository**: Shamrock2245/shamrock-bail-portal-site
