import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import { COLLECTIONS } from 'public/collectionIds';
import { getCounties } from 'public/countyUtils';
import { LightboxController } from 'public/lightbox-controller';

$w.onReady(async function () {
    console.log("🚀 HOME PAGE LOADED - PRODUCTION MODE v2.2 (Defensive)");

    try {
        // Initialize Lightbox Controller
        try {
            LightboxController.init($w);
            LightboxController.initPrivacyLightbox();
            LightboxController.initTermsLightbox();
        } catch (err) {
            console.error("Non-Critical: Lightbox init failed", err);
        }

        // 1. Initialize County Dropdown
        await initCountyDropdown();

        // 2. Setup Testimonials
        setupTestimonials();

        // 3. Setup FAQ
        setupFAQ();

        // 4. Setup Common Charges
        setupBondAmounts();

        // 5. Setup Spanish Speaking Phone Button (Safe)
        safeBindAndLog("#callNowSpanishBtn", 'onClick', () => wixLocation.to("tel:12399550301"));

        // 6. Bind Get Started Button - SIMPLE AND WORKING
        try {
            const btn = $w('#getStartedBtn');
            btn.onClick(() => {
                console.log('🚀 GET STARTED CLICKED!');
                const dropdown = $w('#countyDropdown');
                const selectedCounty = dropdown.value;
                
                if (selectedCounty && selectedCounty !== 'All') {
                    console.log('✅ Navigating to:', selectedCounty);
                    navigateToCounty(selectedCounty);
                } else {
                    console.log('⚠️ No county selected, going to portal-landing');
                    wixLocation.to('/portal-landing');
                }
            });
            console.log('✅ Get Started button bound successfully');
        } catch (err) {
            console.error('❌ Failed to bind Get Started button:', err);
        }

    } catch (criticalErr) {
        console.error("CRITICAL ERROR IN HOME PAGE ONREADY:", criticalErr);
    }
});

// --- HELPER FOR SAFE NAVIGATION (Enhanced UX with Loading State) ---
function navigateToCounty(value) {
    if (!value) return;

    let dest = value;
    // If value is just a name/slug (e.g. "Lee" or "lee"), format it
    if (!dest.startsWith('/')) {
        const slug = dest.trim().toLowerCase().replace(/\s+/g, '-');
        dest = `/bail-bonds/${slug}`;
        console.log(`🛣️  Formatted "${value}" → "${dest}"`);
    }

    console.log(`🚀 Navigating to ${dest}`);
    
    // Show loading state with multiple fallback options
    showLoadingState(value);
    
    // Navigate
    wixLocation.to(dest);
}

/**
 * Show loading state with graceful fallbacks
 */
function showLoadingState(countyName) {
    try {
        // Option 1: Custom loading box
        const loadingBox = $w('#loadingBox');
        if (loadingBox && loadingBox.type) {
            loadingBox.show('fade', { duration: 200 });
            
            // Update text if available
            const loadingText = $w('#loadingText');
            if (loadingText && loadingText.type) {
                loadingText.text = `Loading ${countyName} County...`;
            }
            return;
        }
    } catch (e) { }
    
    try {
        // Option 2: Simple loading text
        const loadingText = $w('#loadingText');
        if (loadingText && loadingText.type) {
            loadingText.text = `Loading ${countyName} County...`;
            loadingText.show('fade', { duration: 200 });
            return;
        }
    } catch (e) { }
    
    try {
        // Option 3: Generic loading indicator
        const loader = $w('#loadingIndicator');
        if (loader && loader.type) {
            loader.show('fade', { duration: 200 });
            return;
        }
    } catch (e) { }
    
    // Option 4: No loading indicator available
    console.log('ℹ️  No loading indicator found (navigation still works)');
}



/**
 * 1. COUNTY DROPDOWN LOGIC
 */
async function initCountyDropdown() {
    console.log("DEBUG: initCountyDropdown() [v3.1 Fix] calling...");

    try {
        // 1. ROBUST ELEMENT SELECTION
        let dropdown = $w('#countyDropdown');
        if (dropdown.length === 0) dropdown = $w('#countySelector');
        if (dropdown.length === 0) dropdown = $w('#dropdown1');

        if (dropdown.length === 0) {
            console.error('CRITICAL: All Dropdown selectors failed.');
            return;
        }

        // 2. Initialize
        dropdown.placeholder = "Loading Counties...";

        // 3. Define Fallback Data IMMEDIATELY
        const fallbackCounties = [
            { name: "Alachua", slug: "alachua" },
            { name: "Charlotte", slug: "charlotte" },
            { name: "Collier", slug: "collier" },
            { name: "Hendry", slug: "hendry" },
            { name: "Lee", slug: "lee" },
            { name: "Sarasota", slug: "sarasota" },
            { name: "Manatee", slug: "manatee" },
            { name: "Desoto", slug: "desoto" }
        ];

        // 4. Fetch counties (WITH 5s TIMEOUT)
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 5000));
        let counties = await Promise.race([getCounties(), timeoutPromise]);

        if (!Array.isArray(counties) || counties.length === 0) {
            console.warn("DEBUG: Fetch failed/empty/timeout. Using Fallback.");
            counties = fallbackCounties;
        }

        // 5. Transform for Dropdown
        const options = counties
            .filter(c => c && (c.name || c.countyName))
            .map(county => {
                const name = county.name || county.countyName || "Unknown";
                const slug = county.slug || county.countySlug || name.toLowerCase().replace(/\s+/g, '-');
                return {
                    label: name + ' County',
                    value: `/bail-bonds/${slug}`
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));

        // 6. Set Options
        dropdown.options = [];
        setTimeout(() => {
            dropdown.options = options;
            dropdown.value = undefined;
            dropdown.resetValidityIndication();
            dropdown.placeholder = "Select a County";
            if (dropdown.collapsed) dropdown.expand();
            if (dropdown.hidden) dropdown.show();
        }, 100);

        // 7. Change Handler - Direct navigation (Best UX for stressed customers)
        dropdown.onChange((event) => {
            const selectedCounty = event.target.value;
            if (!selectedCounty) return;
            
            console.log("🎯 County selected:", selectedCounty, "- Navigating immediately...");
            
            // Provide visual feedback
            dropdown.disable();
            
            // Navigate directly - no extra clicks needed
            navigateToCounty(selectedCounty);
        });

    } catch (err) {
        console.error("CRITICAL ERROR in initCountyDropdown:", err);
    }
}

/**
 * 2. TESTIMONIALS LOGIC
 */
async function setupTestimonials() {
    const fallbackData = [
        { _id: "1", quote: "Process was fast and easy. Highly recommend.", name: "Sarah M." },
        { _id: "2", quote: "They helped me at 3am when no one else would.", name: "John D." },
        { _id: "3", quote: "Professional and explained everything clearly.", name: "Michael R." },
        { _id: "4", quote: "Got my brother out in hours. Thank you!", name: "Emily S." },
        { _id: "5", quote: "Very respectful and understanding.", name: "David K." }
    ];

    let data = fallbackData;

    try {
        const result = await wixData.query(COLLECTIONS.TESTIMONIALS).limit(5).find();
        if (result.items.length > 0) data = result.items;
    } catch (err) {
        console.error("ERROR: Failed to load testimonials from CMS", err);
    }

    const rep = $w('#testimonialsRepeater');
    if (rep.length > 0) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            const quote = itemData.quote || itemData.text || itemData.message || "No quote provided";
            const name = itemData.name || itemData.author || "Anonymous";
            if ($item('#quoteText').length) $item('#quoteText').text = `"${quote}"`;
            if ($item('#authorName').length) $item('#authorName').text = name;
        });
    }
}

/**
 * 3. FAQ LOGIC
 */
async function setupFAQ() {
    const fallbackData = [
        { _id: "1", q: "Can bail be reduced?", a: "Yes. An attorney can file a motion to reduce bail." },
        { _id: "2", q: "Can I get my premium back?", a: "No. The 10% premium is non-refundable." },
        { _id: "3", q: "What if I can't afford 10%?", a: "We offer flexible payment plans." },
        { _id: "4", q: "How long does release take?", a: "2-8 hours on average." },
        { _id: "5", q: "Difference between Bail and Bond?", a: "Bail is the full amount; Bond is the 10% service." },
        { _id: "6", q: "Can anyone be denied bail?", a: "Yes, for capital offenses or flight risks." }
    ];

    let data = fallbackData;

    try {
        const result = await wixData.query(COLLECTIONS.FAQ).limit(10).find();
        if (result.items.length > 0) data = result.items;
    } catch (err) {
        console.error("ERROR: Failed to load FAQs from CMS", err);
    }

    const rep = $w('#faqRepeater');
    if (rep.length > 0) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            const question = itemData.q || itemData.question;
            const answerText = itemData.a || itemData.answer;
            if ($item('#faqQuestion').length) $item('#faqQuestion').text = question;
            if ($item('#faqAnswer').length) $item('#faqAnswer').text = answerText;
        });
    }
}

/**
 * 4. BOND AMOUNTS LOGIC
 */
async function setupBondAmounts() {
    const fallbackData = [
        { _id: "1", offense: "DUI (First Offense)", range: "$500 - $2,500" },
        { _id: "2", offense: "Domestic Violence", range: "$2,500 - $10,000" },
        { _id: "3", offense: "Drug Possession", range: "$1,000 - $25,000" },
        { _id: "4", offense: "Assault", range: "$5,000 - $25,000" },
        { _id: "5", offense: "Burglary", range: "$10,000 - $50,000" }
    ];

    let data = fallbackData;

    try {
        const result = await wixData.query(COLLECTIONS.COMMON_CHARGES).limit(20).find();
        if (result.items.length > 0) data = result.items;
    } catch (err) { }

    let rep = $w('#amountsRepeater');
    if (rep.length === 0) rep = $w('#bondAmountsRepeater');

    if (rep.length > 0) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            const offense = itemData.offense || itemData.chargeName || "Unknown";
            const range = itemData.range || itemData.bondAmount || "Varies";
            if ($item('#offenseName').length) $item('#offenseName').text = offense;
            if ($item('#bailRange').length) $item('#bailRange').text = range;
            if ($item('#chargeName').length) $item('#chargeName').text = offense; // Fallback ID
            if ($item('#amountText').length) $item('#amountText').text = range; // Fallback ID
        });
    }
}

/**
 * REUSABLE HANDLER for Start Process
 */
function handleStartProcess() {
    console.log("🚀 handleStartProcess() called!");
    
    // User Request: If county selected, go there. If not, go to Portal Landing.
    let dropdown = $w('#countyDropdown');
    console.log("  Checking #countyDropdown:", dropdown.type ? "Found" : "Not found");
    
    if (!dropdown.type) {
        dropdown = $w('#countySelector');
        console.log("  Checking #countySelector:", dropdown.type ? "Found" : "Not found");
    }
    
    if (!dropdown.type) {
        dropdown = $w('#dropdown1');
        console.log("  Checking #dropdown1:", dropdown.type ? "Found" : "Not found");
    }

    if (dropdown.type && dropdown.value) {
        console.log(`✅ County selected: ${dropdown.value}. Navigating to county page...`);
        navigateToCounty(dropdown.value);
    } else {
        console.log("✅ No county selected. Navigating to Portal Landing...");
        wixLocation.to('/portal-landing');
    }
}

export function beginProcessButton_click(event) { handleStartProcess(); }
export function spanishSpeakingPhone_click(event) { wixLocation.to("tel:12399550301"); }
export function spanishSpeakingPhone_dblClick(event) { wixLocation.to("tel:12399550301"); }

function safeBindAndLog(selector, eventName, handler) {
    const el = $w(selector);
    if (el.length > 0) {
        if (typeof el[eventName] === 'function') {
            try { el[eventName](handler); } catch (e) { }
        } else if (eventName === 'onClick') {
            try { el.onClick(handler); } catch (e) { }
        }
    }
}