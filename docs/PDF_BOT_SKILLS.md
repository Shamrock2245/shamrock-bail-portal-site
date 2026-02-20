# PDF Bot Skills & Capabilities

**Source Repositories:**
*   [zeshuaro/telegram-pdf-bot](https://github.com/zeshuaro/telegram-pdf-bot)
*   [MrBotDeveloper/PDF-Bot](https://github.com/MrBotDeveloper/PDF-Bot)

This document catalogs the specific skills and patterns that have been integrated into the Shamrock automation factory from the open-source repositories listed above. These capabilities are now part of the `PDF_Processor.js` module.

## 1. Core Integrated Skills

The following skills have been adapted and implemented in the GAS environment:

| Skill | Original Repo | Implementation in `PDF_Processor.js` |
| :--- | :--- | :--- |
| **Merge PDFs** | `zeshuaro` | `_mergeFilesInDrive()`: Merges the final signed document with the ID photos and any other supporting documents into a single, final PDF for the case file. |
| **Compress PDF** | `zeshuaro` | `_compressPdfViaDrive()`: Compresses the final merged PDF to reduce file size for storage and delivery to the client. |
| **Watermark PDF** | `zeshuaro` | `_applyWatermarkViaDrive()`: Applies a "FULLY EXECUTED" watermark to the final PDF to prevent tampering and indicate its status. |
| **Document Intake** | `MrBotDeveloper` | `handleIncomingDocument()`: The core function that receives a document, saves it temporarily, and presents the user with a clear menu of what they want to do with it. |
| **Task Selection Menu** | `MrBotDeveloper` | `processDocumentTaskSelection()`: Handles the user's choice from the inline keyboard menu (ID Photo, Signed Docs, etc.) and routes the document to the correct handler. |
| **File Archiving** | `zeshuaro` | `_archiveFileCopy()`: Creates a copy of the final, processed PDF in a separate, secure archive folder in Google Drive for long-term compliance and backup. |

## 2. Implementation Details

### Post-Signing Pipeline

When a `document.complete` webhook is received from SignNow, the `triggerPostSigningFromWebhook` function in `PDF_Processor.js` initiates the following automated pipeline:

1.  **Merge:** The original signed document is merged with the client's uploaded ID photos.
2.  **Compress:** The merged PDF is compressed to optimize its file size.
3.  **Watermark:** A "FULLY EXECUTED" watermark is applied.
4.  **Archive:** A copy is saved to the secure archive folder.
5.  **Deliver:** The final, processed PDF is sent back to the client via Telegram using the `sendFinalDocumentToClient` function.

This entire process is now fully automated, ensuring a secure, compliant, and efficient closing to every case.
