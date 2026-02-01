# Bail School Expansion Plan (Zoom & Video)
**Goal:** Establish Shamrock Bail Bonds as the premier educational authority in Florida via "Bail School" - offering live and recorded classes.

## 1. Architecture Overview
We will leverage Wix native capabilities augmented by Velo for a seamless "Classroom" experience.

*   **Platform:** Wix Bookings (Class Management) + Wix Video (On-Demand).
*   **Live Stream:** Zoom Integration (Native Wix).
*   **Access Control:** Velo Custom Auth (Gate content to paid/registered students).

## 2. Phase 1: The "Classroom" Infrastructure
### A. Bookings & Zoom Integration
Instead of building a custom scheduler, we use **Wix Bookings**.
1.  **Zoom Connectivity:** Connect Zoom to Wix Bookings services.
    *   *Result:* When a student books a class, they automatically get a unique Zoom link.
    *   *Benefit:* Zero code maintenance for link generation.
2.  **Service Types:**
    *   "Free Intro to Bail" (Lead Magnet)
    *   "Certified Bail Agent Course" (Paid - High Ticket)

### B. The Velo "My Classroom" Page
A custom dashboard for students to see their upcoming classes and past recordings.
*   **Route:** `/bail-school/my-classroom`
*   **Features:**
    *   List of upcoming booked slots (Managed by Wix Bookings API).
    *   One-click "Join Class" button (Active 15 mins before start).
    *   Library of past PDF materials (Study Guides).

## 3. Phase 2: On-Demand Video Library
For students who want self-paced learning.
*   **Tool:** Wix Video (Pro Gallery).
*   **Gating:** "Must be logged in to view."
*   **Content:**
    *   "Florida Statutes 101"
    *   "How to Write a Bond"
    *   "Ethics in Bail"

## 4. Workflows (Agentic)
Refining the workflow using our new Agentic setup:
1.  **New Skill:** `.agent/skills/bail_school_manager`
    *   *Capabilities:* Automate email reminders, generate certificates of completion (via GAS).
2.  **Marketing:** Automated email sequences for students who attend the "Free Intro" but don't buy the "Certified" course.

## 5. Next Steps
1.  **Enable Wix Bookings:** Add the app to the site.
2.  **Connect Zoom:** Authorize the integration in Dashboard.
3.  **Design Landing Page:** A high-conversion page `bail-school` selling the vision.
