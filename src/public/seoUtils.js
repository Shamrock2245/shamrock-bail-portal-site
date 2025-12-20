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
const SITE_NAME = 'Shamrock Bail Bonds';
const PHONE = '239-332-2245';
const PHONE_FORMATTED = '+1-239-332-2245';

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
        "url": `${SITE_URL}/bail-bonds/${county.slug}`,
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

export { SITE_URL, SITE_NAME, PHONE, PHONE_FORMATTED };
