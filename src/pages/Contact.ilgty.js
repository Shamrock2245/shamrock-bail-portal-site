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
    const btnSubmit = $w('#btnSubmit');
    if (btnSubmit && typeof btnSubmit.onClick === 'function') {
        btnSubmit.onClick(handleSubmit);
    }
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
    const pageDesc = "Need immediate bail bond help? Call or text Shamrock Bail Bonds 24/7 at (239) 332-2245, start paperwork online at paperwork.shamrockbailbonds.biz, or visit 1528 Broadway, Fort Myers, FL 33901.";
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
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                }
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
                        "text": "Shamrock Bail Bonds is located at 1528 Broadway, Fort Myers, FL 33901 — directly across the street from the Lee County Justice Center and steps from the Ortiz Ave Core Facility. Walk-ins welcome 24/7."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What is the fastest way to get someone out of jail?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "If you have an ID and 2 minutes, start online at paperwork.shamrockbailbonds.biz to scan your license and sign paperwork instantly. For phone assistance, call Shannon or our live dispatchers 24/7 at (239) 332-2245."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Can I use Telegram to post bail?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. Search @ShamrockBail_bot on Telegram for instant conversational intake, ID scan, quote calculator, and automated paperwork links."
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
    const $btn = $w('#btnSubmit');
    const $err = $w('#textError');
    const $success = $w('#textSuccess');

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
            safeSetText('#textSuccess', "Thank you. A bondsman will call you immediately. Need instant paperwork? Tap 'Start Paperwork Online'.");
            safeShow('#textSuccess');
            safeSetText('#btnSubmit', "Message Sent ✅");
        } else {
            throw new Error(res?.message || "Failed to submit");
        }
    } catch (e) {
        safeSetText('#textError', "Error submitting form. Call (239) 332-2245 for immediate help.");
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
