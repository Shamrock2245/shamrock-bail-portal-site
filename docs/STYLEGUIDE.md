# Coding & Design Style Guide - Shamrock Bail Suite

Common standards for ensuring clean, readable, and premium-quality code.

## 1. JavaScript Standards (Velo & Node.js)
- **Naming:** use `camelCase` for variables/functions and `PascalCase` for classes.
- **Async/Await:** Prefer `async/await` over raw `.then()` chains for better readability.
- **Comments:** Every non-trivial function must have a JSDoc-style comment.
- **Variables:** Use `const` by default. Only use `let` when the value must be reassigned. Never use `var`.

## 2. Design Principles (Wix Frontend)
- **Premium Aesthetics:** Avoid "default" Wix styles. Use a curated palette:
  - **Navy Blue:** #1B3A5F (Primary)
  - **Action Blue:** #0066CC (Action)
  - **Shamrock Gold:** #FDB913 (Accent)
- **Typography:** Headlines in `Poppins` (Bold), body in `Inter` (Regular).
- **Animations:** Use `wix-animations` for subtle entrance and hover effects. Avoid aggressive or distracting movement.
- **Mobile First:** Generous whitespace and large, tap-friendly CTA buttons (min 44px height).

## 3. Data Formatting
- **Dates:** Always format dates as `MM/DD/YYYY` for human-readable UI, but `ISO 8601` for backend storage.
- **Currency:** Ensure all bond amounts are rounded to the nearest dollar and display with a `$` in the UI.
- **Phone Numbers:** Use `(XXX) XXX-XXXX` format for display and `+1XXXXXXXXXX` for links.

## 4. Error Handling
- **User-Facing:** Clean, reassuring error messages (e.g., "Could not detect location. Please select your county manually.").
- **Internal:** Detailed console logs for debugging.

```javascript
/**
 * Example of a styled function
 */
export async function handlePremiumAction(data) {
  try {
    const result = await processData(data);
    return { success: true, result };
  } catch (err) {
    console.error("PremiumAction failed:", err);
    return { success: false, error: "Something went wrong." };
  }
}
```

> [!TIP]
> Use the [WIX-AI-PROMPTS.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/WIX-AI-PROMPTS.md) to maintain the brand voice in AI-generated text.
