/**
 * Overrides for Wix Velo Types
 * 
 * This file is intended to suppress IDE errors where the local type definitions
 * are out of sync with the actual editor elements.
 */

// Global $w namespace
declare global {
    type WixElementSelector = string | any;
    /**
     * Selects and returns elements from a page.
     */
    function $w(selector: WixElementSelector): any;
    namespace $w {
        function onReady(handler: () => void): void;
    }
}

// Ambient module declarations for Wix Velo modules
declare module 'wix-window' {
    const wixWindow: any;
    export default wixWindow;
}

declare module 'wix-location' {
    const wixLocation: any;
    export default wixLocation;
}

declare module 'wix-storage' {
    export const local: any;
    export const session: any;
    export const memory: any;
}

declare module 'wix-storage-frontend' {
    export const local: any;
    export const session: any;
    export const memory: any;
}

declare module 'wix-data' {
    const wixData: any;
    export default wixData;
}

declare module 'wix-seo' {
    const wixSeo: any;
    export default wixSeo;
}

declare module 'wix-users' {
    const wixUsers: any;
    export default wixUsers;
}

declare module 'wix-pay' {
    const wixPay: any;
    export default wixPay;
}

declare module 'wix-crm' {
    const wixCrm: any;
    export default wixCrm;
}

