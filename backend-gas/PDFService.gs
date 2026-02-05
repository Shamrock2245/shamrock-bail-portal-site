/**
 * PDFService.gs
 * Version: 2.0.0 - Multi-Template Support
 * 
 * Handles the generation of PDF documents from Google Doc templates.
 * Supports merging multiple templates into a single PDF via "Append Mode".
 */

// ============================================================================
// TEMPLATE REGISTRY (Mirrors Code.js for robust access)
// ============================================================================
const PDF_TEMPLATES = {
  'paperwork-header': '15sTaIIwhzHk96I8X3rxz7GtLMU-F5zo1',
  'faq-cosigners': '1bjmH2w-XS5Hhe828y_Jmv9DqaS_gSZM7',
  'faq-defendants': '16j9Z8eTii-J_p4o6A2LrzgzptGB8aOhR',
  'indemnity-agreement': '1Raa2gzHOlO5kSJOeDE25eBh2H8LcjN5L',
  'defendant-application': '1JxBubXg0up1NeFBaWgi6qGNA133tSCxG',
  'promissory-note': '104-ArZiCm3cgfQcT5rIO0x_OWiaw6Ddt',
  'disclosure-form': '1qIIDudp7r3J7-6MHlL2US34RcrU9KZKY',
  'surety-terms': '1VfmyUTpchfwJTlENlR72JxmoE_NCF-uf',
  'master-waiver': '181mgKQN-VxvQOyzDquFs8cFHUN0tjrMs',
  'ssa-release': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu',
  'collateral-receipt': '1IAYq4H2b0N0vPnJN7b2vZPaHg_RNKCmP',
  'payment-plan': '1v-qkaegm6MDymiaPK45JqfXXX2_KOj8A',
  'appearance-bond': '15SDM1oBysTw76bIL7Xt0Uhti8uRZKABs'
};

/**
 * Generates a single merged PDF from multiple template keys
 * @param {object} data - Intake data object (includes data.selectedDocs = ['key1', 'key2'])
 * @returns {Blob} PDF file blob
 */
function generatePdfFromTemplate(data) {
  try {
    const props = PropertiesService.getScriptProperties();
    
    // 1. Identify Templates
    const selectedKeys = data.selectedDocs || ['indemnity-agreement']; // Default fallback
    console.log('Generating PDF for package:', selectedKeys);
    
    const validTemplates = selectedKeys
      .map(key => ({ key: key, id: PDF_TEMPLATES[key] }))
      .filter(t => t.id);

    if (validTemplates.length === 0) {
      throw new Error('No valid templates found for keys: ' + selectedKeys.join(', '));
    }

    // 2. Setup Master Doc (Start with the first template)
    // We copy the first template to serve as the "Master"
    // Then we append others to it.
    const destFolderId = props.getProperty('GOOGLE_DRIVE_FOLDER_ID') || props.getProperty('GOOGLE_DRIVE_OUTPUT_FOLDER_ID');
    const destFolder = destFolderId ? DriveApp.getFolderById(destFolderId) : DriveApp.getRootFolder();
    
    const timestamp = Utilities.formatDate(new Date(), 'America/New_York', 'yyyyMMdd_HHmm');
    const docName = `Temp_Package_${data.defendantName || 'Unknown'}_${timestamp}`;
    
    // Copy First Template -> Master
    const firstTemplate = validTemplates[0];
    const masterFile = DriveApp.getFileById(firstTemplate.id).makeCopy(docName, destFolder);
    const masterDoc = DocumentApp.openById(masterFile.getId());
    const masterBody = masterDoc.getBody();

    // 3. Append Subsequent Templates
    if (validTemplates.length > 1) {
      for (let i = 1; i < validTemplates.length; i++) {
        const nextTemp = validTemplates[i];
        
        // Add Page Break
        masterBody.appendPageBreak();
        
        // Open Next Template
        const nextDoc = DocumentApp.openById(nextTemp.id);
        const nextBody = nextDoc.getBody();
        
        // Copy Elements
        const totalElements = nextBody.getNumChildren();
        for (let j = 0; j < totalElements; ++j) {
          const element = nextBody.getChild(j).copy();
          const type = element.getType();
          
          if (type === DocumentApp.ElementType.PARAGRAPH) masterBody.appendParagraph(element);
          else if (type === DocumentApp.ElementType.TABLE) masterBody.appendTable(element);
          else if (type === DocumentApp.ElementType.LIST_ITEM) masterBody.appendListItem(element);
          else if (type === DocumentApp.ElementType.Equation) masterBody.appendEquation(element);
          // Add other types as needed (Images can be tricky)
        }
      }
    }

    // 4. Global Text Replacement
    replacePlaceholders(masterBody, data);

    // 5. Save & Export
    masterDoc.saveAndClose();
    
    const pdfBlob = masterFile.getAs('application/pdf');
    pdfBlob.setName(`BailPacket_${data.defendantName || 'Unknown'}_${timestamp}.pdf`);

    // 6. Cleanup
    masterFile.setTrashed(true); // Delete temp master doc

    return pdfBlob;

  } catch (e) {
    console.error('Error generating PDF Package:', e);
    throw new Error(`PDF Generation Failed: ${e.message}`);
  }
}

/**
 * Helper to replace {{Keys}} in the document body
 */
function replacePlaceholders(body, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' || typeof value === 'number') {
      body.replaceText(`{{${key}}}`, String(value));
    }
  }

  // Calculated Fields
  const today = Utilities.formatDate(new Date(), 'America/New_York', 'MM/dd/yyyy');
  body.replaceText('{{Date}}', today);
  body.replaceText('{{CurrentDate}}', today);
  
  // Clean up unused tags? (Optional)
  // body.replaceText('{{.*?}}', ''); 
}

/**
 * TEST FUNCTION
 */
function testPdfGeneration() {
  const data = {
    defendantName: 'Multi-Doc Test',
    caseNumber: 'CASE-MULTI-001',
    indemnitorName: 'Tester McTest',
    bondAmount: '5000',
    selectedDocs: ['indemnity-agreement', 'payment-plan'] 
  };

  try {
    const pdf = generatePdfFromTemplate(data);
    console.log('✅ PDF Package Generated Successfully');
    console.log('Name:', pdf.getName());
    console.log('Size:', pdf.getBytes().length);
    
    // Save to drive to inspect
    const file = DriveApp.createFile(pdf);
    console.log('Saved Test PDF to Drive:', file.getUrl());
    
  } catch (e) {
    console.error('❌ Test Failed:', e.message);
  }
}
