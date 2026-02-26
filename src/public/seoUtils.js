/**
 * SEO Utilities
 * Filename: public/seoUtils.js
 * 
 * Utility functions for SEO optimization across the site.
 * Includes schema markup generators and meta tag helpers.
 */

import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';

// Site constants
const SITE_URL = 'https://www.shamrockbailbonds.biz';
const SITE_NAME = 'Shamrock Bail Bonds, LLC';
const PHONE = '239-332-2245';
const PHONE_FORMATTED = '+12393322245';

/**
 * Set page meta tags
 * 
 * @param {Object} options
 * @param {string} options.title - Page title
 * @param {string} options.description - Meta description
 * @param {string} options.keywords - Meta keywords (optional)
 * @param {string} options.image - OG image URL (optional)
 */
export function setPageMeta({ title, description, keywords, image }) {
    // Set title
    wixSeo.setTitle(title);

    // Set description
    wixSeo.setMetaDescription(description);

    // Set keywords if provided
    if (keywords) {
        wixSeo.setMetaTags([
            { name: 'keywords', content: keywords }
        ]);
    }

    // Set Open Graph tags
    const ogTags = [
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${SITE_URL}${wixLocation.path.join('/')}` },
        { property: 'og:site_name', content: SITE_NAME }
    ];

    if (image) {
        ogTags.push({ property: 'og:image', content: image });
    }

    // Set Twitter Card tags
    const twitterTags = [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description }
    ];

    if (image) {
        twitterTags.push({ name: 'twitter:image', content: image });
    }

    wixSeo.setMetaTags([...ogTags, ...twitterTags]);
}

/**
 * Generate Local Business schema
 * 
 * @param {Object} options - Override default values
 * @returns {Object} Schema.org LocalBusiness object
 */
export function generateLocalBusinessSchema(options = {}) {
    return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": options.name || SITE_NAME,
        "description": options.description || "Professional bail bond services serving all 67 Florida counties. Available 24/7.",
        "url": options.url || SITE_URL,
        "telephone": PHONE_FORMATTED,
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Fort Myers",
            "addressRegion": "FL",
            "addressCountry": "US"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 26.6406,
            "longitude": -81.8723
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "areaServed": options.areaServed || {
            "@type": "State",
            "name": "Florida"
        },
        ...options.additional
    };
}

/**
 * Generate County Page schema
 * 
 * @param {Object} county - County data
 * @returns {Object} Schema.org LocalBusiness object for county
 */
export function generateCountyPageSchema(county) {
    return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `${SITE_NAME} - ${county.name} County`,
        "description": `Bail bond services in ${county.name} County, Florida. Fast jail release in ${county.countySeat} and surrounding areas. Call ${PHONE}.`,
        "url": `${SITE_URL}/florida-bail-bonds/${county.slug}`,
        "telephone": PHONE_FORMATTED,
        "areaServed": {
            "@type": "AdministrativeArea",
            "name": `${county.name} County, Florida`
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        }
    };
}

/**
 * Generate FAQ Page schema
 * 
 * @param {Array} faqs - Array of FAQ objects with question and answer
 * @returns {Object} Schema.org FAQPage object
 */
export function generateFAQSchema(faqs) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

/**
 * Generate Breadcrumb schema
 * 
 * @param {Array} items - Array of breadcrumb items {name, url}
 * @returns {Object} Schema.org BreadcrumbList object
 */
export function generateBreadcrumbSchema(items) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
        }))
    };
}

/**
 * Generate Article schema for blog posts
 * 
 * @param {Object} article - Article data
 * @returns {Object} Schema.org Article object
 */
export function generateArticleSchema(article) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.description,
        "image": article.image,
        "author": {
            "@type": "Organization",
            "name": SITE_NAME
        },
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/logo.png`
            }
        },
        "datePublished": article.datePublished,
        "dateModified": article.dateModified || article.datePublished,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": article.url
        }
    };
}

/**
 * Generate HowTo schema
 * 
 * @param {Object} howTo - HowTo data with steps
 * @returns {Object} Schema.org HowTo object
 */
export function generateHowToSchema(howTo) {
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": howTo.name,
        "description": howTo.description,
        "totalTime": howTo.totalTime || "PT2H",
        "estimatedCost": howTo.estimatedCost || {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "Varies (10% of bail amount)"
        },
        "step": howTo.steps.map((step, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": step.name,
            "text": step.text,
            "url": step.url
        }))
    };
}

/**
 * Set structured data on page
 * 
 * @param {Array|Object} schemas - Schema object(s) to add
 */
export function setStructuredData(schemas) {
    const schemaArray = Array.isArray(schemas) ? schemas : [schemas];
    wixSeo.setStructuredData(schemaArray);
}

/**
 * Generate canonical URL
 * 
 * @param {string} path - Page path
 * @returns {string} Full canonical URL
 */
export function getCanonicalUrl(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SITE_URL}${cleanPath}`;
}

/**
 * Set canonical URL for current page
 * 
 * @param {string} path - Optional custom path
 */
export function setCanonicalUrl(path) {
    const url = path ? getCanonicalUrl(path) : `${SITE_URL}${wixLocation.path.join('/')}`;
    wixSeo.setLinks([
        { rel: 'canonical', href: url }
    ]);
}

/**
 * GLOBAL SEO INJECTION
 * Call this from masterPage.js on every page load.
 * Sets canonical URL, Organization schema, OG defaults, and robots tag.
 * Skips portal pages (they have their own noindex logic).
 */
export function initGlobalSEO() {
    const currentPath = '/' + wixLocation.path.join('/');

    // Skip portal pages (they already set noindex)
    const noIndexPaths = ['/portal-staff', '/portal-indemnitor', '/portal-defendant', '/portal-landing'];
    if (noIndexPaths.some(p => currentPath.startsWith(p))) {
        return;
    }

    // 1. CANONICAL URL (Critical for indexing)
    const canonicalUrl = `${SITE_URL}${currentPath === '/' ? '' : currentPath}`;
    wixSeo.setLinks([
        { rel: 'canonical', href: canonicalUrl }
    ]);

    // 2. ROBOTS: Explicitly tell Google to index public pages
    // This overrides any implicit noindex from Wix
    wixSeo.setMetaTags([
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'googlebot', content: 'index, follow' }
    ]);

    // 3. DEFAULT OPEN GRAPH (pages with their own OG override these)
    const pageTitle = `Shamrock Bail Bonds | ${formatPageName(currentPath)}`;
    const defaultDescription = '24/7 Bail Bond Service in Florida. Fast, confidential, and professional. Call (239) 332-BAIL for immediate help.';

    wixSeo.setMetaTags([
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:locale', content: 'en_US' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@ShamrockBail' },
        // Only set defaults if the page hasn't set its own
        { name: 'geo.region', content: 'US-FL' },
        { name: 'geo.placename', content: 'Fort Myers' },
        { name: 'geo.position', content: '26.6406;-81.8723' },
        { name: 'ICBM', content: '26.6406, -81.8723' }
    ]);

    // 4. SITE-WIDE STRUCTURED DATA (Organization + WebSite + SearchAction)
    const globalSchemas = [
        // Organization (appears in Google Knowledge Panel)
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            "name": SITE_NAME,
            "url": SITE_URL,
            "telephone": PHONE_FORMATTED,
            "email": "admin@shamrockbailbonds.biz",
            "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/logo.png`
            },
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://www.youtube.com/@ShamrockBailBonds_FL",
                "https://t.me/Shamrock_Bail_Bonds"
            ],
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-2245",
                    "contactType": "Customer Service",
                    "areaServed": "US-FL",
                    "availableLanguage": ["English", "Spanish"],
                    "contactOption": "TollFree"
                }
            ]
        },
        // WebSite (enables Google Sitelinks Search Box)
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            "name": SITE_NAME,
            "url": SITE_URL,
            "publisher": { "@id": `${SITE_URL}/#organization` },
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${SITE_URL}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        },
        // WebPage (current page)
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${canonicalUrl}#webpage`,
            "url": canonicalUrl,
            "name": pageTitle,
            "description": defaultDescription,
            "isPartOf": { "@id": `${SITE_URL}/#website` },
            "about": { "@id": `${SITE_URL}/#organization` },
            "inLanguage": "en-US"
        }
    ];

    wixSeo.setStructuredData(globalSchemas).catch(e => {
        console.warn('Global SEO schema error:', e);
    });
}

/**
 * Format page name from URL path for SEO title fallback
 */
function formatPageName(path) {
    if (path === '/' || path === '') return 'Fort Myers, FL';
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

export { SITE_URL, SITE_NAME, PHONE, PHONE_FORMATTED };
