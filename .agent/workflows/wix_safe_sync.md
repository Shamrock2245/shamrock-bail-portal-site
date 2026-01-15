---
description: Safely sync local Wix Editor changes with remote, handling rebase errors and file naming issues
---

This workflow handles the common scenario where `npm run dev` (Wix CLI) creates untracked files with spaces (e.g. `Locate .kyk1r.js`) or locks files, preventing a clean `git pull`. It stashes your changes, updates from remote, and then re-applies your work safely.

1. Check status and stash all changes (including untracked ones)
// turbo
2. git stash -u

3. Pull the latest changes from remote
// turbo
4. git pull origin main

5. Create a temporary branch to handle the merge safely
// turbo
6. git checkout -b temp/wix-sync-update

7. Restore your local changes
// turbo
8. git stash pop

9. Fix common Wix CLI filename issues (removing spaces from filenames if they exist)
This step looks for files like "Locate .kyk1r.js" and renames them to "Locate.kyk1r.js".
10. find src/pages -name "* .*.js" -exec sh -c 'mv "$1" "${1/ ./.}"' _ {} \;

11. Check status - if there are changes, stage and commit them
12. git status
13. git add .
14. git commit -m "chore: sync local wix editor changes"

15. Switch back to main and merge
// turbo
16. git switch main
17. git merge temp/wix-sync-update

18. Clean up and push
// turbo
19. git branch -d temp/wix-sync-update
// turbo
20. git push origin main
