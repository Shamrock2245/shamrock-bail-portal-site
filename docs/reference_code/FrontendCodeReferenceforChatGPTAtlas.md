# Frontend Code Reference for ChatGPT Atlas

**Version:** 1.0
**Date:** December 23, 2025
**Purpose:** Detailed code examples and patterns for frontend Wix Velo development

---

## 1. Global Setup: `masterPage.js`

This file runs on every page load and handles session management, geolocation, and phone number injection.

```javascript
// masterPage.js
import { initializePhoneInjection } from 'public/phone-injector';
import { autoDetectLocation } from 'public/geolocation-client';
import wixStorage from 'wix-storage-frontend';

$w.onReady(function () {
    // Initialize all global services
    initShamrockServices();
});

async function initShamrockServices() {
    try {
        // 1. Generate or retrieve session ID
        let sessionId = wixStorage.session.getItem('sessionId');
        if (!sessionId) {
            sessionId = generateSessionId();
            wixStorage.session.setItem('sessionId', sessionId);
        }

        // 2. Auto-detect user location silently
        const location = await autoDetectLocation();
        let userCounty = null;
        
        if (location.success) {
            userCounty = location.county;
            console.log(`Geolocation success: User is in ${userCounty} County.`);
            // Store county in session for later use
            wixStorage.session.setItem('userCounty', userCounty);
        } else {
            console.warn(`Geolocation failed: ${location.error}`);
        }

        // 3. Initialize dynamic phone injection for the entire site
        await initializePhoneInjection({
            county: userCounty,
            sessionId: sessionId
        });

    } catch (error) {
        console.error("Error initializing Shamrock services:", error);
    }
}

function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

---

## 2. Public Module: `geolocation-client.js`

This module captures the user's location and detects their county.

```javascript
// public/geolocation-client.js
import { detectCounty } from 'backend/geocoding';
import { saveUserLocation } from 'backend/location';
import wixStorage from 'wix-storage-frontend';

/**
 * Auto-detect user location and save to database
 * @returns {Promise<Object>} - { success: boolean, county: string|null, error: string|null }
 */
export async function autoDetectLocation() {
    try {
        // Check if we already have a county in this session
        const cachedCounty = wixStorage.session.getItem('userCounty');
        if (cachedCounty) {
            return { success: true, county: cachedCounty, error: null };
        }

        // Request geolocation from browser
        const position = await getCurrentPosition();
        const { latitude, longitude, accuracy } = position.coords;

        // Detect county from coordinates
        const countyResult = await detectCounty({ latitude, longitude });
        
        if (countyResult.success) {
            // Save to database
            const sessionId = wixStorage.session.getItem('sessionId');
            await saveUserLocation({
                sessionId,
                latitude,
                longitude,
                county: countyResult.county,
                accuracy,
                consentGiven: true
            });

            return { success: true, county: countyResult.county, error: null };
        } else {
            return { success: false, county: null, error: countyResult.error };
        }

    } catch (error) {
        console.error("Geolocation error:", error);
        return { success: false, county: null, error: error.message };
    }
}

/**
 * Wrapper for browser geolocation API
 * @returns {Promise<Position>}
 */
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
}
```

---

## 3. Public Module: `phone-injector.js`

This module dynamically replaces phone numbers on the page based on the user's county.

```javascript
// public/phone-injector.js
import { getPhoneNumber } from 'backend/routing';
import { logCall } from 'backend/call-tracking';
import wixLocation from 'wix-location-frontend';
import wixStorage from 'wix-storage-frontend';

/**
 * Initialize phone number injection for the entire site
 * @param {Object} context - { county: string, sessionId: string }
 */
export async function initializePhoneInjection(context) {
    try {
        // Get the optimal phone number for this user
        const phoneResult = await getPhoneNumber({
            county: context.county,
            language: 'en', // Default to English, can be detected from browser
            time: new Date().toISOString(),
            device: getDeviceType()
        });

        if (phoneResult.success) {
            const { number, display } = phoneResult;

            // Replace all phone numbers on the page
            replacePhoneNumbers(number, display);

            // Attach call tracking to all phone links
            attachCallTracking(number, context.sessionId);
        }

    } catch (error) {
        console.error("Phone injection error:", error);
    }
}

/**
 * Replace all phone number elements on the page
 * @param {string} number - E.164 format phone number
 * @param {string} display - Formatted display number
 */
function replacePhoneNumbers(number, display) {
    // Find all elements with data-phone attribute
    $w('[data-phone]').forEach(element => {
        if (element.type === 'Button' || element.type === 'Text') {
            element.label = display;
            if (element.link) {
                element.link = `tel:${number}`;
            }
        }
    });

    // Find all tel: links
    $w('a[href^="tel:"]').forEach(link => {
        link.href = `tel:${number}`;
        link.text = display;
    });
}

/**
 * Attach call tracking to all phone elements
 * @param {string} phoneNumber - The phone number being called
 * @param {string} sessionId - Current session ID
 */
function attachCallTracking(phoneNumber, sessionId) {
    $w('[data-phone]').forEach(element => {
        element.onClick(async () => {
            try {
                const county = wixStorage.session.getItem('userCounty');
                await logCall({
                    sessionId,
                    county,
                    phoneNumber,
                    source: element.id,
                    page: wixLocation.url,
                    device: getDeviceType()
                });
            } catch (error) {
                console.error("Call tracking error:", error);
            }
        });
    });
}

/**
 * Detect device type from user agent
 * @returns {string} - "Mobile", "Tablet", or "Desktop"
 */
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet|ipad/i.test(ua)) return 'Tablet';
    return 'Desktop';
}
```

---

## 4. Home Page: `home.js`

```javascript
// pages/home.js
import wixData from 'wix-data';
import wixLocation from 'wix-location-frontend';

$w.onReady(function () {
    loadFeaturedCounties();
});

/**
 * Load and display featured counties
 */
async function loadFeaturedCounties() {
    try {
        const results = await wixData.query('FloridaCounties')
            .eq('featured', true)
            .eq('active', true)
            .find();

        if (results.items.length > 0) {
            $w('#featuredCountiesRepeater').data = results.items;
            $w('#featuredCountiesRepeater').onItemReady(($item, itemData) => {
                $item('#countyName').text = `${itemData.countyName} County`;
                $item('#countyButton').onClick(() => {
                    wixLocation.to(`/county/${itemData.countySlug}`);
                });
            });
        }

    } catch (error) {
        console.error("Error loading featured counties:", error);
    }
}
```

---

## 5. Dynamic County Page: `county-dynamic.js`

```javascript
// pages/county-dynamic.js
import { generateCountyPage } from 'backend/county-generator';
import wixLocation from 'wix-location-frontend';
import wixSeoFrontend from 'wix-seo-frontend';

$w.onReady(async function () {
    try {
        // Get the county slug from the URL
        const path = wixLocation.path;
        const countySlug = path.length > 0 ? path[0] : 'lee'; // Default to 'lee'

        // Fetch the complete county data from the backend
        const result = await generateCountyPage(countySlug);

        if (result.success) {
            const countyData = result.data;
            
            // Populate the page with the dynamic data
            populateCountyPage(countyData);

            // Set SEO tags for the page
            wixSeoFrontend.setTitle(countyData.seo.meta_title);
            wixSeoFrontend.setDescription(countyData.seo.meta_description);
            wixSeoFrontend.setKeywords(countyData.seo.keywords);
            
        } else {
            console.error("Failed to generate county page:", result.error);
            $w('#errorMessage').text = 'Could not load county information. Please call us.';
            $w('#errorMessage').show();
        }
    } catch (error) {
        console.error("Error on dynamic county page:", error);
    }
});

/**
 * Populate all elements on the county page
 * @param {Object} data - County data object
 */
function populateCountyPage(data) {
    // Hero section
    $w('#countyNameHeadline').text = `${data.county_name_full} Bail Bonds`;
    $w('#heroSubheadline').text = data.content.hero_subheadline;

    // About section
    $w('#aboutCountyText').text = data.content.about_county;

    // Jail information
    $w('#jailName').text = data.jail.name;
    $w('#jailAddress').text = data.jail.address;
    $w('#jailWebsiteButton').link = data.jail.booking_url;

    // Clerk information
    $w('#clerkName').text = data.clerk.name;
    $w('#clerkWebsiteButton').link = data.clerk.website;

    // FAQ repeater
    if (data.content.faq && data.content.faq.length > 0) {
        $w('#faqRepeater').data = data.content.faq.map((item, index) => ({
            _id: String(index),
            question: item.question,
            answer: item.answer
        }));

        $w('#faqRepeater').onItemReady(($item, itemData) => {
            $item('#faqQuestion').text = itemData.question;
            $item('#faqAnswer').text = itemData.answer;
        });
    }
}
```

---

## 6. Member Portal: `dashboard.js`

```javascript
// pages/dashboard.js
import wixMembers from 'wix-members-frontend';
import wixData from 'wix-data';
import wixLocation from 'wix-location-frontend';
import { initiateSignNowHandoff } from 'backend/signNowIntegration';

$w.onReady(async function () {
    // Check if user is logged in
    const isLoggedIn = wixMembers.currentMember.loggedIn;
    
    if (!isLoggedIn) {
        wixLocation.to('/login');
        return;
    }

    // Load member data
    const member = await wixMembers.currentMember.getMember();
    loadMemberDocuments(member.loginEmail);

    // Attach SignNow handoff to button
    $w('#startBailButton').onClick(() => handleStartBail(member.loginEmail));
});

/**
 * Load member's pending and required documents
 * @param {string} memberEmail - Member's email address
 */
async function loadMemberDocuments(memberEmail) {
    try {
        // Query pending documents
        const pendingDocs = await wixData.query('PendingDocuments')
            .eq('memberEmail', memberEmail)
            .find();

        if (pendingDocs.items.length > 0) {
            $w('#pendingDocsRepeater').data = pendingDocs.items;
            $w('#pendingDocsRepeater').show();
        } else {
            $w('#noPendingDocsMessage').show();
        }

        // Query required documents
        const requiredDocs = await wixData.query('RequiredDocuments')
            .eq('memberEmail', memberEmail)
            .find();

        if (requiredDocs.items.length > 0) {
            $w('#requiredDocsRepeater').data = requiredDocs.items;
            $w('#requiredDocsRepeater').show();
        }

    } catch (error) {
        console.error("Error loading member documents:", error);
    }
}

/**
 * Handle the "Start Bail Paperwork" button click
 * @param {string} memberEmail - Member's email address
 */
async function handleStartBail(memberEmail) {
    try {
        $w('#startBailButton').disable();
        $w('#startBailButton').label = 'Loading...';

        // Call backend to initiate SignNow handoff
        const result = await initiateSignNowHandoff({ memberEmail });

        if (result.success) {
            // Redirect to SignNow
            wixLocation.to(result.signNowUrl);
        } else {
            console.error("SignNow handoff failed:", result.error);
            $w('#errorMessage').text = 'Unable to start paperwork. Please call us.';
            $w('#errorMessage').show();
            $w('#startBailButton').enable();
            $w('#startBailButton').label = 'Start Bail Paperwork';
        }

    } catch (error) {
        console.error("Error starting bail:", error);
        $w('#startBailButton').enable();
        $w('#startBailButton').label = 'Start Bail Paperwork';
    }
}
```

---

## 7. Wix Velo Best Practices

### Import/Export Rules
- All `import` statements must be at the **top level** of the file
- All `export` statements must be at the **top level** of the file
- Never nest `$w.onReady` functions

### Error Handling
Always wrap async operations in try-catch blocks:

```javascript
try {
    const result = await someBackendFunction();
    // Handle success
} catch (error) {
    console.error("Error:", error);
    // Handle error gracefully
}
```

### Data Query Optimization
- Only fetch the fields you need using `.include()`:

```javascript
wixData.query('FloridaCounties')
    .include('countySlug', 'countyName', 'primaryPhone')
    .find();
```

- Use `.limit()` to restrict result count:

```javascript
wixData.query('CallLogs')
    .limit(50)
    .find();
```

### Session Storage
Use `wix-storage-frontend` for temporary data:

```javascript
import wixStorage from 'wix-storage-frontend';

// Session storage (cleared when browser closes)
wixStorage.session.setItem('key', 'value');
const value = wixStorage.session.getItem('key');

// Local storage (persists across sessions)
wixStorage.local.setItem('key', 'value');
```

---

## 8. Element Naming Conventions

For consistency and ease of reference, use these naming conventions:

- **Buttons:** `#actionNameButton` (e.g., `#startBailButton`, `#callNowButton`)
- **Text Elements:** `#descriptiveNameText` (e.g., `#countyNameText`, `#heroHeadline`)
- **Repeaters:** `#itemNameRepeater` (e.g., `#featuredCountiesRepeater`, `#faqRepeater`)
- **Input Fields:** `#fieldNameInput` (e.g., `#emailInput`, `#phoneInput`)
- **Containers:** `#sectionNameContainer` (e.g., `#heroContainer`, `#servicesContainer`)

---

This reference provides the core patterns needed for frontend development. Always refer to the official Wix Velo documentation for detailed API specifications.
