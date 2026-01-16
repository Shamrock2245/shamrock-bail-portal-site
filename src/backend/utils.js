import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

/**
 * Get Google Apps Script Web App URL from Secrets
 */
export async function getGasUrl() {
    try {
        const url = await getSecret('GAS_WEB_APP_URL');
        if (!url) throw new Error('GAS_WEB_APP_URL secret not found');
        return url;
    } catch (error) {
        console.error('Error getting GAS URL:', error);
        throw error;
    }
}

/**
 * Fetch with exponential backoff retry
 * @param {string} url 
 * @param {Object} options 
 * @param {number} retries 
 */
export async function fetchWithRetry(url, options = {}, retries = 3) {
    try {
        const response = await fetch(url, options);

        // If 5xx error or rate limit, retry
        if (!response.ok && (response.status >= 500 || response.status === 429) && retries > 0) {
            console.warn(`Request failed (${response.status}), retrying... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
            return fetchWithRetry(url, options, retries - 1);
        }

        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Network error, retrying... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}
