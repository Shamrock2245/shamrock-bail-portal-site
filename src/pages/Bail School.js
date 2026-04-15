// Bail School Landing Page — SEO-Enhanced with Full Schema Stack
// This page code should be attached to the "Bail School" page once created in the Wix Editor.
// Route: /bail-school
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import wixWindow from 'wix-window';
import { submitBailSchoolInterest } from 'backend/bailSchoolInterest';

// Course data (static import for fastest load)
import courseData from 'backend/data/bailSchoolCourses.json';

$w.onReady(function () {
    setupNavigation();
    setupInterestForm();
    populateCourseCards();
    populateFAQs();
    setupPageMeta();
    setTimeout(function () { setupStructuredData(); }, 0);
});

// ============================================================
// NAVIGATION
// ============================================================
function setupNavigation() {
    safeOnClick('#startBailProcessBtn', function () { wixLocation.to('/portal-landing'); });
    safeOnClick('#contactUsBtn', function () { wixLocation.to('/contact'); });
    safeOnClick('#enrollTrackABtn', function () { wixLocation.to('/contact'); });
    safeOnClick('#enrollTrackBBtn', function () { wixLocation.to('/contact'); });
    safeOnClick('#enrollTrackCBtn', function () { wixLocation.to('/contact'); });
    safeOnClick('#becomeBondsmanLink', function () { wixLocation.to('/how-to-become-a-bondsman'); });
    safeOnClick('#viewCountiesLink', function () { wixLocation.to('/florida-bail-bonds'); });
    safeOnClick('#callNowBtn', function () { wixWindow.openUrl('tel:+12393322245'); });
}

// ============================================================
// INTEREST FORM
// ============================================================
function setupInterestForm() {
    safeOnClick('#submitInterestBtn', async function () {
        var emailInput = safeGet('#interestEmail');
        if (!emailInput) return;

        var email = emailInput.value;
        if (!email || !email.includes('@')) {
            safeSetText('#interestStatus', '⚠️ Please enter a valid email address.');
            return;
        }

        try {
            safeSetText('#interestStatus', '⏳ Submitting...');
            var result = await submitBailSchoolInterest(email);
            if (result && result.ok) {
                safeSetText('#interestStatus', '✅ You\'re signed up! We\'ll send you course updates soon.');
                emailInput.value = '';
            } else {
                safeSetText('#interestStatus', '❌ Something went wrong. Please try again or call (239) 332-2245.');
            }
        } catch (err) {
            console.error('[BailSchool] Interest form error:', err);
            safeSetText('#interestStatus', '❌ Something went wrong. Please try again or call (239) 332-2245.');
        }
    });
}

// ============================================================
// COURSE CARDS
// ============================================================
function populateCourseCards() {
    var courses = courseData.courses || [];

    // Track A — Indemnitor Basics
    var trackA = courses.find(function (c) { return c.track === 'A'; });
    if (trackA) {
        safeSetText('#trackATitle', trackA.title);
        safeSetText('#trackASubtitle', trackA.subtitle);
        safeSetText('#trackADuration', '⏱ ' + trackA.duration);
        safeSetText('#trackAFormat', '📍 ' + trackA.format);
        safeSetText('#trackALevel', '📊 ' + trackA.level);
        safeSetText('#trackAPrice', trackA.priceLabel);
        safeSetText('#trackADescription', trackA.description);
        safeSetText('#trackAAudience', 'For: ' + trackA.audience);
        safeSetText('#trackAOutcome', '🎯 ' + trackA.outcome);
        populateModuleList('#trackAModules', trackA.modules);
    }

    // Track B — Agent Path
    var trackB = courses.find(function (c) { return c.track === 'B'; });
    if (trackB) {
        safeSetText('#trackBTitle', trackB.title);
        safeSetText('#trackBSubtitle', trackB.subtitle);
        safeSetText('#trackBDuration', '⏱ ' + trackB.duration);
        safeSetText('#trackBFormat', '📍 ' + trackB.format);
        safeSetText('#trackBLevel', '📊 ' + trackB.level);
        safeSetText('#trackBPrice', trackB.priceLabel);
        safeSetText('#trackBDescription', trackB.description);
        safeSetText('#trackBAudience', 'For: ' + trackB.audience);
        safeSetText('#trackBOutcome', '🎯 ' + trackB.outcome);
        populateModuleList('#trackBModules', trackB.modules);
    }

    // Track C — Risk Management
    var trackC = courses.find(function (c) { return c.track === 'C'; });
    if (trackC) {
        safeSetText('#trackCTitle', trackC.title);
        safeSetText('#trackCSubtitle', trackC.subtitle);
        safeSetText('#trackCDuration', '⏱ ' + trackC.duration);
        safeSetText('#trackCFormat', '📍 ' + trackC.format);
        safeSetText('#trackCLevel', '📊 ' + trackC.level);
        safeSetText('#trackCPrice', trackC.priceLabel);
        safeSetText('#trackCDescription', trackC.description);
        safeSetText('#trackCAudience', 'For: ' + trackC.audience);
        safeSetText('#trackCOutcome', '🎯 ' + trackC.outcome);
        populateModuleList('#trackCModules', trackC.modules);
    }

    // Stats
    var stats = courseData.stats || {};
    safeSetText('#statStudents', stats.studentsServed || '500+');
    safeSetText('#statCompletion', stats.courseCompletionRate || '94%');
    safeSetText('#statExamPass', stats.stateExamPassRate || '89%');
    safeSetText('#statYears', stats.yearsTeaching || '13+');
}

function populateModuleList(repeaterId, modules) {
    try {
        var repeater = $w(repeaterId);
        if (!repeater || !repeater.id) return;

        repeater.data = modules.map(function (m, i) {
            return {
                _id: String(i + 1),
                title: m.title,
                description: m.description,
                duration: m.duration || ''
            };
        });

        repeater.onItemReady(function ($item, itemData) {
            safeSetTextItem($item, '#moduleTitle', itemData.title);
            safeSetTextItem($item, '#moduleDescription', itemData.description);
            if (itemData.duration) {
                safeSetTextItem($item, '#moduleDuration', itemData.duration);
            }
        });
    } catch (e) {
        // Module repeaters are optional — if they don't exist in the editor, silently skip
        console.log('[BailSchool] Module repeater not found:', repeaterId);
    }
}

// ============================================================
// FAQ SECTION
// ============================================================
function populateFAQs() {
    var faqs = courseData.faqs || [];

    try {
        var faqRepeater = $w('#faqRepeater');
        if (!faqRepeater || !faqRepeater.id) return;

        faqRepeater.data = faqs.map(function (faq, i) {
            return {
                _id: String(i + 1),
                question: faq.question,
                answer: faq.answer
            };
        });

        faqRepeater.onItemReady(function ($item, itemData) {
            safeSetTextItem($item, '#faqQuestion', itemData.question);
            safeSetTextItem($item, '#faqAnswer', itemData.answer);
        });
    } catch (e) {
        console.log('[BailSchool] FAQ repeater not found');
    }
}

// ============================================================
// SEO — META TAGS
// ============================================================
function setupPageMeta() {
    var pageTitle = 'Bail School | Florida Bail Bond Training & Education | Shamrock Bail Bonds';
    var pageDesc = 'Learn the bail bond business at Shamrock Bail School. Free co-signer education, 120-hour pre-licensing courses for aspiring agents, and advanced skip tracing seminars. Serving all 67 Florida counties since 2012.';
    var pageUrl = 'https://www.shamrockbailbonds.biz/bail-school';

    wixSeo.setTitle(pageTitle);
    wixSeo.setLinks([{ rel: 'canonical', href: pageUrl }]);
    wixSeo.setMetaTags([
        { name: 'description', content: pageDesc },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'keywords', content: 'bail school Florida, bail bond training, become a bail bondsman Florida, co-signer education, bail agent course, 120 hour bail bond course, bail bond school Fort Myers, bail bond continuing education Florida, indemnitor education, bail bond agent license FL, limited surety agent training' },
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDesc },
        { property: 'og:url', content: pageUrl },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://www.shamrockbailbonds.biz/logo.png' },
        { property: 'og:site_name', content: 'Shamrock Bail Bonds, LLC' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: pageDesc }
    ]);
}

// ============================================================
// SEO — STRUCTURED DATA (FULL SCHEMA STACK)
// ============================================================
function setupStructuredData() {
    var pageUrl = 'https://www.shamrockbailbonds.biz/bail-school';
    var courses = courseData.courses || [];
    var faqs = courseData.faqs || [];
    var orgId = 'https://www.shamrockbailbonds.biz/#organization';

    var schemas = [];

    // 1. BreadcrumbList
    schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
            { "@type": "ListItem", "position": 2, "name": "Bail School", "item": pageUrl }
        ]
    });

    // 2. EducationalOrganization
    schemas.push({
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": pageUrl + "#school",
        "name": "Shamrock Bail School",
        "alternateName": "Shamrock Bail Bonds School of Bail Bond Education",
        "description": "Florida's premier bail bond education platform offering co-signer training, 120-hour pre-licensing courses, and advanced skip tracing seminars. Part of Shamrock Bail Bonds, LLC — serving all 67 Florida counties since 2012.",
        "url": pageUrl,
        "logo": "https://www.shamrockbailbonds.biz/logo.png",
        "image": "https://www.shamrockbailbonds.biz/logo.png",
        "telephone": "+1-239-332-2245",
        "email": "school@shamrockbailbonds.biz",
        "foundingDate": "2012-03-15",
        "parentOrganization": {
            "@type": "Organization",
            "@id": orgId,
            "name": "Shamrock Bail Bonds, LLC"
        },
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
            "name": "Florida",
            "sameAs": "https://en.wikipedia.org/wiki/Florida"
        },
        "hasCredential": [
            {
                "@type": "EducationalOccupationalCredential",
                "credentialCategory": "Professional Training",
                "name": "120-Hour Florida Bail Bond Pre-Licensing Course"
            }
        ],
        "sameAs": [
            "https://www.facebook.com/ShamrockBail",
            "https://www.instagram.com/shamrock_bail_bonds",
            "https://t.me/ShamrockBail_bot"
        ],
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", ".hero-subtitle", ".school-description"]
        }
    });

    // 3. Course Schema (one per track)
    courses.forEach(function (course) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "Course",
            "name": course.title + " — Shamrock Bail School",
            "description": course.description,
            "provider": {
                "@type": "EducationalOrganization",
                "@id": pageUrl + "#school",
                "name": "Shamrock Bail School"
            },
            "url": pageUrl + "#" + course.id,
            "educationalLevel": course.level,
            "about": course.subtitle,
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": course.audience
            },
            "timeRequired": "PT" + (course.duration === "45 minutes" ? "45M" : course.duration === "Full-day seminar (8 hours)" ? "8H" : "120H"),
            "isAccessibleForFree": course.price === 0,
            "coursePrerequisites": course.requirements ? course.requirements.join('. ') : undefined,
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": course.format.toLowerCase().includes("online") ? "online" : "blended",
                "courseWorkload": course.duration,
                "instructor": {
                    "@type": "Person",
                    "name": "Shamrock Bail Bonds Training Staff",
                    "worksFor": {
                        "@type": "Organization",
                        "@id": orgId
                    }
                }
            },
            "offers": course.price === 0 ? {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": pageUrl
            } : {
                "@type": "Offer",
                "price": "",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": pageUrl
            }
        });
    });

    // 4. ItemList of courses
    schemas.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Shamrock Bail School — Course Catalog",
        "description": "Complete list of bail bond education courses offered by Shamrock Bail School in Fort Myers, FL. Courses available statewide across all 67 Florida counties.",
        "numberOfItems": courses.length,
        "itemListElement": courses.map(function (course, i) {
            return {
                "@type": "ListItem",
                "position": i + 1,
                "name": course.title,
                "url": pageUrl + "#" + course.id,
                "description": course.subtitle
            };
        })
    });

    // 5. FAQPage
    if (faqs.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "name": "Shamrock Bail School — Frequently Asked Questions",
            "mainEntity": faqs.map(function (faq) {
                return {
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.answer
                    }
                };
            })
        });
    }

    // 6. HowTo — "How to Enroll in Bail School"
    schemas.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Enroll in Shamrock Bail School",
        "description": "Step-by-step guide to enrolling in bail bond education courses at Shamrock Bail School in Fort Myers, Florida. Courses serve students from all 67 Florida counties.",
        "totalTime": "PT10M",
        "step": [
            {
                "@type": "HowToStep",
                "position": 1,
                "name": "Choose Your Track",
                "text": "Select from three curriculum tracks: Indemnitor Basics (free, 45 min), The Agent Path (120+ hours, professional), or Risk Management & Skip Tracing (advanced seminar).",
                "url": pageUrl + "#courses"
            },
            {
                "@type": "HowToStep",
                "position": 2,
                "name": "Register Online or by Phone",
                "text": "Sign up through our website at shamrockbailbonds.biz/bail-school or call (239) 332-2245 to speak with our enrollment team. For the free Indemnitor Basics course, just enter your email.",
                "url": pageUrl + "#enroll"
            },
            {
                "@type": "HowToStep",
                "position": 3,
                "name": "Complete Your Course",
                "text": "Attend classes online (on-demand) or in-person at our Fort Myers location. The Agent Path includes a hybrid format with both online modules and in-person training sessions.",
                "url": pageUrl
            },
            {
                "@type": "HowToStep",
                "position": 4,
                "name": "Receive Your Certification",
                "text": "Upon course completion, receive a digital certificate automatically generated and delivered to your email. Agent Path graduates are also eligible for internship placement at Shamrock Bail Bonds.",
                "url": pageUrl
            }
        ],
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": [".how-it-works-section", "h2"]
        }
    });

    // 7. LocalBusiness (consistent with other pages)
    schemas.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": orgId,
        "name": "Shamrock Bail Bonds",
        "url": "https://www.shamrockbailbonds.biz",
        "logo": "https://www.shamrockbailbonds.biz/logo.png",
        "image": "https://www.shamrockbailbonds.biz/logo.png",
        "description": "Professional 24/7 bail bond services and bail bond education throughout all 67 Florida counties since 2012. Licensed, insured, and technology-driven.",
        "telephone": "+1-239-332-2245",
        "priceRange": "$$",
        "foundingDate": "2012-03-15",
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
            "name": "Florida",
            "sameAs": "https://en.wikipedia.org/wiki/Florida"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-239-332-2245",
            "contactType": "customer service",
            "areaServed": "US-FL",
            "availableLanguage": ["English", "Spanish"],
            "contactOption": "TollFree"
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "sameAs": [
            "https://www.facebook.com/ShamrockBail",
            "https://www.instagram.com/shamrock_bail_bonds",
            "https://t.me/ShamrockBail_bot"
        ]
    });

    wixSeo.setStructuredData(schemas).catch(function (e) {
        console.error('[SEO] Bail School schema error:', e);
    });
}

// ============================================================
// UTILITY HELPERS (Safe wrappers — prevent runtime crashes)
// ============================================================
function safeGet(selector) {
    try {
        var el = $w(selector);
        return (el && el.id) ? el : null;
    } catch (e) { return null; }
}

function safeSetText(selector, value) {
    try {
        var el = $w(selector);
        if (el && el.id && typeof el.text !== 'undefined') {
            el.text = String(value || '');
        }
    } catch (e) { /* non-fatal */ }
}

function safeSetTextItem($item, selector, value) {
    try {
        var el = $item(selector);
        if (el && el.id && typeof el.text !== 'undefined') {
            el.text = String(value || '');
        }
    } catch (e) { /* non-fatal */ }
}

function safeOnClick(selector, handler) {
    try {
        var el = $w(selector);
        if (el && el.id) el.onClick(handler);
    } catch (e) { /* non-fatal */ }
}
