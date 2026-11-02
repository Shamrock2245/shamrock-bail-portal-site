/**
 * Data deletion request page — privacy utility.
 * Must stay noindex so it does not consume crawl budget.
 */
import wixSeo from 'wix-seo';

$w.onReady(function () {
    try {
        wixSeo.setTitle('Data Deletion Request | Shamrock Bail Bonds');
        wixSeo.setMetaTags([
            { name: 'robots', content: 'noindex, nofollow' },
            { name: 'googlebot', content: 'noindex, nofollow' },
            { name: 'description', content: 'Request deletion of personal data held by Shamrock Bail Bonds.' }
        ]);
    } catch (e) {
        console.warn('[data-deletion] SEO setup failed', e);
    }
});
