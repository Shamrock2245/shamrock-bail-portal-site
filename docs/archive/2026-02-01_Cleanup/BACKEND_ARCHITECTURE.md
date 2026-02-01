# Shamrock Bail Bonds - Backend Architecture

**Version:** 1.0  
**Date:** December 21, 2025  
**Purpose:** Optimal backend infrastructure for geolocation-based routing, dynamic phone assignment, call tracking, and scalable county operations

---

## 1. Architecture Overview

The backend follows a **modular service-oriented architecture** with three core systems:

### Core Systems

1. **Geolocation Service** - Detects user location and maps to Florida counties
2. **Routing Service** - Dynamically assigns phone numbers and routes users
3. **Analytics Service** - Tracks all user interactions for optimization

### Design Principles

- **Schema Alignment**: All data structures align with the 34-column arrest scraper schema
- **Workflow Protection**: Zero interference with SignNow or external automations
- **Performance First**: Caching, lazy loading, and optimized queries
- **Mobile-First**: Optimized for panicked users on mobile devices
- **Scalability**: Built to support all 67 Florida counties

---

## 2. Geolocation Service

### Purpose
Convert user GPS coordinates to Florida county names for intelligent routing.

### Components

#### 2.1 Frontend Geolocation Capture
**File:** `src/public/geolocation-client.js`

```javascript
// Captures user location with error handling
// Returns: { latitude, longitude, accuracy, timestamp }
// Handles: Permission denied, timeout, unavailable
```

**Key Features:**
- Non-blocking async capture
- Graceful degradation (IP fallback)
- User consent tracking
- High accuracy mode for mobile

#### 2.2 Backend Geocoding Service
**File:** `src/backend/geocoding.jsw`

```javascript
// Reverse geocodes coordinates to county
// Input: { latitude, longitude }
// Output: { county, state, confidence }
```

**Implementation:**
- Uses Google Geocoding API (or Nominatim for free tier)
- County boundary polygon matching
- Caching for performance (24hr TTL)
- Fallback to IP-based geolocation

#### 2.3 County Boundary Data
**File:** `src/backend/data/florida-county-boundaries.json`

```json
{
  "lee": {
    "name": "Lee",
    "bounds": {
      "north": 26.7619,
      "south": 26.3619,
      "east": -81.5619,
      "west": -82.0619
    },
    "centroid": { "lat": 26.5619, "lng": -81.8119 }
  }
}
```

**Usage:**
- Fast bounding-box checks before API calls
- Offline county detection
- Reduces API costs by 80%+

---

## 3. Routing Service

### Purpose
Dynamically assign phone numbers and route users based on county, time, and context.

### Components

#### 3.1 Phone Number Registry
**File:** `src/backend/data/phone-registry.json`

```json
{
  "primary": {
    "number": "+12393322245",
    "display": "(239) 332-2245",
    "counties": ["lee", "collier", "charlotte", "hendry"],
    "hours": {
      "start": "00:00",
      "end": "23:59"
    },
    "priority": 1
  },
  "spanish": {
    "number": "+12995503010",
    "display": "(299) 550-3010",
    "counties": ["all"],
    "language": "es",
    "priority": 2
  }
}
```

#### 3.2 Dynamic Phone Routing Logic
**File:** `src/backend/routing.jsw`

```javascript
/**
 * Get optimal phone number for user context
 * @param {Object} context - { county, language, time, device }
 * @returns {Object} - { number, display, trackingId }
 */
export async function getPhoneNumber(context) {
  // 1. Match by county
  // 2. Check business hours
  // 3. Apply language preference
  // 4. Generate tracking ID
  // 5. Return formatted number
}
```

**Routing Priority:**
1. County-specific numbers (if available)
2. Regional numbers (SWFL cluster)
3. Primary statewide number
4. After-hours emergency line

#### 3.3 Frontend Phone Injection
**File:** `src/public/phone-injector.js`

```javascript
// Dynamically replaces phone numbers on page load
// Targets: All tel: links, text displays, CTA buttons
// Updates: onClick handlers, href attributes, display text
```

---

## 4. Analytics Service

### Purpose
Track all user interactions for conversion optimization and lead qualification.

### Components

#### 4.1 Event Tracking Schema
**File:** `src/backend/data/tracking-schema.json`

```json
{
  "event_types": [
    "page_view",
    "geolocation_captured",
    "county_detected",
    "phone_clicked",
    "form_submitted",
    "county_selected",
    "member_login",
    "bail_started"
  ],
  "event_properties": {
    "timestamp": "ISO8601",
    "session_id": "UUID",
    "user_id": "string|null",
    "county": "string",
    "page_url": "string",
    "device": "Mobile|Desktop|Tablet",
    "phone_number": "string",
    "source": "string"
  }
}
```

#### 4.2 Backend Analytics Module
**File:** `src/backend/analytics.jsw`

```javascript
/**
 * Track user event
 * @param {string} eventType - Event type from schema
 * @param {Object} properties - Event properties
 * @returns {Promise<Object>} - { success, eventId }
 */
export async function trackEvent(eventType, properties) {
  // 1. Validate event type
  // 2. Enrich with session data
  // 3. Store in Analytics collection
  // 4. Trigger real-time alerts (if qualified)
  // 5. Return confirmation
}
```

#### 4.3 Call Tracking Integration
**File:** `src/backend/call-tracking.jsw`

```javascript
/**
 * Log phone call initiation
 * @param {Object} callData - { county, phoneNumber, source, timestamp }
 * @returns {Promise<Object>} - { trackingId, county, timestamp }
 */
export async function logCall(callData) {
  // 1. Generate unique tracking ID
  // 2. Capture full context (page, county, device)
  // 3. Store in CallLogs collection
  // 4. Update county conversion metrics
  // 5. Trigger Slack notification (if high-value)
}
```

**Call Data Schema:**
```javascript
{
  trackingId: "CALL-20251221-001234",
  timestamp: "2025-12-21T14:30:00Z",
  sessionId: "uuid-v4",
  userId: "member-id-or-null",
  county: "lee",
  phoneNumber: "+12393322245",
  source: "sticky-mobile-cta",
  page: "/bail-bonds/lee-county",
  device: "Mobile",
  userAgent: "Mozilla/5.0...",
  geolocation: { lat: 26.5619, lng: -81.8119 }
}
```

---

## 5. County Infrastructure

### Purpose
Scalable data structure to support all 67 Florida counties with minimal duplication.

### Components

#### 5.1 County Data Model
**File:** `src/backend/data/county-data-model.json`

```json
{
  "county_slug": "lee",
  "county_name": "Lee",
  "county_name_full": "Lee County",
  "active": true,
  "featured": true,
  "tier": 1,
  
  "contact": {
    "primary_phone": "+12393322245",
    "spanish_phone": "+12995503010",
    "email": "info@shamrockbailbonds.biz"
  },
  
  "location": {
    "centroid": { "lat": 26.5619, "lng": -81.8119 },
    "bounds": { "north": 26.7619, "south": 26.3619, "east": -81.5619, "west": -82.0619 },
    "major_cities": ["Fort Myers", "Cape Coral", "Bonita Springs"]
  },
  
  "jail": {
    "name": "Lee County Jail",
    "address": "4700 Justice Way, Fort Myers, FL 33916",
    "booking_url": "https://www.sheriffleefl.org/booking-search/",
    "booking_phone": "(239) 477-1500"
  },
  
  "clerk": {
    "name": "Lee County Clerk of Courts",
    "url": "https://www.leeclerk.org/",
    "records_url": "https://matrix.leeclerk.org/",
    "phone": "(239) 533-5000"
  },
  
  "seo": {
    "meta_title": "Lee County Bail Bonds - 24/7 Fast Release | Shamrock Bail Bonds",
    "meta_description": "Need bail in Lee County? Shamrock Bail Bonds provides 24/7 fast release service. Licensed, trusted, and ready to help. Call (239) 332-2245 now.",
    "keywords": ["lee county bail bonds", "fort myers bail bonds", "cape coral bail bondsman"],
    "schema_type": "LocalBusiness"
  },
  
  "content": {
    "hero_headline": "Lee County Bail Bonds - 24/7 Fast Release",
    "hero_subheadline": "Licensed, trusted, and ready to help. Get your loved one home fast.",
    "about_county": "Lee County is home to Fort Myers, Cape Coral, and surrounding communities...",
    "why_choose_us": "Shamrock Bail Bonds has been serving Lee County families since..."
  },
  
  "scraper_integration": {
    "enabled": true,
    "scraper_county_code": "LEE",
    "sheet_name": "Lee",
    "lead_score_threshold": 70
  }
}
```

#### 5.2 County Tier System

**Tier 1 (Immediate Focus):**
- Lee, Collier, Charlotte, Hendry, DeSoto, Sarasota, Manatee
- Full content, active scraping, dedicated phone routing

**Tier 2 (SWFL Expansion):**
- Glades, Highlands, Hardee
- Basic content, manual lead intake

**Tier 3 (Statewide Placeholder):**
- Remaining 57 counties
- SEO-ready pages, "Call for Service" messaging

#### 5.3 County Page Generator
**File:** `src/backend/county-generator.jsw`

```javascript
/**
 * Generate county page data from template
 * @param {string} countySlug - County slug (e.g., "lee")
 * @returns {Promise<Object>} - Full county page data
 */
export async function generateCountyPage(countySlug) {
  // 1. Load county data from JSON
  // 2. Apply content templates
  // 3. Inject SEO metadata
  // 4. Add scraper integration flags
  // 5. Return complete page data
}
```

---

## 6. Data Collections (Wix Data)

### Required Collections

#### 6.1 FloridaCounties
```javascript
{
  _id: "auto",
  countySlug: "string (unique)",
  countyName: "string",
  active: "boolean",
  featured: "boolean",
  tier: "number",
  primaryPhone: "string",
  spanishPhone: "string",
  jailUrl: "string",
  clerkUrl: "string",
  centroidLat: "number",
  centroidLng: "number",
  // ... (full schema from county-data-model)
}
```

#### 6.2 UserLocations
```javascript
{
  _id: "auto",
  sessionId: "string",
  memberId: "string (nullable)",
  latitude: "number",
  longitude: "number",
  county: "string",
  accuracy: "number",
  timestamp: "datetime",
  consentGiven: "boolean"
}
```

#### 6.3 CallLogs
```javascript
{
  _id: "auto",
  trackingId: "string (unique)",
  sessionId: "string",
  memberId: "string (nullable)",
  county: "string",
  phoneNumber: "string",
  source: "string",
  page: "string",
  device: "string",
  timestamp: "datetime",
  geolocation: "object"
}
```

#### 6.4 AnalyticsEvents
```javascript
{
  _id: "auto",
  eventType: "string",
  sessionId: "string",
  memberId: "string (nullable)",
  county: "string",
  page: "string",
  device: "string",
  properties: "object",
  timestamp: "datetime"
}
```

---

## 7. Integration Points

### 7.1 Arrest Scraper Schema Alignment

**Mapping:**
- `County` field in scraper → `county` field in Wix
- `Lead_Score` → Used for phone routing priority
- `Lead_Status` → Triggers member portal notifications

**Workflow:**
1. Scraper detects new arrest in Lee County
2. Lead score calculated (e.g., 85)
3. If score ≥ 70, trigger Wix notification
4. Member portal shows "New Lead Available"
5. Staff can initiate SignNow from portal

### 7.2 SignNow Integration (No Changes)

**Preserved Workflow:**
1. User logs into Members section
2. Clicks "Start Bail Paperwork"
3. Geolocation consent captured
4. SignNow embedded form loads
5. All downstream automation unchanged

**Backend Support:**
- Geolocation data passed to SignNow via URL params
- County auto-populated in forms
- No interception of SignNow API calls

---

## 8. Performance Optimization

### Caching Strategy

**Level 1: Browser Cache**
- County data: 24 hours
- Phone registry: 1 hour
- Static assets: 7 days

**Level 2: Wix Data Cache**
- County queries: 1 hour
- Analytics aggregations: 5 minutes

**Level 3: External API Cache**
- Geocoding results: 24 hours
- Reduces API costs by 90%

### Lazy Loading

- County boundary data loaded on-demand
- Analytics batched every 30 seconds
- Non-critical tracking deferred

---

## 9. Security & Privacy

### Data Protection

- Geolocation data encrypted at rest
- User consent required before capture
- Automatic deletion after 90 days
- GDPR/CCPA compliant

### API Security

- Backend functions use `.jsw` extension (server-only)
- Rate limiting on public endpoints
- Input validation on all user data
- No sensitive data in frontend code

---

## 10. Deployment Checklist

### Phase 1: Core Infrastructure
- [ ] Create Wix Data collections
- [ ] Deploy backend modules (geocoding, routing, analytics)
- [ ] Import county data (67 counties)
- [ ] Configure phone registry

### Phase 2: Frontend Integration
- [ ] Add geolocation capture to masterPage
- [ ] Implement dynamic phone injection
- [ ] Update Home.js with routing logic
- [ ] Fix double-click → single-click (Spanish phone)

### Phase 3: County Pages
- [ ] Generate Tier 1 county pages (7 counties)
- [ ] Deploy county page template
- [ ] Configure dynamic routing
- [ ] Test SEO metadata

### Phase 4: Analytics & Tracking
- [ ] Deploy call tracking
- [ ] Configure event logging
- [ ] Set up Slack notifications
- [ ] Create analytics dashboard

### Phase 5: Testing & Launch
- [ ] Mobile testing (iOS + Android)
- [ ] Incognito testing
- [ ] Load testing
- [ ] Publish to production

---

## 11. Future Enhancements

### Q1 2026
- AI-powered lead scoring integration
- Real-time chat for high-value leads
- Multi-language support (Haitian Creole)

### Q2 2026
- Predictive routing based on historical data
- A/B testing framework for phone numbers
- Advanced analytics dashboard

### Q3 2026
- Mobile app integration
- Voice call tracking with transcription
- Automated follow-up sequences

---

## 12. Support & Maintenance

### Monitoring
- Uptime monitoring via Wix
- Error logging to Slack
- Weekly analytics reports

### Updates
- Monthly county data refresh
- Quarterly phone number optimization
- Annual security audit

---

**End of Architecture Document**
