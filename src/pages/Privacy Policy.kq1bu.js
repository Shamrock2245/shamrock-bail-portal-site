import wixSeo from 'wix-seo';

$w.onReady(function () {
    updatePageSEO();
});

function updatePageSEO() {
    wixSeo.setTitle("Privacy Policy | Shamrock Bail Bonds");
    wixSeo.setMetaTags([
        { "name": "description", "content": "Privacy Policy for Shamrock Bail Bonds. Learn how we handle your data, ensure confidentiality, and protect your rights." },
        { "property": "og:title", "content": "Privacy Policy | Shamrock Bail Bonds" },
        { "property": "og:type", "content": "website" }
    ]);

    wixSeo.setStructuredData([{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Privacy Policy",
        "url": "https://www.shamrockbailbonds.biz/privacy-policy",
        "publisher": {
            "@type": "Organization",
            "name": "Shamrock Bail Bonds"
        }
    }]);
}
