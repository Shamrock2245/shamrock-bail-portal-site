/**
 * Test_PDF_Hydration.js
 * 
 * Verifies that the PDF Service correctly hydrates templates with data.
 * Usage: Run testPdfHydration() from the Editor or via the Test Runner.
 */

function testPdfHydration() {
    Logger.log("📄 Starting PDF Hydration Test...");

    // 1. Mock Data (Simulating a full intake)
    const mockData = {
        // Defendant
        "defendant-first-name": "John",
        "defendant-last-name": "Doe",
        "defendant-middle-name": "Quincy",
        "defendantName": "John Quincy Doe",
        "defendant-dob": "01/15/1990",
        "defendant-ssn": "000-12-3456",
        "defendant-street-address": "123 Bail Bond Way",
        "defendant-city": "Miami",
        "defendant-state": "FL",
        "defendant-zipcode": "33101",
        "defendant-phone": "305-555-0101",
        "defendant-email": "john.doe@example.com",
        "defendant-charges": "Grand Theft Auto, Resisting Arrest",
        "defendant-booking-number": "BK-2024-9999",
        "caseNumber": "CASE-TEST-2024-X",
        "powerNumber": "PWR-998877",

        // Indemnitor
        "indemnitorName": "Jane Smith",
        "indemnitor-1-first": "Jane",
        "indemnitor-1-last": "Smith",
        "indemnitor-1-address": "456 cosigner Ln",
        "indemnitor-1-city": "Tampa",
        "indemnitor-1-state": "FL",
        "indemnitor-1-zip": "33602",
        "indemnitor-1-phone": "813-555-0202",
        "indemnitor-1-email": "jane.smith@example.com",
        "indemnitor-1-relation": "Sister",
        "indemnitor-1-employer": "Acme Corp",

        // Financial
        "totalBond": "5000",
        "premiumAmount": "500",
        "downPayment": "200",
        "balanceDue": "300",

        // Docs
        "selectedDocs": ["indemnity-agreement", "paperwork-header"]
    };

    try {
        // DEBUG: Inspect the template first
        const templateId = '1ttnAeKyJWCYBeemDj80TJjPijZYDdFFwE45XSiCEexA'; // paperwork-header
        let templateContent = "Could not read";
        try {
            const doc = DocumentApp.openById(templateId);
            const body = doc.getBody();
            templateContent = body.getText().substring(0, 500); // First 500 chars
            Logger.log("TEMPLATE CONTENT PREVIEW: " + templateContent);
        } catch (e) {
            templateContent = "Error reading template: " + e.message;
        }

        // 2. Map Data
        Logger.log("DATA: Mapping fields...");
        let pdfData = mockData;

        // 3. Generate PDF
        Logger.log("GEN: Generating PDF...");
        const pdfBlob = PDFService.generatePdfFromTemplate(mockData);

        // 4. Save to Drive
        const folderId = "1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs"; // Output Folder
        const folder = DriveApp.getFolderById(folderId);
        const file = folder.createFile(pdfBlob);

        Logger.log("✅ PDF Created: " + file.getName());
        Logger.log("🔗 Link: " + file.getUrl());

        return {
            success: true,
            url: file.getUrl(),
            templatePreview: templateContent
        };

    } catch (e) {
        Logger.log("❌ Test Failed: " + e.message + "\n" + e.stack);
        return { success: false, error: e.message, stack: e.stack };
    }
}
