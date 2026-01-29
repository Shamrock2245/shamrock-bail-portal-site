# Tomorrow's Action Guide: Shamrock Domination Plan 🍀
**Date:** January 29, 2026

## 1. Morning: System Health & Testing 🛡️
Before adding new features, verify the "Hardening" phase we just completed.

### A. The "Pre-Flight" Check
1.  **Bridge Health:** Run the new health check script.
    *   *Command:* Run `runHealthCheck()` in your Velo backend test environment.
    *   *Success:* Returns `{"status": "healthy", "latency": "OK"}`.
2.  **Mobile Visibility:** Check the "Sticky CTA" on your phone.
    *   *Action:* Load the live site on mobile. Scroll down.
    *   *Verify:* Does the "Call Now" button stay pegged to the bottom?

### B. The "Manus Audit" Verify
1.  **Form Submission:** Submit a dummy indemnitor form.
2.  **Chain of Custody:**
    *   Did the "Success" screen appear instantly?
    *   Did the data appear in the Google Sheet/SignNow?
    *   *Note:* If it fails, tell the agent: *"Use the `wix_gas_bridge_integrity` skill to diagnose."*

---

## 2. Mid-Day: Bail School "Curriculum Drop" 🏫
We are building the **120-Hour Pre-Licensing Course**.

### A. The Content Upload
1.  **Navigate:** Go to `docs/bail_school_materials/` in your local folder.
2.  **Action:** Drag & Drop your PowerPoints, PDFs, and Handouts here.
3.  **Inventory:** Open `CURRICULUM_INVENTORY.md` and list the files under their categories:
    *   **Category 1:** 120-Hour Pre-Licensing (The Big Course).
    *   **Category 2:** CE Courses (Renewals).

### B. The "Agentic" Handoff
Once files are there, tell the agent:
> *"I have uploaded the files. Please use the `bail_school_manager` skill to map these to the Wix Bookings database."*

---

## 3. Web Development Strategy 🧠
How to work faster using the new **Agentic Framework**.

### A. Use the Personas
Stop explaining context. Just invoke the expert:
*   **"Use `@velo-expert` to redesign the footer."** (Knows UI/UX, Mobile rules).
*   **"Use `@gas-integrator` to add a field to the PDF."** (Knows `pdf_template_manager`).
*   **"Use `@legal-compliance` to check this form."** (Knows the "Sacred Schemas").

### B. The "Proactive Loop"
Instead of "How do I do X?", ask:
> *"Create an implementation plan for [Feature X] using the `AGENTIC_ENHANCEMENT_STRATEGY`."*

---

## Summary Checklist for Tomorrow
- [ ] Run `runHealthCheck()`.
- [ ] Test Mobile CTA on actual phone.
- [ ] Drag & Drop Curriculum files.
- [ ] Update `CURRICULUM_INVENTORY.md`.
