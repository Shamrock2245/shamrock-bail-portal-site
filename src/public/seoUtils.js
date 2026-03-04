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
    wixSeo.setMetaTags([
        { name: 'description', content: description }
    ]);

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
 * GLOBAL SEO + GEO INJECTION
 * Call this from masterPage.js on every page load.
 * Sets canonical URL, Organization schema, OG defaults, robots, geo meta,
 * ProfessionalService schema, and GEO (Generative Engine Optimization) signals.
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
    wixSeo.setMetaTags([
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'googlebot', content: 'index, follow' }
    ]);

    // 3. COMPREHENSIVE META TAGS (OG + Twitter + Geo)
    const pageTitle = `Shamrock Bail Bonds | ${formatPageName(currentPath)}`;
    const defaultDescription = '24/7 bail bond services across all 67 Florida counties. Fast, confidential, bilingual support. Call (239) 332-2245 for immediate release.';

    wixSeo.setMetaTags([
        // Open Graph
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image', content: `${SITE_URL}/logo.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        // Twitter Cards
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@ShamrockBail' },
        { name: 'twitter:image', content: `${SITE_URL}/logo.png` },
        // Geographic Meta (GEO signals for local search)
        { name: 'geo.region', content: 'US-FL' },
        { name: 'geo.placename', content: 'Fort Myers, Florida' },
        { name: 'geo.position', content: '26.6406;-81.8723' },
        { name: 'ICBM', content: '26.6406, -81.8723' },
        // Dublin Core geographic metadata
        { name: 'DC.title', content: pageTitle },
        { name: 'DC.coverage', content: 'Florida, United States' },
        { name: 'DC.language', content: 'en-US' }
    ]);

    // 4. SITE-WIDE STRUCTURED DATA
    const globalSchemas = [
        // A. Organization (Google Knowledge Panel)
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            "name": SITE_NAME,
            "legalName": "Shamrock Bail Bonds, LLC",
            "url": SITE_URL,
            "telephone": PHONE_FORMATTED,
            "email": "admin@shamrockbailbonds.biz",
            "foundingDate": "2012",
            "foundingLocation": "Fort Myers, FL",
            "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/logo.png`,
                "width": 512,
                "height": 512
            },
            "image": `${SITE_URL}/logo.png`,
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://www.youtube.com/@ShamrockBailBonds_FL",
                "https://t.me/Shamrock_Bail_Bonds",
                "https://www.tiktok.com/@shamrockbailbonds",
                "https://www.yelp.com/biz/shamrock-bail-bonds-fort-myers"
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
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "00:00",
                        "closes": "23:59"
                    }
                },
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-5245",
                    "contactType": "Emergency",
                    "areaServed": "US-FL",
                    "availableLanguage": ["English", "Spanish"]
                },
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-955-0301",
                    "contactType": "Customer Service",
                    "areaServed": "US-FL",
                    "availableLanguage": "Spanish"
                }
            ],
            // Semantic relevance signals for AI/GEO
            "knowsAbout": [
                "Bail Bonds",
                "Surety Bonds",
                "Florida Criminal Justice System",
                "Jail Release Process",
                "Court Appearances",
                "Indemnitor Responsibilities",
                "Bail Bond Payment Plans",
                "Florida Statute 903",
                "Pretrial Release"
            ],
            "slogan": "Fort Myers Since 2012"
        },

        // B. ProfessionalService (more specific than LocalBusiness -- ranks higher)
        {
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "additionalType": "https://en.wikipedia.org/wiki/Bail_bondsman",
            "@id": `${SITE_URL}/#profservice`,
            "name": SITE_NAME,
            "url": SITE_URL,
            "telephone": PHONE_FORMATTED,
            "image": `${SITE_URL}/logo.png`,
            "priceRange": "$$",
            "description": "Licensed bail bond agency serving all 67 Florida counties. Available 24 hours a day, 7 days a week with bilingual English and Spanish support. Fast jail release, payment plans available.",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "26.6406",
                "longitude": "-81.8723"
            },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            },
            "paymentAccepted": ["Cash", "Credit Card", "Debit Card", "Payment Plan"],
            "currenciesAccepted": "USD",
            // Florida-wide coverage: all 6 regions
            "areaServed": [
                { "@type": "State", "name": "Florida", "@id": "https://en.wikipedia.org/wiki/Florida" },
                { "@type": "AdministrativeArea", "name": "Southwest Florida" },
                { "@type": "AdministrativeArea", "name": "Southeast Florida" },
                { "@type": "AdministrativeArea", "name": "Central Florida" },
                { "@type": "AdministrativeArea", "name": "Tampa Bay Area" },
                { "@type": "AdministrativeArea", "name": "North Florida" },
                { "@type": "AdministrativeArea", "name": "Florida Panhandle" }
            ],
            // GeoCircle: 300-mile radius covers entire state from Fort Myers
            "serviceArea": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                    "@type": "GeoCoordinates",
                    "latitude": "26.6406",
                    "longitude": "-81.8723"
                },
                "geoRadius": "482803" // ~300 miles in meters
            },
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds"
            ],
            // Service catalog for rich results
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Bail Bond Services",
                "itemListElement": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Surety Bail Bonds",
                            "description": "Standard bail bonds at 10% premium as regulated by Florida statute. Available for all charges."
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Emergency After-Hours Bail Bonds",
                            "description": "24/7 emergency bail bond posting for immediate jail release, nights, weekends, and holidays."
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Immigration Bail Bonds",
                            "description": "Specialized immigration bonds for ICE detainees in Florida. Bilingual Spanish support available."
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Bail Bond Payment Plans",
                            "description": "Flexible payment plans for bail bond premiums. No credit check required for qualifying bonds."
                        }
                    }
                ]
            },
            // Speakable: enables voice search / AI assistants to read this
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", ".hero-subtitle", ".faq-question"]
            }
        },

        // C. WebSite (enables Google Sitelinks Search Box)
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            "name": SITE_NAME,
            "alternateName": "Shamrock Bail",
            "url": SITE_URL,
            "publisher": { "@id": `${SITE_URL}/#organization` },
            "inLanguage": ["en-US", "es"],
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${SITE_URL}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        },

        // D. WebPage (current page context)
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${canonicalUrl}#webpage`,
            "url": canonicalUrl,
            "name": pageTitle,
            "description": defaultDescription,
            "isPartOf": { "@id": `${SITE_URL}/#website` },
            "about": { "@id": `${SITE_URL}/#organization` },
            "provider": { "@id": `${SITE_URL}/#organization` },
            "inLanguage": "en-US",
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", ".hero-subtitle"]
            }
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
    if (path === '/' || path === '') return '24/7 Bail Bonds Fort Myers, FL';
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

export { SITE_URL, SITE_NAME, PHONE, PHONE_FORMATTED };
