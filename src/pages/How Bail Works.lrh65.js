import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixSeo from 'wix-seo';
import { COLLECTIONS } from 'public/collectionIds';

$w.onReady(function () {
    console.log("🚀 How Bail Works Page Loading...");

    // 1. Setup Data for Repeaters
    setupBailProcess();
    setupBailBondsExplained();
    setupTypesOfBail();
    setupBailAmounts();
    setupCommonBailAmounts();
    setupFAQ();

    // 2. Setup Buttons
    const startBtn = $w('#startBailProcessBtn');
    if (startBtn.valid) startBtn.onClick(() => wixLocation.to('/portal-landing'));

    const bottomOnline = $w('#bottomOnlineBtn');
    if (bottomOnline.valid) bottomOnline.onClick(() => wixLocation.to('/portal-landing'));

    const bottomCall = $w('#bottomCallBtn');
    if (bottomCall.valid) bottomCall.onClick(() => wixLocation.to('tel:12393322245')); // Real Shamrock number
    // 3. DEBUG CMS (User Request)
    debugCMS();
});

async function debugCMS() {
    console.log("🕵️‍♀️ STARTING CMS DIAGNOSTIC CHECK...");

    const collectionsToCheck = [
        'Faqs', 'Import 22', 'Import22', // Potential FAQ IDs (Screenshot showed 'Import 22')
        'CommonCharges', 'Common Charges'
    ];

    for (const colId of collectionsToCheck) {
        try {
            const count = await wixData.query(colId).limit(1).count();
            console.log(`🔎 Collection '${colId}': Found ${count} items.`);
        } catch (e) {
            console.warn(`❌ Collection '${colId}': Query failed (might not exist). Error: ${e.message}`);
        }
    }
    console.log("🕵️‍♀️ DIAGNOSTIC CHECK COMPLETE.");
}

// --- 1. The Arrest Process ---
function setupBailProcess() {
    const data = [
        { _id: "1", title: "Booking", text: "After arrest, the defendant is taken to jail for booking. This includes fingerprinting, photographing, and recording personal information. This process typically takes 2-4 hours." },
        { _id: "2", title: "Bail Setting", text: "A judge reviews the case and sets a bail amount. For common offenses, there may be a pre-set bail schedule. For more serious charges, a bail hearing may be required." },
        { _id: "3", title: "Bail Payment Options", text: "Once bail is set, you have three options: Cash Bail (pay full to court), Property Bond (use collateral), or Bail Bond (pay 10% to bondsman)." },
        { _id: "4", title: "Release", text: "After bail is posted, the jail processes the release. This can take anywhere from 2-12 hours depending on the facility." },
        { _id: "5", title: "Court Appearances", text: "The defendant must appear at all scheduled court dates. Failure to appear results in bail forfeiture and an arrest warrant." }
    ];

    // Note: User might not be using a repeater for this section yet based on specs, 
    // but if they do (recommended), here is the ID.
    /* 
    const rep = $w('#processRepeater');
    if(rep.valid) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            $item('#stepTitle').text = itemData.title;
            $item('#stepText').text = itemData.text;
        });
    }
    */
}

// --- 2. Bail Bonds Explained ---
function setupBailBondsExplained() {
    const data = [
        { _id: "1", title: "The Cost", body: "In Florida, bail bond premiums are regulated at 10% of the total bail amount. If bail is $10,000, you pay $1,000. This is non-refundable." },
        { _id: "2", title: "The Process", body: "1. Contact Shamrock\n2. Provide defendant info\n3. Pay premium & sign\n4. We post bail\n5. Defendant released" },
        { _id: "3", title: "Responsibility", body: "As the indemnitor (signer), you guarantee the defendant appears in court. If they skip, you are liable for the full bail amount." },
        { _id: "4", title: "Collateral", body: "For large bonds, we may need collateral (real estate, cash, cars) to secure the bond. It is returned when the case closes." }
    ];

    const rep = $w('#bondsRepeater');
    if (rep.valid) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            $item('#cardTitle').text = itemData.title;
            $item('#cardBody').text = itemData.body;
        });
    }
}

// --- 3. Types of Bail ---
function setupTypesOfBail() {
    const data = [
        {
            _id: "1",
            title: "Cash Bail",
            body: "Pay the full bail amount in cash directly to the court. The full amount is returned (minus fees) when case concludes.",
            prosCons: "Pros: Full refund if they appear.\nCons: Ties up large amounts of cash."
        },
        {
            _id: "2",
            title: "Surety Bond (Bail Bond)",
            body: "A bail bondsman posts the full amount on your behalf for a 10% premium.",
            prosCons: "Pros: Only need 10% upfront, professional help.\nCons: Premium is non-refundable."
        },
        {
            _id: "3",
            title: "Property Bond",
            body: "Use real estate as collateral. Property must have equity equal to 150% of the bail amount.",
            prosCons: "Pros: No cash needed.\nCons: Complex, slow, risk of losing property."
        },
        {
            _id: "4",
            title: "Release on Own Recognizance",
            body: "Judge releases defendant on their promise to appear without money.",
            prosCons: "Pros: Free.\nCons: Only for minor offenses/low risk."
        }
    ];

    const rep = $w('#typesRepeater');
    if (rep.valid) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            $item('#typeTitle').text = itemData.title;
            $item('#typeBody').text = itemData.body;
            const pc = $item('#typeProsCons');
            if (pc.valid) pc.text = itemData.prosCons;
        });
    }
}

// --- 4. How Bail Is Determined (Factors) ---
function setupBailAmounts() {
    const data = [
        { _id: "1", title: "Severity of Offense", body: "Violent crimes and felonies have higher bail than misdemeanors." },
        { _id: "2", title: "Criminal History", body: "Prior arrests, convictions, and 'Failures to Appear' increase bail." },
        { _id: "3", title: "Flight Risk", body: "Ties to community (job, family) lower flight risk. No ties = higher bail." },
        { _id: "4", title: "Public Safety", body: "If defendant is a danger to the public, bail may be denied or set very high." }
    ];

    const rep = $w('#factorsRepeater');
    if (rep.valid) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            $item('#factorTitle').text = itemData.title;
            $item('#factorBody').text = itemData.body;
        });
    }
}

// --- 5. Common Bail Amounts (Table) ---
// Connects to CMS collection: "CommonCharges" (Common Charges)
// CMS Fields: Offense (text), Bail Range (text)
async function setupCommonBailAmounts() {
    const fallbackData = [
        { _id: "1", offense: "DUI (First Offense)", bailRange: "$500 - $2,500" },
        { _id: "2", offense: "Domestic Violence", bailRange: "$2,500 - $10,000" },
        { _id: "3", offense: "Drug Possession", bailRange: "$1,000 - $25,000" },
        { _id: "4", offense: "Assault", bailRange: "$5,000 - $25,000" },
        { _id: "5", offense: "Burglary", bailRange: "$10,000 - $50,000" }
    ];

    let data = fallbackData;

    try {
        // Query CommonCharges OR Common Charges
        let result;

        try {
            result = await wixData.query('CommonCharges').ascending('sortOrder').limit(50).find();
        } catch (e) {
            console.warn("CommonCharges failed, trying 'Common Charges'...");
            result = await wixData.query('Common Charges').ascending('sortOrder').limit(50).find();
        }

        if (result && result.items.length > 0) {
            console.log(`✅ Loaded ${result.items.length} Common Charges from CMS.`);
            data = result.items;
        } else {
            // Second try specifically if first returned empty (not error, but empty)
            const result2 = await wixData.query('Common Charges').ascending('sortOrder').limit(50).find();
            if (result2.items.length > 0) {
                console.log(`✅ Loaded ${result2.items.length} from 'Common Charges'.`);
                data = result2.items;
            } else {
                console.warn("⚠️ No Common Charges in CMS (checked both aliases), using fallback data.");
            }
        }
    } catch (err) {
        console.error("❌ Failed to load Common Charges from CMS:", err);
    }

    const element = $w('#amountsRepeater');

    if (element && element.valid) {
        // DETECT ELEMENT TYPE: Check if it's a Table or a Repeater
        if (element.type === '$w.Table') {
            console.log("📊 #amountsRepeater is a Table. Setting rows.");

            // Map CMS fields to table columns
            // CMS uses: "Offense" and "Bail Range" (with space)
            const tableRows = data.map(item => ({
                // Map to column keys expected by the table
                offense: item.offense || item.Offense || item.title || "Unknown Offense",
                range: item.bailRange || item['Bail Range'] || item.range || "Varies"
            }));

            element.rows = tableRows;

        } else {
            // It's a Repeater
            console.log("🔄 #amountsRepeater is a Repeater. Binding items.");

            // FIX: Set onItemReady BEFORE setting data
            element.onItemReady(($item, itemData) => {
                // Map CMS field names (may have spaces or different casing)
                const offense = itemData.offense || itemData.Offense || itemData.title || itemData.offenseName || "Unknown Offense";
                const range = itemData.bailRange || itemData['Bail Range'] || itemData.range || itemData.amount || "Varies";

                // Try multiple possible element IDs for flexibility
                // User mentioned "first field offense, second field range"
                // Added: #text1, #text2 (common defaults), #offenseText, #rangeText
                const offenseEl = $item('#offenseName') || $item('#offense') || $item('#chargeName') || $item('#textOffense') || $item('#offenseText') || $item('#title');
                const rangeEl = $item('#bailRange') || $item('#range') || $item('#amount') || $item('#textRange') || $item('#rangeText') || $item('#subtitle');

                if (offenseEl && offenseEl.valid) offenseEl.text = offense;
                if (rangeEl && rangeEl.valid) rangeEl.text = range;

                // Debug log if elements missing
                if (!offenseEl || !offenseEl.valid) console.warn("⚠️ Could not find 'Offense' text element in #amountsRepeater item");
                if (!rangeEl || !rangeEl.valid) console.warn("⚠️ Could not find 'Range' text element in #amountsRepeater item");
            });

            element.data = data;
        }
    } else {
        console.error('❌ #amountsRepeater not found on page');
    }
}

// --- 6. FAQ Section ---
// Connects to CMS collection: "Faqs"
// CMS Fields: title (question), answer, category, sortOrder, isActive, relatedPage
async function setupFAQ() {
    const fallbackData = [
        { _id: "1", title: "Can bail be reduced?", answer: "Yes. An attorney can file a motion to reduce bail if it is excessive or circumstances change." },
        { _id: "2", title: "Can I get my premium back?", answer: "No. The 10% premium is a non-refundable service fee earned by the bondsman." },
        { _id: "3", title: "What if I can't afford 10%?", answer: "We offer flexible payment plans. Call us to discuss options." },
        { _id: "4", title: "How long does release take?", answer: "Typical release times are 2-8 hours after we post the bond, depending on the jail." },
        { _id: "5", title: "Difference between Bail and Bond?", answer: "Bail is the full amount set by court. Bond is the 10% service we provide." },
        { _id: "6", title: "Can anyone be denied bail?", answer: "Yes. Bail can be denied for capital offenses, flight risks, or danger to the community." }
    ];

    let data = fallbackData;

    try {
        // Query Import 22 OR Faqs
        let result;
        const pagePath = '/how-bail-works';

        // 1. Try 'Import 22' (Exact ID from Screenshot)
        try {
            console.log("Checking Import 22...");
            result = await wixData.query('Import 22').eq('isActive', true).contains('relatedPage', pagePath).ascending('sortOrder').limit(20).find();
            if (result.items.length === 0) {
                // Try general if page specific not found
                result = await wixData.query('Import 22').eq('isActive', true).ascending('sortOrder').limit(10).find();
            }
        } catch (e) {
            console.warn("Import 22 failed, trying 'Faqs'...");
        }

        // 2. Try 'Faqs' (Standard ID)
        if (!result || result.items.length === 0) {
            try {
                result = await wixData.query('Faqs').eq('isActive', true).contains('relatedPage', pagePath).ascending('sortOrder').limit(20).find();
                if (result.items.length === 0) {
                    result = await wixData.query('Faqs').eq('isActive', true).ascending('sortOrder').limit(10).find();
                }
            } catch (e) { console.warn("Faqs query failed."); }
        }

        if (result && result.items.length > 0) {
            console.log(`✅ Loaded ${result.items.length} FAQs from CMS.`);
            data = result.items;
        } else {
            console.warn("⚠️ No FAQs found in either Import22 or Faqs.");
        }

    } catch (err) {
        console.error("❌ Failed to load FAQs from CMS (All attempts failed):", err);
    }

    // Bind data to the FAQ repeater
    const rep = $w('#faqRepeater');
    if (rep && rep.valid) {
        console.log(`📝 Binding ${data.length} items to #faqRepeater`);

        // FIX: Set onItemReady BEFORE setting data
        rep.onItemReady(($item, itemData) => {
            // Map CMS field names to repeater elements
            // CMS uses: title (question), answer
            const question = itemData.title || itemData.question || itemData.q || "No Question";
            const answerText = itemData.answer || itemData.a || "No Answer";

            // Try multiple possible element IDs for flexibility
            // Added: #textQuestion, #textAnswer, #description (standard Wix List), #content
            const questionEl = $item('#faqQuestion') || $item('#question') || $item('#title') || $item('#textQuestion') || $item('#questionText');
            const answerEl = $item('#faqAnswer') || $item('#answer') || $item('#text') || $item('#textAnswer') || $item('#answerText') || $item('#description') || $item('#content');

            if (questionEl && questionEl.valid) questionEl.text = question;
            if (answerEl && answerEl.valid) answerEl.text = answerText;

            // Debug log if elements missing
            if (!questionEl || !questionEl.valid) console.warn("⚠️ Could not find 'Question' text element in #faqRepeater item");
            if (!answerEl || !answerEl.valid) console.warn("⚠️ Could not find 'Answer' text element in #faqRepeater item");

            // Expand item if collapsed (sometimes happens)
            if ($item('#faqAnswer').collapsed) $item('#faqAnswer').expand();
        });

        rep.data = data;
        console.log(`✅ FAQ Repeater populated.`);
    } else {
        console.error('❌ #faqRepeater not found on page');
    }

    // Trigger SEO Update with FAQ structured data
    updatePageSEO(data);
}

// --- 7. SEO Injection ---
function updatePageSEO(faqItems) {
    // 1. FAQ Schema
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(item => ({
            "@type": "Question",
            "name": item.title || item.question || item.q || "Question",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer || item.a || "Answer"
            }
        }))
    };

    // 2. HowTo Schema (The Arrest Process)
    // Matching data from setupBailProcess()
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How the Bail Bond Process Works",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Booking",
                "text": "After arrest, the defendant is taken to jail for booking. This includes fingerprinting, photographing, and recording personal information. This process typically takes 2-4 hours."
            },
            {
                "@type": "HowToStep",
                "name": "Bail Setting",
                "text": "A judge reviews the case and sets a bail amount. For common offenses, there may be a pre-set bail schedule. For more serious charges, a bail hearing may be required."
            },
            {
                "@type": "HowToStep",
                "name": "Bail Payment Options",
                "text": "Once bail is set, you have three options: Cash Bail (pay full to court), Property Bond (use collateral), or Bail Bond (pay 10% to bondsman)."
            },
            {
                "@type": "HowToStep",
                "name": "Release",
                "text": "After bail is posted, the jail processes the release. This can take anywhere from 2-12 hours depending on the facility."
            },
            {
                "@type": "HowToStep",
                "name": "Court Appearances",
                "text": "The defendant must appear at all scheduled court dates. Failure to appear results in bail forfeiture and an arrest warrant."
            }
        ]
    };

    wixSeo.setStructuredData([faqSchema, howToSchema])
        .then(() => console.log("SEO: Structured Data Set Successfully"))
        .catch(err => console.error("SEO: Failed to set structured data", err));
}
