/**
 * Type declarations for wix-seo to fix IDE errors
 */
declare module 'wix-seo' {
    export function setTitle(title: string): void;
    export function setMetaTags(tags: Array<{ [key: string]: string }>): void;
    export function setStructuredData(data: Array<any>): void;
    export const title: string;
    export const metaTags: Array<any>;
    export const structuredData: Array<any>;
}
