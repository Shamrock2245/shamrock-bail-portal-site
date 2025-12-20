# Wix Velo Code Structure Guide

Based on Wix documentation, here's how code files should be organized:

## File Structure

### Page Code (Frontend)
- Each page has its own code file in the **Page Code** section
- Code runs in the browser (frontend)
- Use `$w.onReady()` to run code when page loads
- Access elements using `$w("#elementID")`

### Public Code
- Location: `Public & Backend` section → Public files
- JavaScript files accessible from any page
- Use for shared functions across multiple pages
- Import with: `import { functionName } from 'public/filename.js'`

### Backend Code
- Location: `Public & Backend` section → Backend files
- Server-side code, not visible to users
- Use for sensitive operations (API keys, database operations)
- Files end with `.jsw` for web modules
- Import with: `import { functionName } from 'backend/filename.jsw'`

### Global Code (masterPage.js)
- Located in Page Code section
- Runs on EVERY page
- Use for header/footer processing
- Use for elements on every page (search bar, cart icon)
- **DO NOT** import from masterPage.js into individual pages

### CSS
- Global CSS in the CSS section
- Applies to all pages
- Can also use CSS Classes panel for element-specific styles

## Element Selection Syntax

```javascript
// Select single element
$w("#elementID");

// Select multiple elements
$w("#element1, #element2, #element3");

// Select all elements of a type
$w("Button");
```

## File Naming Conventions

| File Type | Extension | Location |
|-----------|-----------|----------|
| Page Code | .js | Page Code section |
| Public Module | .js | public/ folder |
| Backend Module | .jsw | backend/ folder |
| HTTP Functions | http-functions.js | backend/ |
| Data Hooks | data.js | backend/ |

## GitHub Integration
- Can sync code with GitHub repository
- Cannot use both Wix IDE and GitHub integration simultaneously

## Key APIs for Shamrock Project

1. **wix-location** - URL routing and navigation
2. **wix-window** - Browser info, geolocation
3. **wix-members** - User authentication
4. **wix-data** - Database operations
5. **wix-fetch** - External API calls (SignNow)
6. **wix-secrets** - Secure API key storage
