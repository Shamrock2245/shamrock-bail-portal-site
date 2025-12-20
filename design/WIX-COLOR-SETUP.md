# Wix Color Scheme & Design Setup Guide

## How to Apply the Shamrock Bail Bonds Color Scheme in Wix Editor

This guide walks you through setting up the exact color scheme for the Shamrock Bail Bonds website redesign.

---

## Step 1: Access Site Design Settings

1. Open your Wix Editor
2. Click **Site Design** in the left panel (or press `D`)
3. Select **Color & Text**

---

## Step 2: Set Up Color Palette

### Primary Colors (Add to Palette)

| Color Name | Hex Code | RGB | Where to Use |
|------------|----------|-----|--------------|
| **Deep Navy Blue** | `#1B3A5F` | 27, 58, 95 | Headers, footer, primary text |
| **Action Blue** | `#0066CC` | 0, 102, 204 | Primary buttons, links, CTAs |
| **Shamrock Gold** | `#FDB913` | 253, 185, 19 | Accents, highlights, badges |
| **Trust Green** | `#28A745` | 40, 167, 69 | Success states, checkmarks |
| **Alert Red** | `#DC3545` | 220, 53, 69 | Errors, urgent notices |

### Background Colors

| Color Name | Hex Code | Where to Use |
|------------|----------|--------------|
| **Pure White** | `#FFFFFF` | Main backgrounds |
| **Light Gray** | `#F8F9FA` | Section backgrounds, cards |
| **Medium Gray** | `#E9ECEF` | Borders, dividers |
| **Dark Gray** | `#6C757D` | Secondary text |

### How to Add Colors:
1. In Color & Text panel, click **+ Add Color**
2. Enter the hex code (e.g., `#1B3A5F`)
3. Name the color for easy reference
4. Repeat for all colors above

---

## Step 3: Set Up Typography

### Font Pairing

**Headings:** Poppins (Bold/SemiBold)
**Body Text:** Inter (Regular/Medium)

### How to Add Fonts:
1. In Site Design > Color & Text
2. Click on **Text Themes**
3. For each heading level, click and select font:
   - **Heading 1:** Poppins Bold, 48px
   - **Heading 2:** Poppins SemiBold, 36px
   - **Heading 3:** Poppins SemiBold, 28px
   - **Heading 4:** Poppins Medium, 22px
   - **Paragraph:** Inter Regular, 16px
   - **Small Text:** Inter Regular, 14px

### Text Colors:
- **Headings:** Deep Navy Blue (#1B3A5F)
- **Body Text:** Dark Gray (#333333)
- **Links:** Action Blue (#0066CC)
- **Light Text (on dark bg):** White (#FFFFFF)

---

## Step 4: Button Styles

### Primary Button (Call to Action)
```
Background: #0066CC (Action Blue)
Text: #FFFFFF (White)
Border Radius: 8px
Padding: 16px 32px
Font: Poppins SemiBold, 16px
Hover Background: #0052A3 (darker blue)
```

### Secondary Button
```
Background: Transparent
Border: 2px solid #0066CC
Text: #0066CC
Border Radius: 8px
Padding: 14px 30px
Font: Poppins Medium, 16px
Hover Background: #0066CC
Hover Text: #FFFFFF
```

### Emergency/Call Button
```
Background: #FDB913 (Shamrock Gold)
Text: #1B3A5F (Deep Navy)
Border Radius: 8px
Padding: 16px 32px
Font: Poppins Bold, 18px
Hover Background: #E5A811 (darker gold)
```

### How to Style Buttons:
1. Select a button in the editor
2. Click **Design** button
3. Click **Customize Design**
4. Set Fill Color, Border, Corners, and Shadow
5. Set Hover state colors
6. Save as **Theme Button** for reuse

---

## Step 5: Header Setup

### Header Design Specs:
- **Background:** Deep Navy Blue (#1B3A5F)
- **Height:** 80px desktop, 60px mobile
- **Logo:** Left aligned, max height 50px
- **Navigation:** White text, Poppins Medium 15px
- **CTA Button:** Shamrock Gold background

### Sticky Header:
1. Select header
2. Go to **Header Settings**
3. Enable **Sticky Header**
4. Set scroll behavior to **Fade In**

### Mobile Header:
1. Switch to Mobile view
2. Add hamburger menu icon (white)
3. Set mobile menu background to Deep Navy Blue
4. Menu items: White text, 18px

---

## Step 6: Footer Setup

### Footer Design Specs:
- **Background:** Deep Navy Blue (#1B3A5F)
- **Text Color:** White (#FFFFFF)
- **Link Color:** Shamrock Gold (#FDB913)
- **Sections:** 4 columns on desktop, stacked on mobile

### Footer Content:
**Column 1 - Logo & About**
- Logo (white version)
- Brief tagline
- 24/7 availability badge

**Column 2 - Quick Links**
- How Bail Works
- County Directory
- Become a Bondsman
- Blog
- Contact

**Column 3 - Contact Info**
- Phone: 239-332-2245
- Email: info@shamrockbailbonds.biz
- Address

**Column 4 - Service Areas**
- Southwest Florida
- All 67 Counties
- View All Counties link

---

## Step 7: Section Backgrounds

### Alternating Sections Pattern:
1. **Hero Section:** Deep Navy Blue with overlay
2. **Content Section 1:** White
3. **Content Section 2:** Light Gray (#F8F9FA)
4. **Content Section 3:** White
5. **CTA Section:** Deep Navy Blue
6. **Footer:** Deep Navy Blue

### How to Set Section Background:
1. Click on section strip
2. Click **Change Strip Background**
3. Select **Color** and enter hex code
4. For images, add overlay with Navy Blue at 70% opacity

---

## Step 8: Card/Box Styles

### Standard Card:
```
Background: #FFFFFF
Border: 1px solid #E9ECEF
Border Radius: 12px
Shadow: 0 2px 8px rgba(0,0,0,0.08)
Padding: 24px
```

### Hover Effect:
```
Shadow: 0 4px 16px rgba(0,0,0,0.12)
Transform: translateY(-2px)
```

### Feature Card (with icon):
```
Background: #F8F9FA
Border: none
Border Radius: 16px
Padding: 32px
Icon: 48px, Action Blue
```

---

## Step 9: Trust Indicators

### Trust Badge Style:
```
Background: #E8F4E8 (light green)
Border: 1px solid #28A745
Border Radius: 8px
Padding: 8px 16px
Icon: Green checkmark
Text: Dark gray, 14px
```

### 24/7 Badge:
```
Background: #FDB913 (Gold)
Text: #1B3A5F (Navy)
Border Radius: 20px
Padding: 8px 20px
Font: Poppins Bold, 14px
```

---

## Step 10: Mobile-First Considerations

### Sticky Mobile CTA Bar:
- Position: Fixed bottom
- Height: 60px
- Background: Shamrock Gold (#FDB913)
- Contains: Phone icon + "Call Now" button
- Always visible on mobile

### Touch Targets:
- Minimum button height: 48px
- Minimum tap area: 44x44px
- Adequate spacing between clickable elements

### Font Sizes (Mobile):
- H1: 32px (reduced from 48px)
- H2: 26px (reduced from 36px)
- Body: 16px (same)
- Buttons: 16px (same)

---

## Quick Reference Card

### Copy These Hex Codes:

```
Primary Navy:    #1B3A5F
Action Blue:     #0066CC
Shamrock Gold:   #FDB913
Trust Green:     #28A745
Alert Red:       #DC3545
Light BG:        #F8F9FA
Border Gray:     #E9ECEF
Text Dark:       #333333
Text Secondary:  #6C757D
```

### Font Stack:
```
Headings: Poppins, sans-serif
Body: Inter, sans-serif
Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

---

## Need Help?

If you have questions about implementing these design specs, refer to:
- `DESIGN-SYSTEM.md` - Full design system documentation
- `shamrock-styles.css` - Complete CSS reference
- `WIX-IMPLEMENTATION-GUIDE.md` - Step-by-step page setup

Contact Shamrock Bail Bonds development team for assistance.
