// How to Become a Bondsman (Bail School) — SEO-Enhanced
// Element IDs (Wix Editor):
//   #bailSchoolScheduleBtn — "Click for Schedule" → school schedule + upcoming cohorts
//   #startBailProcessBtn   — optional portal CTA
//   #contactUsBtn          — contact page
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

/** Live LMS — class calendar + 120hr registration (upcoming cohorts). */
const SCHOOL_SCHEDULE_URL = 'https://school.shamrockbailbonds.biz/schedule#calendar';
/** Tuition / program cards (20hr, 120hr, simulator). */
const SCHOOL_COURSES_URL = 'https://school.shamrockbailbonds.biz/#courses';
/** Direct jump to 120hr enroll/register panel under the calendar. */
const SCHOOL_REGISTER_URL = 'https://school.shamrockbailbonds.biz/schedule#register';

$w.onReady(function () {
    wireNavButtons();
    setupPageMeta();
    setTimeout(() => { setupStructuredData(); }, 0);
});

/**
 * Wire primary CTAs. #bailSchoolScheduleBtn is the "Click for Schedule" control —
 * sends users to the live school schedule (calendar of upcoming offerings + register).
 */
function wireNavButtons() {
    // Primary: open live class calendar / upcoming cohorts
    safeOnClick('#bailSchoolScheduleBtn', () => {
        console.log('📅 Bail School schedule →', SCHOOL_SCHEDULE_URL);
        wixLocation.to(SCHOOL_SCHEDULE_URL);
    });

    // Optional aliases if designer used alternate IDs for the same action
    safeOnClick('#scheduleBtn', () => wixLocation.to(SCHOOL_SCHEDULE_URL));
    safeOnClick('#viewScheduleBtn', () => wixLocation.to(SCHOOL_SCHEDULE_URL));
    safeOnClick('#enrollBailSchoolBtn', () => wixLocation.to(SCHOOL_REGISTER_URL));
    safeOnClick('#bailSchoolEnrollBtn', () => wixLocation.to(SCHOOL_REGISTER_URL));
    safeOnClick('#viewCoursesBtn', () => wixLocation.to(SCHOOL_COURSES_URL));

    safeOnClick('#startBailProcessBtn', () => wixLocation.to('/portal-landing'));
    safeOnClick('#contactUsBtn', () => wixLocation.to('/contact'));

    // Internal school hub on this site
    safeOnClick('#bailSchoolBtn', () => wixLocation.to('/bail-school'));
    safeOnClick('#goToBailSchoolBtn', () => wixLocation.to('/bail-school'));
}

/**
 * Safe click binder — no throw if the element is missing from the page.
 * @param {string} selector e.g. '#bailSchoolScheduleBtn'
 * @param {() => void} handler
 */
function safeOnClick(selector, handler) {
    try {
        const el = $w(selector);
        if (!el || typeof el.onClick !== 'function') {
            // Element not on this page variant — expected for optional IDs
            return;
        }
        el.onClick(() => {
            try {
                handler();
            } catch (err) {
                console.error(`Click handler failed for ${selector}:`, err);
            }
        });
        console.log(`✅ Wired ${selector}`);
    } catch (e) {
        // $w throws if the ID does not exist on the page
        console.warn(`⚠️ ${selector} not found on page — skip`);
    }
}

function setupPageMeta() {
    const pageTitle = 'How to Become a Bail Bondsman in Florida | Shamrock Bail School';
    const pageDesc =
        'Become a licensed Florida bail bond agent: 120-hour pre-licensing ($649), 20-hour correspondence ($199), state exam, fingerprinting & internship. View live class schedules at Shamrock Bail School.';
    const pageUrl = 'https://www.shamrockbailbonds.biz/how-to-become-a-bondsman';

    wixSeo.setTitle(pageTitle);
    wixSeo.setLinks([{ rel: 'canonical', href: pageUrl }]);
    wixSeo.setMetaTags([
        { name: 'description', content: pageDesc },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'keywords', content: 'how to become bail bondsman Florida, bail bond agent license FL, 120 hour bail bond course, Florida bail bond exam, limited surety agent license, bail bond career Florida, shamrock bail school schedule' },
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDesc },
        { property: 'og:url', content: pageUrl },
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: 'https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png' },
        { property: 'og:site_name', content: 'Shamrock Bail Bonds, LLC' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: pageDesc }
    ]);
}

function setupStructuredData() {
    const pageUrl = 'https://www.shamrockbailbonds.biz/how-to-become-a-bondsman';

    wixSeo.setStructuredData([
        // Breadcrumb
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Bail School", "item": "https://www.shamrockbailbonds.biz/bail-school" },
                { "@type": "ListItem", "position": 3, "name": "How to Become a Bondsman", "item": pageUrl }
            ]
        },
        // HowTo Schema — rich snippet eligible
        {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Become a Licensed Bail Bondsman in Florida",
            "description": "A complete guide to the requirements and steps for obtaining a Limited Surety Agent (bail bond agent) license in the state of Florida, per FL Statute 648.",
            "isPartOf": {
                "@type": "EducationalOrganization",
                "@id": "https://www.shamrockbailbonds.biz/bail-school#school",
                "name": "Shamrock Bail School"
            },
            "totalTime": "P6M",
            "estimatedCost": {
                "@type": "MonetaryAmount",
                "currency": "USD",
                "value": "649"
            },
            "supply": [
                { "@type": "HowToSupply", "name": "Florida driver's license or state ID" },
                { "@type": "HowToSupply", "name": "Fingerprint card (electronic submission)" },
                { "@type": "HowToSupply", "name": "Application fee (Florida DFS)" }
            ],
            "tool": [
                { "@type": "HowToTool", "name": "Shamrock Bail School 120-Hour Basic Certification Training" },
                { "@type": "HowToTool", "name": "Sponsoring bail bond agency" }
            ],
            "step": [
                {
                    "@type": "HowToStep",
                    "position": 1,
                    "name": "Complete the 120-Hour Pre-Licensing Course",
                    "text": "Enroll in Shamrock Bail School's 120-Hour Basic Certification Training ($649) — live webinars + hybrid cohorts with State Exam Simulator included. View upcoming class dates on the live schedule.",
                    "url": SCHOOL_SCHEDULE_URL
                },
                {
                    "@type": "HowToStep",
                    "position": 2,
                    "name": "Pass the Florida State Exam",
                    "text": "Register for and pass the Florida Department of Financial Services bail bond agent examination. The exam covers FL Statutes 648 and 903, bail bond procedures, and ethics.",
                    "url": pageUrl
                },
                {
                    "@type": "HowToStep",
                    "position": 3,
                    "name": "Complete Background Check & Fingerprinting",
                    "text": "Submit electronic fingerprints for a Level 2 criminal background check through the Florida Department of Law Enforcement (FDLE) to verify moral character requirements.",
                    "url": pageUrl
                },
                {
                    "@type": "HowToStep",
                    "position": 4,
                    "name": "Find a Sponsoring Agency & Complete Internship",
                    "text": "Secure sponsorship from a licensed bail bond agency like Shamrock Bail Bonds to complete the required 1-year temporary license period under supervision before receiving full licensure.",
                    "url": pageUrl
                }
            ],
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", ".step-content", ".requirements-section"]
            }
        },
        // LocalBusiness with full enhancement
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "name": "Shamrock Bail Bonds",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
            "image": "https://www.shamrockbailbonds.biz/logo.png",
            "description": "Professional 24/7 bail bond services throughout Florida since 2012. Also offering bail bond agent training and internship opportunities.",
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
            },
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://t.me/ShamrockBail_bot"
            ]
        }
    ]).catch(function(e) { console.error('[SEO] Bail School schema error:', e); });
}
