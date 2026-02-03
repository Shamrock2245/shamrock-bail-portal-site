/**
 * Ambient type declarations to resolve IDE errors for Wix modules and custom backend files.
 */

// Allow import of .jsw files
declare module '*.jsw' {
    const value: any;
    export default value;
    export const addPendingDocument: any;
    export const addPendingDocumentsBatch: any;
    export const updateDocumentStatus: any;
    export const getPendingIntakes: any;
    export const markIntakeProcessed: any;
    export const getIndemnitorProfile: any;
    // Add other specific exports as needed or use 'any'
}

// Wix Modules
declare module 'wix-http-functions' {
    export function ok(options?: any): any;
    export function badRequest(options?: any): any;
    export function serverError(options?: any): any;
    export function forbidden(options?: any): any;
    export function created(options?: any): any;
    export function notFound(options?: any): any;
    export function response(options?: any): any;
}

declare module 'wix-secrets-backend' {
    export function getSecret(name: string): Promise<string>;
}

declare module 'wix-data' {
    const wixData: any;
    export default wixData;
}

declare module 'wix-location' {
    const content: any;
    export default content;
}

declare module 'wix-seo' {
    const content: any;
    export default content;
}

declare module 'wix-window' {
    const content: any;
    export default content;
}

declare module 'wix-fetch' {
    export function fetch(url: string, options?: any): Promise<any>;
}

// Handle 'backend/*' aliases that might fail resolution
declare module 'backend/*' {
    const content: any;
    export = content;
}

declare module 'backend/logging' {
    export function logSafe(message: string, data?: any, level?: string): void;
}
