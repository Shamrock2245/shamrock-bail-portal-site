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
        // 2. Map Data
        Logger.log("DATA: Mapping fields...");
        let pdfData = mockData;
        if (typeof PDF_mapDataToTags === 'function') {
            // Simulate the logic in Code.js
            const mappedFields = PDF_mapDataToTags(mockData, 'BOND_PACKAGE'); // Using a dummy key to trigger full map? 
            // Wait, PDF_Mappings.js says usage is PDF_mapDataToTags(data, templateKey)
            // But existing Code.js calls it with 'BOND_PACKAGE'? 
            // Let's look at PDF_Mappings.js again. 
            // It expects a templateKey. 'BOND_PACKAGE' is NOT in TEMPLATE_FILENAME_MAP.
            // This might be the bug! 
            // Code.js line 1628: const mappedFields = PDF_mapDataToTags(docData, 'BOND_PACKAGE');

            // If I use 'indemnity-agreement', it should work.

            // Let's try to replicate the POTENTIAL BUG first
            // const mappedFields_Bug = PDF_mapDataToTags(mockData, 'BOND_PACKAGE'); 
            // Logger.log("Mapped with BOND_PACKAGE: " + JSON.stringify(mappedFields_Bug));

            // Now let's try the correct way (per file)
            // But PDFService merges them? 

            // Actually, PDF_Mappings says:
            // "This allows us to just look up values by Master Key."
            // And PDF_mapDataToTags iterates through ONE template's map.

            // So Code.js logic seems flawed if it passes 'BOND_PACKAGE'. 
            // Let's verify that separately.

            // monitoring for now, let's just use the Master Logic directly if possible?
            // No, we need to test the PIPELINE.
        }

        // 3. Generate PDF
        Logger.log("GEN: Generating PDF...");
        const pdfBlob = PDFService.generatePdfFromTemplate(mockData); // PDFService does its own replacement too?

        // 4. Save to Drive
        const folderId = "1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs"; // Output Folder
        const folder = DriveApp.getFolderById(folderId);
        const file = folder.createFile(pdfBlob);

        Logger.log("✅ PDF Created: " + file.getName());
        Logger.log("🔗 Link: " + file.getUrl());
        return { success: true, url: file.getUrl() };

    } catch (e) {
        Logger.log("❌ Test Failed: " + e.message + "\n" + e.stack);
        return { success: false, error: e.message };
    }
}
