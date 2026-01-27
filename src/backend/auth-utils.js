import crypto from 'crypto';

/**
 * Generate a secure random token
 * @param {number} length - Token length
 * @returns {string} - Random token
 */
export function generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

/**
 * Hash a password using SHA-256
 * @param {string} password 
 * @returns {string} - Hashed password
 */
export function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify a password against a hash
 * @param {string} password 
 * @param {string} hash 
 * @returns {boolean}
 */
export function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}
