/**
 * 404 Not Found Page
 * Filename: pages/404.js
 * 
 * Custom 404 error page with helpful navigation.
 * 
 * Page Elements:
 * - #errorTitle: Error title
 * - #errorMessage: Error message
 * - #homeButton: Go to home button
 * - #searchInput: Search input
 * - #popularLinks: Popular links section
 * - #callButton: Call now button
 */

import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

// Popular pages
const popularPages = [
    { title: 'Home', url: '/' },
    { title: 'How Bail Works', url: '/how-bail-works' },
    { title: 'County Directory', url: '/county-directory' },
    { title: 'Start Bail Online', url: '/members/start-bail' },
    { title: 'Contact Us', url: '/contact' },
    { title: 'FAQ', url: '/faq' }
];

$w.onReady(function () {
    setupSEO();
    initializePage();
    setupEventListeners();
});

/**
 * Set up SEO (noindex for 404)
 */
function setupSEO() {
    wixSeo.setTitle('Page Not Found | Shamrock Bail Bonds');
    wixSeo.setMetaDescription('The page you\'re looking for could not be found. Visit our homepage or contact us for bail bond assistance.');
}

/**
 * Initialize page content
 */
function initializePage() {
    $w('#errorTitle').text = 'Page Not Found';
    $w('#errorMessage').text = `
We couldn't find the page you're looking for. It may have been moved or no longer exists.

Don't worry - we're still here to help with your bail bond needs 24/7.
    `;
    
    // Render popular links
    if ($w('#popularLinksRepeater')) {
        $w('#popularLinksRepeater').data = popularPages;
        $w('#popularLinksRepeater').onItemReady(($item, itemData) => {
            $item('#linkText').text = itemData.title;
            $item('#linkContainer').onClick(() => {
                wixLocation.to(itemData.url);
            });
        });
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Home button
    $w('#homeButton').onClick(() => {
        wixLocation.to('/');
    });
    
    // Search input
    if ($w('#searchInput')) {
        $w('#searchInput').onKeyPress((event) => {
            if (event.key === 'Enter') {
                const query = $w('#searchInput').value;
                if (query) {
                    wixLocation.to(`/search?q=${encodeURIComponent(query)}`);
                }
            }
        });
    }
    
    // Call button
    $w('#callButton').onClick(() => {
        wixLocation.to('tel:+12393322245');
    });
    
    // Start bail button
    if ($w('#startBailButton')) {
        $w('#startBailButton').onClick(() => {
            wixLocation.to('/members/start-bail');
        });
    }
}

export { popularPages };
