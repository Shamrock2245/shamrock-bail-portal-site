/**
 * Shamrock Bail Bonds - Data Validator
 * Strictly enforces the "Sacred" 34-Column Schema
 * 
 * File: public/data-validator.js
 */

/**
 * Validates an arrest record against the 34-column schema
 * @param {Object} record - The record to validate
 * @returns {Object} - { isValid: boolean, errors: Array, cleanRecord: Object }
 */
export function validateArrestRecord(record) {
    const errors = [];
    const schema = get34ColumnSchema();

    // Check if record is provided
    if (!record || typeof record !== 'object') {
        return { isValid: false, errors: ['Record is missing or invalid type'], cleanRecord: null };
    }

    // 1. Check for Primary Key
    if (!record.Booking_Number || String(record.Booking_Number).trim() === '') {
        errors.push('CRITICAL: Missing Booking_Number (Primary Key)');
    }

    if (!record.County || String(record.County).trim() === '') {
        errors.push('CRITICAL: Missing County');
    }

    // 2. Validate Column Alignment (Conceptual for AI Agents)
    // In practice, we ensure all 34 fields are present and typed correctly
    const cleanRecord = {};

    schema.forEach(field => {
        const value = record[field.name];

        // Type Enforcement
        if (field.type === 'Number') {
            const num = Number(String(value).replace(/[^0-9.-]+/g, ""));
            cleanRecord[field.name] = isNaN(num) ? 0 : num;
        } else if (field.type === 'Date') {
            const date = new Date(value);
            cleanRecord[field.name] = isNaN(date.getTime()) ? new Date() : date;
        } else {
            cleanRecord[field.name] = value ? String(value).trim() : '';
        }

        // Mandatory checks for non-PK but essential fields
        if (field.required && !cleanRecord[field.name]) {
            errors.push(`Missing required field: ${field.name}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        cleanRecord
    };
}

/**
 * Returns the formal definition of the 34-column schema
 */
export function get34ColumnSchema() {
    return [
        { index: 1, name: 'Scrape_Timestamp', type: 'Date', required: true },
        { index: 2, name: 'County', type: 'String', required: true },
        { index: 3, name: 'Booking_Number', type: 'String', required: true },
        { index: 4, name: 'Person_ID', type: 'String', required: false },
        { index: 5, name: 'Full_Name', type: 'String', required: true },
        { index: 6, name: 'First_Name', type: 'String', required: false },
        { index: 7, name: 'Middle_Name', type: 'String', required: false },
        { index: 8, name: 'Last_Name', type: 'String', required: false },
        { index: 9, name: 'DOB', type: 'String', required: false },
        { index: 10, name: 'Booking_Date', type: 'String', required: true },
        { index: 11, name: 'Booking_Time', type: 'String', required: false },
        { index: 12, name: 'Status', type: 'String', required: true },
        { index: 13, name: 'Facility', type: 'String', required: false },
        { index: 14, name: 'Race', type: 'String', required: false },
        { index: 15, name: 'Sex', type: 'String', required: false },
        { index: 16, name: 'Height', type: 'String', required: false },
        { index: 17, name: 'Weight', type: 'String', required: false },
        { index: 18, name: 'Address', type: 'String', required: false },
        { index: 19, name: 'City', type: 'String', required: false },
        { index: 20, name: 'State', type: 'String', required: false },
        { index: 21, name: 'ZIP', type: 'String', required: false },
        { index: 22, name: 'Mugshot_URL', type: 'String', required: false },
        { index: 23, name: 'Charges', type: 'String', required: true },
        { index: 24, name: 'Bond_Amount', type: 'Number', required: true },
        { index: 25, name: 'Bond_Paid', type: 'String', required: false },
        { index: 26, name: 'Bond_Type', type: 'String', required: false },
        { index: 27, name: 'Court_Type', type: 'String', required: false },
        { index: 28, name: 'Case_Number', type: 'String', required: false },
        { index: 29, name: 'Court_Date', type: 'String', required: false },
        { index: 30, name: 'Court_Time', type: 'String', required: false },
        { index: 31, name: 'Court_Location', type: 'String', required: false },
        { index: 32, name: 'Detail_URL', type: 'String', required: false },
        { index: 33, name: 'Lead_Score', type: 'Number', required: true },
        { index: 34, name: 'Lead_Status', type: 'String', required: true }
    ];
}
