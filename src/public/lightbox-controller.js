/**
 * LightboxController.js
 * Centralized coordination for all lightboxes on the site.
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { local } from 'wix-storage';

export class LightboxController {
    static _$w = null;

    /**
     * Initialize the controller with the page's $w scope
     * @param {function} $w - The global $w function
     */
    static init($w) {
        this._$w = $w;
    }

    /**
     * Generic method to open a lightbox by name (or ID map)
     * @param {string} name - Key for the lightbox (e.g. 'idUpload', 'consent')
     * @param {object} context - Data to pass to the lightbox
     */
    static show(name, context = {}) {
        const lightboxName = this._resolveLightboxName(name);
        if (lightboxName) {
            console.log(`[LightboxController] Opening: ${lightboxName}`);
            return wixWindow.openLightbox(lightboxName, context);
        } else {
            console.warn(`[LightboxController] Unknown lightbox key: ${name}`);
            return Promise.resolve(null);
        }
    }

    /**
     * Generic method to hide a lightbox (functionally just closes current)
     * @param {string} name - Optional name for logging
     */
    static hide(name) {
        console.log(`[LightboxController] Closing ${name || 'current'} lightbox`);
        wixWindow.lightbox.close();
    }

    /**
     * Resolve internal keys to actual Lightbox names in Editor
     */
    static _resolveLightboxName(key) {
        const map = {
            'emergencyCta': 'EmergencyCtaLightbox',
            'privacy': 'PrivacyLightbox',
            'terms': 'TermsLightbox',
            'idUpload': 'IdUploadLightbox',
            'consent': 'ConsentLightbox',
            'signing': 'SigningLightbox',
            'defendantDetails': 'DefendantDetails',
            // Aliases if needed:
            'EmergencyCtaLightbox': 'EmergencyCtaLightbox',
            'PrivacyLightbox': 'PrivacyLightbox',
            'TermsLightbox': 'TermsLightbox'
        };
        return map[key] || key;
    }

    // --- Specific Lightbox Logic ---

    /**
     * Initialize Emergency CTA (Homepage)
     * Logic: Show after 8s if not previously interacted/shown recently
     */
    static initEmergencyCtaLightbox() {
        // defined in implementation guide: "Appears after 8 seconds... Does not appear again for 24 hours"
        const STORAGE_KEY = 'emergency_cta_dismissed';
        const lastDismissed = local.getItem(STORAGE_KEY);
        const THREE_HOURS = 3 * 60 * 60 * 1000; // 3 hours in ms (Guide says 24h but usually lower for dev, adhering to 24h as per request)
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        if (lastDismissed) {
            const timeDiff = Date.now() - parseInt(lastDismissed, 10);
            if (timeDiff < TWENTY_FOUR_HOURS) {
                console.log("[LightboxController] Emergency CTA suppressed (24h cooldown)");
                return;
            }
        }

        setTimeout(() => {
            wixWindow.openLightbox("EmergencyCtaLightbox")
                .then((data) => {
                    // If closed/dismissed, save timestamp
                    local.setItem(STORAGE_KEY, Date.now().toString());
                });
        }, 8000);
    }

    /**
     * Privacy Policy Lightbox
     */
    static initPrivacyLightbox() {
        // If there are links on the page triggering this, bind them.
        // Usually called via `LightboxController.show('privacy')` from other scripts
        // But if there's a footer link:
        if (this._$w && this._$w('#footerPrivacyLink').length > 0) {
            this._$w('#footerPrivacyLink').onClick(() => this.show('privacy'));
        }
    }

    /**
     * Terms Lightbox
     */
    static initTermsLightbox() {
        if (this._$w && this._$w('#footerTermsLink').length > 0) {
            this._$w('#footerTermsLink').onClick(() => this.show('terms'));
        }
    }

    /**
     * Staff: Defendant Details
     * Usually called programmatically with data
     */
    static setupDefendantDetailsLightbox(data) {
        return this.show('defendantDetails', data);
    }
}
