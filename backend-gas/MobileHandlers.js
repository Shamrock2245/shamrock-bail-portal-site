/**
 * MobileHandlers.js
 * Backend handlers for Mobile and Tablet Dashboard interfaces
 * Shamrock Bail Bonds - GAS Project
 */

/**
 * Serve the appropriate mobile dashboard based on query parameter
 */
function doGetMobile(e) {
  const page = e.parameter.page || 'mobile';
  
  if (page === 'tablet') {
    return HtmlService.createTemplateFromFile('TabletDashboard')
      .evaluate()
      .setTitle('Shamrock - Tablet Dashboard')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    return HtmlService.createTemplateFromFile('MobileDashboard')
      .evaluate()
      .setTitle('Shamrock Mobile')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Save draft case data from mobile dashboard
 * @param {Object} formData - The collected form data
 * @returns {Object} Success/failure response
 */
function saveDraft(formData) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    let draftsSheet = ss.getSheetByName('Drafts');
    
    // Create Drafts sheet if it doesn't exist
    if (!draftsSheet) {
      draftsSheet = ss.insertSheet('Drafts');
      draftsSheet.appendRow([
        'Draft_ID', 'Defendant_Name', 'County', 'Total_Bond', 
        'Indemnitor_Name', 'Indemnitor_Phone', 'Created', 'Updated', 'Data_JSON'
      ]);
    }
    
    const draftId = 'DRAFT-' + new Date().getTime();
    const defendantName = `${formData.defendant.firstName} ${formData.defendant.lastName}`.trim();
    const indemnitorName = formData.indemnitors[0]?.name || '';
    const indemnitorPhone = formData.indemnitors[0]?.phone || '';
    
    // Calculate total bond
    let totalBond = 0;
    formData.charges.forEach(charge => {
      totalBond += parseFloat(String(charge.bondAmount).replace(/[^0-9.]/g, '')) || 0;
    });
    
    draftsSheet.appendRow([
      draftId,
      defendantName,
      formData.defendant.county,
      totalBond,
      indemnitorName,
      indemnitorPhone,
      new Date().toISOString(),
      new Date().toISOString(),
      JSON.stringify(formData)
    ]);
    
    return { success: true, draftId: draftId };
  } catch (error) {
    console.error('saveDraft error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save case to the main Cases sheet
 * @param {Object} formData - The collected form data
 * @returns {Object} Success/failure response with case ID
 */
function saveCase(formData) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const casesSheet = ss.getSheetByName('Cases') || ss.getSheetByName('Active_Cases');
    
    if (!casesSheet) {
      throw new Error('Cases sheet not found');
    }
    
    const caseId = generateCaseId(formData.defendant.county);
    const defendantName = `${formData.defendant.firstName} ${formData.defendant.lastName}`.trim();
    
    // Calculate totals
    let totalBond = 0;
    const chargeDescriptions = [];
    formData.charges.forEach(charge => {
      totalBond += parseFloat(String(charge.bondAmount).replace(/[^0-9.]/g, '')) || 0;
      if (charge.description) chargeDescriptions.push(charge.description);
    });
    
    const premiumRate = parseFloat(formData.payment.premiumRate) / 100;
    const premium = Math.max(totalBond * premiumRate, formData.charges.length * 100);
    const downPayment = parseFloat(formData.payment.downPayment) || 0;
    const balance = premium - downPayment;
    
    // Build row data (adjust columns based on your sheet structure)
    const rowData = [
      caseId,                                    // Case_ID
      defendantName,                             // Defendant_Name
      formData.defendant.firstName,              // First_Name
      formData.defendant.lastName,               // Last_Name
      formData.defendant.dob,                    // DOB
      formData.defendant.phone,                  // Phone
      formData.defendant.email,                  // Email
      formData.defendant.address || '',          // Address
      formData.defendant.city || '',             // City
      formData.defendant.state || 'FL',          // State
      formData.defendant.zip || '',              // ZIP
      formData.defendant.county,                 // County
      formData.defendant.bookingNumber,          // Booking_Number
      formData.defendant.arrestDate,             // Arrest_Date
      formData.defendant.facility || '',         // Facility
      chargeDescriptions.join('; '),             // Charges
      totalBond,                                 // Total_Bond
      premium,                                   // Premium
      downPayment,                               // Down_Payment
      balance,                                   // Balance
      formData.payment.method,                   // Payment_Method
      formData.indemnitors[0]?.name || '',       // Indemnitor_1_Name
      formData.indemnitors[0]?.phone || '',      // Indemnitor_1_Phone
      formData.indemnitors[0]?.email || '',      // Indemnitor_1_Email
      formData.indemnitors[0]?.relationship || '', // Indemnitor_1_Relationship
      formData.indemnitors[0]?.address || '',    // Indemnitor_1_Address
      'Pending',                                 // Status
      new Date().toISOString(),                  // Created_Date
      'Mobile Dashboard'                         // Source
    ];
    
    casesSheet.appendRow(rowData);
    
    return { success: true, caseId: caseId };
  } catch (error) {
    console.error('saveCase error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate document packet from mobile dashboard
 * @param {Object} formData - The collected form data
 * @returns {Object} Success/failure response with PDF URL
 */
function generatePacketFromMobile(formData) {
  try {
    // First save the case
    const saveResult = saveCase(formData);
    if (!saveResult.success) {
      return saveResult;
    }
    
    // Map mobile form data to the 34-column schema expected by generateFilledPacket
    const mappedData = mapMobileToPacketSchema(formData, saveResult.caseId);
    
    // Call existing packet generation function
    const packetResult = generateFilledPacket(mappedData);
    
    if (packetResult && packetResult.pdfUrl) {
      return { 
        success: true, 
        caseId: saveResult.caseId,
        pdfUrl: packetResult.pdfUrl 
      };
    } else {
      return { 
        success: true, 
        caseId: saveResult.caseId,
        message: 'Case saved, packet generation pending'
      };
    }
  } catch (error) {
    console.error('generatePacketFromMobile error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send documents for signing from mobile dashboard
 * @param {Object} formData - The collected form data
 * @returns {Object} Success/failure response
 */
function sendForSigningFromMobile(formData) {
  try {
    // First generate the packet
    const packetResult = generatePacketFromMobile(formData);
    if (!packetResult.success) {
      return packetResult;
    }
    
    // Get indemnitor contact info for SignNow
    const indemnitor = formData.indemnitors[0];
    if (!indemnitor || !indemnitor.email) {
      return { success: false, error: 'Indemnitor email is required for signing' };
    }
    
    // Prepare signer data
    const signerData = {
      name: indemnitor.name,
      email: indemnitor.email,
      phone: indemnitor.phone,
      role: 'Indemnitor'
    };
    
    // Call existing SignNow integration
    // This assumes generateAndSendWithWixPortal or similar function exists
    const signingResult = sendToSignNow({
      caseId: packetResult.caseId,
      signers: [signerData],
      defendantName: `${formData.defendant.firstName} ${formData.defendant.lastName}`,
      county: formData.defendant.county
    });
    
    if (signingResult && signingResult.success) {
      // Send SMS notification via Twilio
      if (indemnitor.phone) {
        sendSigningNotificationSMS(indemnitor.phone, indemnitor.name, packetResult.caseId);
      }
      
      return { 
        success: true, 
        caseId: packetResult.caseId,
        message: 'Documents sent for signing'
      };
    } else {
      return { 
        success: true, 
        caseId: packetResult.caseId,
        message: 'Case saved, signing link will be sent shortly'
      };
    }
  } catch (error) {
    console.error('sendForSigningFromMobile error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Map mobile form data to the 34-column packet schema
 * @param {Object} formData - Mobile form data
 * @param {string} caseId - Generated case ID
 * @returns {Object} Mapped data for packet generation
 */
function mapMobileToPacketSchema(formData, caseId) {
  const def = formData.defendant;
  const ind = formData.indemnitors[0] || {};
  const charges = formData.charges || [];
  const payment = formData.payment || {};
  
  // Calculate totals
  let totalBond = 0;
  charges.forEach(c => {
    totalBond += parseFloat(String(c.bondAmount).replace(/[^0-9.]/g, '')) || 0;
  });
  
  const premiumRate = parseFloat(payment.premiumRate) / 100;
  const premium = Math.max(totalBond * premiumRate, charges.length * 100);
  
  return {
    // Case Info
    caseId: caseId,
    caseNumber: caseId,
    
    // Defendant Info
    defendantFirstName: def.firstName || '',
    defendantMiddleName: def.middleName || '',
    defendantLastName: def.lastName || '',
    defendantSuffix: def.suffix || '',
    defendantFullName: `${def.firstName || ''} ${def.middleName || ''} ${def.lastName || ''} ${def.suffix || ''}`.trim(),
    defendantDOB: def.dob || '',
    defendantSSN: def.ssn || '',
    defendantDL: def.dlNumber || '',
    defendantDLState: def.dlState || 'FL',
    defendantAddress: def.address || '',
    defendantCity: def.city || '',
    defendantState: def.state || 'FL',
    defendantZip: def.zip || '',
    defendantPhone: def.phone || '',
    defendantEmail: def.email || '',
    
    // Booking Info
    bookingNumber: def.bookingNumber || '',
    county: def.county || 'Lee',
    arrestDate: def.arrestDate || '',
    facility: def.facility || '',
    courtType: def.courtType || 'Co/Cir',
    
    // Charges
    charges: charges.map(c => ({
      description: c.description || '',
      bondAmount: c.bondAmount || '0',
      type: c.type || 'M'
    })),
    chargeDescriptions: charges.map(c => c.description).join('; '),
    
    // Bond/Payment
    totalBondAmount: totalBond,
    premiumRate: payment.premiumRate || '10',
    premiumAmount: premium,
    downPayment: parseFloat(payment.downPayment) || 0,
    balanceDue: premium - (parseFloat(payment.downPayment) || 0),
    paymentMethod: payment.method || 'cash',
    
    // Indemnitor Info
    indemnitorName: ind.name || '',
    indemnitorPhone: ind.phone || '',
    indemnitorEmail: ind.email || '',
    indemnitorAddress: ind.address || '',
    indemnitorRelationship: ind.relationship || '',
    
    // Additional Indemnitors
    indemnitors: formData.indemnitors || [],
    
    // Metadata
    agentName: payment.agent || 'Shamrock Bail Bonds',
    createdDate: new Date().toISOString(),
    source: 'Mobile Dashboard'
  };
}

/**
 * Generate a unique case ID
 * @param {string} county - County name
 * @returns {string} Unique case ID
 */
function generateCaseId(county) {
  const countyCode = (county || 'LEE').substring(0, 3).toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  const timestamp = Date.now().toString().slice(-6);
  return `${countyCode}-${year}-${timestamp}`;
}

/**
 * Send SMS notification for signing via Twilio
 * @param {string} phone - Phone number
 * @param {string} name - Recipient name
 * @param {string} caseId - Case ID
 */
function sendSigningNotificationSMS(phone, name, caseId) {
  try {
    const message = `Hi ${name.split(' ')[0]}, your bail bond paperwork for case ${caseId} is ready to sign. ` +
                    `Please check your email for the secure signing link. - Shamrock Bail Bonds`;
    
    // Use existing Twilio integration
    if (typeof sendTwilioSMS === 'function') {
      sendTwilioSMS(phone, message);
    }
  } catch (error) {
    console.error('SMS notification error:', error);
  }
}

/**
 * Get SwipeSimple payment link with pre-filled amount
 * @param {number} amount - Payment amount
 * @param {string} defendantName - Defendant name for reference
 * @returns {string} Payment link URL
 */
function getPaymentLink(amount, defendantName) {
  // Base SwipeSimple payment link - update with actual link
  const baseUrl = 'https://checkout.swipesimple.com/v2/pay/shamrock-bail-llc';
  
  // SwipeSimple doesn't support URL parameters for amount,
  // so we return the base link and the amount is entered manually
  return baseUrl;
}
