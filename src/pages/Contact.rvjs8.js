/**
 * Page: Contact.ilgty.js
 * Function: Contact & 24/7 Emergency Dispatch Center
 * 
 * Architecture:
 * 1. Distinct paths: Emergency "Call/Text Us Now" vs. Self-Service "Start Paperwork Online"
 * 2. Headquarters: 1528 Broadway, Fort Myers, FL 33901 (SWFL Core First, Statewide Second)
 * 3. Omni-Channel Intake: Highlights 24/7 Phone, SMS, Shannon Voice AI, and Telegram Bot
 * 
 * @module Contact
 */

import { submitContactForm } from 'backend/contact-api';
import { getCounties } from 'public/countyUtils';
import { buildPaperworkLaunchpadUrl } from 'public/portal-config';
import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixWindowFrontend from 'wix-window-frontend';

$w.onReady(async function () {
    console.log("☘️ [Contact Page] Initializing 24/7 Emergency & Paperwork Dispatch...");

    setupActionPaths();
    await loadJails();
    updatePageSEO();
    fixPlaceholderHeadings();
});

/**
 * Configure distinct action paths: Call/Text vs. Start Paperwork Online
 */
function setupActionPaths() {
    // 1. Emergency Call/Text Direct Links
    safeOnClick('#btnCallNow', () => {
        wixLocation.to('tel:+12393322245');
    });

    safeOnClick('#btnTextNow', () => {
        wixLocation.to('sms:+12399550178');
    });

    // 2. Start Paperwork Online (Self-Service Path)
    safeOnClick('#btnStartPaperwork', () => {
        wixLocation.to(buildPaperworkLaunchpadUrl({ source: 'wix-contact' }));
    });

    safeOnClick('#btnGetSomeoneOut', () => {
        wixLocation.to(buildPaperworkLaunchpadUrl({ source: 'wix-contact' }));
    });

    // 3. Telegram Bot & Shannon Voice AI Alternate Channels
    safeOnClick('#btnTelegramBot', () => {
        wixLocation.to('https://t.me/ShamrockBail_bot');
    });

    // 4. Form Submit
    // $w throws on a missing ID, so guard it (the Studio layout uses #submitContactBtn).
    safeOnClick('#btnSubmit', handleSubmit);
}

function fixPlaceholderHeadings() {
    const replacements = {
        '#capsTitle': 'Flagship Office · Fort Myers HQ',
        '#textCapsTitle': '1528 Broadway, Fort Myers, FL 33901',
        '#officeHeading': 'Southwest Florida Headquarters'
    };
    Object.keys(replacements).forEach((id) => {
        try {
            const el = $w(id);
            if (el && typeof el.text === 'string') {
                el.text = replacements[id];
            }
        } catch (e) {}
    });
}

function updatePageSEO() {
    const pageTitle = "Contact Shamrock Bail Bonds | 24/7 Emergency Dispatch Fort Myers FL";
    const pageDesc = "Need bail bond help? Call or text Shamrock Bail Bonds 24/7 at (239) 332-2245, start paperwork online at paperwork.shamrockbailbonds.biz, or visit 1528 Broadway, Fort Myers, FL 33901.";
    const pageUrl = "https://www.shamrockbailbonds.biz/contact";
    const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";

    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:type", "content": "website" },
        { "property": "og:image", "content": logoUrl },
        { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
        { "name": "robots", "content": "index, follow, max-snippet:-1" }
    ]);

    wixSeo.setLinks([{ "rel": "canonical", "href": pageUrl }]);

    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": pageTitle,
            "url": pageUrl,
            "description": pageDesc,
            "mainEntity": {
                "@type": "LocalBusiness",
                "name": "Shamrock Bail Bonds, LLC",
                "@id": "https://www.shamrockbailbonds.biz/#organization",
                "image": logoUrl,
                "telephone": "+1-239-332-2245",
                "priceRange": "$$",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "1528 Broadway",
                    "addressLocality": "Fort Myers",
                    "addressRegion": "FL",
                    "postalCode": "33901",
                    "addressCountry": "US"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": "26.6406",
                    "longitude": "-81.8723"
                },
                "openingHours": "Mo-Fr 09:00-17:00",
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "09:00",
                    "closes": "17:00"
                },
                "contactPoint": [
                    {
                        "@type": "ContactPoint",
                        "telephone": "+1-239-332-2245",
                        "contactType": "customer service",
                        "areaServed": "FL",
                        "availableLanguage": ["en", "es"],
                        "hoursAvailable": {
                            "@type": "OpeningHoursSpecification",
                            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                            "opens": "00:00",
                            "closes": "23:59"
                        }
                    },
                    {
                        "@type": "ContactPoint",
                        "telephone": "+1-727-295-2245",
                        "contactType": "customer service",
                        "areaServed": "FL",
                        "availableLanguage": "es",
                        "hoursAvailable": {
                            "@type": "OpeningHoursSpecification",
                            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                            "opens": "00:00",
                            "closes": "23:59"
                        }
                    }
                ]
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "Where is Shamrock Bail Bonds located?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Shamrock Bail Bonds is located at 1528 Broadway, Fort Myers, FL 33901 — directly across the street from the Lee County Justice Center and steps from the Ortiz Ave Core Facility. Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What is the easiest way to start the bail process?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "If you have an ID, you can start online at paperwork.shamrockbailbonds.biz to scan your license and sign paperwork electronically. For phone assistance, call Shannon or our live dispatchers 24/7 at (239) 332-2245."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Can I use Telegram to post bail?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. Search @ShamrockBail_bot on Telegram for conversational intake, ID scan, quote calculator, and automated paperwork links."
                    }
                }
            ]
        }
    ]);
}

async function loadJails() {
    try {
        const counties = await getCounties();
        const opts = counties.map(c => ({
            label: c.jailName,
            value: c.jailName
        }));
        opts.sort((a, b) => a.label.localeCompare(b.label));
        const dd = $w('#dropdownJail');
        if (dd) dd.options = opts;
    } catch (err) {
        console.warn("Failed to load jails:", err);
    }
}

async function handleSubmit() {
    safeDisable('#btnSubmit');
    safeSetText('#btnSubmit', "Submitting...");
    safeHide('#textError');
    safeHide('#textSuccess');

    const formData = {
        name: safeGetValue('#inputName'),
        phone: safeGetValue('#inputPhone'),
        email: safeGetValue('#inputEmail'),
        relationship: safeGetValue('#dropdownRelationship'),
        defendantName: safeGetValue('#inputDefendantName'),
        defendantDob: safeGetValue('#datePickerDefendantDOB'),
        jail: safeGetValue('#dropdownJail'),
        bookingNumber: safeGetValue('#inputBookingNumber'),
        charges: safeGetValue('#inputCharges'),
        source: safeGetValue('#dropdownSource') || 'Website Contact',
        notes: safeGetValue('#inputNotes'),
        consent: safeGetChecked('#checkboxConsent')
    };

    if (!formData.name || !formData.phone || !formData.defendantName) {
        safeSetText('#textError', "Please fill in all required fields (Name, Phone, Defendant Name).");
        safeShow('#textError');
        safeEnable('#btnSubmit');
        safeSetText('#btnSubmit', "Send Message");
        return;
    }

    try {
        const res = await submitContactForm(formData);
        if (res && res.success) {
            safeSetText('#textSuccess', "Thank you. A bondsman will call you back. Ready to start paperwork? Tap 'Start Paperwork Online'.");
            safeShow('#textSuccess');
            safeSetText('#btnSubmit', "Message Sent ✅");
        } else {
            throw new Error(res?.message || "Failed to submit");
        }
    } catch (e) {
        safeSetText('#textError', "Error submitting form. Call (239) 332-2245 for help.");
        safeShow('#textError');
        safeEnable('#btnSubmit');
        safeSetText('#btnSubmit', "Send Message");
    }
}

// Helpers
function safeGetValue(id) {
    try {
        const el = $w(id);
        return el && el.value ? String(el.value).trim() : '';
    } catch (e) { return ''; }
}

function safeGetChecked(id) {
    try {
        const el = $w(id);
        return el ? !!el.checked : true;
    } catch (e) { return true; }
}

function safeSetText(id, text) {
    try {
        const el = $w(id);
        if (el) el.text = text;
    } catch (e) {}
}

function safeShow(id) {
    try {
        const el = $w(id);
        if (el) el.show();
    } catch (e) {}
}

function safeHide(id) {
    try {
        const el = $w(id);
        if (el) el.hide();
    } catch (e) {}
}

function safeEnable(id) {
    try {
        const el = $w(id);
        if (el && typeof el.enable === 'function') el.enable();
    } catch (e) {}
}

function safeDisable(id) {
    try {
        const el = $w(id);
        if (el && typeof el.disable === 'function') el.disable();
    } catch (e) {}
}

function safeOnClick(id, handler) {
    try {
        const el = $w(id);
        if (el && typeof el.onClick === 'function') el.onClick(handler);
    } catch (e) {}
}

// =============================================================================
// WIX STUDIO LAYER (Oct 2026) — source: Studio cutover ready/velo/contact.js
// Element IDs from the Studio design. Every lookup is guarded (a missing ID skips
// that feature), so this is inert on the current live layout and the code above
// keeps running unchanged. Scoped in an IIFE so helper names never collide.
// Copy rules: no release-time/speed claims; Spanish line (727) 295-2245;
// "Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7".
// =============================================================================
(function studioLayer() {
    /**
     * contact.js — Contact page (/contact)
     * Paste in Wix Studio: Contact page > Code panel > page code.
     *
     * Same backend call and payload as before: backend/contact-api.jsw submitContactForm
     * ({ name, phone, email, defendantName, jail, notes, source, consent }).
     * Changes: every lookup guarded; phone/SMS buttons get tel:/sms: links; the county
     * dropdown is filled with the 67 counties if it was left empty in the editor.
     */


    const PHONE_MAIN = 'tel:+12393322245';
    const PHONE_SPANISH = 'tel:+17272952245';
    const SMS_TEXT = 'sms:+12399550178';

    const COUNTY_OPTIONS = [
        { label: "Lee County (Fort Myers / Cape Coral)", value: "lee" },
        { label: "Collier County (Naples / Immokalee)", value: "collier" },
        { label: "Charlotte County (Punta Gorda / Port Charlotte)", value: "charlotte" },
        { label: "Sarasota County (Sarasota / Venice)", value: "sarasota" },
        { label: "Hendry County (LaBelle / Clewiston)", value: "hendry" },
        { label: "Glades County (Moore Haven)", value: "glades" },
        { label: "DeSoto County (Arcadia)", value: "desoto" },
        { label: "Alachua County (Gainesville)", value: "alachua" },
        { label: "Baker County (Macclenny)", value: "baker" },
        { label: "Bay County (Panama City)", value: "bay" },
        { label: "Bradford County (Starke)", value: "bradford" },
        { label: "Brevard County (Titusville / Melbourne)", value: "brevard" },
        { label: "Broward County (Fort Lauderdale)", value: "broward" },
        { label: "Calhoun County (Blountstown)", value: "calhoun" },
        { label: "Citrus County (Inverness)", value: "citrus" },
        { label: "Clay County (Green Cove Springs)", value: "clay" },
        { label: "Columbia County (Lake City)", value: "columbia" },
        { label: "Dixie County (Cross City)", value: "dixie" },
        { label: "Duval County (Jacksonville)", value: "duval" },
        { label: "Escambia County (Pensacola)", value: "escambia" },
        { label: "Flagler County (Bunnell / Palm Coast)", value: "flagler" },
        { label: "Franklin County (Apalachicola)", value: "franklin" },
        { label: "Gadsden County (Quincy)", value: "gadsden" },
        { label: "Gilchrist County (Trenton)", value: "gilchrist" },
        { label: "Gulf County (Port St. Joe)", value: "gulf" },
        { label: "Hamilton County (Jasper)", value: "hamilton" },
        { label: "Hardee County (Wauchula)", value: "hardee" },
        { label: "Hernando County (Brooksville)", value: "hernando" },
        { label: "Highlands County (Sebring)", value: "highlands" },
        { label: "Hillsborough County (Tampa)", value: "hillsborough" },
        { label: "Holmes County (Bonifay)", value: "holmes" },
        { label: "Indian River County (Vero Beach)", value: "indian-river" },
        { label: "Jackson County (Marianna)", value: "jackson" },
        { label: "Jefferson County (Monticello)", value: "jefferson" },
        { label: "Lafayette County (Mayo)", value: "lafayette" },
        { label: "Lake County (Tavares)", value: "lake" },
        { label: "Leon County (Tallahassee)", value: "leon" },
        { label: "Levy County (Bronson)", value: "levy" },
        { label: "Liberty County (Bristol)", value: "liberty" },
        { label: "Madison County (Madison)", value: "madison" },
        { label: "Manatee County (Bradenton)", value: "manatee" },
        { label: "Marion County (Ocala)", value: "marion" },
        { label: "Martin County (Stuart)", value: "martin" },
        { label: "Miami-Dade County (Miami)", value: "miami-dade" },
        { label: "Monroe County (Key West)", value: "monroe" },
        { label: "Nassau County (Fernandina Beach)", value: "nassau" },
        { label: "Okaloosa County (Crestview)", value: "okaloosa" },
        { label: "Okeechobee County (Okeechobee)", value: "okeechobee" },
        { label: "Orange County (Orlando)", value: "orange" },
        { label: "Osceola County (Kissimmee)", value: "osceola" },
        { label: "Palm Beach County (West Palm Beach)", value: "palm-beach" },
        { label: "Pasco County (Dade City / New Port Richey)", value: "pasco" },
        { label: "Pinellas County (Clearwater)", value: "pinellas" },
        { label: "Polk County (Bartow / Lakeland)", value: "polk" },
        { label: "Putnam County (Palatka)", value: "putnam" },
        { label: "Santa Rosa County (Milton)", value: "santa-rosa" },
        { label: "Seminole County (Sanford)", value: "seminole" },
        { label: "St. Johns County (St. Augustine)", value: "st-johns" },
        { label: "St. Lucie County (Fort Pierce)", value: "st-lucie" },
        { label: "Sumter County (Bushnell)", value: "sumter" },
        { label: "Suwannee County (Live Oak)", value: "suwannee" },
        { label: "Taylor County (Perry)", value: "taylor" },
        { label: "Union County (Lake Butler)", value: "union" },
        { label: "Volusia County (DeLand / Daytona)", value: "volusia" },
        { label: "Wakulla County (Crawfordville)", value: "wakulla" },
        { label: "Walton County (DeFuniak Springs)", value: "walton" },
        { label: "Washington County (Chipley)", value: "washington" }
    ].map((c) => { const name = c.label.split(' (')[0].replace(/ County$/, ''); return { label: `${name} County`, value: name }; });

    $w.onReady(function () {
        initDropdowns();
        initContactForm();
        initDirectCallLinks();
    });

    // ─── Safe element helpers ($w throws on a missing ID; `if ($w('#x'))` does not protect) ──
    function el(id) {
        try {
            const node = $w(id);
            if (!node || (typeof node.id !== 'string' && typeof node.type !== 'string')) return null;
            return node;
        } catch (e) {
            return null;
        }
    }
    function itemEl($item, id) {
        try {
            const node = $item(id);
            if (!node || (typeof node.id !== 'string' && typeof node.type !== 'string')) return null;
            return node;
        } catch (e) {
            return null;
        }
    }
    function on(id, event, handler) {
        const node = typeof id === 'string' ? el(id) : id;
        if (!node) return null;
        try { node[event](handler); } catch (e) { /* element has no such event */ }
        return node;
    }
    function setText(node, value) {
        if (!node) return;
        try { node.text = String(value == null ? '' : value); } catch (e) { /* not a text element */ }
    }
    function setLink(node, url, target) {
        if (!node || !url) return false;
        try {
            node.link = url;
            node.target = target || '_self';
            return true;
        } catch (e) {
            return false;
        }
    }
    function valueOf(id) {
        const node = el(id);
        if (!node) return '';
        try { return typeof node.value === 'string' ? node.value.trim() : (node.value || ''); } catch (e) { return ''; }
    }
    function call(node, method) {
        if (!node) return;
        try { node[method](); } catch (e) { /* noop */ }
    }

    function initDropdowns() {
        const county = el('#dropdownCounty');
        if (county) {
            try {
                if (!county.options || county.options.length === 0) county.options = COUNTY_OPTIONS;
                if (!county.value) county.value = 'Lee';
            } catch (e) { /* keep editor options */ }
        }
        const jail = el('#dropdownJail');
        if (jail) {
            try {
                if (!jail.options || jail.options.length === 0) {
                    jail.options = COUNTY_OPTIONS.map((c) => ({ label: `${c.label} Jail`, value: `${c.label} Jail` }))
                        .concat([{ label: 'Not sure', value: 'Not sure' }]);
                }
            } catch (e) { /* keep editor options */ }
        }
    }

    function initContactForm() {
        const submitBtn = el('#submitContactBtn');
        const spinner = el('#submitSpinner');
        const successBox = el('#successBox');
        const errorBox = el('#errorBox');
        const errorText = el('#errorMsgText');
        if (!submitBtn) return;
        call(spinner, 'hide');

        function showError(msg) {
            setText(errorText, msg);
            call(errorBox, 'expand');
        }

        function resetFormFields() {
            ['#inputName', '#inputPhone', '#inputEmail', '#inputInmateName', '#inputMessage'].forEach((id) => {
                const node = el(id);
                if (node) { try { node.value = ''; } catch (e) { /* noop */ } }
            });
        }

        submitBtn.onClick(async () => {
            call(successBox, 'collapse');
            call(errorBox, 'collapse');

            const name = valueOf('#inputName');
            const phone = valueOf('#inputPhone');
            const email = valueOf('#inputEmail');
            const county = el('#dropdownCounty') ? valueOf('#dropdownCounty') : 'Lee';
            const jail = valueOf('#dropdownJail') || county || '';
            const inmateName = valueOf('#inputInmateName');
            const message = valueOf('#inputMessage');
            const consentBox = el('#checkboxConsent');
            let consent = false;
            try { consent = !!consentBox && consentBox.checked === true; } catch (e) { consent = false; }

            if (!name) {
                showError('Please enter your name so we know who to speak with.');
                call(el('#inputName'), 'focus');
                return;
            }
            if (phone.replace(/[^0-9]/g, '').length < 10) {
                showError('Please enter a valid 10-digit callback phone number.');
                call(el('#inputPhone'), 'focus');
                return;
            }
            if (!inmateName) {
                showError("Please enter the defendant's name.");
                call(el('#inputInmateName'), 'focus');
                return;
            }
            if (!jail) {
                showError('Please choose the jail or county.');
                return;
            }
            if (!consent) {
                showError('Please confirm we may contact you about this inquiry.');
                return;
            }

            call(submitBtn, 'disable');
            call(spinner, 'show');
            try {
                const result = await submitContactForm({
                    name: name,
                    phone: phone,
                    email: email,
                    defendantName: inmateName,
                    jail: jail,
                    notes: message,
                    source: 'wix-studio-contact-page',
                    consent: true
                });
                if (result && result.success) {
                    call(successBox, 'expand');
                    resetFormFields();
                    trackEvent('contact_form_submitted', county);
                } else {
                    showError((result && (result.error || result.message)) || 'We could not send your message. Please call (239) 332-2245.');
                }
            } catch (err) {
                console.error('Submission failed:', err);
                showError('Connection error. Please call (239) 332-2245. Phones are answered 24/7.');
            } finally {
                call(submitBtn, 'enable');
                call(spinner, 'hide');
            }
        });
    }

    function initDirectCallLinks() {
        const callEnglish = el('#contactCallEnglish');
        setLink(callEnglish, PHONE_MAIN, '_self');
        on(callEnglish, 'onClick', () => trackEvent('call_english', 'contact_page'));

        const callSpanish = el('#contactCallSpanish');
        setLink(callSpanish, PHONE_SPANISH, '_self');
        on(callSpanish, 'onClick', () => trackEvent('call_spanish', 'contact_page'));

        const textSms = el('#contactTextSMS');
        setLink(textSms, SMS_TEXT, '_self');
        on(textSms, 'onClick', () => trackEvent('sms_click', 'contact_page'));
    }

    function trackEvent(action, label) {
        try {
            if (wixWindowFrontend.trackEvent) {
                wixWindowFrontend.trackEvent('CustomEvent', {
                    event: 'contact_page_action',
                    eventCategory: 'Lead Dispatch',
                    eventAction: action,
                    eventLabel: label
                });
            }
        } catch (e) {
            console.warn('Analytics suppressed:', e.message);
        }
    }
})();
