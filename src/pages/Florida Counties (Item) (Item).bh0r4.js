// Force Sync: Restoring Dynamic Page Code
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCountyBySlug, getNearbyCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Dynamic County Page Loading...");

    // 1. Extract Slug from URL
    const path = wixLocation.path;
    // Handle both /county/lee and /floridacounties-1/lee formats
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log("📍 Extracted Slug:", countySlug);

    if (!countySlug) {
        console.error("❌ No slug found in URL");
        $w('#countyName').text = "County Not Found";
        return;
    }

    try {
        // 2. Fetch County Data
        const county = await getCountyBySlug(countySlug);

        if (!county) {
            console.error("❌ County data not found for slug:", countySlug);
            $w('#countyName').text = "County Data Not Found";
            return;
        }

        console.log("✅ County Data Loaded:", county.name);

        // 3. Populate Page Elements (Screenshot Design)

        // --- Headers ---
        setText('#countyName', county.name);
        setText('#dynamicHeader', `Bail Bonds in ${county.name} County`);
        setText('#quickRefHeader', `${county.name} Quick Reference`);

        // --- Sheriff's Office (Top Left) ---
        setText('#sheriffPhone', county.jailPhone || county.primaryPhone || "(239) 477-1500");
        // Bridge: Spec #callSheriffBtn (Button) vs Legacy #sheriffWebsite (Link)
        const sheriffUrl = county.sheriffWebsite || county.jailBookingUrl; // Fallback to either

        if ($w('#callSheriffBtn').length > 0) {
            setLink('#callSheriffBtn', sheriffUrl, "Visit Sheriff's Website");
            $w('#sheriffWebsite').collapse();
        } else {
            setLink('#sheriffWebsite', sheriffUrl, "Visit Sheriff's Website");
        }

        // --- Main Jail (Top Right) ---
        setText('#jailName', county.jailName || `${county.name} County Jail`);

        // RELAXED REQUIREMENT: If no address, just show the county name/state or hide
        if (county.jailAddress) {
            setText('#jailAddress', county.jailAddress);
        } else {
            // User request: Don't show "Address not available" or scour for it.
            // Option A: Hide
            $w('#jailAddress').collapse();
            // Option B: Generic
            // setText('#jailAddress', `${county.name}, FL`);
        }

        // --- Clerk of Court (Bottom Left) ---
        setText('#clerkPhone', county.clerkPhone || "(239) 533-5000");
        // Bridge: Spec #callClerkBtn vs Legacy #clerkWebsite
        if ($w('#callClerkBtn').length > 0) {
            setLink('#callClerkBtn', county.clerkWebsite, "Visit Clerk's Website");
        } else {
            setLink('#clerkWebsite', county.clerkWebsite, "Visit Clerk's Website");
        }

        // --- County Information (Bottom Right) ---
        setText('#countySeat', county.countySeat ? `County Seat: ${county.countySeat}` : "");
        // Population removed per user request

        // --- About Section (Dynamic Content) ---
        // Header: "About Bail Bonds in [Lee County]"
        setText('#aboutHeader', `About Bail Bonds in ${county.name} County`);

        // Body: "...throughout Lee County, including Fort Myers and all surrounding..."
        const city = county.countySeat || "the area";
        const aboutText = `Shamrock Bail Bonds provides fast, professional bail bond services throughout ${county.name} County, including ${city} and all surrounding communities. When someone you care about is arrested and taken to ${county.name} County Main Jail, time is critical. Our experienced agents are available 24 hours a day, 7 days a week to help secure their release as quickly as possible.`;
        setText('#aboutBody', aboutText);

        // Header: "Why Choose Shamrock Bail Bonds in [Lee County]"
        setText('#whyChooseHeader', `Why Choose Shamrock Bail Bonds in ${county.name} County`);

        // --- Call Button (Sticky/Header) ---
        const phone = county.primaryPhone || "(239) 332-2245";

        // Bridge: Spec #callShamrockBtn vs Legacy #callCountiesBtn
        const specCall = $w('#callShamrockBtn');
        const legacyCall = $w('#callCountiesBtn');

        if (specCall.valid) {
            specCall.label = `Call ${phone}`;
            specCall.onClick(() => wixLocation.to(`tel:${phone.replace(/[^0-9]/g, '')}`));
            specCall.expand();
        }

        if (legacyCall.valid) {
            legacyCall.label = `Call ${phone}`;
            legacyCall.onClick(() => wixLocation.to(`tel:${phone.replace(/[^0-9]/g, '')}`));
        }

        // 4. Update SEO Tags
        wixSeo.setTitle(`Bail Bonds ${county.name} County | Shamrock Bail Bonds`);
        wixSeo.setMetaTags([{
            "name": "description",
            "content": `24/7 Bail Bonds in ${county.name} County. Call ${phone} for immediate release. Fast, confidential service.`
        }]);

        // 5. Populate Nearby Counties
        const nearby = await getNearbyCounties("Southwest Florida", county._id); // Region mocked for now
        const rep = $w('#nearbyCountiesRepeater');

        if (rep.length > 0) {
            rep.data = nearby;
            rep.onItemReady(($item, itemData) => {
                const name = itemData.name || itemData.countyName || "Unknown";
                const slug = itemData.slug || itemData.countySlug || name.toLowerCase();

                // Try common repeater elements
                if ($item('#neighborName').length) $item('#neighborName').text = name;
                if ($item('#neighborLink').length) {
                    $item('#neighborLink').link = `/county/${slug}`;
                    $item('#neighborLink').label = name; // If it's a button
                }

                // Fallback: If container is clicked
                if ($item('#neighborContainer').length) {
                    $item('#neighborContainer').onClick(() => wixLocation.to(`/county/${slug}`));
                }
            });
            rep.expand();
        }

    } catch (error) {
        console.error("❌ Error initializing page:", error);
    }
});

// Helper to safely set text
function setText(selector, value) {
    const el = $w(selector);
    if (el.valid) {
        el.text = value || "";
    } else {
        console.warn(`⚠️ Element ${selector} not found on page.`);
    }
}

// Helper to safely set link on buttons or text
function setLink(selector, url, label) {
    const el = $w(selector);
    if (el.valid) {
        if (url) {
            if (el.type === '$w.Button') {
                el.label = label;
                el.link = url;
                el.target = "_blank";
            } else {
                // For Text elements, assuming they are used as labels or headers for the link
                // If the user uses a Text element for "Visit Website", we can't easily make it a link without HTML
                // But strictly setting .text property. If they want a clickable text link, they should use a Button styled as text.
                el.text = label;
                // If we want to force it to be clickable if it's a text element, we'd need onClick
                el.onClick(() => wixLocation.to(url));
            }
            el.expand();
        } else {
            el.collapse(); // Hide if no URL
        }
    }
}
