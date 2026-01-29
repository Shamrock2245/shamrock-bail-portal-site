---
name: Bail School Manager
description: Automates course bookings, reminders, and certificate generation.
version: 1.0.0
---

# Skill: Bail School Manager

Use this skill to manage the "Shamrock Bail School" education platform.

## 1. Course Definition Schema
Courses are defined in the `Courses` collection (Schema ID: `Courses`).

| Field | Type | Example |
| :--- | :--- | :--- |
| `title` | Text | "Florida Statutes 101" |
| `type` | Text | `LIVE_ZOOM` or `ON_DEMAND` |
| `price` | Number | 150.00 |
| `zoomLinkId` | Text | (From Wix Bookings) |
| `videoSource` | Text | (From Wix Video ID) |

## 2. Certificate Generation (GAS Implementation)
When a student completes a course, we generate a PDF certificate.

**Integration Point:** `backend/bailSchool.jsw` -> `notifyGASOfCompletion(studentId, courseId)`

**Payload to GAS:**
```json
{
  "action": "generateCertificate",
  "studentName": "Jane Doe",
  "courseName": "Certified Bail Agent Level 1",
  "completionDate": "2026-01-28",
  "licenseNumber": "P-123456"
}
```

## 3. Zoom Link Automation
**Logic:**
1.  User buys "Live Class" via Wix Bookings.
2.  Wix Bookings triggers `onBookingConfirmed()`.
3.  We grab the Zoom Link from the Service Object.
4.  We email it to the user + store it in `StudentEnrollments` collection.

## 4. Workflows
*   **Generate Certificate:** Run `generateCertificate(userId, courseId)`.
*   **Grant Access:** Run `grantCourseAccess(userId, courseId)`.
*   **Revoke Access:** Run `revokeCourseAccess(userId, courseId)` (Refunds).
