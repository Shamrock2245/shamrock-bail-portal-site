# Loading Indicator Setup Guide

## Overview

The HOME page now supports multiple loading indicator options. The code will automatically detect and use whichever elements you add to the Wix Editor.

**Priority Order:**
1. `#loadingBox` (full loading container with text)
2. `#loadingText` (simple text element)
3. `#loadingIndicator` (generic loader icon)

**Note:** All are optional! If none exist, navigation still works perfectly.

---

## Option 1: Full Loading Box (Recommended)

### What to Add in Wix Editor

1. **Container Box**
   - Element: Box
   - ID: `loadingBox`
   - Style: 
     - Background: Semi-transparent dark (#000000, 70% opacity)
     - Position: Fixed, centered on screen
     - Size: 300px x 150px
     - Border radius: 10px
     - Initially hidden

2. **Loading Icon** (inside the box)
   - Element: Image or Lottie animation
   - Use any animated loading icon from Media Manager
   - Center horizontally
   - Size: 60px x 60px

3. **Loading Text** (inside the box)
   - Element: Text
   - ID: `loadingText`
   - Text: "Loading..." (will be updated dynamically)
   - Style:
     - Font: Montserrat, 16px, white
     - Align: Center
     - Below the icon

### Layout Structure
```
┌─────────────────────────────┐
│       #loadingBox           │
│                             │
│      [Animated Icon]        │
│                             │
│   Loading Lee County...     │  ← #loadingText
│                             │
└─────────────────────────────┘
```

---

## Option 2: Simple Loading Text

### What to Add in Wix Editor

1. **Text Element**
   - Element: Text
   - ID: `loadingText`
   - Text: "Loading..." (placeholder)
   - Style:
     - Font: Montserrat, 18px, white
     - Background: Dark overlay (#000000, 80% opacity)
     - Padding: 20px 40px
     - Border radius: 5px
     - Position: Fixed, centered
     - Initially hidden

### Example
```
┌──────────────────────────┐
│  Loading Lee County...   │  ← #loadingText
└──────────────────────────┘
```

---

## Option 3: Generic Loading Indicator

### What to Add in Wix Editor

1. **Image or Lottie Element**
   - Element: Image (GIF) or Lottie animation
   - ID: `loadingIndicator`
   - Source: Any animated loading icon from Media Manager
   - Style:
     - Size: 80px x 80px
     - Position: Fixed, centered
     - Initially hidden

### Example
```
     [Spinning Icon]  ← #loadingIndicator
```

---

## Recommended Animated Icons

### From Wix Media Manager

Look for files named:
- `loading-spinner.gif`
- `loader-animation.json` (Lottie)
- `spinner.gif`
- `loading-icon.gif`

### Or Use These Free Resources

**Lottie Animations:**
- https://lottiefiles.com/search?q=loading&category=animations
- Search: "loading spinner", "loading dots", "loading circle"

**GIF Spinners:**
- Simple circular spinner (white or brand color)
- Three dots animation
- Pulse animation

---

## Implementation Steps

### Step 1: Open Wix Editor
1. Go to HOME page
2. Enter Dev Mode

### Step 2: Add Loading Element(s)
Choose one of the three options above and add the element(s).

### Step 3: Set Element IDs
**Critical:** Set the exact IDs:
- `loadingBox` (if using Option 1)
- `loadingText` (if using Option 1 or 2)
- `loadingIndicator` (if using Option 3)

### Step 4: Set Initial State
**Important:** Set all loading elements to **Hidden** initially.

The code will show them when needed.

### Step 5: Test
1. Save and Preview
2. Select a county from dropdown
3. Loading indicator should appear briefly
4. Page navigates to county page

---

## Code Behavior

### What the Code Does

```javascript
function showLoadingState(countyName) {
    // Try Option 1: Full loading box
    const loadingBox = $w('#loadingBox');
    if (loadingBox && loadingBox.type) {
        loadingBox.show('fade', { duration: 200 });
        
        // Update text if available
        const loadingText = $w('#loadingText');
        if (loadingText && loadingText.type) {
            loadingText.text = `Loading ${countyName} County...`;
        }
        return; // Found it, stop looking
    }
    
    // Try Option 2: Simple loading text
    const loadingText = $w('#loadingText');
    if (loadingText && loadingText.type) {
        loadingText.text = `Loading ${countyName} County...`;
        loadingText.show('fade', { duration: 200 });
        return;
    }
    
    // Try Option 3: Generic loading indicator
    const loader = $w('#loadingIndicator');
    if (loader && loader.type) {
        loader.show('fade', { duration: 200 });
        return;
    }
    
    // No loading indicator - that's okay!
    console.log('ℹ️  No loading indicator found (optional)');
}
```

### Dynamic Text Updates

When using `#loadingText`, the text automatically updates based on the selected county:

- Select "Lee" → "Loading Lee County..."
- Select "Collier" → "Loading Collier County..."
- Select "Charlotte" → "Loading Charlotte County..."

---

## Styling Recommendations

### Colors
- **Background:** Dark overlay (#000000, 70-80% opacity)
- **Text:** White (#FFFFFF) or brand gold (#FFD700)
- **Icon:** White or brand color

### Animations
- **Show:** Fade in (200ms)
- **Duration:** Brief (navigation is fast)
- **Icon:** Smooth rotation or pulse

### Positioning
- **Fixed positioning** (stays centered during navigation)
- **Z-index:** 9999 (appears above everything)
- **Center:** Both horizontally and vertically

---

## Example CSS (for reference)

If you were using custom CSS, it would look like this:

```css
#loadingBox {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    z-index: 9999;
    display: none; /* Initially hidden */
}

#loadingText {
    color: white;
    font-family: 'Montserrat', sans-serif;
    font-size: 18px;
    margin-top: 15px;
}

#loadingIndicator {
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

**Note:** Wix Editor handles styling visually, but this gives you an idea of the final look.

---

## Troubleshooting

### Loading Indicator Not Showing

**Check 1:** Element ID is correct
- Must be exactly `#loadingBox`, `#loadingText`, or `#loadingIndicator`
- Case-sensitive!

**Check 2:** Element is initially hidden
- In Wix Editor, set "Hidden on load"
- Code will show it when needed

**Check 3:** Element is on the correct page
- Must be on HOME page
- Not in a repeater or hidden container

### Loading Indicator Stays Visible

**Cause:** Navigation is slow or failed

**Solution:** 
- Check console for navigation errors
- Verify county slug is correct
- Check internet connection

### Text Not Updating

**Check:** `#loadingText` ID is correct
- Must be inside `#loadingBox` (Option 1) or standalone (Option 2)
- Must be a Text element, not a heading or paragraph

---

## Best Practices

### Do ✅
- Keep it simple and fast
- Use subtle animations
- Make it centered and obvious
- Test on mobile devices

### Don't ❌
- Don't use heavy animations (slows down page)
- Don't make it too large (blocks view)
- Don't use bright colors (jarring)
- Don't add sound effects (annoying)

---

## Mobile Considerations

### Touch Targets
- Loading indicator should be centered
- Don't block the entire screen
- Keep it small enough to see context

### Performance
- Use optimized GIFs (< 50KB)
- Use Lottie for smooth animations
- Avoid heavy images

---

## Future Enhancements

### Potential Additions
1. **Progress Bar** - Show navigation progress
2. **County Icon** - Display county seal while loading
3. **Estimated Time** - "Loading in 2 seconds..."
4. **Cancel Button** - Allow user to cancel navigation

**Note:** Keep it simple for now. Add complexity only if needed.

---

## Related Files

- `src/pages/HOME.c1dmp.js` - Loading state logic
- `docs/UX_OPTIMIZATION_HOME_PAGE.md` - UX philosophy
- `docs/ELEMENT-ID-CHEATSHEET.md` - All element IDs

---

## Summary

**Quick Setup:**
1. Add element to HOME page in Wix Editor
2. Set ID to `loadingBox`, `loadingText`, or `loadingIndicator`
3. Set initially hidden
4. Save and test

**That's it!** The code handles the rest automatically.

---

**Setup Date:** January 14, 2026  
**Status:** Ready to Implement in Wix Editor  
**Code Deployed:** Commit 86eef0a+
