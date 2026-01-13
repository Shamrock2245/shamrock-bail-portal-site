# Mobile-Optimized Florida Counties Page - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the mobile-optimized Florida Counties dynamic page design based on the Figma prototype at https://pause-heat-20846788.figma.site.

**Repository**: Shamrock2245/shamrock-bail-portal-site  
**Target Page**: FloridaCounties (Item) - Dynamic Page  
**Design System**: Mobile-first, matching Figma prototype exactly

---

## Files Created

1. **CSS**: `src/styles/county-page-mobile.css` - Mobile-first styling
2. **JavaScript**: `src/pages/FloridaCounties-Mobile-Enhanced.js` - Enhanced page logic
3. **Documentation**: This file

---

## Implementation Steps

### Step 1: Access Wix Editor

1. Log into Wix at https://manage.wix.com
2. Navigate to shamrockbailbonds.biz site
3. Click "Edit Site" to open Wix Editor

### Step 2: Locate the Dynamic County Page

1. In Wix Editor, go to **Pages & Menu** (left sidebar)
2. Find **"Florida Counties (Item)"** or **"FloridaCounties (Item)"** under Dynamic Pages
3. Click to open the page in the editor

### Step 3: Update Page Structure (Element IDs)

Ensure the following element IDs exist on the page. If not, add them:

#### Hero Section
- `#heroSection` - Container (Strip/Section)
- `#dynamicHeader` - Text element for county name
- `#heroSubtitle` - Text element for subtitle
- `#heroButtons` - Container for buttons
- `#callCountiesBtn` - Button for calling
- `#startBailBtn` - Button for starting bail process

#### Quick Reference Card
- `#quickRefSection` - Container (Strip/Section)
- `#quickRefHeader` - Text element for section title
- `#quickRefGrid` - Container with 2x2 grid layout
- `#sheriffTitle` - Text element
- `#sheriffPhone` - Text element (clickable)
- `#sheriffWebsite` - Button or text link
- `#jailName` - Text element
- `#jailAddress` - Text element
- `#inmateSearchBtn` - Button
- `#clerkTitle` - Text element
- `#clerkPhone` - Text element (clickable)
- `#clerkWebsite` - Button or text link
- `#countyInfoTitle` - Text element
- `#countySeat` - Text element
- `#countyPopulation` - Text element

#### About Section
- `#aboutSection` - Container (Strip/Section)
- `#aboutHeader` - Text element
- `#aboutBody` - Text element (multi-line)

#### Why Choose Us Section
- `#whyChooseSection` - Container (Strip/Section)
- `#whyChooseHeader` - Text element
- Feature items (use repeater or static elements with checkmarks)

#### Process Section
- `#processSection` - Container (Strip/Section)
- `#processHeader` - Text element
- `#step1Title`, `#step1Description` - Text elements
- `#step2Title`, `#step2Description` - Text elements
- `#step3Title`, `#step3Description` - Text elements

#### FAQ Section
- `#faqSection` - Container (Strip/Section)
- `#faqHeader` - Text element
- `#faq1`, `#faq2`, `#faq3`, `#faq4`, `#faq5` - Collapsible containers

#### Final CTA Section
- `#finalCtaSection` - Container (Strip/Section)
- `#finalCtaTitle` - Text element
- `#finalCtaSubtitle` - Text element
- `#finalCallBtn` - Button

### Step 4: Add Custom CSS

1. In Wix Editor, click on the **page settings** (gear icon)
2. Go to **Advanced Settings** > **Custom Code**
3. Add a new code snippet:
   - **Name**: County Page Mobile Styles
   - **Type**: CSS
   - **Location**: Body - End
   - **Pages**: This page only
4. Copy the entire contents of `src/styles/county-page-mobile.css`
5. Paste into the code editor
6. Save

### Step 5: Update Page Code

1. In Wix Editor, open the **Code Panel** (Developer Tools icon)
2. Find the page file: **FloridaCounties (Item).kyk1r.js** or similar
3. **BACKUP THE EXISTING CODE** (copy to a text file)
4. Replace with the contents of `src/pages/FloridaCounties-Mobile-Enhanced.js`
5. Save the file

### Step 6: Configure Mobile Layout

1. In Wix Editor, switch to **Mobile View** (phone icon at top)
2. Adjust the following for mobile:
   - **Hero Section**: Full width, centered content
   - **Quick Reference Grid**: 2 columns on mobile
   - **Buttons**: Full width (90% max-width 320px)
   - **Sections**: Proper padding (48px top/bottom, 20px left/right)
3. Use Wix's responsive editor to fine-tune spacing

### Step 7: Test on Mobile Devices

1. Click **Preview** in Wix Editor
2. Test on actual mobile devices (iOS and Android)
3. Verify:
   - ✅ Hero section displays correctly with gradient background
   - ✅ Buttons are touch-friendly (min 44px height)
   - ✅ Quick reference card shows 2x2 grid
   - ✅ All phone numbers are clickable
   - ✅ External links open in new tabs
   - ✅ Text is readable (proper font sizes)
   - ✅ Sections have proper spacing

### Step 8: Publish Changes

1. Click **Publish** in Wix Editor
2. Verify changes on live site: shamrockbailbonds.biz
3. Test a few county pages:
   - `/floridacounties-1/lee`
   - `/floridacounties-1/collier`
   - `/floridacounties-1/miami-dade`

---

## Design Specifications Summary

### Colors
- **Deep Navy**: #1B3A5F
- **Action Blue**: #0066CC
- **Shamrock Gold**: #FDB913
- **White**: #FFFFFF
- **Off-White**: #F8F9FA
- **Near Black**: #212529
- **Dark Gray**: #343A40

### Typography
- **Headings**: Poppins, 600-700 weight
- **Body**: Inter, 400 weight
- **Mobile H1**: 36px
- **Mobile H2**: 28px
- **Mobile Body**: 16px

### Spacing
- **Section Padding (Mobile)**: 48px top/bottom, 20px left/right
- **Card Padding**: 24px
- **Button Padding**: 14px 28px
- **Grid Gap**: 20px

### Components
- **Buttons**: 8px border-radius, 600 font-weight
- **Cards**: 12px border-radius, subtle shadow
- **Touch Targets**: Minimum 44px height on mobile

---

## Element ID Reference

| Section | Element ID | Type | Purpose |
|---------|-----------|------|---------|
| Hero | `#dynamicHeader` | Text | County name title |
| Hero | `#heroSubtitle` | Text | Descriptive subtitle |
| Hero | `#callCountiesBtn` | Button | Primary call CTA |
| Hero | `#startBailBtn` | Button | Secondary CTA |
| Quick Ref | `#quickRefHeader` | Text | Section title |
| Quick Ref | `#sheriffPhone` | Text | Sheriff phone number |
| Quick Ref | `#sheriffWebsite` | Button/Link | Sheriff website link |
| Quick Ref | `#jailName` | Text | Jail facility name |
| Quick Ref | `#jailAddress` | Text | Jail address |
| Quick Ref | `#inmateSearchBtn` | Button | Inmate search link |
| Quick Ref | `#clerkPhone` | Text | Clerk phone number |
| Quick Ref | `#clerkWebsite` | Button/Link | Clerk website link |
| Quick Ref | `#countySeat` | Text | County seat info |
| Quick Ref | `#countyPopulation` | Text | Population data |
| About | `#aboutHeader` | Text | Section title |
| About | `#aboutBody` | Text | About paragraph |
| Why Choose | `#whyChooseHeader` | Text | Section title |
| Process | `#processHeader` | Text | Section title |
| Process | `#step1Title` | Text | Step 1 title |
| Process | `#step1Description` | Text | Step 1 description |
| Process | `#step2Title` | Text | Step 2 title |
| Process | `#step2Description` | Text | Step 2 description |
| Process | `#step3Title` | Text | Step 3 title |
| Process | `#step3Description` | Text | Step 3 description |
| FAQ | `#faqHeader` | Text | Section title |
| Final CTA | `#finalCtaTitle` | Text | CTA title |
| Final CTA | `#finalCtaSubtitle` | Text | CTA subtitle |
| Final CTA | `#finalCallBtn` | Button | Final call button |

---

## Troubleshooting

### Issue: Elements not styling correctly
**Solution**: Verify element IDs match exactly (case-sensitive). Check that custom CSS was added to the page.

### Issue: Buttons not clickable
**Solution**: Ensure onClick handlers are properly set in the JavaScript code. Check browser console for errors.

### Issue: Dynamic data not populating
**Solution**: Verify `countyUtils.js` is working correctly. Check that the Counties CMS collection has all required fields.

### Issue: Mobile layout looks wrong
**Solution**: Switch to mobile view in Wix Editor and adjust responsive settings. Ensure CSS media queries are working.

### Issue: Phone links not working
**Solution**: Check that phone numbers are formatted correctly. Verify `tel:` links are properly constructed.

---

## CMS Collection Requirements

The **Counties** collection must have these fields:

| Field Name | Type | Required | Purpose |
|------------|------|----------|---------|
| `name` | Text | Yes | County name (e.g., "Lee") |
| `slug` | Text | Yes | URL slug (e.g., "lee") |
| `countySeat` | Text | Yes | Main city |
| `population` | Number | No | County population |
| `jailName` | Text | Yes | Jail facility name |
| `jailAddress` | Text | Yes | Jail address |
| `jailPhone` | Text | Yes | Jail phone number |
| `jailBookingUrl` | URL | Yes | Inmate search URL |
| `sheriffWebsite` | URL | Yes | Sheriff's website |
| `clerkPhone` | Text | Yes | Clerk phone number |
| `clerkWebsite` | URL | Yes | Clerk's website |
| `primaryPhone` | Text | Yes | Main contact number |

---

## Next Steps

1. ✅ Implement the design on one test county page
2. ✅ Test thoroughly on mobile devices
3. ✅ Verify all dynamic data populates correctly
4. ✅ Check SEO tags are working
5. ✅ Test phone links and external links
6. ✅ Validate accessibility (touch targets, contrast)
7. ✅ Roll out to all 67 county pages
8. ✅ Monitor analytics for user engagement

---

## Support & Maintenance

- **Repository**: Shamrock2245/shamrock-bail-portal-site
- **Branch**: main
- **Contact**: admin@shamrockbailbonds.biz

For questions or issues, refer to the project documentation or create an issue in the GitHub repository.

---

## Version History

- **v1.0** (2026-01-12): Initial mobile-optimized implementation based on Figma design
