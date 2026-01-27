---
description: Safely deploy Google Apps Script code using Clasp, handling directory navigation and authentication.
---

1. **Verify Directory and Navigate**
   - The Clasp project is located in `backend-gas/`.
   - If the current directory is the root (does not contain `.clasp.json`), change directory:
     ```bash
     cd backend-gas
     ```

2. **Check Deployment Status**
   - Verify which files will be pushed.
   ```bash
   npx @google/clasp status
   ```

3. **Attempt Safe Push**
   - Force push local files to overwrite remote (canonical source of truth).
   // turbo
   ```bash
   npx @google/clasp push -f
   ```

4. **Handle Authentication Failure (Conditional)**
   - **IF** the push fails with `invalid_grant`, `Unauthenticated`, or `logged in` errors:
     1. Initiate login (Interactive):
        ```bash
        npx @google/clasp login
        ```
     2. **USER ACTION**: Click the link, log in as `admin@shamrockbailbonds.biz`, and allow access.
     3. Retry Push:
        ```bash
        npx @google/clasp push -f
        ```

5. **Return to Root**
   - After completion, return to project root.
   ```bash
   cd ..
   ```
