/**
 * Global Type Definitions for Wix Velo
 * Use this to resolve "Cannot find name '$w'" and missing module errors
 * when the official wix-code-types are incomplete.
 */

// The global $w namespace for Velo
declare var $w: any;

// Missing Velo modules
declare module 'wix-window' {
    const wixWindow: any;
    export default wixWindow;
}

declare module 'wix-storage' {
    export const session: any;
    export const local: any;
    export const memory: any;
}

declare module 'wix-storage-frontend' {
    const wixStorageFrontend: any;
    export = wixStorageFrontend;
}

declare module 'wix-location' {
    const wixLocation: any;
    export default wixLocation;
}

declare module 'wix-data' {
    const wixData: any;
    export default wixData;
}
