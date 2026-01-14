// Force Sync: Dynamic Page Logic
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import wixData from 'wix-data';
import { getCountyBySlug, getNearbyCounties } from 'public/countyUtils';
import { COLLECTIONS } from 'public/collectionIds';

$w.onReady(async function () {
    console.log("🚀 Dynamic County Page Loading...");

    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    if (!countySlug) return;

    // DATASET OVERRIDE
    $w.onReady(() => {
        const dataset = $w('#dynamicDataset');
        if (dataset.length > 0) {
            dataset.onReady(() => {
                dataset.setFilter(wixData.filter().eq('slug', countySlug));
            });
        }
    });

    try {
        const [county, faqResult] = await Promise.all([
            getCountyBySlug(countySlug),
            wixData.query(COLLECTIONS.FAQ).limit(6).find()
        ]);

        if (!county) return;

        // SEO
        wixSeo.setStructuredData([{
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": `Shamrock Bail Bonds - ${county.name}`,
            "url": `https://www.shamrockbailbonds.biz/bail-bonds/${county.slug}`,
            "telephone": "+12393322245"
        }]);

        // UI Updates
        setText('#countyName', county.name);
        setText('#dynamicHeader', `Bail Bonds in ${county.name} County`);

        // Phones & Links
        setText('#sheriffPhone', county.jailPhone || county.primaryPhone || "(239) 477-1500");
        setText('#clerkPhone', county.clerkPhone || "(239) 533-5000");

        const sheriffUrl = county.sheriffWebsite || county.jailBookingUrl;
        setLink('#callSheriffBtn', sheriffUrl, "Visit Sheriff's Website");
        setLink('#callClerkBtn', county.clerkWebsite, "Visit Clerk's Website");

        // CTA Buttons
        if ($w('#callShamrockBtn').length) {
            $w('#callShamrockBtn').label = `Call ${county.primaryPhone || "(239) 332-BAIL"}`;
            $w('#callShamrockBtn').onClick(() => wixLocation.to(`tel:${(county.primaryPhone || "2393322245").replace(/[^0-9]/g, '')}`));
        }

        // FAQs
        const faqRep = $w('#faqRepeater');
        if (faqRep.valid && faqResult.items.length > 0) {
            faqRep.data = faqResult.items;
            faqRep.onItemReady(($item, itemData) => {
                $item('#faqQuestion').text = itemData.q || itemData.question;
                $item('#faqAnswer').text = itemData.a || itemData.answer;
            });
            faqRep.expand();
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