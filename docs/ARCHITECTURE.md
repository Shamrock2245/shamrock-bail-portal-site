# Shamrock Bail Bonds Automation: System Architecture

**Version:** 2.0 (Post-Deduplication)
**Date:** 2026-02-20
**Author:** Manus AI

This document outlines the unified, deduplicated architecture of the Shamrock Bail Bonds automation factory. It reflects the merged and cleaned codebase after the audit of Antigravity and Manus session work.

## 1. Core Principle: Single Source of Truth

To eliminate redundancy and ensure data integrity, the system adheres to a strict single-source-of-truth principle for all key functionalities. Duplicate files and functions have been removed, and all logic is now centralized in canonical modules.

## 2. System Components & Data Flow

The automation pipeline is composed of several interconnected modules, each with a clearly defined responsibility.

```mermaid
graph TD
    A[Telegram Client] -->|Inbound Msg| B(Wix Endpoint);
    B -->|Forwards to| C(GAS Webhook);
    C -->|Routes to| D{Message Type?};
    D -->|Text| E[Manus_Brain.js];
    D -->|Photo/Doc| F[PDF_Processor.js];
    D -->|Location| G[LocationMetadataService.js];
    E -->|Intake Flow| H(Telegram_IntakeFlow.js);
    H -->|Data to| I[Wix Collections];
    F -->|ID Photos| J(ID Verification Flow);
    J -->|Stores in| K[Google Drive];
    F -->|Signed Docs| L(Post-Signing Pipeline);
    L -->|Merges/Watermarks| K;
    L -->|Sends to Client| A;
    M[SignNow Webhook] -->|signing_complete| N(SOC2_WebhookHandler.js);
    N -->|Triggers| L;
```

### 2.1. Google Apps Script (`backend-gas`)

This is the heart of the automation factory, containing all business logic.

| File | Responsibility |
| :--- | :--- |
| **`Code.js`** | Main entry point. Routes all incoming webhooks (`doPost`) and exposes client-callable functions (`doGet`). |
| **`Telegram_Webhook.js`** | Handles all inbound Telegram messages. Routes to the appropriate handler based on message type (text, photo, document, location, command). |
| **`PDF_Processor.js`** | **(Unified)** Handles all document and photo uploads. Presents a task menu to the user (ID, Signed Docs, etc.) and manages the guided ID verification flow (front, back, selfie). Also runs the post-signing pipeline. |
| **`Telegram_IntakeFlow.js`** | Manages the conversational state machine for new client intake via Telegram. Collects all necessary defendant and indemnitor information. |
| **`Manus_Brain.js`** | Routes general text messages to the appropriate AI model or conversational flow. |
| **`WebhookHandler.js`** | Handles SignNow webhooks, specifically the `document.complete` event, which it delegates to `DriveFilingService` and now triggers the `PDF_Processor` post-signing pipeline. |
| **`SOC2_WebhookHandler.js`** | Secure entry point for all webhooks, performing signature verification before passing the payload to the main handlers. |
| **`DriveFilingService.gs`** | Manages all interactions with Google Drive, including creating case folders and saving documents. |
| **`Utilities.js`** | **(New)** A centralized library of all common helper functions (`getFileExtension`, `formatDate_`, `getOrCreateDriveSubfolder`, etc.) to eliminate code duplication. |
| **`Telegram_API.js`** | A robust client for the Telegram Bot API. Handles sending all message types, downloading files, and managing webhooks. |
| **`Telegram_Notifications.js`** | Contains all functions for sending outbound business notifications (e.g., court date reminders, payment requests). |
| **`Telegram_Auth.js`** | Manages user authentication via OTP sent to their Telegram account. |

### 2.2. Wix Velo (`src`)

The Wix site serves as the mobile-first frontend for clients and the dashboard for staff.

| File | Responsibility |
| :--- | :--- |
| **`http-functions.js`** | Exposes the public webhook endpoint that receives messages from Telegram and forwards them to the GAS web app. |
| **`wix-crm-backend`** | Handles interactions with the Wix CRM, including creating and updating contact records. |
| **`portal-auth.jsw`** | Manages user login and session management for the client portal. |
| **`Dashboard.html`** | **(GAS)** The staff-facing dashboard for managing cases, viewing intake queue submissions, and generating document packets. |

## 3. Key Architectural Decisions & Resolutions

*   **Unified Document/Photo Handling:** All inbound photos and documents are now routed through `PDF_Processor.js`. This provides a consistent user experience with a clear task menu and leverages the robust, stateful ID verification flow from the `Telegram_PhotoHandler.js` (which has been merged and deleted).

*   **Centralized Utilities:** All common helper functions have been moved to `Utilities.js`. All other files have been refactored to call this single source of truth, reducing code size and maintenance effort.

*   **Closed-Loop Signing:** The `handleDocumentComplete` function in `WebhookHandler.js` now triggers the `triggerPostSigningFromWebhook` function in `PDF_Processor.js`. This creates a fully automated loop: a client signs a document in SignNow, the webhook is received, the final PDF is processed (merged, watermarked), and the client is immediately sent the final document and a request for ID photos via Telegram.

This unified architecture is now cleaner, more maintainable, and fully aligned with the project goal of a zero-re-entry automation factory.
