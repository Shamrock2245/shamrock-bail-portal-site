/**
 * Sitemap Generator
 * Filename: seo/sitemap-generator.js
 * 
 * Generates XML sitemap for Shamrock Bail Bonds website.
 * Run this script to generate an updated sitemap.xml.
 *
 * This file is a planning artifact. The sitemap Wix serves from
 * /_functions/sitemap is built in src/backend/http-functions.js.
 * A change here does not change that response.
 */

const fs = require('fs');
const path = require('path');

// Site configuration
const SITE_URL = 'https://www.shamrockbailbonds.biz';
const LAST_MOD = new Date().toISOString().split('T')[0];

// All 67 Florida counties — MUST match actual live URL slugs
// Canonical slugs are hyphenated for compound names (indian-river, palm-beach,
// st-johns, st-lucie, miami-dade, santa-rosa). The unhyphenated drafts
// (indianriver, palmbeach, stjohns, stlucie) stay unpublished and out of the
// sitemap; see docs/seo/redirect-map.csv for their 301s.
const floridaCounties = [
    'alachua', 'baker', 'bay', 'bradford', 'brevard', 'broward', 'calhoun',
    'charlotte', 'citrus', 'clay', 'collier', 'columbia', 'desoto', 'dixie',
    'duval', 'escambia', 'flagler', 'franklin', 'gadsden', 'gilchrist', 'glades',
    'gulf', 'hamilton', 'hardee', 'hendry', 'hernando', 'highlands', 'hillsborough',
    'holmes', 'indian-river', 'jackson', 'jefferson', 'lafayette', 'lake', 'lee',
    'leon', 'levy', 'liberty', 'madison', 'manatee', 'marion', 'martin', 'miami-dade',
    'monroe', 'nassau', 'okaloosa', 'okeechobee', 'orange', 'osceola', 'palm-beach',
    'pasco', 'pinellas', 'polk', 'putnam', 'santa-rosa', 'sarasota', 'seminole',
    'st-johns', 'st-lucie', 'sumter', 'suwannee', 'taylor', 'union', 'volusia',
    'wakulla', 'walton', 'washington'
];

// City and jail pages served by the same /florida-bail-bonds/{slug} template
// (FloridaCounties items that are not counties). 36 entries.
const floridaLocalPages = [
    'bonita-springs', 'bradenton', 'cape-coral', 'cape-coral-pd',
    'charlotte-county-jail', 'clearwater', 'clewiston', 'collier-county-jail',
    'daytona-beach', 'englewood', 'estero', 'fort-lauderdale', 'fort-myers',
    'fort-myers-beach', 'gainesville', 'immokalee', 'jacksonville', 'labelle',
    'lakeland', 'lee-county-jail', 'lehigh-acres', 'marco-island', 'miami',
    'naples', 'north-fort-myers', 'north-port', 'orlando', 'pensacola',
    'port-charlotte', 'punta-gorda', 'sanibel', 'st-petersburg', 'tallahassee',
    'tampa', 'venice', 'west-palm-beach'
];

// Static pages with their priorities and change frequencies
// MUST match actual live Wix page slugs
// Portal pages (/portal, /portal-landing, /portal-defendant, /portal-indemnitor,
// /portal-staff) are noindex and must never be listed here.
// The county hub is /florida-bail-bonds-1. /florida-bail-bonds is the dynamic
// prefix and 301s to the hub, so it is not a static sitemap URL.
const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/florida-bail-bonds-1', priority: '0.9', changefreq: 'weekly' },
    { url: '/how-bail-works', priority: '0.9', changefreq: 'monthly' },
    { url: '/how-to-become-a-bondsman', priority: '0.8', changefreq: 'monthly' },
    { url: '/contact', priority: '0.8', changefreq: 'monthly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/blog', priority: '0.7', changefreq: 'weekly' },
    { url: '/testimonials', priority: '0.7', changefreq: 'monthly' },
    { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' }
];

/**
 * Generate sitemap XML
 */
function generateSitemap() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
        xml += generateUrlEntry(page.url, page.priority, page.changefreq);
    });

    // Add county pages — uses /florida-bail-bonds/{slug} pattern
    floridaCounties.forEach(county => {
        xml += generateUrlEntry(
            `/florida-bail-bonds/${county}`,
            '0.8',
            'monthly'
        );
    });

    // City and jail pages on the same template
    floridaLocalPages.forEach(slug => {
        xml += generateUrlEntry(
            `/florida-bail-bonds/${slug}`,
            '0.7',
            'monthly'
        );
    });

    xml += '</urlset>';

    return xml;
}

/**
 * Generate a single URL entry
 */
function generateUrlEntry(url, priority, changefreq) {
    return `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${LAST_MOD}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
}

/**
 * Child sitemaps that sitemap.xml must list.
 * blog-posts and blog-categories were missing from the index after the
 * PR #64 sitemap-generator edit (the only sitemap change in PRs #63–#71).
 * Wix still serves those two files; the index has to point at them.
 */
const SITEMAP_INDEX_CHILDREN = [
    'blog-posts-sitemap.xml',
    'blog-categories-sitemap.xml',
    'dynamic-florida-bail-bonds_p_e7cdf976_0d00_4377_927c_fa4cc08037be_0_5000-sitemap.xml',
    'pages-sitemap.xml'
];

/**
 * Generate sitemap index for large sites
 */
function generateSitemapIndex(sitemaps = SITEMAP_INDEX_CHILDREN) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    sitemaps.forEach(sitemap => {
        xml += `  <sitemap>
    <loc>${SITE_URL}/${sitemap}</loc>
    <lastmod>${LAST_MOD}</lastmod>
  </sitemap>\n`;
    });

    xml += '</sitemapindex>';

    return xml;
}

// Export for use in other scripts
module.exports = {
    floridaLocalPages,
    generateSitemap,
    generateSitemapIndex,
    floridaCounties,
    staticPages,
    SITEMAP_INDEX_CHILDREN
};

if (require.main === module) {
    try {
        console.log(generateSitemapIndex());
    } catch (error) {
        console.error("CRITICAL ERROR Generating Sitemap:", error);
        process.exit(1);
    }
}
