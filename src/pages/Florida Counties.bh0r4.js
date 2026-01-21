// Force Sync: Dynamic Page Logic
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import wixData from 'wix-data';
import { generateCountyPage } from 'backend/county-generator';
import { getNearbyCounties } from 'public/countyUtils'; // Keeping for "Nearby Counties" feature

$w.onReady(async function () {
    console.log("🚀 Dynamic County Page Loading... (Optimized)");

    // 1. EXTRACT SLUG
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log(`🔎 Frontend detected slug: "${countySlug}"`);

    if (!countySlug) {
        console.error("❌ No slug found in URL path:", path);
        return;
    }

    // --- DATASET OVERRIDE (Legacy Support) ---
    // Safely attempt to filter legacy dataset if present, but don't block execution
    $w('#dynamicDataset').onReady(() => {
        console.log("Dataset Ready - Applying Filter...");
        $w('#dynamicDataset').setFilter(wixData.filter().eq('countySlug', countySlug))
            .then(() => console.log("✅ Dataset filter applied."))
            .catch(e => console.log("⚠️ Dataset filter failed:", e));
    });

    try {
        // Show loading state if element exists
        if ($w('#loadingIndicator').valid) $w('#loadingIndicator').show();

        console.log("⏳ Calling backend generateCountyPage...");

        // 2. FETCH DATA IN PARALLEL
        // Fetch Main County Data (Backend) AND Nearby Counties (Utils)
        const [pageResult, nearby] = await Promise.all([
            generateCountyPage(countySlug.toLowerCase()),
            getNearbyCounties("Southwest Florida") // Fetch contextually if possible, default to region
                .catch(e => { console.warn("Nearby counties fetch failed", e); return []; })
        ]);

        console.log("📥 Backend Response:", pageResult);

        const { success, data } = pageResult;

        if (!success || !data) {
            console.warn(`⚠️ County data not found for slug: ${countySlug}.`);
            // Optional: fallback or redirect
            // wixLocation.to('/portal-landing');
            return;
        }

        const county = data;
        console.log(`✅ Loaded Data for: ${county.county_name_full}. Starting UI Update...`);

        // 3. GENERATE SEO (Meta + Schema)
        // Meta Tags
        wixSeo.setTitle(county.seo.meta_title);
        wixSeo.setMetaTags([
            { "name": "description", "content": county.seo.meta_description },
            { "name": "keywords", "content": county.seo.keywords.join(", ") },
            { "property": "og:title", "content": county.seo.meta_title },
            { "property": "og:description", "content": county.seo.meta_description },
            { "property": "og:url", "content": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}` },
            { "property": "og:type", "content": "website" }
        ]);

        // Structured Data (JSON-LD)
        const faqs = county.content.faq || [];
        const schemas = [];

        // A. Breadcrumbs
        schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Bail Bonds", "item": "https://www.shamrockbailbonds.biz/bail-bonds" },
                { "@type": "ListItem", "position": 3, "name": county.county_name_full, "item": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}` }
            ]
        });

        // B. LocalBusiness
        schemas.push({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": `Shamrock Bail Bonds - ${county.county_name}`,
            "description": county.seo.meta_description,
            "url": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}`,
            "telephone": county.contact.primary_phone,
            "image": "https://www.shamrockbailbonds.biz/logo.png",
            "areaServed": {
                "@type": "AdministrativeArea",
                "name": `${county.county_name} County, Florida`
            },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            }
        });

        // C. FAQPage
        if (faqs.length > 0) {
            schemas.push({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
                }))
            });
        }

        wixSeo.setStructuredData(schemas)
            .then(() => console.log("✅ Schemas injected."))
            .catch(err => console.error("❌ Schema injection failed", err));

        // 4. POPULATE UI
        // Header & Hero
        console.log("Setting #countyName to:", county.county_name);
        setText('#countyName', county.county_name);
        setText('#dynamicHeader', `Bail Bonds in ${county.county_name} County`);
        setText('#heroSubtitle', county.content.hero_subheadline);

        // Contact Info
        setText('#sheriffPhone', county.jail.booking_phone);
        setText('#jailName', county.jail.name);
        setText('#clerkPhone', county.clerk.phone);

        // Links / Buttons
        setLink('#callSheriffBtn', county.jail.booking_url, "Jail / Sheriff Website");
        setLink('#sheriffWebsite', county.jail.booking_url, "Jail / Sheriff Website"); // Desktop/Mobile variants

        setLink('#callClerkBtn', county.clerk.website, "Clerk of Court");
        setLink('#clerkWebsite', county.clerk.website, "Clerk of Court");

        // Content Sections
        setText('#aboutHeader', `About Bail Bonds in ${county.county_name} County`);
        setText('#aboutBody', county.content.about_county);
        setText('#whyChooseHeader', `Why Choose Us in ${county.county_name}`);
        setText('#whyChooseBody', county.content.why_choose_us); // Assuming element exists

        // Sticky/Main Call Buttons
        const callBtn = $w('#callShamrockBtn').length ? $w('#callShamrockBtn') : $w('#callCountiesBtn');
        if (callBtn.valid) {
            callBtn.label = county.content.hero_cta_primary || "Call Now";
            callBtn.onClick(() => wixLocation.to(`tel:${county.contact.primary_phone_display.replace(/[^0-9]/g, '')}`));
            callBtn.expand();
        }

        // Jail Address (if element exists and data provided)
        if ($w('#jailAddress').valid) {
            // Backend generator currently doesn't provide address separate from jail name commonly
            // If needed we can add it to generator or map it here if available
            $w('#jailAddress').collapse();
        }

        // 5. POPULATE FAQs (Repeater)
        const faqRep = $w('#faqRepeater');
        if (faqRep.valid && faqs.length > 0) {
            faqRep.data = faqs.map((f, i) => ({ ...f, _id: `faq-${i}` }));
            faqRep.onItemReady(($item, itemData) => {
                $item('#faqQuestion').text = itemData.question;
                $item('#faqAnswer').text = itemData.answer;
            });
            faqRep.expand();
        } else if (faqRep.valid) {
            faqRep.collapse();
        }

        // 6. POPULATE NEARBY COUNTIES
        const nearbyRep = $w('#nearbyCountiesRepeater');
        if (nearbyRep.valid && Array.isArray(nearby) && nearby.length > 0) {
            // Filter out current county just in case
            const neighbors = nearby.filter(n => n.slug !== countySlug);
            nearbyRep.data = neighbors;
            nearbyRep.onItemReady(($item, itemData) => {
                if ($item('#neighborName').valid) $item('#neighborName').text = itemData.name;
                if ($item('#neighborContainer').valid) {
                    $item('#neighborContainer').onClick(() => wixLocation.to(`/bail-bonds/${itemData.slug}`));
                }
            });
            nearbyRep.expand();
        }

        // Hide loader / Show content
        if ($w('#loadingIndicator').valid) $w('#loadingIndicator').hide();
        if ($w('#countyContent').valid) $w('#countyContent').expand();

    } catch (err) {
        console.error("❌ Critical Page Error:", err);
        if ($w('#loadingIndicator').valid) $w('#loadingIndicator').hide();
    }
});

// --- HELPER UI FUNCTIONS ---
function setText(selector, value) {
    if ($w(selector).valid) $w(selector).text = value || "";
}

function setLink(selector, url, label) {
    const el = $w(selector);
    if (!el.valid) return;

    if (url) {
        if (el.type === '$w.Button') {
            el.label = label || el.label;
            el.link = url;
            el.target = "_blank";
        } else {
            // Text link
            el.text = label || el.text;
            // el.link = url; // Text elements might not allow direct link prop assignment on some versions, safer to use event or property if rich text
            // Use wixLocation for text click if needed, or simple link property if it's a specific Wix element type
            // NOTE: Simple text elements don't always have a .link property accessible like this unless rich text.
        }
        el.expand();
    } else {
        el.collapse();
    }
}