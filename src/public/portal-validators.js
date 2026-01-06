/**
 * Portal Validators Module
 * 
 * Client-side validation using JSON Schema
 * Validates form data before API submission
 * 
 * @module portal-validators
 */

import { VALIDATION_PATTERNS } from './portal-config';

// ============================================================================
// JSON Schema Definitions (from SCHEMAS.md)
// ============================================================================

/**
 * Shared schema definitions
 */
const SHARED_DEFS = {
  USState: {
    type: 'string',
    pattern: '^(A[EKLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEHINOPST]|N[CDEHJMVY]|O[HKR]|P[A]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$'
  },

  Phone: {
    type: 'string',
    pattern: '^\\+?1?[ .-]?\\(?\\d{3}\\)?[ .-]?\\d{3}[ .-]?\\d{4}$'
  },

  Address: {
    type: 'object',
    properties: {
      line1: { type: 'string', minLength: 1 },
      line2: { type: 'string' },
      city: { type: 'string', minLength: 1 },
      state: { $ref: '#/$defs/USState' },
      zip: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' }
    },
    required: ['line1', 'city', 'state', 'zip'],
    additionalProperties: false
  },

  Money: {
    type: 'number',
    minimum: 0
  }
};

/**
 * Person schema
 */
export const PERSON_SCHEMA = {
  type: 'object',
  required: ['role', 'first_name', 'last_name', 'dob'],
  properties: {
    person_id: { type: 'string' },
    role: {
      type: 'string',
      enum: ['defendant', 'indemnitor', 'coindemnitor', 'spouse', 'parent', 'reference', 'attorney']
    },
    first_name: { type: 'string', minLength: 1 },
    middle_name: { type: 'string' },
    last_name: { type: 'string', minLength: 1 },
    dob: { type: 'string', format: 'date' },
    ssn: { type: 'string', pattern: '^\\d{3}-?\\d{2}-?\\d{4}$' },
    email: { type: 'string', format: 'email' },
    phone_primary: { $ref: '#/$defs/Phone' },
    address: { $ref: '#/$defs/Address' },
    employer_name: { type: 'string' },
    employer_address: { $ref: '#/$defs/Address' },
    employer_phone: { $ref: '#/$defs/Phone' }
  },
  additionalProperties: false,
  $defs: SHARED_DEFS
};

/**
 * Case schema
 */
export const CASE_SCHEMA = {
  type: 'object',
  required: ['court_name', 'county', 'bond_amount'],
  properties: {
    case_number: { type: 'string' },
    court_name: { type: 'string', minLength: 1 },
    county: { type: 'string', minLength: 1 },
    charge_description: { type: 'string' },
    bond_amount: { $ref: '#/$defs/Money' },
    power_of_attorney_numbers: {
      type: 'array',
      items: { type: 'string' }
    },
    execution_datetime: { type: 'string', format: 'date-time' },
    agent_name: { type: 'string' },
    defendant_person_id: { type: 'string' },
    indemnitors: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  additionalProperties: false,
  $defs: SHARED_DEFS
};

// ============================================================================
// Simple Validation Functions (without AJV dependency)
// ============================================================================

/**
 * Validate data against a schema
 * Simplified validation without external dependencies
 * 
 * @param {Object} schema - JSON schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
function validateAgainstSchema(schema, data) {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    }
  }

  // Check field types and patterns
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (field in data && data[field] !== null && data[field] !== undefined) {
        const value = data[field];

        // Type validation
        if (fieldSchema.type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== fieldSchema.type) {
            errors.push({
              field,
              message: `${field} must be of type ${fieldSchema.type}`
            });
          }
        }

        // Pattern validation
        if (fieldSchema.pattern && typeof value === 'string') {
          const regex = new RegExp(fieldSchema.pattern);
          if (!regex.test(value)) {
            errors.push({
              field,
              message: `${field} format is invalid`
            });
          }
        }

        // Min length validation
        if (fieldSchema.minLength && typeof value === 'string') {
          if (value.length < fieldSchema.minLength) {
            errors.push({
              field,
              message: `${field} must be at least ${fieldSchema.minLength} characters`
            });
          }
        }

        // Enum validation
        if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
          errors.push({
            field,
            message: `${field} must be one of: ${fieldSchema.enum.join(', ')}`
          });
        }

        // Nested object validation (Address)
        if (fieldSchema.$ref === '#/$defs/Address') {
          const addressErrors = validateAddress(value);
          errors.push(...addressErrors);
        }

        // Phone validation
        if (fieldSchema.$ref === '#/$defs/Phone') {
          if (!VALIDATION_PATTERNS.PHONE.test(value)) {
            errors.push({
              field,
              message: `${field} must be a valid phone number`
            });
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate address object
 * 
 * @param {Object} address - Address object
 * @returns {Array} Array of error objects
 */
function validateAddress(address) {
  const errors = [];

  if (!address.line1 || address.line1.trim() === '') {
    errors.push({ field: 'address.line1', message: 'Street address is required' });
  }

  if (!address.city || address.city.trim() === '') {
    errors.push({ field: 'address.city', message: 'City is required' });
  }

  if (!address.state || !VALIDATION_PATTERNS.ZIP.test(address.zip)) {
    errors.push({ field: 'address.state', message: 'Valid state is required' });
  }

  if (!address.zip || !VALIDATION_PATTERNS.ZIP.test(address.zip)) {
    errors.push({ field: 'address.zip', message: 'Valid ZIP code is required' });
  }

  return errors;
}

// ============================================================================
// Field-Level Validators
// ============================================================================

/**
 * Validate email address
 * 
 * @param {string} email - Email address
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: false, message: 'Email is required' };
  }

  if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate phone number
 * 
 * @param {string} phone - Phone number
 * @returns {Object} { valid: boolean, message: string }
 */
export function validatePhone(phone) {
  if (!phone || phone.trim() === '') {
    return { valid: false, message: 'Phone number is required' };
  }

  if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
    return { valid: false, message: 'Invalid phone number format. Use (XXX) XXX-XXXX' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate SSN
 * 
 * @param {string} ssn - Social Security Number
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateSSN(ssn) {
  if (!ssn || ssn.trim() === '') {
    return { valid: false, message: 'SSN is required' };
  }

  if (!VALIDATION_PATTERNS.SSN.test(ssn)) {
    return { valid: false, message: 'Invalid SSN format. Use XXX-XX-XXXX' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate ZIP code
 * 
 * @param {string} zip - ZIP code
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateZip(zip) {
  if (!zip || zip.trim() === '') {
    return { valid: false, message: 'ZIP code is required' };
  }

  if (!VALIDATION_PATTERNS.ZIP.test(zip)) {
    return { valid: false, message: 'Invalid ZIP code format. Use XXXXX or XXXXX-XXXX' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate date
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateDate(date) {
  if (!date || date.trim() === '') {
    return { valid: false, message: 'Date is required' };
  }

  if (!VALIDATION_PATTERNS.DATE.test(date)) {
    return { valid: false, message: 'Invalid date format. Use YYYY-MM-DD' };
  }

  // Check if date is valid
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, message: 'Invalid date' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate date of birth (must be at least 18 years ago)
 * 
 * @param {string} dob - Date of birth in YYYY-MM-DD format
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateDOB(dob) {
  const dateValidation = validateDate(dob);
  if (!dateValidation.valid) {
    return dateValidation;
  }

  const birthDate = new Date(dob);
  const today = new Date();

  // Calculate age without mutation to avoid linter errors
  const yearDiff = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const isBeforeBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate());

  const currentAge = isBeforeBirthday ? yearDiff - 1 : yearDiff;

  if (currentAge < 18) {
    return { valid: false, message: 'Must be at least 18 years old' };
  }

  if (currentAge > 120) {
    return { valid: false, message: 'Invalid date of birth' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate required field
 * 
 * @param {any} value - Field value
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateRequired(value, fieldName = 'This field') {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, message: `${fieldName} is required` };
  }

  return { valid: true, message: '' };
}

/**
 * Validate minimum length
 * 
 * @param {string} value - String value
 * @param {number} minLength - Minimum length
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateMinLength(value, minLength, fieldName = 'This field') {
  if (!value || value.length < minLength) {
    return { valid: false, message: `${fieldName} must be at least ${minLength} characters` };
  }

  return { valid: true, message: '' };
}

/**
 * Validate amount (must be positive number)
 * 
 * @param {number} amount - Amount value
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateAmount(amount, fieldName = 'Amount') {
  if (amount === null || amount === undefined) {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, message: `${fieldName} must be a valid number` };
  }

  if (amount < 0) {
    return { valid: false, message: `${fieldName} must be positive` };
  }

  return { valid: true, message: '' };
}

// ============================================================================
// Document-Specific Validators
// ============================================================================

/**
 * Validate person data
 * 
 * @param {Object} personData - Person data object
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validatePerson(personData) {
  return validateAgainstSchema(PERSON_SCHEMA, personData);
}

/**
 * Validate case data
 * 
 * @param {Object} caseData - Case data object
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateCase(caseData) {
  return validateAgainstSchema(CASE_SCHEMA, caseData);
}

/**
 * Validate defendant application form
 * 
 * @param {Object} formData - Form data
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateDefendantApplication(formData) {
  const errors = [];

  // Required fields
  const requiredFields = [
    'first_name', 'last_name', 'dob', 'address',
    'phone_primary', 'email'
  ];

  for (const field of requiredFields) {
    if (!formData[field]) {
      errors.push({ field, message: `${field} is required` });
    }
  }

  // Validate DOB
  if (formData.dob) {
    const dobValidation = validateDOB(formData.dob);
    if (!dobValidation.valid) {
      errors.push({ field: 'dob', message: dobValidation.message });
    }
  }

  // Validate email
  if (formData.email) {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      errors.push({ field: 'email', message: emailValidation.message });
    }
  }

  // Validate phone
  if (formData.phone_primary) {
    const phoneValidation = validatePhone(formData.phone_primary);
    if (!phoneValidation.valid) {
      errors.push({ field: 'phone_primary', message: phoneValidation.message });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate indemnitor financial form
 * 
 * @param {Object} formData - Form data
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateIndemnitorFinancial(formData) {
  const errors = [];

  // Required fields
  const requiredFields = [
    'first_name', 'last_name', 'dob', 'ssn', 'address',
    'phone_primary', 'email', 'employer_name'
  ];

  for (const field of requiredFields) {
    if (!formData[field]) {
      errors.push({ field, message: `${field} is required` });
    }
  }

  // Validate SSN
  if (formData.ssn) {
    const ssnValidation = validateSSN(formData.ssn);
    if (!ssnValidation.valid) {
      errors.push({ field: 'ssn', message: ssnValidation.message });
    }
  }

  // Validate DOB
  if (formData.dob) {
    const dobValidation = validateDOB(formData.dob);
    if (!dobValidation.valid) {
      errors.push({ field: 'dob', message: dobValidation.message });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Form Validation Helper
// ============================================================================

/**
 * Validate entire form and return formatted errors
 * 
 * @param {Object} formData - Form data
 * @param {string} formType - Type of form (defendant, indemnitor, case)
 * @returns {Object} { valid: boolean, errors: Object, errorMessage: string }
 */
export function validateForm(formData, formType) {
  let result;

  switch (formType) {
    case 'defendant':
      result = validateDefendantApplication(formData);
      break;
    case 'indemnitor':
      result = validateIndemnitorFinancial(formData);
      break;
    case 'case':
      result = validateCase(formData);
      break;
    case 'person':
      result = validatePerson(formData);
      break;
    default:
      return {
        valid: false,
        errors: {},
        errorMessage: 'Unknown form type'
      };
  }

  // Convert errors array to object keyed by field name
  const errorsObj = {};
  for (const error of result.errors) {
    errorsObj[error.field] = error.message;
  }

  return {
    valid: result.valid,
    errors: errorsObj,
    errorMessage: result.valid ? '' : 'Please correct the errors above'
  };
}

// ============================================================================
// Export all validators
// ============================================================================

export default {
  // Schemas
  PERSON_SCHEMA,
  CASE_SCHEMA,

  // Field validators
  validateEmail,
  validatePhone,
  validateSSN,
  validateZip,
  validateDate,
  validateDOB,
  validateRequired,
  validateMinLength,
  validateAmount,

  // Document validators
  validatePerson,
  validateCase,
  validateDefendantApplication,
  validateIndemnitorFinancial,

  // Form validator
  validateForm
};
