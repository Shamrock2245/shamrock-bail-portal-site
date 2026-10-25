/**
 * home.js - Home Page Code for Wix Studio
 * Page: Home (/)
 * Branch: Wix studio version (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4)
 * 
 * Handles:
 * 1. Hero emergency dispatch CTAs (English, Spanish, SMS, Start Online)
 * 2. 67-County quick-jump selector routing to /florida-bail-bonds/{county}
 * 3. Transparent 10% Florida bail calculator with statutory $100 min/charge
 * 4. FAQ accordion expand/collapse interactions
 * 5. Telemetry & GA4 conversion tracking
 */

import wixLocationFrontend from 'wix-location-frontend';
import wixWindowFrontend from 'wix-window-frontend';

const FLORIDA_COUNTIES = [
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
];

$w.onReady(function () {
    initHeroActions();
    initCountySelector();
    initBailCalculator();
    initFaqAccordion();
});

/**
 * Hero Emergency Dispatch Actions
 */
function initHeroActions() {
    if ($w('#heroStartOnline')) {
        $w('#heroStartOnline').onClick(() => {
            trackEvent('start_online_click', 'hero');
            wixLocationFrontend.to('/portal-landing');
        });
    }

    if ($w('#heroCallEnglish')) {
        $w('#heroCallEnglish').onClick(() => {
            trackEvent('call_english', 'hero');
        });
    }

    if ($w('#heroCallSpanish')) {
        $w('#heroCallSpanish').onClick(() => {
            trackEvent('call_spanish', 'hero');
        });
    }

    if ($w('#heroTextSMS')) {
        $w('#heroTextSMS').onClick(() => {
            trackEvent('sms_click', 'hero');
        });
    }
}

/**
 * County Selector Dropdown & Navigator
 */
function initCountySelector() {
    const dropdown = $w('#countyDropdown');
    const goBtn = $w('#countyGoBtn');

    if (dropdown) {
        dropdown.options = FLORIDA_COUNTIES;
        dropdown.placeholder = "Select your Florida county...";

        dropdown.onChange(() => {
            const slug = dropdown.value;
            if (slug) {
                navigateToCounty(slug);
            }
        });
    }

    if (goBtn && dropdown) {
        goBtn.onClick(() => {
            const slug = dropdown.value;
            if (slug) {
                navigateToCounty(slug);
            }
        });
    }
}

function navigateToCounty(slug) {
    trackEvent('county_navigate', slug);
    wixLocationFrontend.to(`/florida-bail-bonds/${slug}`);
}

/**
 * 10% Florida Bail Bond Calculator
 */
function initBailCalculator() {
    const input = $w('#calcBailInput');
    const calcBtn = $w('#calcSubmitBtn');
    const resultBox = $w('#calcResultBox');
    const premiumText = $w('#calcPremiumAmount');
    const noteText = $w('#calcStatutoryNote');

    if (calcBtn && input && premiumText) {
        calcBtn.onClick(() => {
            const rawVal = parseFloat(String(input.value).replace(/[^0-9.]/g, '')) || 0;
            if (rawVal <= 0) {
                if (resultBox) resultBox.collapse();
                return;
            }

            // Florida Statute § 648: 10% premium, minimum $100 per charge
            const premium = Math.max(100, rawVal * 0.10);
            premiumText.text = `$${premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            if (noteText) {
                noteText.text = `Under Florida law (F.S. Ch. 648), bail bond rates are strictly set at 10% for state charges ($100 minimum per charge). No agency can charge more or less.`;
            }

            if (resultBox) {
                resultBox.expand();
            }

            trackEvent('calculator_used', `amount_${rawVal}`);
        });
    }
}

/**
 * FAQ Accordion Interaction
 */
function initFaqAccordion() {
    // If using individual buttons or repeater
    const faqCount = 6;
    for (let i = 1; i <= faqCount; i++) {
        const toggleBtn = $w(`#faqToggle${i}`);
        const answerBox = $w(`#faqAnswer${i}`);
        const icon = $w(`#faqIcon${i}`);

        if (toggleBtn && answerBox) {
            toggleBtn.onClick(() => {
                if (answerBox.collapsed) {
                    answerBox.expand();
                    if (icon) icon.text = '−';
                } else {
                    answerBox.collapse();
                    if (icon) icon.text = '+';
                }
            });
        }
    }
}

function trackEvent(action, label) {
    try {
        if (wixWindowFrontend.trackEvent) {
            wixWindowFrontend.trackEvent('CustomEvent', {
                event: 'home_interaction',
                eventCategory: 'User Engagement',
                eventAction: action,
                eventLabel: label
            });
        }
    } catch (e) {
        console.warn('Analytics suppressed:', e.message);
    }
}
