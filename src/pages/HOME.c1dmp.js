// HOME.c1dmp.js
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import { COLLECTIONS } from 'public/collectionIds';
import { getCounties } from 'public/countyUtils';
import { LightboxController } from 'public/lightbox-controller';

$w.onReady(async function () {
    console.log("🚀 HOME PAGE LOADED - PRODUCTION MODE v2.0");

    // Initialize Lightbox Controller
    LightboxController.init($w);
    LightboxController.initEmergencyCtaLightbox();
    LightboxController.initPrivacyLightbox();
    LightboxController.initTermsLightbox();

    // 1. Initialize County Dropdown
    await initCountyDropdown();

    // 2. Setup Testimonials
    setupTestimonials();

    // 3. Setup FAQ (Added)
    setupFAQ();

    // 4. Setup Common Charges (Added)
    setupBondAmounts();

    // 5. Setup Spanish Speaking Phone Button (Defensive)
    const spanishBtn = $w("#callNowSpanishBtn");
    if (spanishBtn.length > 0) {
        spanishBtn.onClick(() => wixLocation.to("tel:12399550301"));
        spanishBtn.onDblClick(() => wixLocation.to("tel:12399550301"));
    }
});


/**
 * ------------------------------------------------------------------
 * 1. COUNTY DROPDOWN LOGIC
 * ------------------------------------------------------------------
 */
async function initCountyDropdown() {
    console.log("DEBUG: initCountyDropdown() calling...");

    try {
        // 1. ROBUST ELEMENT SELECTION
        let dropdown = $w('#countySelector');

        if (dropdown.length === 0) {
            console.warn("DEBUG: #countySelector not found. Trying #dropdown1 fallback...");
            dropdown = $w('#dropdown1');
        }

        if (dropdown.length === 0) {
            console.error('CRITICAL: All Dropdown selectors failed.');
            return;
        }

        console.log(`DEBUG: Dropdown found! ID: ${dropdown.id}`);

        // 2. Initialize with "Loading..." state if possible, or simple placeholder
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
                    value: `/county/${slug}`
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));

        // 6. Set Options
        console.log("DEBUG: Setting " + options.length + " options.");

        // Force reset
        dropdown.options = [];
        setTimeout(() => {
            dropdown.options = options;
            dropdown.placeholder = "Select a County";
            // Force visibility
            if (dropdown.collapsed) dropdown.expand();
            if (dropdown.hidden) dropdown.show();
        }, 100);

        // 7. Change Handler
        dropdown.onChange((event) => {
            const dest = event.target.value;
            console.log("Navigation triggered to:", dest);
            if (dest) wixLocation.to(dest);
        });

    } catch (err) {
        console.error("CRITICAL ERROR in initCountyDropdown:", err);
    }
}


/**
 * ------------------------------------------------------------------
 * 2. TESTIMONIALS LOGIC
 * ------------------------------------------------------------------
 */
/**
 * ------------------------------------------------------------------
 * 2. TESTIMONIALS LOGIC
 * ------------------------------------------------------------------
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
        const result = await wixData.query(COLLECTIONS.TESTIMONIALS)
            .limit(5)
            .find();

        if (result.items.length > 0) {
            console.log(`DEBUG: Loaded ${result.items.length} testimonials from CMS.`);
            data = result.items;
        } else {
            console.warn("DEBUG: No testimonials in CMS, using fallback.");
        }
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
    } else {
        console.warn("DEBUG: #testimonialsRepeater not found");
    }
}


/**
 * ------------------------------------------------------------------
 * 3. FAQ LOGIC (New)
 * ------------------------------------------------------------------
 */
/**
 * ------------------------------------------------------------------
 * 3. FAQ LOGIC (New)
 * ------------------------------------------------------------------
 */
async function setupFAQ() {
    const fallbackData = [
        { _id: "1", q: "Can bail be reduced?", a: "Yes. An attorney can file a motion to reduce bail if it is excessive or circumstances change." },
        { _id: "2", q: "Can I get my premium back?", a: "No. The 10% premium is a non-refundable service fee earned by the bondsman." },
        { _id: "3", q: "What if I can't afford 10%?", a: "We offer flexible payment plans. Call us to discuss options." },
        { _id: "4", q: "How long does release take?", a: "Typical release times are 2-8 hours after we post the bond, depending on the jail." },
        { _id: "5", q: "Difference between Bail and Bond?", a: "Bail is the full amount set by court. Bond is the 10% service we provide." },
        { _id: "6", q: "Can anyone be denied bail?", a: "Yes. Bail can be denied for capital offenses, flight risks, or danger to the community." }
    ];

    let data = fallbackData;

    try {
        const result = await wixData.query(COLLECTIONS.FAQ)
            .limit(10)
            .find();

        if (result.items.length > 0) {
            console.log(`DEBUG: Loaded ${result.items.length} FAQs from CMS.`);
            data = result.items;
        } else {
            console.warn("DEBUG: No FAQs in CMS, using fallback.");
        }
    } catch (err) {
        console.error("ERROR: Failed to load FAQs from CMS", err);
    }

    const rep = $w('#faqRepeater');
    if (rep.length > 0) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            const question = itemData.q || itemData.question || "No Question";
            const answerText = itemData.a || itemData.answer || "No Amswer";

            if ($item('#faqQuestion').length) $item('#faqQuestion').text = question;

            // Handle Answer Text
            const answer = $item('#faqAnswer');
            if (answer.length > 0) {
                answer.text = answerText;
            }
        });
    } else {
        console.warn("DEBUG: #faqRepeater not found. Checked: #faqRepeater");
    }
}


/**
 * ------------------------------------------------------------------
 * 4. BOND AMOUNTS LOGIC (New)
 * ------------------------------------------------------------------
 */
/**
 * ------------------------------------------------------------------
 * 4. BOND AMOUNTS LOGIC (New)
 * ------------------------------------------------------------------
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
        const result = await wixData.query(COLLECTIONS.COMMON_CHARGES)
            .limit(20)
            .find();

        if (result.items.length > 0) {
            console.log(`DEBUG: Loaded ${result.items.length} Common Charges from CMS.`);
            data = result.items;
        } else {
            console.warn("DEBUG: No Common Charges in CMS, using fallback.");
        }
    } catch (err) {
        console.error("ERROR: Failed to load Common Charges from CMS", err);
    }

    // Try finding the repeater. User called it "common charge and bond amounts"
    // Likely IDs: #amountsRepeater, #bondAmountsRepeater, #chargesRepeater
    let rep = $w('#amountsRepeater');
    if (rep.length === 0) rep = $w('#bondAmountsRepeater');

    if (rep.length > 0) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            const offense = itemData.offense || itemData.chargeName || itemData.title || "Unknown Offense";
            const range = itemData.range || itemData.bondAmount || itemData.amount || "Varies";

            // Try common field IDs
            if ($item('#offenseName').length) $item('#offenseName').text = offense;
            if ($item('#bailRange').length) $item('#bailRange').text = range;

            // Fallbacks
            if ($item('#chargeName').length) $item('#chargeName').text = offense;
            if ($item('#amountText').length) $item('#amountText').text = range;
        });
    } else {
        console.warn("DEBUG: Bond/Amounts Repeater not found. Checked: #amountsRepeater, #bondAmountsRepeater");
    }
}

/**
 * EXPORTS (For Editor wiring)
 */
export function beginProcessButton_click(event) {
    const dropdown = $w('#countySelector');
    if (dropdown.length > 0 && dropdown.value) {
        wixLocation.to(dropdown.value);
    } else {
        wixLocation.to('/portal');
    }
}
export function spanishSpeakingPhone_click(event) { wixLocation.to("tel:12399550301"); }
export function spanishSpeakingPhone_dblClick(event) { wixLocation.to("tel:12399550301"); }
