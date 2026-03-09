/**
 * AI_HistoricalOCR.js
 * 
 * Pipeline for parsing scanned historical bonds into structured JSON
 * and inserting them into the MongoDB Atlas database.
 * 
 * Flow:
 * 1. Process files in a designated "Historical Scans" Google Drive folder.
 * 2. Send image/pdf data to OpenAI Vision.
 * 3. Validate extracted fields.
 * 4. Insert into 'HistoricalBonds' MongoDB Collection.
 * 5. Move parsed file to a 'Processed' folder.
 */

// NOTE: You will need to define these Folder IDs in Script Properties
// HISTORICAL_INBOX_FOLDER_ID
// HISTORICAL_PROCESSED_FOLDER_ID

function processHistoricalBondsBatch() {
    const props = PropertiesService.getScriptProperties();
    const inboxId = props.getProperty('HISTORICAL_INBOX_FOLDER_ID');
    const processedId = props.getProperty('HISTORICAL_PROCESSED_FOLDER_ID');

    if (!inboxId || !processedId) {
        console.warn("Missing Drive Folder IDs for Historical Bonds processing.");
        return;
    }

    const inbox = DriveApp.getFolderById(inboxId);
    const processed = DriveApp.getFolderById(processedId);
    const files = inbox.getFiles();
    let count = 0;

    while (files.hasNext() && count < 10) { // Process in batches of 10 to avoid timeouts
        const file = files.next();
        const mimeType = file.getMimeType();

        console.log(`Processing Historical Bond: ${file.getName()}`);

        try {
            let base64Data = Utilities.base64Encode(file.getBlob().getBytes());

            // If PDF, we might need a middle step to convert to image depending on OpenAI capabilities,
            // but OpenAI vision now supports PDF direct parsing in some endpoints. 
            // For this implementation, we assume we send the base64 indicating it's a doc/image.

            let parsedData = AI_parseHistoricalBond(base64Data, mimeType);

            if (parsedData && !parsedData.error) {
                // Hydrate with source link
                parsedData.SourceFile_Link = file.getUrl();
                parsedData.SourceFile_Name = file.getName();

                // Push to MongoDB
                const result = MongoDbService.insertOne('HistoricalBonds', parsedData);
                if (result && !result.error) {
                    console.log(`✅ Passed to MongoDB: ${parsedData.FirstName} ${parsedData.LastName}`);
                    file.moveTo(processed); // Move to processed folder
                } else {
                    console.error(`❌ MongoDB Insertion failed for ${file.getName()}: ${JSON.stringify(result)}`);
                }
            } else {
                console.error(`❌ OCR failed for ${file.getName()}`);
            }
        } catch (e) {
            console.error(`Error processing ${file.getName()}: ${e.message}`);
        }
        count++;
    }
}

/**
 * Sends the document to OpenAI Vision to extract historical fields.
 * @param {string} base64Data 
 * @param {string} mimeType 
 * @returns {Object} Structured JSON
 */
function AI_parseHistoricalBond(base64Data, mimeType) {
    const systemPrompt = `
    You are an expert Data Entry Clerk for a Bail Bonds agency.
    Extract the following historical bond information from the provided scanned document/image.
    
    **INSTRUCTIONS:**
    1. Read the document carefully. It may be an old scanned PDF or image.
    2. Extract the core fields required for our MongoDB migration.
    3. Return ONLY valid JSON matching the schema.
    4. If a field cannot be found or is illegible, return null.

    Required Fields:
    - FirstName: String
    - LastName: String
    - BondDate: "YYYY-MM-DD"
    - PowerNumber: String
    - LiabilityAmount: Number (no currency symbols)
    - PremiumAmount: Number (no currency symbols)
    
    Future Fields (extract if present):
    - Email: String or null
    - Phone: String or null
    - FullName: String or null
    - DefendantName: String or null
    - DefendantPhone: String or null
    - CaseNumber: String or null
    - Status: String or null
    - References: String or null
    - EmployerInfo: String or null
    - ResidenceType: String or null
    - Language: String or null
    - BookingNumber: String or null
    - County: String or null
    - Charges: String or null
    
    Return ONLY JSON.
  `;

    // Format for callOpenAI which expects an array of objects
    const userContent = [{
        mimeType: mimeType,
        data: base64Data
    }];

    const result = callOpenAI(systemPrompt, userContent, { jsonMode: true, useKnowledgeBase: false });
    return result;
}
