# Prompt for Manus: Diagnosing & Fixing Wix CLI Code Sync Issues

**Context:**
We are working on the Shamrock Bail Bonds portal (Wix Velo + GitHub). We are using the Wix CLI (`wix dev` via `npm run dev`) to sync local code to the Wix Editor.

**The Problem:**
Code written locally in VS Code for several pages is **not appearing** in the Wix Editor's code panel. The panel is blank or shows default comments, even though the local files contain full implementations.

**Affected Pages & Files:**
1.  **Locate An Inmate:** File is currently named `src/pages/Locate .kyk1r.js` (Note the space before `.kyk1r`).
2.  **How Bail Works:** File is named `src/pages/How Bail Works.lrh65.js`.
3.  **Bail School:** File is named `src/pages/How to Become a Bondsman.y8dfc.js`.

**Symptoms:**
- The Wix Editor shows the correct page structure, but the Velo code panel is empty.
- Because the code isn't loading, repeaters and dynamic logic (like the "Locate" page county list) render blank on Preview.
- We have tried renaming the files locally (e.g., changing `Locate .kyk1r.js` to `Locate.kyk1r.js` to remove the space), but the sync did not seem to pick it up immediately. We temporarily reverted the filenames to their original "spaced" versions to be safe.

**Hypothesis:**
There is a disconnect between the **Wix Page Name** and the **Local Filename**.
- Wix CLI maps files based on `Page Name.PageID.js`.
- If the page is named "Locate" in the editor, but the file is `Locate .kyk1r.js` (implying "Locate " with a space), the CLI might be failing to map them, effectively treating the local file as an orphan and the editor page as having no code.

**Request:**
Please provide the specific steps or script to:
1.  **Identically match** the local filenames to what Wix expects for these specific Page IDs (`kyk1r`, `lrh65`, `y8dfc`).
2.  **Force-push** the local code to the Wix Editor, ensuring the local version is the source of truth.
3.  **Verify** the page settings (Dynamic vs. Static) to ensure our code (which manually handles dynamic routing via `wix-location`) doesn't conflict with any Wix configuration.

**Goal:**
Get the code from `src/pages/` to visibly appear and execute in the Wix Editor immediately.
