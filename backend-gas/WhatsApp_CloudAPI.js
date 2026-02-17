/**
 * ============================================================================
 * WhatsApp_CloudAPI.js
 * ============================================================================
 * Direct WhatsApp Cloud API Integration (No Twilio Dependency)
 * 
 * Replaces Twilio-based WhatsApp messaging with direct Meta Graph API calls.
 * Supports:
 * - Text messages
 * - Media messages (audio, images, documents)
 * - Authentication templates (OTP)
 * - Interactive messages
 * 
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * SETUP REQUIRED:
 * 1. Create Meta Developer App with WhatsApp Business use case
 * 2. Generate System User permanent access token
 * 3. Set Script Properties:
 *    - WHATSAPP_ACCESS_TOKEN
 *    - WHATSAPP_PHONE_NUMBER_ID
 *    - WHATSAPP_BUSINESS_ACCOUNT_ID
 * ============================================================================
 */

class WhatsAppCloudAPI {
    constructor() {
        const props = PropertiesService.getScriptProperties();
        this.accessToken = props.getProperty('WHATSAPP_ACCESS_TOKEN');
        this.phoneNumberId = props.getProperty('WHATSAPP_PHONE_NUMBER_ID');
        this.businessAccountId = props.getProperty('WHATSAPP_BUSINESS_ACCOUNT_ID');
        this.apiVersion = 'v23.0'; // Latest stable version
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    }

    /**
     * Validate that required credentials are configured
     */
    isConfigured() {
        return !!(this.accessToken && this.phoneNumberId);
    }

    /**
     * Send a text message
     * @param {string} to - Recipient phone number (E.164 format)
     * @param {string} text - Message text
     * @param {boolean} previewUrl - Enable URL preview (default: false)
     * @return {Object} API response
     */
    sendText(to, text, previewUrl = false) {
        if (!this.isConfigured()) {
            throw new Error('WhatsApp Cloud API not configured. Missing access token or phone number ID.');
        }

        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: this._formatPhoneNumber(to),
            type: 'text',
            text: {
                preview_url: previewUrl,
                body: text
            }
        };

        return this._makeRequest(url, payload);
    }

    /**
     * Send an audio message (voice note)
     * @param {string} to - Recipient phone number
     * @param {string} audioUrl - Public URL to audio file (MP3, OGG)
     * @return {Object} API response
     */
    sendAudio(to, audioUrl) {
        if (!this.isConfigured()) {
            throw new Error('WhatsApp Cloud API not configured.');
        }

        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: 'whatsapp',
            to: this._formatPhoneNumber(to),
            type: 'audio',
            audio: {
                link: audioUrl
            }
        };

        return this._makeRequest(url, payload);
    }

    /**
     * Send an image message
     * @param {string} to - Recipient phone number
     * @param {string} imageUrl - Public URL to image file
     * @param {string} caption - Optional caption
     * @return {Object} API response
     */
    sendImage(to, imageUrl, caption = null) {
        if (!this.isConfigured()) {
            throw new Error('WhatsApp Cloud API not configured.');
        }

        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: 'whatsapp',
            to: this._formatPhoneNumber(to),
            type: 'image',
            image: {
                link: imageUrl
            }
        };

        if (caption) {
            payload.image.caption = caption;
        }

        return this._makeRequest(url, payload);
    }

    /**
     * Send an authentication template (OTP)
     * @param {string} to - Recipient phone number
     * @param {string} otpCode - One-time password code
     * @param {string} templateName - Template name (must be pre-approved)
     * @return {Object} API response
     */
    sendAuthenticationOTP(to, otpCode, templateName = 'shamrock_otp') {
        if (!this.isConfigured()) {
            throw new Error('WhatsApp Cloud API not configured.');
        }

        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: 'whatsapp',
            to: this._formatPhoneNumber(to),
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: 'en_US'
                },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            {
                                type: 'text',
                                text: otpCode
                            }
                        ]
                    },
                    {
                        type: 'button',
                        sub_type: 'url',
                        index: 0,
                        parameters: [
                            {
                                type: 'text',
                                text: otpCode
                            }
                        ]
                    }
                ]
            }
        };

        return this._makeRequest(url, payload);
    }

    /**
     * Mark a message as read
     * @param {string} messageId - WhatsApp message ID
     * @return {Object} API response
     */
    markAsRead(messageId) {
        if (!this.isConfigured()) {
            throw new Error('WhatsApp Cloud API not configured.');
        }

        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
        };

        return this._makeRequest(url, payload);
    }

    /**
     * Format phone number to E.164 standard
     * @param {string} phone - Phone number in any format
     * @return {string} E.164 formatted number
     */
    _formatPhoneNumber(phone) {
        // Remove all non-digit characters
        let cleaned = phone.toString().replace(/\D/g, '');
        
        // Add country code if missing (assume US +1)
        if (cleaned.length === 10) {
            cleaned = '1' + cleaned;
        }
        
        // Ensure it starts with +
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Make HTTP request to WhatsApp Cloud API
     * @param {string} url - API endpoint URL
     * @param {Object} payload - Request payload
     * @return {Object} Parsed response
     */
    _makeRequest(url, payload) {
        const options = {
            method: 'post',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        try {
            const response = UrlFetchApp.fetch(url, options);
            const responseCode = response.getResponseCode();
            const responseText = response.getContentText();

            if (responseCode >= 200 && responseCode < 300) {
                const data = JSON.parse(responseText);
                console.log('✅ WhatsApp API Success:', data);
                return {
                    success: true,
                    data: data,
                    messageId: data.messages ? data.messages[0].id : null
                };
            } else {
                const error = JSON.parse(responseText);
                console.error('❌ WhatsApp API Error:', error);
                return {
                    success: false,
                    error: error.error || error,
                    message: error.error?.message || 'WhatsApp API request failed'
                };
            }
        } catch (e) {
            console.error('❌ WhatsApp API Exception:', e);
            return {
                success: false,
                error: e.toString(),
                message: 'Failed to connect to WhatsApp API'
            };
        }
    }

    /**
     * Verify webhook signature (for incoming webhooks)
     * @param {string} signature - X-Hub-Signature-256 header value
     * @param {string} payload - Raw request body
     * @param {string} appSecret - WhatsApp App Secret
     * @return {boolean} True if signature is valid
     */
    static verifyWebhookSignature(signature, payload, appSecret) {
        if (!signature || !signature.startsWith('sha256=')) {
            return false;
        }

        const expectedSignature = signature.substring(7); // Remove 'sha256=' prefix
        const hmac = Utilities.computeHmacSha256Signature(payload, appSecret);
        const computedSignature = hmac.map(byte => {
            const hex = (byte & 0xFF).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');

        return computedSignature === expectedSignature;
    }
}

// ============================================================================
// GLOBAL HELPER FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * Send WhatsApp text message (simple wrapper)
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @return {Object} Result object
 */
function sendWhatsAppMessage(to, text) {
    const client = new WhatsAppCloudAPI();
    return client.sendText(to, text);
}

/**
 * Send WhatsApp audio message (voice note)
 * @param {string} to - Recipient phone number
 * @param {string} audioUrl - Public URL to audio file
 * @return {Object} Result object
 */
function sendWhatsAppAudio(to, audioUrl) {
    const client = new WhatsAppCloudAPI();
    return client.sendAudio(to, audioUrl);
}

/**
 * Send WhatsApp OTP authentication message
 * @param {string} to - Recipient phone number
 * @param {string} otpCode - 6-digit OTP code
 * @return {Object} Result object
 */
function sendWhatsAppOTP(to, otpCode) {
    const client = new WhatsAppCloudAPI();
    return client.sendAuthenticationOTP(to, otpCode);
}
