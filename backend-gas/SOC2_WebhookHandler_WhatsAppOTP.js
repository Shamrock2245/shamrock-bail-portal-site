/**
 * ============================================================================
 * SOC2_WebhookHandler - WhatsApp OTP Endpoints Addition
 * ============================================================================
 * 
 * ADD THESE HANDLERS TO THE EXISTING SOC2_WebhookHandler.js
 * 
 * Insert in the doPost() function's switch statement:
 * ============================================================================
 */

// ADD TO doPost() SWITCH STATEMENT:

case 'whatsapp_send_otp':
    // Handle WhatsApp OTP send request from Wix frontend
    try {
        const requestData = JSON.parse(e.postData.contents);
        const phoneNumber = requestData.phoneNumber;
        
        if (!phoneNumber) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: 'Phone number is required'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const result = WA_sendOTP(phoneNumber);
        
        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        console.error('Error in whatsapp_send_otp:', error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            message: 'Failed to send OTP'
        })).setMimeType(ContentService.MimeType.JSON);
    }

case 'whatsapp_validate_otp':
    // Handle WhatsApp OTP validation request from Wix frontend
    try {
        const requestData = JSON.parse(e.postData.contents);
        const phoneNumber = requestData.phoneNumber;
        const otpCode = requestData.otpCode;
        
        if (!phoneNumber || !otpCode) {
            return ContentService.createTextOutput(JSON.stringify({
                valid: false,
                error: 'Phone number and OTP code are required'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const result = WA_validateOTP(phoneNumber, otpCode);
        
        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        console.error('Error in whatsapp_validate_otp:', error);
        return ContentService.createTextOutput(JSON.stringify({
            valid: false,
            error: 'Failed to validate OTP'
        })).setMimeType(ContentService.MimeType.JSON);
    }

case 'whatsapp_resend_otp':
    // Handle WhatsApp OTP resend request from Wix frontend
    try {
        const requestData = JSON.parse(e.postData.contents);
        const phoneNumber = requestData.phoneNumber;
        
        if (!phoneNumber) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: 'Phone number is required'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const result = WA_resendOTP(phoneNumber);
        
        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        console.error('Error in whatsapp_resend_otp:', error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            message: 'Failed to resend OTP'
        })).setMimeType(ContentService.MimeType.JSON);
    }

/**
 * ============================================================================
 * FULL EXAMPLE OF UPDATED doPost() FUNCTION:
 * ============================================================================
 */

function doPost(e) {
    try {
        const action = e.parameter.action || e.parameter.source;
        
        console.log('📥 Incoming webhook:', action);
        
        switch (action) {
            case 'signnow':
                return handleSignNowWebhook(e);
                
            case 'whatsapp':
                return handleWhatsAppWebhook(e);
                
            case 'whatsapp_send_otp':
                return handleWhatsAppSendOTP(e);
                
            case 'whatsapp_validate_otp':
                return handleWhatsAppValidateOTP(e);
                
            case 'whatsapp_resend_otp':
                return handleWhatsAppResendOTP(e);
                
            case 'wix_intake':
                return handleWixIntakeSubmission(e);
                
            default:
                console.warn('⚠️ Unknown webhook action:', action);
                return ContentService.createTextOutput(JSON.stringify({
                    success: false,
                    message: 'Unknown action'
                })).setMimeType(ContentService.MimeType.JSON);
        }
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle WhatsApp OTP send request
 */
function handleWhatsAppSendOTP(e) {
    try {
        const requestData = JSON.parse(e.postData.contents);
        const phoneNumber = requestData.phoneNumber;
        
        if (!phoneNumber) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: 'Phone number is required'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const result = WA_sendOTP(phoneNumber);
        
        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        console.error('Error in handleWhatsAppSendOTP:', error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            message: 'Failed to send OTP'
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle WhatsApp OTP validation request
 */
function handleWhatsAppValidateOTP(e) {
    try {
        const requestData = JSON.parse(e.postData.contents);
        const phoneNumber = requestData.phoneNumber;
        const otpCode = requestData.otpCode;
        
        if (!phoneNumber || !otpCode) {
            return ContentService.createTextOutput(JSON.stringify({
                valid: false,
                error: 'Phone number and OTP code are required'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const result = WA_validateOTP(phoneNumber, otpCode);
        
        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        console.error('Error in handleWhatsAppValidateOTP:', error);
        return ContentService.createTextOutput(JSON.stringify({
            valid: false,
            error: 'Failed to validate OTP'
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle WhatsApp OTP resend request
 */
function handleWhatsAppResendOTP(e) {
    try {
        const requestData = JSON.parse(e.postData.contents);
        const phoneNumber = requestData.phoneNumber;
        
        if (!phoneNumber) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: 'Phone number is required'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const result = WA_resendOTP(phoneNumber);
        
        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        console.error('Error in handleWhatsAppResendOTP:', error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            message: 'Failed to resend OTP'
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
