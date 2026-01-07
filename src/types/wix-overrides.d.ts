/**
 * Overrides for Wix Velo Types
 * 
 * This file is intended to suppress IDE errors where the local type definitions
 * are out of sync with the actual editor elements.
 * 
 * It augments the global namespace to allow any string as a selector,
 * preventing "Argument of type 'string' is not assignable to WixElementSelector".
 */

// Allow any string to be passed to $w
type WixElementSelectorOverride = string;

declare global {
    type WixElementSelector = string | number | symbol;
}

// Ensure the module is treated as a global augmentation
export { };
