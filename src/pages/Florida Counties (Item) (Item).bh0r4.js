// Force Sync: Dynamic Page Logic
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCountyBySlug, getNearbyCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Dynamic County Page Loading...");

    // 1. EXTRACT SLUG
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    if (!countySlug) return;

    try {
        // 2. FETCH DATA
        const county = await getCountyBySlug(countySlug);
        if (!county) return;

        // 3. UPDATE PAGE TEXT (Forces the correct county to show)
        setText('#countyName', county.name);
        setText('#dynamicHeader', `Bail Bonds in ${county.name} County`);
        setText('#quickRefHeader', `${county.name} Quick Reference`);

        // Sheriff & Jail
        setText('#sheriffPhone', county.jailPhone || county.primaryPhone || "(239) 477-1500");
        setText('#jailName', county.jailName || `${county.name} County Jail`);

        // Handle Missing Address Gracefully
        if (county.jailAddress) {
            setText('#jailAddress', county.jailAddress);
        } else {
            $w('#jailAddress').collapse(); // Hide if empty
        }

        // Clerk
        setText('#clerkPhone', county.clerkPhone || "(239) 533-5000");

        // Buttons (Link Logic)
        const sheriffUrl = county.sheriffWebsite || county.jailBookingUrl;
        if ($w('#callSheriffBtn').length > 0) setLink('#callSheriffBtn', sheriffUrl, "Visit Sheriff's Website");
        else setLink('#sheriffWebsite', sheriffUrl, "Visit Sheriff's Website");

        if ($w('#callClerkBtn').length > 0) setLink('#callClerkBtn', county.clerkWebsite, "Visit Clerk's Website");
        else setLink('#clerkWebsite', county.clerkWebsite, "Visit Clerk's Website");

        // About Section
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

        // 4. NEARBY COUNTIES (The "Magic" Part)
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