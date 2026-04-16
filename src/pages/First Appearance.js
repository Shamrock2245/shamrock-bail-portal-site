/**
 * Shamrock Bail Bonds — First Appearance Page
 * URL: /first-appearance
 *
 * SECTIONS:
 *  1. Hero + CTA
 *  2. "What IS a First Appearance" explainer
 *  3. "What it is NOT" myth-busters
 *  4. How Bail is Determined
 *  5. County Schedule Table (interactive, filterable)
 *  6. Interactive Florida Map (county click → detail panel)
 *  7. FAQ Accordion
 *  8. Bottom CTA
 *
 * ELEMENT IDs EXPECTED ON PAGE (set in Wix Editor):
 *  Hero:
 *    #heroCallBtn          — "Call Now" CTA
 *    #heroOnlineBtn        — "Start Online" CTA
 *
 *  County Table / Map:
 *    #countySearchInput    — Text input for county filter
 *    #countyRepeater       — Repeater for county schedule cards
 *      #countyName         — Text: county name
 *      #countySchedule     — Text: schedule/time
 *      #countyAccess       — Text: access method
 *      #countyLiveBtn      — Button: "Watch Live" / "Join Zoom"
 *      #countyStatusDot    — Box: green (live) / grey (offline)
 *    #flCourtsDirBtn       — Button: link to courtrooms.flcourts.gov
 *
 *  FAQ:
 *    #faqRepeater          — Repeater for FAQ items
 *      #faqQuestion        — Text: question
 *      #faqAnswer          — Text: answer (initially collapsed)
 *      #faqToggleBtn       — Button: expand/collapse
 *
 *  Bottom CTA:
 *    #bottomCallBtn        — "Call 239-332-2245"
 *    #bottomOnlineBtn      — "Start Online"
 */

import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

// ─── DATA ────────────────────────────────────────────────────────────────────

/**
 * County first appearance data.
 * "liveUrl" is either a Zoom link, a court live stream page, or the FL courts directory.
 * "accessType" is one of: "zoom" | "livestream" | "directory" | "inperson"
 */
const COUNTY_DATA = [
    {
        name: "Lee County",
        slug: "lee",
        circuit: "20th Judicial Circuit",
        schedule: "10:00 AM — Daily (M–F)",
        location: "Courtroom 6-C, Lee County Justice Center, Fort Myers",
        accessType: "livestream",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Live stream available via FL Courts Virtual Courtroom Directory. Bond set same day.",
        scheduleSource: "https://www.ca.cjis20.org/About-The-Court/Court-Schedules/leeschedules.aspx"
    },
    {
        name: "Hendry County",
        slug: "hendry",
        circuit: "20th Judicial Circuit",
        schedule: "Time not publicly posted — check Zoom",
        location: "LaBelle Courthouse (virtual via Zoom)",
        accessType: "zoom",
        liveUrl: "https://zoom.us/j/94329649927?pwd=l5J4yPuaqHacJ1lQoe3GaJK9TTpA7a.1",
        zoomId: "943 2964 9927",
        zoomPw: "550315",
        notes: "Zoom ID: 943 2964 9927 | Passcode: 550315",
        scheduleSource: "https://www.ca.cjis20.org/About-The-Court/Court-Schedules/hendryschedules.aspx"
    },
    {
        name: "Charlotte County",
        slug: "charlotte",
        circuit: "20th Judicial Circuit",
        schedule: "Daily (M–F) — check 20th Circuit",
        location: "Charlotte County Courthouse, Punta Gorda",
        accessType: "livestream",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "View via FL Courts Virtual Courtroom Directory. Filter by Charlotte County.",
        scheduleSource: "https://www.ca.cjis20.org/About-The-Court/Court-Schedules/charlotteschedules.aspx"
    },
    {
        name: "Collier County",
        slug: "collier",
        circuit: "20th Judicial Circuit",
        schedule: "Daily (M–F) — check 20th Circuit",
        location: "Collier County Courthouse, Naples",
        accessType: "livestream",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "View via FL Courts Virtual Courtroom Directory. Filter by Collier County.",
        scheduleSource: "https://www.ca.cjis20.org/About-The-Court/Court-Schedules/collierschedules.aspx"
    },
    {
        name: "Hillsborough County",
        slug: "hillsborough",
        circuit: "13th Judicial Circuit",
        schedule: "1:30 PM — Daily (M–F)",
        location: "Courtroom 17, George E. Edgecomb Courthouse, Tampa (mostly in-person)",
        accessType: "inperson",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Primarily in-person. Closed-circuit video for defendants in custody.",
        scheduleSource: "https://www.fljud13.org/JudicialDirectory/MurphyJLogan/ProceduresPreferences.aspx"
    },
    {
        name: "Orange County",
        slug: "orange",
        circuit: "9th Judicial Circuit",
        schedule: "Varies — check 9th Circuit live stream",
        location: "Orange County Courthouse, Orlando (virtual available)",
        accessType: "livestream",
        liveUrl: "https://ninthcircuit.org/communication-outreach/initial-appearances-live",
        notes: "Live audio stream available via 9th Circuit website. Also on FL Courts Virtual Courtroom Directory.",
        scheduleSource: "https://ninthcircuit.org/communication-outreach/initial-appearances-live"
    },
    {
        name: "Osceola County",
        slug: "osceola",
        circuit: "9th Judicial Circuit",
        schedule: "Varies — check 9th Circuit live stream",
        location: "Osceola County Courthouse, Kissimmee (virtual available)",
        accessType: "livestream",
        liveUrl: "https://ninthcircuit.org/communication-outreach/initial-appearances-live",
        notes: "Live audio stream available via 9th Circuit website. Runs consecutively with Orange County on weekends.",
        scheduleSource: "https://ninthcircuit.org/communication-outreach/initial-appearances-live"
    },
    {
        name: "Pinellas County",
        slug: "pinellas",
        circuit: "6th Judicial Circuit",
        schedule: "Varies by day — check FL Courts Directory",
        location: "Pinellas County Justice Center, Clearwater",
        accessType: "directory",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Check FL Courts Virtual Courtroom Directory for live stream links.",
        scheduleSource: "https://courtrooms.flcourts.gov/"
    },
    {
        name: "Sarasota County",
        slug: "sarasota",
        circuit: "12th Judicial Circuit",
        schedule: "Varies by day — check FL Courts Directory",
        location: "Sarasota County Courthouse",
        accessType: "directory",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Part of the 12th Judicial Circuit (DeSoto, Manatee, Sarasota). Check FL Courts Directory.",
        scheduleSource: "https://courtrooms.flcourts.gov/"
    },
    {
        name: "Manatee County",
        slug: "manatee",
        circuit: "12th Judicial Circuit",
        schedule: "Varies by day — check FL Courts Directory",
        location: "Manatee County Judicial Center, Bradenton",
        accessType: "directory",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Part of the 12th Judicial Circuit. Check FL Courts Virtual Courtroom Directory.",
        scheduleSource: "https://courtrooms.flcourts.gov/"
    },
    {
        name: "DeSoto County",
        slug: "desoto",
        circuit: "12th Judicial Circuit",
        schedule: "Varies by day — check FL Courts Directory",
        location: "DeSoto County Courthouse, Arcadia",
        accessType: "directory",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Part of the 12th Judicial Circuit. Check FL Courts Virtual Courtroom Directory.",
        scheduleSource: "https://courtrooms.flcourts.gov/"
    },
    {
        name: "Palm Beach County",
        slug: "palm-beach",
        circuit: "15th Judicial Circuit",
        schedule: "Varies by day — check FL Courts Directory",
        location: "Palm Beach County Courthouse, West Palm Beach",
        accessType: "directory",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Check FL Courts Virtual Courtroom Directory for live stream links.",
        scheduleSource: "https://courtrooms.flcourts.gov/"
    },
    {
        name: "Seminole County",
        slug: "seminole",
        circuit: "18th Judicial Circuit",
        schedule: "Varies by day — check FL Courts Directory",
        location: "Seminole County Criminal Justice Center, Sanford",
        accessType: "directory",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Part of the 18th Judicial Circuit (Brevard, Seminole). Check FL Courts Directory.",
        scheduleSource: "https://courtrooms.flcourts.gov/"
    },
    {
        name: "Polk County",
        slug: "polk",
        circuit: "10th Judicial Circuit",
        schedule: "Varies by day — check FL Courts Directory",
        location: "Polk County Courthouse, Bartow",
        accessType: "directory",
        liveUrl: "https://courtrooms.flcourts.gov/",
        notes: "Part of the 10th Judicial Circuit (Hardee, Highlands, Polk). Check FL Courts Directory.",
        scheduleSource: "https://courtrooms.flcourts.gov/"
    }
];

const FAQ_DATA = [
    {
        question: "How long after arrest is the First Appearance held?",
        answer: "Under Florida Rule of Criminal Procedure 3.130, the First Appearance must be held within 24 hours of arrest. If it is not, the defendant may be entitled to release."
    },
    {
        question: "Can I attend my loved one's First Appearance?",
        answer: "Many Florida counties now broadcast First Appearance hearings live via Zoom or online streaming. You can watch using the links in our county schedule table above. Some courtrooms (like Hillsborough) are primarily in-person and may have limited public seating."
    },
    {
        question: "What should the defendant say at First Appearance?",
        answer: "Very little. The defendant should confirm their name and that they understand their rights. They should NOT explain the facts of the case, argue with the judge, or make any statements about what happened. Everything said in court is recorded."
    },
    {
        question: "What if the judge sets a high bond amount?",
        answer: "Call Shamrock Bail Bonds immediately at 239-332-2245. We only require 10% of the bond amount (the Florida-regulated premium). We can also discuss payment plans and begin the process the moment the bond is set."
    },
    {
        question: "What is the difference between First Appearance and Arraignment?",
        answer: "First Appearance happens within 24 hours of arrest and focuses on bail. Arraignment is a separate, later hearing where the defendant formally enters a plea of Guilty, Not Guilty, or No Contest. They are two distinct steps in the criminal process."
    },
    {
        question: "What if there is no probable cause at First Appearance?",
        answer: "If the judge finds there is no probable cause to support the arrest, the defendant must be released immediately. This is rare but does happen, particularly in cases where the arrest report is incomplete."
    },
    {
        question: "Can the bond amount be changed after First Appearance?",
        answer: "Yes. An attorney can file a motion to reduce or modify the bond at a later hearing. However, the fastest path to release is to post the bond that is set at First Appearance and work with an attorney afterward."
    }
];

// ─── PAGE INIT ────────────────────────────────────────────────────────────────

$w.onReady(function () {
    console.log("🟢 First Appearance Page Loading...");

    // Buttons
    _bindBtn('#heroCallBtn', () => wixLocation.to('tel:12393322245'));
    _bindBtn('#heroOnlineBtn', () => wixLocation.to('/portal-landing'));
    _bindBtn('#bottomCallBtn', () => wixLocation.to('tel:12393322245'));
    _bindBtn('#bottomOnlineBtn', () => wixLocation.to('/portal-landing'));
    _bindBtn('#flCourtsDirBtn', () => wixLocation.to('https://courtrooms.flcourts.gov/'));

    // County Repeater
    setupCountyRepeater(COUNTY_DATA);

    // Search / Filter
    const searchInput = $w('#countySearchInput');
    if (searchInput.valid) {
        searchInput.onInput((event) => {
            const term = event.target.value.toLowerCase().trim();
            const filtered = term
                ? COUNTY_DATA.filter(c => c.name.toLowerCase().includes(term) || c.circuit.toLowerCase().includes(term))
                : COUNTY_DATA;
            setupCountyRepeater(filtered);
        });
    }

    // FAQ Repeater
    setupFaqRepeater();

    // SEO
    setupSEO();

    console.log("✅ First Appearance Page Ready.");
});

// ─── COUNTY REPEATER ─────────────────────────────────────────────────────────

function setupCountyRepeater(data) {
    const repeater = $w('#countyRepeater');
    if (!repeater.valid) {
        console.warn('[countyRepeater] Element not found — skipping.');
        return;
    }

    repeater.data = data.map((c, i) => ({ _id: String(i), ...c }));

    repeater.onItemReady(($item, itemData) => {
        // County name
        const nameEl = $item('#countyName');
        if (nameEl.valid) nameEl.text = itemData.name;

        // Circuit
        const circuitEl = $item('#countyCircuit');
        if (circuitEl.valid) circuitEl.text = itemData.circuit;

        // Schedule
        const schedEl = $item('#countySchedule');
        if (schedEl.valid) schedEl.text = itemData.schedule;

        // Location
        const locEl = $item('#countyLocation');
        if (locEl.valid) locEl.text = itemData.location;

        // Notes
        const notesEl = $item('#countyNotes');
        if (notesEl.valid) notesEl.text = itemData.notes;

        // Status dot: green if zoom/livestream, grey if inperson/directory
        const dot = $item('#countyStatusDot');
        if (dot.valid) {
            dot.style.backgroundColor = (itemData.accessType === 'zoom' || itemData.accessType === 'livestream')
                ? '#22c55e'   // Shamrock green
                : '#9ca3af';  // Grey
        }

        // Live button label + action
        const liveBtn = $item('#countyLiveBtn');
        if (liveBtn.valid) {
            const labels = {
                zoom: '📹 Join Zoom',
                livestream: '▶ Watch Live',
                directory: '🔍 Find Stream',
                inperson: '📍 Courthouse Info'
            };
            liveBtn.label = labels[itemData.accessType] || 'View';
            liveBtn.onClick(() => wixLocation.to(itemData.liveUrl));
        }
    });
}

// ─── FAQ REPEATER ─────────────────────────────────────────────────────────────

function setupFaqRepeater() {
    const repeater = $w('#faqRepeater');
    if (!repeater.valid) {
        console.warn('[faqRepeater] Element not found — skipping.');
        return;
    }

    repeater.data = FAQ_DATA.map((f, i) => ({ _id: String(i), ...f }));

    repeater.onItemReady(($item, itemData) => {
        const qEl = $item('#faqQuestion');
        if (qEl.valid) qEl.text = itemData.question;

        const aEl = $item('#faqAnswer');
        if (aEl.valid) {
            aEl.text = itemData.answer;
            aEl.hide(); // Start collapsed
        }

        const toggleBtn = $item('#faqToggleBtn');
        if (toggleBtn.valid) {
            toggleBtn.label = '+';
            toggleBtn.onClick(() => {
                if (aEl.valid) {
                    if (aEl.hidden) {
                        aEl.show('slide');
                        toggleBtn.label = '−';
                    } else {
                        aEl.hide('slide');
                        toggleBtn.label = '+';
                    }
                }
            });
        }
    });
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

function setupSEO() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ_DATA.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f.answer
            }
        }))
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
            { "@type": "ListItem", "position": 2, "name": "First Appearance", "item": "https://www.shamrockbailbonds.biz/first-appearance" }
        ]
    };

    const eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "Florida First Appearance Hearings — Live Schedule",
        "description": "Daily First Appearance hearings across Florida counties. Lee County at 10 AM, Hillsborough at 1:30 PM, and more.",
        "location": {
            "@type": "Place",
            "name": "Florida Courts",
            "address": {
                "@type": "PostalAddress",
                "addressRegion": "FL",
                "addressCountry": "US"
            }
        },
        "organizer": {
            "@type": "Organization",
            "name": "Florida Courts",
            "url": "https://courtrooms.flcourts.gov/"
        }
    };

    wixSeo.setStructuredData([faqSchema, breadcrumbSchema, eventSchema])
        .then(() => console.log("✅ SEO: Structured Data Set"))
        .catch(err => console.error("❌ SEO Error:", err));
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function _bindBtn(selector, handler) {
    try {
        const el = $w(selector);
        if (el.valid) el.onClick(handler);
    } catch (e) {
        console.warn(`[_bindBtn] ${selector} not found:`, e.message);
    }
}
