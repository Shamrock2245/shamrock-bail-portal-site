/**
 * Terms and Conditions Page Controller
 * File: src/pages/terms-and-conditions.e6rv6.js
 * 
 * Shamrock Bail Bonds - Legal Terms & Conditions
 * Full SEO schema, mobile-first responsive layout, and client agreements.
 */

import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';

$w.onReady(function () {
    console.log("📜 [Terms & Conditions] Initializing legal terms controller...");
    setupPageSEO();
    setupTermsContent();
    setupActionButtons();
    setTimeout(() => { setupStructuredData(); }, 0);
});

function setupPageSEO() {
    const title = 'Terms & Conditions | Shamrock Bail Bonds Florida';
    const desc = 'Review terms and conditions for Shamrock Bail Bonds surety services in Florida, including electronic signatures, payment terms, and client responsibilities.';
    const url = 'https://www.shamrockbailbonds.biz/terms-and-conditions';

    wixSeo.setTitle(title);
    wixSeo.setLinks([{ rel: 'canonical', href: url }]);
    wixSeo.setMetaTags([
        { name: 'description', content: desc },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Shamrock Bail Bonds, LLC' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title }
    ]);
}

function setupStructuredData() {
    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Terms and Conditions", "item": "https://www.shamrockbailbonds.biz/terms-and-conditions" }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Terms and Conditions",
            "url": "https://www.shamrockbailbonds.biz/terms-and-conditions",
            "description": "Terms and Conditions governing surety bail bond issuance, electronic signing, indemnitor obligations, and payment policies for Shamrock Bail Bonds.",
            "publisher": {
                "@type": "Organization",
                "@id": "https://www.shamrockbailbonds.biz/#organization",
                "name": "Shamrock Bail Bonds"
            },
            "inLanguage": "en-US",
            "lastReviewed": "2026-08-01"
        },
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "name": "Shamrock Bail Bonds",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
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
            "geo": { "@type": "GeoCoordinates", "latitude": "26.6406", "longitude": "-81.8723" },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00", "closes": "23:59"
            }
        }
    ]).catch(function(e) { console.warn('[SEO] Terms schema non-fatal error:', e); });
}

function setupTermsContent() {
    const termsBody = getDetailedTermsText();

    try {
        const titleEl = $w('#termsTitle') || $w('#pageTitle');
        if (titleEl) titleEl.text = "Terms & Conditions";
    } catch (e) {}

    try {
        const textEl = $w('#termsContent') || $w('#textTerms') || $w('#textContent');
        if (textEl) textEl.text = termsBody;
    } catch (e) {}

    try {
        const updatedEl = $w('#lastUpdatedText') || $w('#textUpdated');
        if (updatedEl) updatedEl.text = "Last Revised: August 2026";
    } catch (e) {}
}

function setupActionButtons() {
    try {
        const btnCall = $w('#btnCallDesk') || $w('#btnEmergencyCall');
        if (btnCall) {
            btnCall.onClick(() => {
                wixLocation.to('tel:2393322245');
            });
        }
    } catch (e) {}

    try {
        const btnStart = $w('#btnStartIntake') || $w('#btnGetStarted');
        if (btnStart) {
            btnStart.onClick(() => {
                wixLocation.to('/portal-landing');
            });
        }
    } catch (e) {}
}

function getDetailedTermsText() {
    return `SHAMROCK BAIL BONDS, LLC — TERMS & CONDITIONS OF SERVICE

1. SCOPE OF SERVICES
Shamrock Bail Bonds, LLC ("Shamrock", "we", "us", or "our") provides licensed surety bail bonding services throughout the State of Florida in accordance with Florida Statutes Chapters 648 and 903. Our services include automated bail intake, electronic document signing, identity verification, payment processing, court appearance notifications, and client portal access.

2. ELIGIBILITY & ACCURACY OF INFORMATION
To execute surety contracts, indemnity agreements, or promissory notes, you must be at least 18 years of age and legally authorized to enter binding contracts. You certify under penalty of perjury that all personal information, driver's license credentials, employment records, residential addresses, and defendant relationship disclosures submitted through this portal are true, complete, and accurate.

3. STATUTORY FLORIDA PREMIUM RATES & NON-REFUNDABLE FEES
In strict accordance with Florida Administrative Code and Florida Insurance Regulations:
- State statutory bail premium is 10% of total bond amount for state charges (minimum $100 per charge).
- Federal bond premium is 15% of total bond amount.
- Bail bond premiums are fully earned upon the defendant's release from custody and are NON-REFUNDABLE under any circumstances once the bond is posted, regardless of case dismissal, acquittal, rearrest, or immediate surrender.

4. INDEMNITOR (COSIGNER) RESPONSIBILITIES & LIABILITIES
As an Indemnitor (Cosigner), you guarantee the full appearance of the Defendant at every required court hearing in any court having jurisdiction. If the Defendant fails to appear, skips bail, or forfeits the bond, you agree to immediately pay Shamrock the full face amount of the bond, plus all reasonable investigative, apprehension, court forfeiture, and attorney fees incurred.

5. ELECTRONIC SIGNATURES (UETA & E-SIGN ACT)
By typing your name, drawing a digital signature, or completing electronic signing via our authorized launchpad, you agree that your electronic signature carries the exact legal weight, validity, and enforceability of a wet-ink signature pursuant to the Florida Uniform Electronic Transaction Act (F.S. § 668.50) and Federal E-SIGN Act (15 U.S.C. § 7001).

6. SMS, MMS, & BLUEBUBBLES MESSAGING CONSENT (10DLC COMPLIANCE)
By providing your mobile telephone number, you expressly consent to receive transaction receipts, signing recovery links, court date alerts, check-in reminders, and operational notifications via SMS, MMS, iMessage, and RCS. Message frequency varies based on court scheduling. Standard message and data rates may apply. Reply STOP to cancel or HELP for assistance.

7. COLLATERAL & LIEN TERMS
Any cash, promissory note, or real/personal property pledged as collateral will be held in trust in compliance with Florida Chapter 648. Collateral will only be released after Shamrock receives certified court documentation proving discharge or exoneration of the bond.

8. JURISDICTION & GOVERNING LAW
These Terms & Conditions and all related bail agreements shall be governed by and construed under the laws of the State of Florida. Any legal action arising from these terms shall be brought exclusively in Lee County, Florida.

Shamrock Bail Bonds, LLC
1528 Broadway, Fort Myers, FL 33901
Phone: (239) 332-2245 | Email: shamrockbailoffice@gmail.com`;
}

