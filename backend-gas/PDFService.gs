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
  'paperwork-header': '1ttnAeKyJWCYBeemDj80TJjPijZYDdFFwE45XSiCEexA',
  'faq-cosigners': '1zmAJyuMPZtOG-Is-8tPfkQWEmK043VR571GCYXB3EKY',
  'faq-defendants': '1J2cgPoz1gomuCxrAyS69KwsEm570O0mn5m2__0pm3-E',
  'indemnity-agreement': '125cAWaM1CKjEc7OWEbPlVU7w-gixNkV1Fw_6gaFHTpM',
  'defendant-application': '1eFwOUAf4Wtlkux4DZkI9d3IJVVC-JLV9Zv5wLzG86o8',
  'promissory-note': '1QE5pd5JeusdOVetrTWd052RTS6z9uzi2o9MalFYXweQ',
  'disclosure-form': '1-2H13q6KhOuOhYhUCY1l0gM2FezBmejHShVv0eiuB_Q',
  'surety-terms': '1BlLmT2bLKoCChhhRqG1O7HuU9ibCFlZoYxd5lJBUekA',
  'master-waiver': '1PJ1DseAMA9k-aLyszm_21wHIjSOJU9wFtpWFse72eGs',
  'ssa-release': '1O-qxrn_K7M6bNlkA3tqsAD6bcjcxKmfGysliLOqnkAg',
  'collateral-receipt': '1x8DR6l1WOq3sCaOnxi0aOFGrzM1DrlS9nEGeQh9nLek',
  'payment-plan': '1Xg7r0RVwYyuWznxYpO-YSW9Cybyf6f6NHIhh5_nNzbw',
  'appearance-bond': '1pH1ZFWmrSSliM7ojsNlQ8J41Q-3AbVS7Rn5FKFCwllY'
};


/**
 * Generates a single merged PDF from multiple template keys
 * @param {object} data - Intake data object (includes data.selectedDocs = ['key1', 'key2'])
 * @returns {Blob} PDF file blob
 */
function generatePdfFromTemplate(data) {
  let debugStep = 'Start';
  try {
    debugStep = 'Get Properties';
    const props = PropertiesService.getScriptProperties();
    
    // 1. Identify Templates
    debugStep = 'Identify Templates';
    if (!PDF_TEMPLATES) throw new Error('PDF_TEMPLATES is undefined');
    
    const selectedKeys = data.selectedDocs || ['indemnity-agreement']; 
    console.log('Generating PDF for package:', selectedKeys);
    
    const validTemplates = selectedKeys
      .map(key => ({ key: key, id: PDF_TEMPLATES[key] }))
      .filter(t => t.id);

    if (validTemplates.length === 0) {
      throw new Error('No valid templates found for keys: ' + selectedKeys.join(', '));
    }

    // 2. Setup Master Doc
    debugStep = 'Get Dest Folder';
    const destFolderId = props ? (props.getProperty('GOOGLE_DRIVE_FOLDER_ID') || props.getProperty('GOOGLE_DRIVE_OUTPUT_FOLDER_ID')) : null;
    let destFolder;
    try {
      destFolder = destFolderId ? DriveApp.getFolderById(destFolderId) : DriveApp.getRootFolder();
    } catch (err) {
      console.warn('Invalid Dest Folder ID');
      destFolder = DriveApp.getRootFolder();
    }
    
    debugStep = 'Format Date';
    const timestamp = Utilities.formatDate(new Date(), 'America/New_York', 'yyyyMMdd_HHmm');
    const docName = `Temp_Package_${data.defendantName || 'Unknown'}_${timestamp}`;
    
    // Copy First Template
    debugStep = 'Copy Master Template';
    const firstTemplate = validTemplates[0];
    if (!firstTemplate || !firstTemplate.id) throw new Error('First template is invalid');
    
    const sourceFile = DriveApp.getFileById(firstTemplate.id);
    const mimeType = sourceFile.getMimeType();
    console.log('DEBUG: Template MimeType:', mimeType);
    
    if (mimeType !== MimeType.GOOGLE_DOCS) {
       throw new Error(`Template is not a Google Doc! Type: ${mimeType}`);
    }
    
    // This is likely where it fails if ID is bad
    const masterFile = sourceFile.makeCopy(docName, destFolder);
    
    debugStep = 'Open Master Doc';
    const masterDoc = DocumentApp.openById(masterFile.getId());
    const masterBody = masterDoc.getBody();

    // 3. Append Subsequent Templates
    debugStep = 'Append Templates';
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
        }
      }
    }

    // 4. Global Text Replacement
    debugStep = 'Replace Placeholders';
    replacePlaceholders(masterBody, data);

    // 5. Save & Export
    debugStep = 'Save & Close';
    masterDoc.saveAndClose();
    
    debugStep = 'Get PDF Blob';
    const pdfBlob = masterFile.getAs('application/pdf');
    pdfBlob.setName(`BailPacket_${data.defendantName || 'Unknown'}_${timestamp}.pdf`);

    // 6. Cleanup
    debugStep = 'Cleanup';
    masterFile.setTrashed(true); 

    return pdfBlob;

  } catch (e) {
    console.error(`Error at ${debugStep}:`, e);
    throw new Error(`PDF Generation Failed at [${debugStep}]: ${e.message}`);
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

// Export for other files
var PDFService = {
  generatePdfFromTemplate: generatePdfFromTemplate
};
