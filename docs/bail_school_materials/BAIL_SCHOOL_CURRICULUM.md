# Bail School & Curriculum Guidelines

This document outlines the operational structure, curriculum tracks, and integrations for the Shamrock Bail Bonds "Bail School" division.

## 1. Core Mission of the Bail School
The school serves a dual purpose:
1. **Revenue & Education**: Pro-actively educating the community and indemnitors.
2. **Lead Generation**: Capturing pre-qualified leads who may eventually need services, establishing Shamrock as the ultimate authority in Florida bail.

## 2. Platform Integrations
The school's operational backbone relies on specific automations:
- **`bail_school_manager` Skill**: The AI skill responsible for scheduling, booking lookups, and triggering certificate generation.
- **Wix Bookings & Events**: The frontend interface where users register for courses.
- **SignNow**: Used for generating completion certificates and signing liability waivers.
- **SwipeSimple**: Handling course registration fees (if applicable).

## 3. The Curriculum Tracks
*These tracks map directly to the Wix frontend structure under the `/bail-school` routes.*

### Track A: Indemnitor Basics
- **Target Audience**: First-time co-signers, family members of defendants.
- **Duration**: 45 Minutes (Online / VOD).
- **Core Topics**:
  - What does it mean to co-sign? (Liability, Collateral).
  - The lifecycle of a bond (Arrest to Case Closed).
  - Understanding court dates and "Failure to Appear" consequences.
- **Outcome**: Indemnitor receives a "Verified Co-Signer" badge/status in their CRM profile.

### Track B: The Agent Path (Become a Bondsman)
- **Target Audience**: Individuals looking to enter the industry. Maps to the `/become-bondsman` CMS page.
- **Duration**: Multi-day / Hybrid.
- **Core Topics**:
  - Florida Statutes 648 and 903.
  - Premium calculations and transfer fees.
  - Risk assessment (The 0-100 Score algorithm).
  - Technology stack (Using the Shamrock Portal).
- **Outcome**: Certification generation and potential recruitment funnel.

### Track C: Risk Management & Skip Tracing
- **Target Audience**: Existing industry professionals or advanced students.
- **Duration**: Advanced Seminar.
- **Core Topics**:
  - Advanced TLO/IRB cross-referencing.
  - Understanding county scraper logic ("The Scout").
  - Digital footprint tracking.

## 4. Automation & Handoff
- **Registration**: When a user registers on Wix, the data MUST map to the `BailSchoolRoster` schema.
- **Pre-Course Reminders**: "The Concierge" sends SMS/WhatsApp reminders 24 hours and 1 hour before the course begins.
- **Graduation Webhook**: Upon course completion, GAS generates a PDF certificate via SignNow and emails it automatically. 

## 5. UI/UX Rules for the School
- **Aesthetics**: Premium, academic, and authoritative.
- **Trust Signals**: Display instructor credentials, course completion metrics, and state compliance badges prominently on the school landing pages.
