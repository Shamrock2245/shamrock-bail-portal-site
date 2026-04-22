import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixSeo from 'wix-seo';
import { COLLECTIONS } from 'public/collectionIds';

$w.onReady(function () {
    console.log(" How Bail Works Page Loading...");

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
    console.log(" STARTING CMS DIAGNOSTIC CHECK...");

    const collectionsToCheck = [
        'Import22', 'Faqs', // Potential FAQ IDs (Import22 is the correct collection ID)
        'CommonCharges', 'Common Charges'
    ];

    for (const colId of collectionsToCheck) {
        try {
            const count = await wixData.query(colId).limit(1).count();
            console.log(` Collection '${colId}': Found ${count} items.`);
        } catch (e) {
            console.warn(`[X] Collection '${colId}': Query failed (might not exist). Error: ${e.message}`);
        }
    }
    console.log(" DIAGNOSTIC CHECK COMPLETE.");
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
            console.log(`[OK] Loaded ${result.items.length} Common Charges from CMS.`);
            data = result.items;
        } else {
            // Second try specifically if first returned empty (not error, but empty)
            const result2 = await wixData.query('Common Charges').ascending('sortOrder').limit(50).find();
            if (result2.items.length > 0) {
                console.log(`[OK] Loaded ${result2.items.length} from 'Common Charges'.`);
                data = result2.items;
            } else {
                console.warn("[!] No Common Charges in CMS (checked both aliases), using fallback data.");
            }
        }
    } catch (err) {
        console.error("[X] Failed to load Common Charges from CMS:", err);
    }

    // Use the correct ID from Wix Editor: #amountsRepeater
    const element = $w('#amountsRepeater');

    if (element) {
        console.log('[OK] Found #amountsRepeater element, type:', element.type);

        // DETECT ELEMENT TYPE: Check if it's a Table or a Repeater
        if (element.type === 'Table' || element.type === '$w.Table') {
            console.log(" Found Table element:", element.id);

            // Map CMS fields to table columns - BE ROBUST
            // The table likely expects columns 'offense' and 'range' OR 'bailRange'
            // We should inspect the first item keys to be sure, but we can't see the table config from here.
            // Best approach: Send comprehensive object.
            const tableRows = data.map(item => {
                // Find best candidates for Offense
                const offenseVal = item.offense || item.Offense || item.title || item['Charge'] || item['charge'] || "Unknown Offense";
                // Find best candidates for Range
                const rangeVal = item.bailRange || item['Bail Range'] || item.range || item['Bail Amount'] || item['amount'] || "Varies";

                return {
                    // Standard keys
                    offense: offenseVal,
                    range: rangeVal,
                    bailRange: rangeVal, // Duplicate for safety
                    // Fallback keys in case table columns are named differently
                    title: offenseVal,
                    amount: rangeVal,
                    // Pass original just in case
                    ...item
                };
            });

            element.rows = tableRows;
            console.log("[OK] Table rows set:", tableRows.length, "rows");

        } else {
            // It's a Repeater
            console.log(" Found Repeater element:", element.id);

            element.onItemReady(($item, itemData) => {
                // Map CMS field names (may have spaces or different casing)
                const offense = itemData.offense || itemData.Offense || itemData.title || itemData.offenseName || itemData.charge || "Unknown Offense";
                const range = itemData.bailRange || itemData['Bail Range'] || itemData.range || itemData.amount || "Varies";

                // Try multiple possible element IDs for flexibility
                const offenseEl = $item('#offenseName') || $item('#offense') || $item('#textOffense') || $item('#chargeName') || $item('#text1');
                const rangeEl = $item('#bailRange') || $item('#range') || $item('#textRange') || $item('#bailAmount') || $item('#text2');

                if (offenseEl && offenseEl.valid) {
                    offenseEl.text = offense;
                    offenseEl.expand();
                }
                if (rangeEl && rangeEl.valid) {
                    rangeEl.text = range;
                    rangeEl.expand();
                }
            });

            element.data = data;
        }
    } else {
        console.error('[X] #amountsRepeater element NOT found on page');
    }
}

// --- 6. FAQ Section ---
// Connects to CMS collection: "Faqs"
// CMS Fields: title (question), answer, category, sortOrder, isActive, relatedPage
async function setupFAQ() {
    const fallbackData = [
        {
            _id: "1",
            title: "How fast can you get someone out of jail?",
            answer: "Shamrock Bail Bonds can begin the release process within minutes of your call — 24 hours a day, 7 days a week. Once the bond is posted, Lee County Jail typically releases defendants within 4 to 8 hours. Larger facilities like Hillsborough or Miami-Dade may take 6 to 12 hours. Call (239) 332-2245 any time to start the clock."
        },
        {
            _id: "2",
            title: "How much does a bail bond cost in Florida?",
            answer: "A Florida bail bond costs 10% of the total bail amount, with a $100 minimum per charge. This premium is regulated by the Florida Department of Financial Services and is non-negotiable. For example, a $10,000 bail requires a $1,000 premium. A $125 transfer fee applies for counties outside Lee and Charlotte County."
        },
        {
            _id: "3",
            title: "Can bail be reduced after it is set?",
            answer: "Yes. A defense attorney can file a Motion for Bond Reduction at any time. Courts consider the nature of the charges, criminal history, community ties, and flight risk. While the motion is pending, Shamrock Bail Bonds can post the bond at the current amount so your loved one is not waiting in jail."
        },
        {
            _id: "4",
            title: "Is the bail bond premium refundable?",
            answer: "No. The 10% bail bond premium is a non-refundable service fee, even if charges are dropped or the defendant is found not guilty. It compensates the bondsman for assuming financial risk. However, if the case is resolved quickly, Shamrock may offer partial credit toward future services."
        },
        {
            _id: "5",
            title: "What is an indemnitor and what are they responsible for?",
            answer: "An indemnitor (co-signer) is the person who guarantees the defendant will appear at all court dates by signing the bail bond agreement. If the defendant fails to appear, the indemnitor becomes financially responsible for the full bail amount. Indemnitors should have stable local roots and be confident in the defendant's reliability."
        },
        {
            _id: "6",
            title: "What happens if I can't afford the 10% premium?",
            answer: "Shamrock Bail Bonds offers flexible payment plans when you cannot pay the full premium upfront. You can make a down payment and pay the balance over time. We evaluate each situation individually — income, family circumstances, and case details all factor in. Call (239) 332-2245 to discuss a plan that works for you."
        },
        {
            _id: "7",
            title: "What is the difference between bail and a bail bond?",
            answer: "Bail is the full cash amount the court requires to release a defendant — set by a judge. A bail bond is a surety agreement where a licensed bondsman pledges to pay that full amount if the defendant fails to appear, in exchange for a 10% premium. Most families use a bail bond because they cannot afford cash bail."
        },
        {
            _id: "8",
            title: "Can anyone be denied bail in Florida?",
            answer: "Yes. Florida judges can deny bail for capital offenses (murder, rape), defendants deemed a danger to the community, or those with a demonstrated history of failing to appear. Under the Florida Constitution, pre-trial detention without bail is possible but requires a hearing and specific findings by the judge."
        },
        {
            _id: "9",
            title: "Does Shamrock Bail Bonds handle felony bail bonds?",
            answer: "Yes. Shamrock Bail Bonds posts bonds for both misdemeanor and felony charges throughout Florida. Felony bonds typically carry higher bail amounts set at a First Appearance hearing or later bail hearing. Our bondsmen are experienced with serious charges including drug offenses, assault, DUI manslaughter, and weapons charges."
        },
        {
            _id: "10",
            title: "Can a bail bond be revoked after release?",
            answer: "Yes. A bail bond can be revoked if the defendant violates release conditions — such as failing to appear in court, getting arrested again, violating a no-contact order, or leaving the state without permission. The indemnitor should immediately notify Shamrock Bail Bonds of any potential violations to avoid bond forfeiture."
        },
        {
            _id: "11",
            title: "Does Shamrock Bail Bonds require collateral?",
            answer: "Collateral is required for large bonds or high-risk situations. Acceptable collateral includes real estate equity, vehicles, jewelry, or cash deposits. For most standard bonds in Florida, a creditworthy co-signer and the 10% premium are sufficient. All collateral is returned once the case concludes and bond obligations are fulfilled."
        },
        {
            _id: "12",
            title: "How does the bail process work for immigration bonds?",
            answer: "Immigration bonds are federal bonds set by ICE or an immigration judge that allow a detained non-citizen to be released pending immigration proceedings. They function similarly to criminal bail bonds but involve federal courts and higher amounts. Call Shamrock Bail Bonds at (239) 332-2245 — we provide bilingual immigration bond assistance."
        }
    ];

    let data = fallbackData;

    try {
        // Query Import 22 OR Faqs
        let result;
        const pagePath = '/how-bail-works';

        // 1. Try 'Import22' (Correct Collection ID - no space)
        // STRATEGY: Try specific first, then broad (removing active/page filters)
        try {
            console.log("Checking Import22 (Faqs collection)...");
            // Attempt 1: Strict (Active + Page)
            result = await wixData.query('Import22').eq('isActive', true).contains('relatedPage', pagePath).ascending('sortOrder').limit(20).find();

            // Attempt 2: Active only
            if (result.items.length === 0) {
                console.log("...Strict search empty. Trying active items...");
                result = await wixData.query('Import22').eq('isActive', true).limit(20).find();
            }

            // Attempt 3: ANYTHING (Just to get data on screen)
            if (result.items.length === 0) {
                console.log("...Active search empty. Fetching ANY items from Import22...");
                result = await wixData.query('Import22').limit(20).find();
            }

        } catch (e) {
            console.warn("Import22 query failed, trying 'Faqs' display name...", e);
        }

        // 2. Try 'Faqs' display name if Import22 failed
        if (!result || result.items.length === 0) {
            try {
                // Same fallback strategy
                result = await wixData.query('Faqs').eq('isActive', true).contains('relatedPage', pagePath).ascending('sortOrder').limit(20).find();
                if (result.items.length === 0) {
                    result = await wixData.query('Faqs').limit(10).find();
                }
            } catch (e) { console.warn("Faqs query failed."); }
        }

        if (result && result.items.length > 0) {
            console.log(`[OK] Loaded ${result.items.length} FAQs from CMS.`);
            data = result.items;
        } else {
            console.warn("[!] No FAQs found in either Import22 or Faqs collections.");
        }

    } catch (err) {
        console.error("[X] Failed to load FAQs from CMS (All attempts failed):", err);
    }

    // Bind data to the FAQ repeater
    // Use the correct ID from Wix Editor: #faqRepeater
    const rep = $w('#faqRepeater');
    if (rep) {
        console.log('[OK] Found #faqRepeater element');

        rep.onItemReady(($item, itemData) => {
            console.log("Rendering FAQ Item:", itemData);

            // Map CMS fields
            const question = itemData.title || itemData.question || itemData.q || "No Question";
            const answerText = itemData.answer || itemData.a || "No Answer";

            // Get elements - IDs confirmed from Wix Editor Layers panel
            const questionEl = $item('#faqQuestion');
            const answerEl = $item('#faqAnswer');
            const container = $item('#faqContainer');
            const box = $item('#box4');

            // Set question text
            if (questionEl) {
                questionEl.text = question;
            }

            // Set answer text on CollapsibleText element
            if (answerEl) {
                // Expand first, set text, then collapse
                answerEl.expandText();
                answerEl.text = answerText;
                answerEl.collapseText();
                // Note: readMoreActionType must be configured in Wix Editor (read-only property)
            }
        });

        rep.data = data;
        console.log(`[OK] FAQ Repeater populated with ${data.length} items.`);
    } else {
        console.error('[X] #faqRepeater not found on page');
    }

    // Trigger SEO Update with FAQ structured data
    updatePageSEO(data);
}

// --- 7. SEO Injection ---
function updatePageSEO(faqItems) {
    // 0. Meta Tags (Title, Description, OG, Twitter)
    const title = 'How Bail Works in Florida | Bail Bond Process Explained | Shamrock Bail Bonds';
    const description = 'Learn how bail bonds work in Florida. Step-by-step guide to posting bail, payment options, jail release times, and what co-signers need to know. 24/7 help: (239) 332-2245.';
    const pageUrl = 'https://www.shamrockbailbonds.biz/how-bail-works';

    wixSeo.setTitle(title);
    wixSeo.setMetaTags([
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: pageUrl },
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: 'https://www.shamrockbailbonds.biz/logo.png' },
        { property: 'og:locale', content: 'en_US' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: 'https://www.shamrockbailbonds.biz/logo.png' },
        { name: 'keywords', content: 'how bail works, bail bond process Florida, posting bail Florida, bail bond co-signer, jail release process, bail bond payment plans, Florida bail laws, how to get someone out of jail' }
    ]);

    wixSeo.setLinks([
        { rel: 'canonical', href: pageUrl }
    ]);

    // 1. FAQ Schema (with speakable for voice/GEO)
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
        })),
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": [".faq-question", ".faq-answer", "h1", "h2"]
        }
    };

    // 2. HowTo Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Post Bail in Florida",
        "description": "A step-by-step guide to posting bail and getting someone released from jail in Florida.",
        "totalTime": "PT2H",
        "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "10% of bail amount"
        },
        "step": [
            {
                "@type": "HowToStep",
                "position": 1,
                "name": "Contact a Bail Bondsman",
                "text": "Call Shamrock Bail Bonds at (239) 332-2245. Available 24/7, including holidays.",
                "url": "https://www.shamrockbailbonds.biz/contact"
            },
            {
                "@type": "HowToStep",
                "position": 2,
                "name": "Provide Defendant Information",
                "text": "Share the defendant's full name, booking number, charges, and jail location.",
                "url": "https://www.shamrockbailbonds.biz/how-bail-works"
            },
            {
                "@type": "HowToStep",
                "position": 3,
                "name": "Complete Paperwork",
                "text": "Sign the bail bond application digitally. Co-signers (indemnitors) are usually required.",
                "url": "https://www.shamrockbailbonds.biz/portal-landing"
            },
            {
                "@type": "HowToStep",
                "position": 4,
                "name": "Pay the Premium",
                "text": "Pay 10% of the bail amount (Florida-regulated rate). Payment plans available.",
                "url": "https://www.shamrockbailbonds.biz/how-bail-works"
            },
            {
                "@type": "HowToStep",
                "position": 5,
                "name": "Await Release",
                "text": "The bond is posted at the jail. Release times vary by facility (typically 4-12 hours).",
                "url": "https://www.shamrockbailbonds.biz/how-bail-works"
            }
        ],
        "tool": [
            { "@type": "HowToTool", "name": "Valid government-issued photo ID" },
            { "@type": "HowToTool", "name": "Defendant's booking information" },
            { "@type": "HowToTool", "name": "Payment method (cash, credit/debit card)" }
        ]
    };

    // 3. BreadcrumbList Schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.shamrockbailbonds.biz/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "How Bail Works",
                "item": "https://www.shamrockbailbonds.biz/how-bail-works"
            }
        ]
    };

    // 4. LocalBusiness Schema (fully enriched for rich snippet eligibility)
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": "https://www.shamrockbailbonds.biz/#organization",
        "name": "Shamrock Bail Bonds",
        "legalName": "Shamrock Bail Bonds LLC",
        "url": "https://www.shamrockbailbonds.biz",
        "logo": "https://www.shamrockbailbonds.biz/logo.png",
        "image": "https://www.shamrockbailbonds.biz/logo.png",
        "description": "Florida's most responsive and reliable bail bond service, offering 24/7 assistance across all 67 counties.",
        "foundingDate": "2012-03-15",
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
        "areaServed": {
            "@type": "State",
            "name": "Florida"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-239-332-2245",
            "contactType": "customer service",
            "areaServed": "FL",
            "availableLanguage": ["English", "Spanish"],
            "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            }
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "reviewCount": "150"
        },
        "sameAs": [
            "https://www.facebook.com/ShamrockBail",
            "https://www.instagram.com/shamrock_bail_bonds",
            "https://t.me/ShamrockBail_bot"
        ]
    };

    wixSeo.setStructuredData([faqSchema, howToSchema, breadcrumbSchema, localBusinessSchema])
        .then(() => console.log("SEO: Structured Data Set Successfully"))
        .catch(err => console.error("SEO: Failed to set structured data", err));
}
