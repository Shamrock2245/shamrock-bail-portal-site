---
name: UI/UX Pro Max
description: AI-powered design intelligence with 50+ styles, 95+ color palettes, and automated design system generation
version: 1.0.0
---

# Skill: UI/UX Pro Max

Use this skill to transform basic wireframes into "Wow" interfaces.

## 1. Design Intelligence ("The Styles")
When asked to "Make it look like Apple" or "Make it Cyberpunk," apply these token sets:

### Style: `apple-modern`
*   **Fonts:** Inter, SF Pro Display
*   **Radius:** 12px - 20px (Smooth Corners)
*   **Shadows:** `0 4px 6px -1px rgba(0, 0, 0, 0.1)` (Subtle Diffuse)
*   **Glass:** `backdrop-filter: blur(20px) saturate(180%)`

### Style: `shamrock-gold` (Brand)
*   **Primary:** `#D4AF37` (Gold Metallic)
*   **Secondary:** `#003300` (Deep Irish Green)
*   **Accent:** `#FFFFFF` (Clean White)
*   **Vibe:** Professional, Established, Trustworthy.

## 2. Component Blueprints
Copy/Paste these Velo/CSS snippets for instant premium feel.

### A. The "Glassmorphism" Card
```css
.glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 16px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}
```

### B. The "Sticky Mobile CTA" (Critical)
*   **Goal:** Always visible "Call Now" button on mobile.
*   **Wix Setup:**
    1.  Create Container (`#boxStickyFooter`).
    2.  Set `Position: Fixed` -> `Bottom: 0`.
    3.  Z-Index: `9999` (Top Layer).
    4.  Logic:
        ```javascript
        // Ensure it doesn't cover form fields
        $w('#boxStickyFooter').expand(); // Show on Scroll Down
        ```

## 3. Animation Rules (Mobile Performance)
*   **Do:** Transform (Translate/Scale), Opacity.
*   **Do NOT:** Width, Height, Top, Left (Causes Layout Thrashing).
*   **Trigger:** Use `intersectionObserver` (in Custom Element) or `wixWindow.getBoundingRect()` sparingly.

## 4. Accessibility Check
*   **Contrast:** Gold on White is tricky. Use Gold on Green (`#D4AF37` on `#003300`) for headers.
*   **Touch:** All interactive elements must have `min-height: 44px` padding.
