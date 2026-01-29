/**
 * normalize-frontmatter.js
 * 
 * Purpose: Sanitize and standardize user input from Wix Forms before sending to GAS.
 * This ensures "John Doe" and "john doe" and "JOHN DOE" all become "John Doe".
 * 
 * usage: import { normalizeIntakeData } from 'public/scripts/normalize-frontmatter';
 */

/**
 * Normalizes an entire Intake Payload
 * @param {Object} rawData - The raw form data from collectIntakeFormData()
 * @returns {Object} - Clean, standardized data ready for GAS
 */
export function normalizeIntakeData(rawData) {
    if (!rawData) return {};

    const cleanData = { ...rawData };

    // 1. Title Case Names (Fixes "john doe" -> "John Doe")
    const nameFields = [
        'defendantName', 'defendantFirstName', 'defendantLastName',
        'indemnitorName', 'indemnitorFirstName', 'indemnitorLastName', 'indemnitorMiddleName',
        'reference1Name', 'reference2Name', 'indemnitorSupervisorName'
    ];

    nameFields.forEach(field => {
        if (cleanData[field]) {
            cleanData[field] = toTitleCase(cleanData[field]);
        }
    });

    // 2. Normalize Emails (Lowercase, trim)
    const emailFields = ['defendantEmail', 'indemnitorEmail'];
    emailFields.forEach(field => {
        if (cleanData[field]) {
            cleanData[field] = cleanData[field].toLowerCase().trim();
        }
    });

    // 3. Standardize Phone Numbers (Strip non-numeric for storage, or keep format?)
    // Decision: Keep format (###) ###-#### for readability in PDF, but strip for internal logic if needed.
    // For now, we trust the frontend mask, but ensure no trailing spaces.
    const phoneFields = [
        'defendantPhone', 'indemnitorPhone',
        'reference1Phone', 'reference2Phone',
        'indemnitorEmployerPhone', 'indemnitorSupervisorPhone'
    ];

    phoneFields.forEach(field => {
        if (cleanData[field]) {
            cleanData[field] = cleanData[field].trim();
        }
    });

    // 4. Address Standardization (Uppercase State)
    if (cleanData.indemnitorState) {
        cleanData.indemnitorState = cleanData.indemnitorState.toUpperCase().slice(0, 2);
    }
    if (cleanData.reference1State) {
        cleanData.reference1State = cleanData.reference1State.toUpperCase().slice(0, 2);
    }
    if (cleanData.reference2State) {
        cleanData.reference2State = cleanData.reference2State.toUpperCase().slice(0, 2);
    }

    return cleanData;
}

/**
 * Helper: Convert string to Title Case
 */
function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
