/**
 * About Us Page
 * Filename: pages/About.js
 * 
 * About page for Shamrock Bail Bonds.
 * 
 * Page Elements:
 * - #aboutTitle: Page title
 * - #aboutSubtitle: Page subtitle
 * - #storySection: Company story section
 * - #valuesRepeater: Core values repeater
 * - #statsSection: Statistics section
 * - #teamSection: Team section (optional)
 * - #ctaSection: Call-to-action section
 */

import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';

// Core values data
const coreValues = [
    {
        icon: '🤝',
        title: 'Integrity',
        description: 'We operate with complete honesty and transparency. Every client receives straightforward information about the bail process, costs, and their responsibilities.'
    },
    {
        icon: '⚡',
        title: 'Speed',
        description: 'We understand that every minute matters. Our streamlined process and 24/7 availability ensure the fastest possible release for your loved one.'
    },
    {
        icon: '💚',
        title: 'Compassion',
        description: 'We treat every client with dignity and respect. An arrest is stressful enough - we\'re here to make the bail process as smooth as possible.'
    },
    {
        icon: '🛡️',
        title: 'Reliability',
        description: 'When we make a commitment, we keep it. Our clients trust us because we deliver on our promises, every time.'
    },
    {
        icon: '📚',
        title: 'Education',
        description: 'We believe informed clients make better decisions. We take time to explain the process and answer all your questions.'
    },
    {
        icon: '🌴',
        title: 'Local Expertise',
        description: 'As a Florida-based company, we know the local courts, jails, and legal system inside and out. This expertise benefits our clients.'
    }
];

// Statistics
const stats = [
    { number: '67', label: 'Florida Counties Served' },
    { number: '24/7', label: 'Availability' },
    { number: '1000+', label: 'Clients Helped' },
    { number: '10%', label: 'Standard Premium Rate' }
];

$w.onReady(function () {
    setupSEO();
    initializePage();
    setupEventListeners();
});

/**
 * Set up SEO
 */
function setupSEO() {
    wixSeo.setTitle('About Shamrock Bail Bonds | Florida Bail Bond Experts');
    wixSeo.setMetaDescription('Learn about Shamrock Bail Bonds - your trusted Florida bail bond company. Serving all 67 counties with integrity, speed, and compassion. Available 24/7.');
    
    // Local business schema
    const businessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Shamrock Bail Bonds",
        "description": "Professional bail bond services serving all 67 Florida counties. Available 24/7.",
        "url": "https://www.shamrockbailbonds.biz",
        "telephone": "+1-239-332-2245",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Fort Myers",
            "addressRegion": "FL",
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
        "priceRange": "$$",
        "areaServed": {
            "@type": "State",
            "name": "Florida"
        }
    };
    
    wixSeo.setStructuredData([businessSchema]);
}

/**
 * Initialize page content
 */
function initializePage() {
    // Set titles
    $w('#aboutTitle').text = 'About Shamrock Bail Bonds';
    $w('#aboutSubtitle').text = 'Your Trusted Partner in Florida Bail Bonds';
    
    // Set story content
    if ($w('#storyText')) {
        $w('#storyText').text = `
Shamrock Bail Bonds was founded with a simple mission: to provide fast, professional, and compassionate bail bond services to families across Florida during their most challenging times.

We understand that an arrest can happen to anyone, at any time. It's often unexpected, stressful, and overwhelming. That's why we've built our company around being there when you need us most - 24 hours a day, 7 days a week, 365 days a year.

Our team of licensed bail bond agents brings years of experience and deep knowledge of Florida's legal system. We've built strong relationships with jails and courts throughout all 67 Florida counties, allowing us to expedite the release process and get your loved one home faster.

What sets Shamrock Bail Bonds apart is our commitment to treating every client like family. We take the time to explain the bail process, answer your questions, and ensure you understand your rights and responsibilities. We believe that informed clients are empowered clients.

We've also embraced modern technology to make the bail process easier than ever. Our online bail system allows you to complete paperwork, upload documents, and sign forms from anywhere - even from another state. This means faster processing and quicker releases.

Whether you're in Fort Myers, Miami, Jacksonville, or anywhere in between, Shamrock Bail Bonds is here to help. We're proud to serve our Florida community and look forward to earning your trust.
        `;
    }
    
    // Render core values
    if ($w('#valuesRepeater')) {
        $w('#valuesRepeater').data = coreValues;
        $w('#valuesRepeater').onItemReady(($item, itemData) => {
            $item('#valueIcon').text = itemData.icon;
            $item('#valueTitle').text = itemData.title;
            $item('#valueDescription').text = itemData.description;
        });
    }
    
    // Render statistics
    if ($w('#statsRepeater')) {
        $w('#statsRepeater').data = stats;
        $w('#statsRepeater').onItemReady(($item, itemData) => {
            $item('#statNumber').text = itemData.number;
            $item('#statLabel').text = itemData.label;
        });
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // CTA buttons
    if ($w('#callButton')) {
        $w('#callButton').onClick(() => {
            wixLocation.to('tel:+12393322245');
        });
    }
    
    if ($w('#startBailButton')) {
        $w('#startBailButton').onClick(() => {
            wixLocation.to('/members/start-bail');
        });
    }
    
    if ($w('#contactButton')) {
        $w('#contactButton').onClick(() => {
            wixLocation.to('/contact');
        });
    }
}

export { coreValues, stats };
