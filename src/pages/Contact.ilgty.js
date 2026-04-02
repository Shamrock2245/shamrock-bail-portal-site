import { submitContactForm } from 'backend/contact-api';
import { getCounties } from 'public/countyUtils';
import wixSeo from 'wix-seo';

$w.onReady(async function () {
    console.log(" Contact Page Loaded");

    // Initialize Event Handlers
    $w('#btnSubmit').onClick(handleSubmit);

    // Load Jails
    await loadJails();

    // Optional: Pre-fill data if query params exist (e.g. from a "Quick Contact" link)
    // const query = wixLocation.query;
    // if(query.jail) $w('#dropdownJail').value = query.jail;

    updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "Contact Shamrock Bail Bonds | 24/7 Emergency Bail Bonds Fort Myers FL";
    const pageDesc = "Need immediate bail bond help? Contact Shamrock Bail Bonds 24/7 at (239) 332-2245. Serving Fort Myers, Naples, Cape Coral, and all 67 Florida counties. Walk-ins welcome at 1528 Broadway.";
    const pageUrl = "https://www.shamrockbailbonds.biz/contact";
    const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";

    // 1. Meta Tags (Action-oriented)
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:type", "content": "website" },
        { "property": "og:image", "content": logoUrl },
        { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
        { "property": "og:locale", "content": "en_US" },
        { "name": "twitter:card", "content": "summary_large_image" },
        { "name": "twitter:title", "content": pageTitle },
        { "name": "twitter:description", "content": pageDesc },
        { "name": "robots", "content": "index, follow, max-snippet:-1" },
        { "name": "keywords", "content": "contact bail bondsman Fort Myers, 24/7 bail bonds Florida, emergency bail bond number, Shamrock Bail Bonds phone" }
    ]);

    wixSeo.setLinks([
        { "rel": "canonical", "href": pageUrl }
    ]);

    // 2. Structured Data (ContactPage + LocalBusiness w/ 24/7 ContactPoint)
    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Contact", "item": pageUrl }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": pageTitle,
            "url": pageUrl,
            "description": pageDesc,
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", ".contact-info", "address"]
            },
            "mainEntity": {
                "@type": "LocalBusiness",
                "name": "Shamrock Bail Bonds, LLC",
                "@id": "https://www.shamrockbailbonds.biz/#organization",
                "image": logoUrl,
                "logo": { "@type": "ImageObject", "url": logoUrl },
                "telephone": "+12393322245",
                "url": "https://www.shamrockbailbonds.biz/",
                "priceRange": "$$",
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                },
                "sameAs": [
                    "https://www.facebook.com/ShamrockBail",
                    "https://www.instagram.com/shamrock_bail_bonds"
                ],
                "contactPoint": [
                    {
                        "@type": "ContactPoint",
                        "telephone": "+12393322245",
                        "contactType": "customer service",
                        "areaServed": { "@type": "State", "name": "Florida" },
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
                        "telephone": "+12393322245",
                        "contactType": "emergency",
                        "areaServed": { "@type": "State", "name": "Florida" },
                        "availableLanguage": "English"
                    }
                ],
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
                    "latitude": 26.6406,
                    "longitude": -81.8723
                }
            }
        }
    ])
        .then(() => console.log("[OK] Contact Page SEO Set"))
        .catch(e => console.error("[X] Contact Page SEO Error", e));
}

async function loadJails() {
    try {
        const counties = await getCounties();
        const opts = counties.map(c => ({
            label: c.jailName,
            value: c.jailName
        }));

        // Sort alphabetically
        opts.sort((a, b) => a.label.localeCompare(b.label));

        $w('#dropdownJail').options = opts;
    } catch (err) {
        console.error("Failed to load jails", err);
    }
}

/**
 * Handle Submit Button Click
 */
async function handleSubmit() {
    const $btn = $w('#btnSubmit');
    const $err = $w('#textError');
    const $success = $w('#textSuccess');

    // 1. Reset State
    $btn.disable();
    $btn.label = "Submitting...";
    $err.hide();
    $success.hide();

    // 2. Collect Data
    const formData = {
        name: $w('#inputName').value,
        phone: $w('#inputPhone').value,
        email: $w('#inputEmail').value,
        relationship: $w('#dropdownRelationship').value,
        defendantName: $w('#inputDefendantName').value,
        defendantDob: $w('#datePickerDefendantDOB').value,
        jail: $w('#dropdownJail').value,
        bookingNumber: $w('#inputBookingNumber').value,
        charges: $w('#inputCharges').value,
        source: $w('#dropdownSource').value,
        notes: $w('#inputNotes').value,
        consent: $w('#checkboxConsent').checked
    };

    console.log("DEBUG: Submitting form...", formData);

    // 3. Client-Side Validation (Fast Fail)
    if (!formData.name || !formData.phone || !formData.defendantName || !formData.jail) {
        showError("Please fill in all required fields marked with *.");
        resetButton();
        return;
    }

    if (!formData.consent) {
        showError("You must consent to be contacted to proceed.");
        resetButton();
        return;
    }

    // 4. Send to Backend
    try {
        const result = await submitContactForm(formData);

        if (result.success) {
            // Success State
            $success.text = "Request submitted! We will contact you momentarily.";
            $success.show();
            $w('#btnSubmit').hide(); // Hide button to prevent double submit

            // Optional: Clear form
            // clearForm(); 
        } else {
            // Backend Error
            showError(result.error || "An error occurred. Please call us directly.");
            resetButton();
        }

    } catch (error) {
        console.error("Submission Error:", error);
        showError("Network error. Please try again or call (239) 555-BAIL.");
        resetButton();
    }
}

function showError(msg) {
    const $err = $w('#textError');
    $err.text = msg;
    $err.show();
    // Auto-hide after 5 seconds
    setTimeout(() => $err.hide(), 5000);
}

function resetButton() {
    const $btn = $w('#btnSubmit');
    $btn.label = "Submit Request ->";
    $btn.enable();
}
