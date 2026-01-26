---
description: Robust Git synchronization workflow suitable for syncing desktop changes with remote, handling stashing and merging.
---

1. **Protect Local State (Stash)**
   - Before searching for updates, safely stash any uncommitted work (including untracked files).
   ```bash
   git stash -u
   ```

2. **Pull Remote Changes**
   - Fetch and merge the latest `main` branch.
   ```bash
   git pull origin main
   ```

3. **Restore Local State**
   - Re-apply the user's work on top of the fresh update.
   ```bash
   git stash pop
   ```
   - *Note: If `No stash entries found` is returned, it simply means the directory was clean. Accessing exit code 0 is fine.*

4. **Stage and Commit (If Changes Exist)**
   - Stage all changes (Wix syncs, code edits).
   ```bash
   git add .
   ```
   - Commit with a standard message (User can verify).
   ```bash
   git commit -m "chore: sync local desktop changes"
   ```

5. **Push to Remote**
   - Send everything to GitHub.
   ```bash
   git push origin main
   ```
