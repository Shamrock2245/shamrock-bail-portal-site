/**
 * PaymentService.js
 * 
 * Handles payment link generation and delivery for Shamrock Bail Bonds
 * Integrates with:
 * 1. SwipeSimple (Payment Processing)
 * 2. WhatsApp Cloud API (Link Delivery)
 * 3. SignNow Webhooks (Trigger on signature completion)
 * 
 * Version: 1.0.0
 * Date: 2026-02-19
 */

// =============================================================================
// PAYMENT CONFIGURATION
// =============================================================================

function getPaymentConfig() {
  const scriptProps = PropertiesService.getScriptProperties();
  
  return {
    // SwipeSimple configuration
    swipeSimpleBaseUrl: scriptProps.getProperty('SWIPESIMPLE_BASE_URL') || 'https://swipesimple.com/links',
    swipeSimpleApiKey: scriptProps.getProperty('SWIPESIMPLE_API_KEY') || '',
    
    // Payment settings
    processingFee: 25, // Fixed processing fee
    minimumPayment: 50, // Minimum payment amount
    
    // Payment link expiration
    linkExpirationHours: 48 // 48 hours to complete payment
  };
}

// =============================================================================
// PAYMENT CALCULATION
// =============================================================================

/**
 * Calculate total payment amount
 * @param {object} caseData - Case information with bondAmount
 * @returns {object} - { premium: number, processingFee: number, total: number }
 */
function calculatePaymentAmount(caseData) {
  const bondAmount = parseFloat(caseData.bondAmount || caseData.Bond_Amount || 0);
  
  if (bondAmount <= 0) {
    throw new Error('Invalid bond amount');
  }
  
  // Premium calculation (10% of bond amount in Florida)
  const premium = bondAmount * 0.10;
  
  // Processing fee
  const config = getPaymentConfig();
  const processingFee = config.processingFee;
  
  // Total
  const total = premium + processingFee;
  
  return {
    bondAmount: bondAmount,
    premium: premium,
    processingFee: processingFee,
    total: total
  };
}

// =============================================================================
// PAYMENT LINK GENERATION
// =============================================================================

/**
 * Generate SwipeSimple payment link
 * @param {object} caseData - Case information
 * @param {object} amounts - Payment amounts from calculatePaymentAmount()
 * @returns {string} - Payment link URL
 */
function generatePaymentLink(caseData, amounts) {
  const config = getPaymentConfig();
  
  // Generate unique reference
  const reference = `${caseData.caseNumber || 'CASE'}_${new Date().getTime()}`;
  
  // Build payment link
  // Note: SwipeSimple link format may vary - adjust based on actual API
  const params = {
    amount: amounts.total.toFixed(2),
    reference: reference,
    description: `Bail Bond - ${caseData.defendantName || 'Defendant'}`,
    customer_email: caseData.indemnitorEmail || '',
    customer_phone: caseData.indemnitorPhone || ''
  };
  
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const paymentLink = `${config.swipeSimpleBaseUrl}?${queryString}`;
  
  console.log(`Payment link generated: ${paymentLink}`);
  
  return paymentLink;
}

// =============================================================================
// WHATSAPP DELIVERY
// =============================================================================

/**
 * Send payment link via WhatsApp
 * @param {string} phoneNumber - Recipient's phone number
 * @param {object} caseData - Case information
 * @param {object} amounts - Payment amounts
 * @param {string} paymentLink - Payment link URL
 * @returns {object} - { success: boolean, message: string }
 */
function sendPaymentLinkViaWhatsApp(phoneNumber, caseData, amounts, paymentLink) {
  try {
    const whatsapp = new WhatsAppCloudAPI();
    
    const message = `✅ **Signature received!** Thank you for signing.

Now for payment. Here's the breakdown:

**Bond Amount:** $${amounts.bondAmount.toLocaleString()}
**Premium (10%):** $${amounts.premium.toFixed(2)}
**Processing Fee:** $${amounts.processingFee.toFixed(2)}
**───────────────**
**Total Due:** $${amounts.total.toFixed(2)}

💳 **Pay securely here:**
${paymentLink}

**We accept:**
✓ Credit/Debit cards
✓ Apple Pay
✓ Google Pay

Once payment clears, ${caseData.defendantName || 'the defendant'} can be released within 1-2 hours.

⏰ This link expires in 48 hours.

Questions? Just reply!`;
    
    const result = whatsapp.sendText(phoneNumber, message);
    
    if (result && result.success !== false) {
      // Log for compliance
      logProcessingEvent('PAYMENT_LINK_SENT', {
        caseNumber: caseData.caseNumber,
        phoneNumber: phoneNumber,
        amount: amounts.total,
        paymentLink: paymentLink,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: 'Payment link sent via WhatsApp'
      };
    } else {
      return {
        success: false,
        message: 'Failed to send WhatsApp message'
      };
    }
    
  } catch (e) {
    console.error('Error sending payment link:', e);
    return {
      success: false,
      message: e.message
    };
  }
}

// =============================================================================
// MAIN PAYMENT FLOW
// =============================================================================

/**
 * Process payment link generation and delivery
 * Called after indemnitor signs documents
 * 
 * @param {object} caseData - Case information
 * @returns {object} - { success: boolean, paymentLink: string, message: string }
 */
function processPaymentLink(caseData) {
  console.log(`Processing payment link for case: ${caseData.caseNumber}`);
  
  try {
    // 1. Validate case data
    if (!caseData.caseNumber) {
      throw new Error('Case number is required');
    }
    
    if (!caseData.indemnitorPhone && !caseData.phoneNumber) {
      throw new Error('Indemnitor phone number is required');
    }
    
    // 2. Calculate payment amounts
    const amounts = calculatePaymentAmount(caseData);
    
    // 3. Generate payment link
    const paymentLink = generatePaymentLink(caseData, amounts);
    
    // 4. Send via WhatsApp
    const phoneNumber = caseData.indemnitorPhone || caseData.phoneNumber;
    const deliveryResult = sendPaymentLinkViaWhatsApp(phoneNumber, caseData, amounts, paymentLink);
    
    // 5. Store payment link in case record
    storePaymentLink(caseData.caseNumber, paymentLink, amounts);
    
    return {
      success: deliveryResult.success,
      paymentLink: paymentLink,
      amounts: amounts,
      message: deliveryResult.message
    };
    
  } catch (e) {
    console.error('Payment link processing error:', e);
    return {
      success: false,
      message: e.message
    };
  }
}

/**
 * Store payment link in case record (Sheets or Drive)
 */
function storePaymentLink(caseNumber, paymentLink, amounts) {
  try {
    // Store in Script Properties for quick lookup
    const props = PropertiesService.getScriptProperties();
    const paymentData = {
      caseNumber: caseNumber,
      paymentLink: paymentLink,
      amounts: amounts,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    props.setProperty(`payment_${caseNumber}`, JSON.stringify(paymentData));
    
    console.log(`Payment link stored for case: ${caseNumber}`);
    
  } catch (e) {
    console.error('Error storing payment link:', e);
  }
}

/**
 * Retrieve payment link for a case
 */
function getPaymentLink(caseNumber) {
  try {
    const props = PropertiesService.getScriptProperties();
    const data = props.getProperty(`payment_${caseNumber}`);
    
    if (data) {
      return JSON.parse(data);
    }
    
    return null;
    
  } catch (e) {
    console.error('Error retrieving payment link:', e);
    return null;
  }
}

/**
 * Mark payment as completed
 * Called by payment webhook
 */
function markPaymentComplete(caseNumber, transactionId) {
  try {
    const paymentData = getPaymentLink(caseNumber);
    
    if (paymentData) {
      paymentData.status = 'completed';
      paymentData.transactionId = transactionId;
      paymentData.completedAt = new Date().toISOString();
      
      const props = PropertiesService.getScriptProperties();
      props.setProperty(`payment_${caseNumber}`, JSON.stringify(paymentData));
      
      // Log for compliance
      logProcessingEvent('PAYMENT_COMPLETED', {
        caseNumber: caseNumber,
        transactionId: transactionId,
        amount: paymentData.amounts.total,
        timestamp: new Date().toISOString()
      });
      
      // Trigger next step (ID verification request)
      triggerIdVerificationRequest(caseNumber, paymentData);
      
      console.log(`Payment marked complete: ${caseNumber}`);
      return true;
    }
    
    return false;
    
  } catch (e) {
    console.error('Error marking payment complete:', e);
    return false;
  }
}

/**
 * Trigger ID verification request after payment
 */
function triggerIdVerificationRequest(caseNumber, paymentData) {
  try {
    // Get case data to find phone number
    const phoneNumber = paymentData.phoneNumber || findPhoneNumberByCase(caseNumber);
    
    if (phoneNumber && typeof requestPhotoUpload === 'function') {
      requestPhotoUpload(phoneNumber, caseNumber);
    }
    
  } catch (e) {
    console.error('Error triggering ID verification:', e);
  }
}

/**
 * Find phone number by case number
 */
function findPhoneNumberByCase(caseNumber) {
  // Try to find from conversation state or Sheets
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID || '');
    const sheet = ss.getSheetByName('Bookings');
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === caseNumber) {
          // Assuming phone is in a specific column - adjust as needed
          return data[i][5]; // Adjust column index
        }
      }
    }
  } catch (e) {
    console.warn('Could not find phone number:', e);
  }
  
  return null;
}

// =============================================================================
// PAYMENT REMINDERS
// =============================================================================

/**
 * Send payment reminder if not completed within X hours
 */
function sendPaymentReminder(caseNumber) {
  try {
    const paymentData = getPaymentLink(caseNumber);
    
    if (!paymentData || paymentData.status === 'completed') {
      return;
    }
    
    const phoneNumber = paymentData.phoneNumber || findPhoneNumberByCase(caseNumber);
    if (!phoneNumber) {
      console.warn(`No phone number found for case: ${caseNumber}`);
      return;
    }
    
    const whatsapp = new WhatsAppCloudAPI();
    
    const message = `👋 Hi! This is a friendly reminder about your bail bond payment.

**Total Due:** $${paymentData.amounts.total.toFixed(2)}

💳 **Pay here:**
${paymentData.paymentLink}

Once payment clears, we can proceed with the release process.

Questions? Just reply!`;
    
    whatsapp.sendText(phoneNumber, message);
    
    logProcessingEvent('PAYMENT_REMINDER_SENT', {
      caseNumber: caseNumber,
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Payment reminder sent for case: ${caseNumber}`);
    
  } catch (e) {
    console.error('Error sending payment reminder:', e);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Functions are global in GAS - no explicit exports needed
