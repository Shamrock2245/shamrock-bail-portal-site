# Shamrock Bail Bonds Design System

## Brand Overview

The Shamrock Bail Bonds brand conveys **trust, professionalism, and calm authority**. The design should feel modern and clean while projecting stability and reliability—essential qualities for families in crisis.

---

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Deep Navy** | `#1B3A5F` | rgb(27, 58, 95) | Primary brand color, headers, footer, nav |
| **Action Blue** | `#0066CC` | rgb(0, 102, 204) | CTAs, links, interactive elements |
| **Shamrock Gold** | `#FDB913` | rgb(253, 185, 19) | Accents, highlights, badges |

### Secondary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Trust Teal** | `#17A2B8` | rgb(23, 162, 184) | Secondary buttons, info boxes |
| **Success Green** | `#28A745` | rgb(40, 167, 69) | Success states, confirmations |
| **Alert Red** | `#DC3545` | rgb(220, 53, 69) | Errors, urgent notices |
| **Warning Orange** | `#FD7E14` | rgb(253, 126, 20) | Warnings, attention needed |

### Neutral Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **White** | `#FFFFFF` | rgb(255, 255, 255) | Backgrounds, cards |
| **Off-White** | `#F8F9FA` | rgb(248, 249, 250) | Section backgrounds |
| **Light Gray** | `#E9ECEF` | rgb(233, 236, 239) | Borders, dividers |
| **Medium Gray** | `#6C757D` | rgb(108, 117, 125) | Secondary text |
| **Dark Gray** | `#343A40` | rgb(52, 58, 64) | Body text |
| **Near Black** | `#212529` | rgb(33, 37, 41) | Headings, emphasis |

### Gradient

**Primary Gradient (for hero sections):**
```css
background: linear-gradient(135deg, #1B3A5F 0%, #0066CC 100%);
```

**Gold Accent Gradient:**
```css
background: linear-gradient(90deg, #FDB913 0%, #F7931E 100%);
```

---

## Color Application Guide

### Header & Navigation
- **Background:** Deep Navy (`#1B3A5F`)
- **Text:** White (`#FFFFFF`)
- **Logo:** White with Gold accent
- **Hover state:** Action Blue (`#0066CC`)

### Hero Section
- **Background:** Primary Gradient or Deep Navy
- **Headline:** White (`#FFFFFF`)
- **Subheadline:** Off-White with 90% opacity
- **Primary CTA:** Shamrock Gold (`#FDB913`) with Dark text
- **Secondary CTA:** White outline

### Body Content
- **Background:** White (`#FFFFFF`)
- **Headings:** Near Black (`#212529`)
- **Body text:** Dark Gray (`#343A40`)
- **Links:** Action Blue (`#0066CC`)
- **Link hover:** Deep Navy (`#1B3A5F`)

### Cards & Boxes
- **Background:** White (`#FFFFFF`)
- **Border:** Light Gray (`#E9ECEF`)
- **Shadow:** `0 2px 8px rgba(27, 58, 95, 0.1)`
- **Hover shadow:** `0 4px 16px rgba(27, 58, 95, 0.15)`

### Buttons

**Primary Button (Main CTA):**
- Background: Shamrock Gold (`#FDB913`)
- Text: Near Black (`#212529`)
- Hover: Darken 10% (`#E5A811`)
- Border-radius: 8px

**Secondary Button:**
- Background: Action Blue (`#0066CC`)
- Text: White (`#FFFFFF`)
- Hover: Deep Navy (`#1B3A5F`)
- Border-radius: 8px

**Outline Button:**
- Background: Transparent
- Border: 2px solid Action Blue (`#0066CC`)
- Text: Action Blue (`#0066CC`)
- Hover: Fill with Action Blue, white text

**Emergency/Call Button:**
- Background: Alert Red (`#DC3545`)
- Text: White (`#FFFFFF`)
- Hover: Darken 10%

### Footer
- **Background:** Near Black (`#212529`)
- **Text:** Light Gray (`#E9ECEF`)
- **Links:** White (`#FFFFFF`)
- **Link hover:** Shamrock Gold (`#FDB913`)

### Forms
- **Input background:** White (`#FFFFFF`)
- **Input border:** Light Gray (`#E9ECEF`)
- **Input focus border:** Action Blue (`#0066CC`)
- **Label text:** Dark Gray (`#343A40`)
- **Placeholder:** Medium Gray (`#6C757D`)
- **Error state:** Alert Red (`#DC3545`)
- **Success state:** Success Green (`#28A745`)

---

## Typography

### Font Families

**Primary (Headings):** Poppins
```css
font-family: 'Poppins', sans-serif;
```

**Secondary (Body):** Inter
```css
font-family: 'Inter', sans-serif;
```

**Fallback Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

### Font Sizes

| Element | Desktop | Mobile | Weight | Line Height |
|---------|---------|--------|--------|-------------|
| H1 (Hero) | 56px | 36px | 700 | 1.1 |
| H2 (Section) | 42px | 28px | 600 | 1.2 |
| H3 (Subsection) | 28px | 22px | 600 | 1.3 |
| H4 (Card title) | 22px | 18px | 600 | 1.3 |
| H5 (Small heading) | 18px | 16px | 600 | 1.4 |
| Body Large | 18px | 16px | 400 | 1.6 |
| Body | 16px | 15px | 400 | 1.6 |
| Body Small | 14px | 13px | 400 | 1.5 |
| Caption | 12px | 12px | 400 | 1.4 |
| Button | 16px | 15px | 600 | 1 |

### Text Styles in Wix

When setting up text styles in Wix, use these settings:

**Heading 1:**
- Font: Poppins
- Size: 56px (desktop) / 36px (mobile)
- Weight: Bold (700)
- Color: #212529 (or #FFFFFF on dark backgrounds)

**Heading 2:**
- Font: Poppins
- Size: 42px (desktop) / 28px (mobile)
- Weight: Semi-Bold (600)
- Color: #212529

**Heading 3:**
- Font: Poppins
- Size: 28px (desktop) / 22px (mobile)
- Weight: Semi-Bold (600)
- Color: #212529

**Paragraph:**
- Font: Inter
- Size: 16px
- Weight: Regular (400)
- Color: #343A40
- Line height: 1.6

---

## Spacing System

Use consistent spacing throughout the site:

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing, inline elements |
| sm | 8px | Small gaps, padding |
| md | 16px | Standard padding, margins |
| lg | 24px | Section padding, card padding |
| xl | 32px | Large gaps |
| 2xl | 48px | Section margins |
| 3xl | 64px | Major section breaks |
| 4xl | 96px | Hero sections, major spacing |

### Section Padding
- **Desktop:** 80px top/bottom, 5% left/right (max 1200px content)
- **Mobile:** 48px top/bottom, 20px left/right

---

## Component Styles

### Cards

```css
.card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(27, 58, 95, 0.1);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(27, 58, 95, 0.15);
  transform: translateY(-4px);
}
```

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #FDB913;
  color: #212529;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 14px 28px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #E5A811;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(253, 185, 19, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: #0066CC;
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 14px 28px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #1B3A5F;
}

/* Call Now Button (Emergency) */
.btn-call {
  background: #DC3545;
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 18px;
  padding: 16px 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
}
```

### Trust Badges

```css
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #FFFFFF;
}

.trust-badge-icon {
  color: #FDB913;
}
```

### Sticky Mobile CTA Bar

```css
.mobile-cta-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1B3A5F;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  z-index: 1000;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
}

.mobile-cta-bar .btn-call {
  flex: 1;
  text-align: center;
}

.mobile-cta-bar .btn-secondary {
  flex: 1;
  text-align: center;
}
```

---

## Wix-Specific Color Settings

### How to Apply in Wix Editor

1. **Site Colors:**
   - Go to Site Design > Colors
   - Set up these as your site colors:
     - Color 1: `#1B3A5F` (Deep Navy)
     - Color 2: `#0066CC` (Action Blue)
     - Color 3: `#FDB913` (Shamrock Gold)
     - Color 4: `#FFFFFF` (White)
     - Color 5: `#212529` (Near Black)

2. **Text Themes:**
   - Go to Site Design > Text
   - Create themes matching the typography section above

3. **Button Design:**
   - Go to Site Design > Buttons
   - Create primary, secondary, and outline button styles

### Wix Color Codes for Copy/Paste

```
Deep Navy:     #1B3A5F
Action Blue:   #0066CC
Shamrock Gold: #FDB913
Trust Teal:    #17A2B8
Success Green: #28A745
Alert Red:     #DC3545
White:         #FFFFFF
Off-White:     #F8F9FA
Light Gray:    #E9ECEF
Medium Gray:   #6C757D
Dark Gray:     #343A40
Near Black:    #212529
```

---

## Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile | < 768px | Phones |
| Tablet | 768px - 1024px | Tablets, small laptops |
| Desktop | > 1024px | Laptops, desktops |

### Mobile-First Considerations

- Stack all columns vertically on mobile
- Increase touch targets to minimum 44px
- Show sticky CTA bar on mobile only
- Reduce font sizes per typography table
- Simplify navigation to hamburger menu
- Full-width buttons on mobile

---

## Iconography

### Recommended Icon Set
Use **Heroicons** (outline style) or **Phosphor Icons** for consistency.

### Key Icons Needed
- Phone (for call buttons)
- Document (for paperwork)
- Clock (for 24/7)
- Shield (for trust/security)
- Map pin (for locations)
- Check circle (for features/benefits)
- User (for account)
- Menu (hamburger)
- Arrow right (for CTAs)
- Search (for directory)

### Icon Sizing
- Small: 16px
- Medium: 24px
- Large: 32px
- Hero: 48px

### Icon Colors
- On light backgrounds: Dark Gray (`#343A40`) or Action Blue (`#0066CC`)
- On dark backgrounds: White (`#FFFFFF`) or Shamrock Gold (`#FDB913`)

---

## Imagery Guidelines

### Photography Style
- Professional, warm lighting
- Diverse representation
- Avoid clichéd "jail" imagery
- Focus on relief, reunion, hope
- Use office exterior photos tastefully

### Image Treatment
- Slight desaturation for consistency
- Overlay gradients on hero images
- Rounded corners (12px) on inline images

### Placeholder Colors
When images aren't available, use:
- Deep Navy (`#1B3A5F`) with subtle pattern
- Or gradient background

---

## Animation & Transitions

### Standard Transitions
```css
transition: all 0.3s ease;
```

### Hover Effects
- Buttons: Slight lift (`translateY(-2px)`) + shadow
- Cards: Lift (`translateY(-4px)`) + enhanced shadow
- Links: Color change only

### Loading States
- Use skeleton screens with Light Gray (`#E9ECEF`)
- Subtle pulse animation

### Scroll Animations (Optional)
- Fade in from bottom on scroll
- Keep subtle—don't distract from content
