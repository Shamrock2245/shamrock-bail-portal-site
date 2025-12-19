# Wix CMS Collections Analysis

## Existing Collections Found

### 1. FloridaCounties
- **Status:** ✅ Already populated with 67 counties
- **Fields:**
  - title (SEO optimized title)
  - county (countyName)
  - bookingWebsiteLink
  - bookingPhoneNumber
  - countyClerkWebsitelink
  - recordsSearchLink
  - countyClerkPhoneNumber

### 2. MagicLinks
- **Status:** ✅ Already created
- **Purpose:** Store magic link tokens for passwordless login
- **Fields:**
  - token (unique magic link token)
  - personId (Person ID from API)
  - role (defendant/indemnitor/staff)
  - caseId (optional)
  - createdAt
  - expiresAt
  - used (boolean)

### 3. Blog/Posts, Blog/Categories, Blog/Tags
- **Status:** ✅ Standard Wix Blog collections
- **Purpose:** SEO content

## Collections Needed for Document Portal

### PendingDocuments (TO CREATE)
- **Purpose:** Store signing links sent from Dashboard.html
- **Fields needed:**
  - _id (auto)
  - memberId (reference to member)
  - email (client email)
  - phone (client phone)
  - defendantName (for display)
  - caseNumber
  - documentName (e.g., "Bail Bond Packet - John Doe")
  - signingLink (SignNow embedded link)
  - status (pending/signed/expired)
  - createdAt
  - signedAt (nullable)
  - expiresAt

### Cases (TO CREATE or link to API)
- **Purpose:** Track bail bond cases
- **Fields from SCHEMAS.md:**
  - case_number
  - court_name
  - county
  - charge_description
  - bond_amount
  - power_of_attorney_numbers
  - execution_datetime
  - agent_name
  - defendant_person_id
  - indemnitors (array)

### Persons (TO CREATE or link to API)
- **Purpose:** Store defendant/indemnitor info
- **Fields from SCHEMAS.md:**
  - person_id
  - role (defendant/indemnitor/etc.)
  - first_name, middle_name, last_name
  - dob, ssn, email, phone_primary
  - address (object)
  - employer info
  - identifiers (height, weight, etc.)
  - driver_license_number, driver_license_state
