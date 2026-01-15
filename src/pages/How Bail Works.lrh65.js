import wixLocation from 'wix-location';
import wixData from 'wix-data';
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
});

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
// --- 5. Common Bail Amounts (Table) ---
async function setupCommonBailAmounts() {
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

    const rep = $w('#amountsRepeater');
    if (rep && rep.valid) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            // Primary field names from CSV: offense, range
            const offense = itemData.offense || itemData.chargeName || itemData.title || "Unknown Offense";
            const range = itemData.range || itemData.bondAmount || itemData.amount || "Varies";

            const offenseEl = $item('#offenseName');
            const rangeEl = $item('#bailRange');

            if (offenseEl && offenseEl.valid) offenseEl.text = offense;
            if (rangeEl && rangeEl.valid) rangeEl.text = range;
        });
    } else {
        console.error('ERROR: #amountsRepeater not found on page');
    }
}

// --- 6. FAQ Section ---
// --- 6. FAQ Section ---
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

    // Using Native Wix Collapsible Text
    const rep = $w('#faqRepeater');
    if (rep && rep.valid) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            // Primary field names from CMS: title (question text), answer
            const question = itemData.title || itemData.question || itemData.q || "No Question";
            const answerText = itemData.answer || itemData.a || "No Answer";

            const questionEl = $item('#faqQuestion');
            const answerEl = $item('#faqAnswer');

            if (questionEl && questionEl.valid) questionEl.text = question;
            if (answerEl && answerEl.valid) answerEl.text = answerText;
        });
    } else {
        console.error('ERROR: #faqRepeater not found on page');
    }
}
