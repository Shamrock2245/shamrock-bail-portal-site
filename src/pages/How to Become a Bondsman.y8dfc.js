// How to Become a Bondsman (Bail School) — SEO-Enhanced
// Element IDs (Wix Editor):
//   #bailSchoolScheduleBtn — "Click for Schedule" → school schedule + upcoming cohorts
//   #startBailProcessBtn   — optional portal CTA
//   #contactUsBtn          — contact page
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import wixSeoFrontend from 'wix-seo-frontend';

/** Live LMS — class calendar + 120hr registration (upcoming cohorts). */
const SCHOOL_SCHEDULE_URL = 'https://school.shamrockbailbonds.biz/schedule#calendar';
/** Tuition / program cards (20hr, 120hr, simulator). */
const SCHOOL_COURSES_URL = 'https://school.shamrockbailbonds.biz/#courses';
/** Direct jump to 120hr enroll/register panel under the calendar. */
const SCHOOL_REGISTER_URL = 'https://school.shamrockbailbonds.biz/schedule#register';

$w.onReady(function () {
    wireNavButtons();
    setupPageMeta();
    demoteExtraHeadings();
    setupStructuredData();
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
        'Become a licensed Florida bail bond agent: 120-hour pre-licensing ($649), 20-hour correspondence (pending course approval), state exam, fingerprinting & internship. View live class schedules at Shamrock Bail School.';
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

    const schemas = [
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
        // EducationalOrganization (Bail School only — kept separate from bail client LocalBusiness per Rule 6)
        {
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "@id": "https://www.shamrockbailbonds.biz/bail-school#school",
            "name": "Shamrock Bail School",
            "url": "https://www.shamrockbailbonds.biz/bail-school",
            "description": "Florida bail bond agent pre-licensing education and exam preparation.",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            }
        }
    ];

    try {
        const res = wixSeoFrontend.setStructuredData(schemas);
        if (res && typeof res.catch === 'function') {
            res.catch(function (e) { console.error('[SEO] Bail School schema error:', e); });
        }
    } catch (e) {
        wixSeo.setStructuredData(schemas).catch(function (err) { console.error('[SEO] Bail School schema error:', err); });
    }
}


/**
 * Bing SEO: keep one true H1 ("How to become a bondsman in Florida").
 * Demote the other Editor Heading-1 Rich Text blocks to H2 without changing copy.
 * Thunderbolt: $w('#comp-…') returns a stub without .html, and el.valid is
 * undefined, so a .valid gate always early-returns. Select by Velo nickname
 * and gate only on a non-empty html string.
 */
function demoteExtraHeadings() {
    // Keep bondsmanHeroTitle / #comp-mjn08m2j ("How to become a bondsman in Florida").
    const demoteIds = [
        '#heroTitle',         // Start your Career as a Bail Bondsman
        '#text138',           // Shamrock Bail School
        '#bailSchoolCtaTitle' // Interested in Becoming a Bail Bondsman?
    ];
    demoteIds.forEach(function (id) {
        try {
            const el = $w(id);
            if (!el || typeof el.html !== 'string' || !el.html) return;
            if (!/<h1\b/i.test(el.html)) return;
            el.html = el.html.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
            console.log('[SEO] Demoted H1→H2 on', id);
        } catch (e) { /* optional element */ }
    });
}
