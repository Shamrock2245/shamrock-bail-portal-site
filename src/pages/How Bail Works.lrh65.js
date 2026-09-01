import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixSeo from 'wix-seo';
import { COLLECTIONS } from 'public/collectionIds';
import { buildPaperworkLaunchpadUrl } from 'public/portal-config';

function firstValid(ids) {
    for (let i = 0; i < ids.length; i++) {
        try {
            const el = $w(ids[i]);
            if (el && el.valid) return el;
        } catch (e) { /* skip */ }
    }
    return null;
}

function firstTable() {
    const named = firstValid(['#chargesTable', '#table1', '#table2', '#comp-mjvk9syv']);
    if (named) return named;
    try {
        const tables = $w('Table');
        if (tables && tables.valid) {
            console.log('[OK] Bound charges via $w("Table") id=', tables.id);
            return tables;
        }
    } catch (e) { /* no table type */ }
    return null;
}

function firstOffenseRepeater() {
    return firstValid([
        '#repeater1',
        '#amountsRepeater',
        '#offenseRepeater',
        '#comp-mtirvxwp',
        '#comp-mtiridhe',
        '#comp-mtiridig'
    ]);
}

function firstRangeRepeater() {
    return firstValid([
        '#repeater2',
        '#rangeRepeater',
        '#bailRangeRepeater',
        '#comp-mtirx40l'
    ]);
}

function firstFaqRepeater() {
    const named = firstValid(['#faqRepeater', '#repeaterFAQ', '#listRepeater', '#comp-mjxe7ggr']);
    if (named) return named;
    const skip = {
        bondsRepeater: true,
        typesRepeater: true,
        factorsRepeater: true,
        processRepeater: true,
        amountsRepeater: true,
        repeater1: true,
        repeater2: true,
        offenseRepeater: true,
        rangeRepeater: true,
        'comp-mtirvxwp': true,
        'comp-mtirx40l': true,
        'comp-mtiridhe': true,
        'comp-mtiridig': true
    };
    try {
        const all = $w('Repeater');
        const ids = String((all && all.id) || '').split(',').map((s) => s.trim()).filter(Boolean);
        for (let i = 0; i < ids.length; i++) {
            const nick = ids[i].replace(/^#/, '');
            if (skip[nick]) continue;
            const el = $w('#' + nick);
            if (el && el.valid) {
                console.log('[OK] Bound FAQs via Repeater id=', nick);
                return el;
            }
        }
    } catch (e) { /* no repeater type */ }
    return null;
}

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
    if (startBtn.valid) startBtn.onClick(() => wixLocation.to(buildPaperworkLaunchpadUrl({ source: 'wix-how-bail-works' })));

    const bottomOnline = $w('#bottomOnlineBtn');
    if (bottomOnline.valid) bottomOnline.onClick(() => wixLocation.to(buildPaperworkLaunchpadUrl({ source: 'wix-how-bail-works' })));

    const bottomCall = $w('#bottomCallBtn');
    if (bottomCall.valid) bottomCall.onClick(() => wixLocation.to('tel:+12393322245'));
    // 3. DEBUG CMS (User Request)
    debugCMS();
});

async function debugCMS() {
    console.log(" STARTING CMS DIAGNOSTIC CHECK...");

    const collectionsToCheck = [
        COLLECTIONS.FAQS,
        COLLECTIONS.COMMON_CHARGES
    ];

    for (const colId of collectionsToCheck) {
        try {
            const count = await wixData.query(colId).limit(1).count();
            console.log(` Collection '${colId}': Found ${count} items.`);
        } catch (e) {
            console.warn(`[X] Collection '${colId}': Query failed (might not exist). Error: ${e.message}`);
        }
    }
    try {
        const tables = $w('Table');
        const reps = $w('Repeater');
        console.log('Tables on page:', tables && tables.id, 'valid=', tables && tables.valid);
        console.log('Repeaters on page:', reps && reps.id, 'valid=', reps && reps.valid);
    } catch (e) {
        console.warn('Could not list Table/Repeater types:', e.message);
    }
    console.log(" DIAGNOSTIC CHECK COMPLETE.");
}

// --- 1. The Arrest Process ---
function setupBailProcess() {
    const data = [
        { _id: "1", title: "1. Booking & Charges", text: "After arrest, the defendant is booked at the county jail. Fingerprints, photo, and charges are filed into the court roster (2-4 hours)." },
        { _id: "2", title: "2. Bail & First Appearance", text: "Bail is set by county bond schedule or at First Appearance within 24 hours. Florida law mandates 10% premium with a $100 minimum per charge." },
        { _id: "3", title: "3. Scan ID & Prepare Forms", text: "Instead of filling out 14 legal documents by hand, scan your ID in 60 seconds. Our system hydrates the paperwork automatically." },
        { _id: "4", title: "4. Bond Posted & Release", text: "Shamrock posts the appearance bond directly with the jail desk. Processing time ranges from 2 to 6 hours depending on facility." },
        { _id: "5", title: "5. Court Appearances", text: "The defendant is released with mandatory scheduled court dates. Shamrock provides automated reminders to keep them in compliance." }
    ];
    const rep = $w('#processRepeater');
    if (rep && rep.valid) {
        rep.onItemReady(($item, itemData) => {
            const titleEl = $item('#processTitle');
            const bodyEl = $item('#processBody');
            if (titleEl && titleEl.valid) titleEl.text = itemData.title;
            if (bodyEl && bodyEl.valid) bodyEl.text = itemData.text;
        });
        rep.data = data;
    }
}

// --- 2. Bail Bonds Explained ---
function setupBailBondsExplained() {
    const data = [
        { 
            _id: "1", 
            title: "Florida Statutory Premium (10% / $100 Min)", 
            body: "Under Florida Statutes 648 & 903, bail bond premiums are strictly regulated at 10% of total bail, or a $100 minimum per individual charge (whichever is greater). There are never hidden fees or surprise markups." 
        },
        { 
            _id: "2", 
            title: "What is an Indemnitor (Cosigner)?", 
            body: "The indemnitor is the loved one or guarantor who stands behind the bond. You guarantee the defendant appears in court and review case facts. No paper clipboards — review and sign from your phone." 
        },
        { 
            _id: "3", 
            title: "What Paperwork Will You Sign?", 
            body: "Florida requires a 14-document state packet (Appearance Bond, Indemnity Agreement, Premium Receipt). Shamrock translates this into a simple 1-screen human review before you sign." 
        },
        { 
            _id: "4", 
            title: "Scan Your ID & Fill The Forms", 
            body: "Ready to get started? Have 2 minutes and a license? Scan your ID on your phone and our system fills the paperwork automatically so you don't type from scratch." 
        }
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
function mapChargeRow(item, index) {
    const offense = item.offense || item.Offense || item.title || item.charge || 'Unknown Offense';
    const range = item.range || item.bailRange || item['Bail Range'] || item.amount || 'Varies';
    return {
        _id: String(item._id || index + 1),
        offense,
        range
    };
}

async function setupCommonBailAmounts() {
    const fallbackData = [
        { _id: '1', offense: 'DUI (First Offense)', range: '$500 - $2,500' },
        { _id: '2', offense: 'Domestic Violence', range: '$2,500 - $10,000' },
        { _id: '3', offense: 'Drug Possession', range: '$1,000 - $25,000' },
        { _id: '4', offense: 'Assault', range: '$5,000 - $25,000' },
        { _id: '5', offense: 'Burglary', range: '$10,000 - $50,000' }
    ];

    let rows = fallbackData;
    try {
        const result = await wixData.query(COLLECTIONS.COMMON_CHARGES).limit(50).find();
        if (result && result.items.length > 0) {
            rows = result.items.map(mapChargeRow);
            console.log('[OK] Loaded', rows.length, 'CommonCharges rows');
        } else {
            console.warn('[!] CommonCharges empty, using fallback rows');
        }
    } catch (err) {
        console.error('[X] CommonCharges query failed, using fallback:', err);
    }

    const offenseRepeater = firstOffenseRepeater();
    const rangeRepeater = firstRangeRepeater();
    const sameRepeater = offenseRepeater && rangeRepeater && String(offenseRepeater.id) === String(rangeRepeater.id);

    if (offenseRepeater && rangeRepeater && !sameRepeater) {
        bindChargesRepeater(offenseRepeater, rows, 'offense');
        bindChargesRepeater(rangeRepeater, rows, 'range');
        return;
    }

    if (offenseRepeater && (offenseRepeater.type === '$w.Repeater' || typeof offenseRepeater.onItemReady === 'function')) {
        bindChargesRepeater(offenseRepeater, rows, 'both');
        return;
    }

    const element = firstTable();
    if (!element) {
        console.error('[X] No charges Repeater (#repeater1 / #repeater2) or Table on page');
        return;
    }
    console.log('[OK] Charges table id=', element.id, 'type=', element.type);
    try {
        element.columns = [
            { id: 'offense', dataPath: 'offense', label: 'Offense or Charge', type: 'string', width: 340, visible: true },
            { id: 'range', dataPath: 'range', label: 'Typical Bail Range', type: 'string', width: 240, visible: true }
        ];
    } catch (e) {
        console.warn('[charges] could not set table columns', e);
    }
    element.rows = rows.map((row) => ({
        _id: row._id,
        offense: row.offense,
        range: row.range,
        'Offense or Charge': row.offense,
        'Typical Bail Range': row.range
    }));
    console.log('[OK] Table rows set:', rows.length);
}

function firstItemText($item, ids) {
    for (let i = 0; i < ids.length; i++) {
        try {
            const el = $item(ids[i]);
            if (el && el.valid && typeof el.text !== 'undefined') return el;
        } catch (e) { /* next */ }
    }
    try {
        const texts = $item('Text');
        if (texts && texts.valid && typeof texts.text !== 'undefined') return texts;
        const idsCsv = String((texts && texts.id) || '').split(',').map((s) => s.trim()).filter(Boolean);
        if (idsCsv.length) {
            const el = $item('#' + idsCsv[0]);
            if (el && typeof el.text !== 'undefined') return el;
        }
    } catch (e) { /* no Text widgets in this item */ }
    return null;
}

function bindChargesRepeater(repeater, rows, mode) {
    const offenseIds = ['#offenseName', '#offense', '#textOffense', '#chargeName', '#text1', '#title'];
    const rangeIds = ['#bailRange', '#range', '#textRange', '#bailAmount', '#text2', '#subtitle'];

    repeater.onItemReady(($item, itemData) => {
        const offense = itemData.offense || 'Unknown Offense';
        const range = itemData.range || 'Varies';

        if (mode === 'offense') {
            const el = firstItemText($item, offenseIds);
            if (el) {
                el.text = offense;
                return;
            }
            console.warn('[charges] #repeater1 item has no Text. Drop a Text inside the left repeater item and name it #offenseName.');
            return;
        }

        if (mode === 'range') {
            const el = firstItemText($item, rangeIds);
            if (el) {
                el.text = range;
                return;
            }
            console.warn('[charges] #repeater2 item has no Text. Drop a Text inside the right repeater item and name it #bailRange.');
            return;
        }

        const offEl = firstItemText($item, offenseIds);
        const rangeEl = firstItemText($item, rangeIds);
        if (offEl && rangeEl && String(offEl.id) !== String(rangeEl.id)) {
            offEl.text = offense;
            rangeEl.text = range;
            return;
        }
        if (offEl) {
            offEl.text = offense + '  —  ' + range;
            return;
        }
        console.warn('[charges] Repeater item has no Text. Add #offenseName and #bailRange inside the item.');
    });

    repeater.data = rows;
    console.log('[OK] Charges repeater', mode, 'populated with', rows.length, 'items id=', repeater.id);
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
        let result = await wixData.query(COLLECTIONS.FAQS)
            .eq('relatedPage', '/how-bail-works')
            .eq('isActive', true)
            .ascending('sortOrder')
            .limit(20)
            .find();
        if (!result.items.length) {
            result = await wixData.query(COLLECTIONS.FAQS)
                .eq('relatedPage', '/how-bail-works')
                .limit(20)
                .find();
        }
        if (result && result.items.length > 0) {
            console.log('[OK] Loaded', result.items.length, 'How Bail Works FAQs from Import22');
            data = result.items;
        } else {
            console.warn('[!] No Import22 FAQs tagged /how-bail-works, using fallback copy');
        }
    } catch (err) {
        console.error('[X] FAQ query failed, using fallback:', err);
    }

    const rep = firstFaqRepeater();
    if (rep) {
        const setFirstText = ($item, ids, value) => {
            for (let i = 0; i < ids.length; i++) {
                try {
                    const el = $item(ids[i]);
                    if (el && el.valid && typeof el.text !== 'undefined') {
                        if (typeof el.expandText === 'function') {
                            try { el.expandText(); } catch (e) {}
                            el.text = value;
                        } else {
                            el.text = value;
                        }
                        return true;
                    }
                } catch (e) { /* try next id */ }
            }
            return false;
        };

        rep.onItemReady(($item, itemData) => {
            const question = itemData.title || itemData.question || itemData.q || '';
            const answerText = itemData.answer || itemData.a || '';
            const qOk = setFirstText($item, ['#faqQuestion', '#comp-mjxe8oln', '#classicTitle', '#title', '#text1', '#question'], question);
            let aOk = setFirstText($item, ['#faqAnswer', '#comp-mjxea4my', '#faqAnswerText', '#collapsibleText1', '#text2', '#answer', '#paragraph1'], answerText);
            if (!aOk) {
                try {
                    const ct = $item('CollapsibleText');
                    if (ct && ct.valid) {
                        try { ct.expandText(); } catch (e) {}
                        ct.text = answerText;
                        aOk = true;
                    }
                } catch (e) { /* no collapsible */ }
            }
            if (!qOk) console.warn('[FAQ] question element missing in repeater item');
            if (!aOk) console.warn('[FAQ] answer element missing in repeater item');
        });

        rep.data = data;
        console.log('[OK] FAQ Repeater populated with', data.length, 'items id=', rep.id);
    } else {
        console.error('[X] FAQ repeater not found (tried #faqRepeater and $w("Repeater"))');
    }

    // Trigger SEO Update with FAQ structured data
    updatePageSEO(data);
}

// --- 7. SEO Injection ---
function updatePageSEO(faqItems) {
    // 0. Meta Tags (Title, Description, OG, Twitter)
    const title = 'How Bail Works in Florida | Cost, Process & Payment Plans';
    const description = 'Florida bail is 10% ($100 minimum per charge). Learn the process, indemnitor duties, payment plans, and Lee County Jail release times. Call (239) 332-2245.';
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
