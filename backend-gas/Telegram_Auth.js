/**
 * ============================================================================
 * Telegram_Auth.js
 * ============================================================================
 * Telegram OTP Authentication System
 * 
 * Provides secure one-time password authentication via Telegram.
 * Works alongside existing email magic link authentication.
 * 
 * Flow:
 * 1. User enters Telegram number on portal
 * 2. System generates 6-digit OTP
 * 3. OTP sent via Telegram authentication template
 * 4. User enters OTP on portal
 * 5. System validates and creates session
 * 
 * Dependencies:
 * - Telegram_CloudAPI.js
 * - portal-auth.jsw (for session creation)
 * ============================================================================
 */

/**
 * Generate a random OTP code
 * @param {number} length - Length of OTP (default: 6)
 * @return {string} OTP code
 */
function generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        otp += digits.charAt(randomIndex);
    }
    return otp;
}

/**
 * Send Telegram OTP to user
 * @param {string} phoneNumber - User's Telegram number
 * @return {Object} Result object with success status
 */
function TG_sendOTP(phoneNumber) {
    try {
        // Validate phone number
        if (!phoneNumber || phoneNumber.trim() === '') {
            return {
                success: false,
                message: 'Phone number is required'
            };
        }

        // Format phone number
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        // Generate OTP
        const otp = generateOTP(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        
        console.log(`📱 Generating OTP for ${formattedPhone}: ${otp}`);
        
        // Store OTP in cache (10 minute TTL)
        const cache = CacheService.getScriptCache();
        const cacheKey = `telegram_otp:${formattedPhone}`;
        const otpData = {
            code: otp,
            expires: expiresAt.getTime(),
            attempts: 0
        };
        
        cache.put(cacheKey, JSON.stringify(otpData), 600); // 10 minutes
        
        // Send OTP via Telegram
        const telegram = new TelegramBotAPI();
        const result = telegram.sendAuthenticationOTP(formattedPhone, otp);
        
        if (result.success) {
            console.log(`✅ OTP sent successfully to ${formattedPhone}`);
            
            // Log to Slack for monitoring
            try {
                NotificationService.notifySlack('SLACK_WEBHOOK_ALERTS', {
                    text: `📱 Telegram OTP sent to ${maskPhoneNumber(formattedPhone)}`
                });
            } catch (e) {
                console.warn('Could not send Slack notification:', e);
            }
            
            return {
                success: true,
                message: 'OTP sent to Telegram',
                expiresIn: 600 // seconds
            };
        } else {
            console.error(`❌ Failed to send OTP: ${result.message}`);
            return {
                success: false,
                message: result.message || 'Failed to send OTP'
            };
        }
        
    } catch (error) {
        console.error('❌ Error in TG_sendOTP:', error);
        return {
            success: false,
            message: 'System error. Please try again.'
        };
    }
}

/**
 * Validate Telegram OTP and create session
 * @param {string} phoneNumber - User's Telegram number
 * @param {string} otpCode - OTP code entered by user
 * @return {Object} Result with session token if valid
 */
function TG_validateOTP(phoneNumber, otpCode) {
    try {
        // Validate inputs
        if (!phoneNumber || !otpCode) {
            return {
                valid: false,
                error: 'Phone number and OTP code are required'
            };
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);
        const cache = CacheService.getScriptCache();
        const cacheKey = `telegram_otp:${formattedPhone}`;
        
        // Retrieve stored OTP
        const storedData = cache.get(cacheKey);
        
        if (!storedData) {
            console.warn(`⚠️ OTP not found or expired for ${formattedPhone}`);
            return {
                valid: false,
                error: 'OTP expired or not found. Please request a new code.'
            };
        }
        
        const otpData = JSON.parse(storedData);
        
        // Check expiration
        if (Date.now() > otpData.expires) {
            cache.remove(cacheKey);
            console.warn(`⚠️ OTP expired for ${formattedPhone}`);
            return {
                valid: false,
                error: 'OTP has expired. Please request a new code.'
            };
        }
        
        // Check attempt limit (prevent brute force)
        if (otpData.attempts >= 5) {
            cache.remove(cacheKey);
            console.warn(`⚠️ Too many attempts for ${formattedPhone}`);
            return {
                valid: false,
                error: 'Too many attempts. Please request a new code.'
            };
        }
        
        // Validate OTP code
        if (otpData.code !== otpCode.trim()) {
            // Increment attempts
            otpData.attempts++;
            cache.put(cacheKey, JSON.stringify(otpData), 600);
            
            console.warn(`⚠️ Invalid OTP for ${formattedPhone}. Attempts: ${otpData.attempts}`);
            return {
                valid: false,
                error: 'Invalid code. Please try again.',
                attemptsRemaining: 5 - otpData.attempts
            };
        }
        
        // OTP is valid! Clear it from cache
        cache.remove(cacheKey);
        
        console.log(`✅ OTP validated successfully for ${formattedPhone}`);
        
        // Find or create user in Wix CMS
        const user = findOrCreateUserByPhone(formattedPhone);
        
        if (!user) {
            return {
                valid: false,
                error: 'Failed to create user account. Please try again.'
            };
        }
        
        // Create session token
        const sessionToken = createCustomSession(user.email, user.role, user.userId);
        
        // Log successful login
        try {
            NotificationService.notifySlack('SLACK_WEBHOOK_ALERTS', {
                text: `✅ Telegram login successful: ${maskPhoneNumber(formattedPhone)} (${user.role})`
            });
        } catch (e) {
            console.warn('Could not send Slack notification:', e);
        }
        
        return {
            valid: true,
            sessionToken: sessionToken,
            role: user.role,
            email: user.email,
            userId: user.userId
        };
        
    } catch (error) {
        console.error('❌ Error in TG_validateOTP:', error);
        return {
            valid: false,
            error: 'System error. Please try again.'
        };
    }
}

/**
 * Find or create user by phone number
 * @param {string} phoneNumber - Formatted phone number
 * @return {Object} User object with email, role, userId
 */
function findOrCreateUserByPhone(phoneNumber) {
    try {
        // Check if user exists in IntakeQueue or Sessions collection
        // For now, create a simple user record
        // TODO: Integrate with Wix CMS collections
        
        const email = `${phoneNumber.replace(/\D/g, '')}@telegram.shamrock.local`;
        const role = 'indemnitor'; // Default role for Telegram users
        const userId = Utilities.getUuid();
        
        console.log(`👤 User created/found: ${email} (${role})`);
        
        return {
            email: email,
            role: role,
            userId: userId,
            phone: phoneNumber,
            loginMethod: 'telegram_otp'
        };
        
    } catch (error) {
        console.error('❌ Error in findOrCreateUserByPhone:', error);
        return null;
    }
}

/**
 * Create custom session token
 * @param {string} email - User email
 * @param {string} role - User role
 * @param {string} userId - User ID
 * @return {string} Session token
 */
function createCustomSession(email, role, userId) {
    const sessionData = {
        email: email,
        role: role,
        userId: userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    // Generate secure token
    const token = Utilities.base64Encode(
        Utilities.computeDigest(
            Utilities.DigestAlgorithm.SHA_256,
            JSON.stringify(sessionData) + Date.now() + Math.random()
        )
    ).replace(/[^a-zA-Z0-9]/g, '');
    
    // Store session in cache (7 days)
    const cache = CacheService.getScriptCache();
    cache.put(`session:${token}`, JSON.stringify(sessionData), 21600); // 6 hours (max cache TTL)
    
    // Also store in Script Properties for longer persistence
    const props = PropertiesService.getScriptProperties();
    props.setProperty(`session:${token}`, JSON.stringify(sessionData));
    
    console.log(`🔑 Session created for ${email}: ${token.substring(0, 10)}...`);
    
    return token;
}

/**
 * Format phone number to E.164
 * @param {string} phone - Phone number in any format
 * @return {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    let cleaned = phone.toString().replace(/\D/g, '');
    
    if (cleaned.length === 10) {
        cleaned = '1' + cleaned;
    }
    
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    
    return cleaned;
}

/**
 * Mask phone number for logging (privacy)
 * @param {string} phone - Phone number
 * @return {string} Masked phone number
 */
function maskPhoneNumber(phone) {
    if (phone.length < 4) return '****';
    return phone.substring(0, phone.length - 4).replace(/\d/g, '*') + phone.substring(phone.length - 4);
}

/**
 * Resend OTP (with rate limiting)
 * @param {string} phoneNumber - User's Telegram number
 * @return {Object} Result object
 */
function TG_resendOTP(phoneNumber) {
    try {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        const cache = CacheService.getScriptCache();
        const rateLimitKey = `otp_ratelimit:${formattedPhone}`;
        
        // Check rate limit (max 3 OTPs per 15 minutes)
        const rateLimitData = cache.get(rateLimitKey);
        if (rateLimitData) {
            const data = JSON.parse(rateLimitData);
            if (data.count >= 3) {
                return {
                    success: false,
                    message: 'Too many requests. Please wait 15 minutes before requesting another code.'
                };
            }
            data.count++;
            cache.put(rateLimitKey, JSON.stringify(data), 900); // 15 minutes
        } else {
            cache.put(rateLimitKey, JSON.stringify({ count: 1 }), 900);
        }
        
        // Send new OTP
        return TG_sendOTP(phoneNumber);
        
    } catch (error) {
        console.error('❌ Error in TG_resendOTP:', error);
        return {
            success: false,
            message: 'System error. Please try again.'
        };
    }
}
