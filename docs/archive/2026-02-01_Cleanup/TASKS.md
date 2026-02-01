# TECHNICAL DEBT & TASK REGISTRY

> [!IMPORTANT]
> All tasks must map to objectives in [ROADMAP.md](ROADMAP.md).
> Priority: P0 (Critical/Blocker), P1 (High), P2 (Medium), P3 (Low).

## 🛑 P0: SPEC COMPLIANCE (DO NOW)
- [ ] **Audit Element IDs**: Check `masterPage.js`, `Home`, and `Dynamic County` pages against [ELEMENT-ID-CHEATSHEET](../specs/ELEMENT-ID-CHEATSHEET.md).
- [ ] **Schema Verify**: Check `FloridaCounties` collection structure against Foundation Spec.
- [ ] **SignNow Wiring**: Confirm the "Start Bail" button ONLY activates after Consent + Login.

## 🚀 P1: CRITICAL USER FLOWS
- [ ] **Mobile Sticky CTA**: Ensure `#stickyMobileCTA` exists and hides on desktop / shows on mobile.
- [ ] **County Dropdown**: Fix routing logic if currently broken.
- [ ] **Call Logging**: Verify `saveCallLog` backend function is receiving data from frontend clicks.

## 🛠 P2: ROBUSTNESS
- [ ] **Error Boundaries**: Add nice UI for "County Not Found" or "Load Failed".
- [ ] **Loading States**: Add spinners for "Start Bail Paperwork" transition.

## 📦 P3: CLEANUP
- [ ] Remove unused backend `.jsw` files (after verifying they are unused).
- [ ] Consolidate CSS in global if duplicated across pages.

## ✅ DONE
- [x] Create Foundation Spec.
- [x] Create ID Cheatsheet.
- [x] Create Test Plan.
