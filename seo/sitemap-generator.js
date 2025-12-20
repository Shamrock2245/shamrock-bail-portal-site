/**
 * Sitemap Generator
 * Filename: seo/sitemap-generator.js
 * 
 * Generates XML sitemap for Shamrock Bail Bonds website.
 * Run this script to generate an updated sitemap.xml
 */

const fs = require('fs');
const path = require('path');

// Site configuration
const SITE_URL = 'https://www.shamrockbailbonds.biz';
const LAST_MOD = new Date().toISOString().split('T')[0];

// All 67 Florida counties
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

// Static pages with their priorities and change frequencies
const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/how-bail-works', priority: '0.9', changefreq: 'monthly' },
    { url: '/county-directory', priority: '0.9', changefreq: 'monthly' },
    { url: '/become-a-bondsman', priority: '0.8', changefreq: 'monthly' },
    { url: '/sheriffs-directory', priority: '0.8', changefreq: 'monthly' },
    { url: '/contact', priority: '0.8', changefreq: 'monthly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/faq', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog', priority: '0.7', changefreq: 'weekly' },
    { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' }
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
    
    // Add county pages
    floridaCounties.forEach(county => {
        xml += generateUrlEntry(
            `/bail-bonds/${county}-county`,
            '0.8',
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
 * Generate sitemap index for large sites
 */
function generateSitemapIndex(sitemaps) {
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

// Generate and output sitemap
const sitemap = generateSitemap();
console.log(sitemap);

// Export for use in other scripts
module.exports = { generateSitemap, generateSitemapIndex, floridaCounties, staticPages };
