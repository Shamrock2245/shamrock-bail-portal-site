/**
 * Test_DocFiller.js
 * 
 * Unit tests for the Magic Tags system.
 * Run `test_MagicTags_Generation()` to verify the whole flow.
 */

function test_MagicTags_Generation() {
    console.log('🧪 Starting Magic Tags Test...');

    // 1. Verify Templates are Registered
    const id = DocFiller.getTemplateId('defendant-application');
    if (!id) {
        console.error('❌ Template ID for "defendant-application" not found.');
        console.error('👉 Please run TaggingAssistant.scanAndRegisterTemplates() first!');
        return;
    }
    console.log(`✅ Found Template ID: ${id}`);

    // 2. Prepare Mock Data
    const mockData = {
        'defendant-first-name': 'Testy',
        'defendant-last-name': 'McTestFace',
        'defendant-dob': '01/01/1980',
        'defendant-ssn': '000-00-0000',
        'charges': 'Resisting Unit Testing w/o Violence',
        'totalBond': '5000',
        'premiumAmount': '500'
    };

    // 3. Generate Doc
    try {
        console.log('📄 Generating Document...');
        // Use root folder (null) or specify a folder ID
        const newDocId = generateDocumentFromKey(
            'defendant-application',
            null,
            `TEST - Defendant App - ${new Date().toISOString()}`,
            mockData
        );

        console.log(`🎉 SUCCESS! Generated Doc ID: ${newDocId}`);
        console.log(`🔗 Link: https://docs.google.com/document/d/${newDocId}/edit`);
    } catch (e) {
        console.error('💥 Error generating document:', e.message);
        console.error(e.stack);
    }
}
