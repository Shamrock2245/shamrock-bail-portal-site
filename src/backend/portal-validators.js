/**
 * Backend Portal Validators
 * 
 * This file has been deprecated. All validation logic has been moved to:
 * public/portal-validators.js
 * 
 * This stub file exists to prevent deployment errors from stale references.
 */

// Re-export from public validators for backward compatibility
import * as publicValidators from 'public/portal-validators';

export const validateEmail = publicValidators.validateEmail;
export const validatePhone = publicValidators.validatePhone;
export const validateDOB = publicValidators.validateDOB;
export const validateSSN = publicValidators.validateSSN;
export const validateAddress = publicValidators.validateAddress;
export const validateDefendant = publicValidators.validateDefendant;
export const validateIndemnitor = publicValidators.validateIndemnitor;
export const validateCase = publicValidators.validateCase;
