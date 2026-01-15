// Force Sync: Dynamic Page Logic
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import wixData from 'wix-data';
import { getCountyBySlug, getNearbyCounties } from 'public/countyUtils';
import { COLLECTIONS } from 'public/collectionIds';

$w.onReady(async function () {
    console.log("🚀 Dynamic County Page Loading...");

    // 1. EXTRACT SLUG
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    if (!countySlug) {
        console.error("❌ No slug found in URL path:", path);
        return;
    }

    console.log(`DEBUG: Extracted Slug: "${countySlug}"`);

    // --- DATASET OVERRIDE (Fix for Manual Connections) ---
    // If the user manually connected a Dataset, it might be defaulting to "Alachua".
    // We force it to filter by the current slug so the manual UI matches our code.
    $w.onReady(() => {
        const dataset = $w('#dynamicDataset'); // Standard ID
        if (dataset.length > 0) {
            console.log("DEBUG: Found #dynamicDataset. Forcing filter to slug:", countySlug);
            dataset.onReady(() => {
                dataset.setFilter(wixData.filter().eq('slug', countySlug))
                    .then(() => console.log("DEBUG: Dataset filter applied."))
                    .catch(e => console.error("DEBUG: Dataset filter success/fail or strict mode:", e));
            });
        }
    });

    try {
        // 2. FETCH DATA IN PARALLEL (Optimization)
        // We fetch the County Data AND the FAQs at the same time for speed
        const [county, faqResult] = await Promise.all([
            getCountyBySlug(countySlug),
            wixData.query(COLLECTIONS.FAQ).limit(6).find()
        ]);

        if (!county) {
            console.warn(`County not found for slug: ${countySlug}. Redirecting to portal landing.`);
            wixLocation.to('/portal-landing');
            return;
        }

        console.log(`Loaded County: ${county.name} | Loaded ${faqResult.totalCount} FAQs`);

        // 3. GENERATE SEO SCHEMA (LocalBusiness + FAQPage)
        // We combine the business info with the FAQ data for a rich Google result
        const faqs = faqResult.items;

        wixSeo.setStructuredData([
            {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": `Shamrock Bail Bonds - ${county.name} County`,
                "description": `Professional 24/7 bail bond services in ${county.name} County, Florida. Fast jail release for ${county.countySeat || "the area"} and surrounding areas.`,
                "url": `https://www.shamrockbailbonds.biz/bail-bonds/${county.slug}`,
                "telephone": "+12393322245",
                "image": "https://www.shamrockbailbonds.biz/logo.png",
                "priceRange": "$$",
                "areaServed": {
                    "@type": "AdministrativeArea",
                    "name": `${county.name} County, Florida`
                },
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": [
                        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
                    ],
                    "opens": "00:00",
                    "closes": "23:59"
                }
            },
            {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.question || faq.title,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.answer
                    }
                }))
            }
        ]);

        // 4. UPDATE PAGE UI
        // Text Fields
        setText('#countyName', county.name);
        setText('#dynamicHeader', `Bail Bonds in ${county.name} County`);
        setText('#quickRefHeader', `${county.name} Quick Reference`);

        // Sheriff & Jail
        setText('#sheriffPhone', county.jailPhone || county.primaryPhone || "(239) 477-1500");
        setText('#jailName', county.jailName || `${county.name} County Jail`);

        if (county.jailAddress) {
            setText('#jailAddress', county.jailAddress);
        } else {
            $w('#jailAddress').collapse();
        }

        // Clerk
        setText('#clerkPhone', county.clerkPhone || "(239) 533-5000");

        // Buttons
        const sheriffUrl = county.sheriffWebsite || county.jailBookingUrl;
        if ($w('#callSheriffBtn').length > 0) setLink('#callSheriffBtn', sheriffUrl, "Visit Sheriff's Website");
        else setLink('#sheriffWebsite', sheriffUrl, "Visit Sheriff's Website");

        if ($w('#callClerkBtn').length > 0) setLink('#callClerkBtn', county.clerkWebsite, "Visit Clerk's Website");
        else setLink('#clerkWebsite', county.clerkWebsite, "Visit Clerk's Website");

        // About
        setText('#aboutHeader', `About Bail Bonds in ${county.name} County`);
        const city = county.countySeat || "the area";
        setText('#aboutBody', `Shamrock Bail Bonds provides fast, professional bail bond services throughout ${county.name} County, including ${city} and all surrounding communities.`);
        setText('#whyChooseHeader', `Why Choose Shamrock Bail Bonds in ${county.name} County`);

        // Sticky CTA
        const phone = county.primaryPhone || "(239) 332-2245";
        const callBtn = $w('#callShamrockBtn').length ? $w('#callShamrockBtn') : $w('#callCountiesBtn');
        if (callBtn.valid) {
            callBtn.label = `Call ${phone}`;
            callBtn.onClick(() => wixLocation.to(`tel:${phone.replace(/[^0-9]/g, '')}`));
            callBtn.expand();
        }

        // Start Bail Process Button
        const startBailBtn = $w('#startBailBtn').length ? $w('#startBailBtn') : $w('#startProcessBtn');
        if (startBailBtn.valid) {
            startBailBtn.label = "Start Bond Process"; // Updated label for clarity
            startBailBtn.onClick(() => wixLocation.to('/portal-landing'));
            startBailBtn.expand();
        }

        // 5. POPULATE FAQ REPEATER
        const faqRep = $w('#faqRepeater');
        if (faqRep.valid && faqs.length > 0) {
            faqRep.data = faqs;
            faqRep.onItemReady(($item, itemData) => {
                // Determine field names (fallback to various common CMS names)
                const qText = itemData.question || itemData.title || itemData.q;
                const aText = itemData.answer || itemData.a;

                $item('#faqQuestion').text = qText;
                $item('#faqAnswer').text = aText;
            });
            faqRep.expand();
        } else if (faqRep.valid) {
            faqRep.collapse();
        }

        // 6. NEARBY COUNTIES
        const nearby = await getNearbyCounties("Southwest Florida", county._id);
        const rep = $w('#nearbyCountiesRepeater');
        if (rep.length > 0) {
            rep.data = nearby;
            rep.onItemReady(($item, itemData) => {
                const name = itemData.name || "Unknown";
                const slug = itemData.slug || name.toLowerCase();

                if ($item('#neighborName').length) $item('#neighborName').text = name;
                if ($item('#neighborContainer').length) {
                    $item('#neighborContainer').onClick(() => wixLocation.to(`/bail-bonds/${slug}`));
                }
            });
            rep.expand();
        }

    } catch (error) {
        console.error("Page Error:", error);
    }
});

// --- HELPER FUNCTIONS ---

function setText(selector, value) {
    if ($w(selector).valid) $w(selector).text = value || "";
}

function setLink(selector, url, label) {
    const el = $w(selector);
    if (el.valid && url) {
        if (el.type === '$w.Button') { el.label = label; el.link = url; el.target = "_blank"; }
        else { el.text = label; el.onClick(() => wixLocation.to(url)); }
        el.expand();
    } else if (el.valid) {
        el.collapse();
    }
}
