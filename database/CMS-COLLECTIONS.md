# Wix CMS Database Collections

These are the database collections to create in Wix CMS for the Shamrock Bail Bonds site.

---

## Collection 1: Counties

**Collection ID:** `Counties`
**Purpose:** Store all 67 Florida county information for county pages and directory

### Fields

| Field Name | Field ID | Type | Required | Description |
|------------|----------|------|----------|-------------|
| County Name | `title` | Text | Yes | County name (e.g., "Lee County") |
| Slug | `slug` | Text | Yes | URL-friendly name (e.g., "lee-county") |
| Region | `region` | Text | Yes | Florida region (Southwest, Southeast, Central, etc.) |
| Sheriff Office Name | `sheriffOfficeName` | Text | Yes | Full name of sheriff's office |
| Sheriff Website | `sheriffWebsite` | URL | Yes | Sheriff's office website |
| Sheriff Phone | `sheriffPhone` | Text | Yes | Sheriff's office phone number |
| Sheriff Address | `sheriffAddress` | Text | No | Physical address |
| Jail Name | `jailName` | Text | No | Name of county jail |
| Jail Phone | `jailPhone` | Text | No | Jail phone number |
| Jail Address | `jailAddress` | Text | No | Jail physical address |
| Inmate Search URL | `inmateSearchUrl` | URL | No | Link to inmate search |
| Clerk of Court Name | `clerkName` | Text | Yes | Clerk of Court office name |
| Clerk Website | `clerkWebsite` | URL | Yes | Clerk's website |
| Clerk Phone | `clerkPhone` | Text | Yes | Clerk's phone number |
| Clerk Address | `clerkAddress` | Text | No | Clerk's physical address |
| Court Records URL | `courtRecordsUrl` | URL | No | Link to court records |
| Population | `population` | Number | No | County population |
| County Seat | `countySeat` | Text | No | County seat city |
| Major Cities | `majorCities` | Text | No | Comma-separated list |
| Meta Title | `metaTitle` | Text | Yes | SEO title for county page |
| Meta Description | `metaDescription` | Text | Yes | SEO description |
| Is Active | `isActive` | Boolean | Yes | Whether to show county |
| Featured | `featured` | Boolean | No | Show on homepage |
| Sort Order | `sortOrder` | Number | No | Display order |

### Sample Data
```json
{
  "title": "Lee County",
  "slug": "lee-county",
  "region": "Southwest Florida",
  "sheriffOfficeName": "Lee County Sheriff's Office",
  "sheriffWebsite": "https://www.sheriffleefl.org/",
  "sheriffPhone": "(239) 477-1000",
  "sheriffAddress": "14750 Six Mile Cypress Pkwy, Fort Myers, FL 33912",
  "jailName": "Lee County Jail",
  "jailPhone": "(239) 477-1000",
  "inmateSearchUrl": "https://www.sheriffleefl.org/inmate-search/",
  "clerkName": "Lee County Clerk of Court",
  "clerkWebsite": "https://www.leeclerk.org/",
  "clerkPhone": "(239) 533-5000",
  "population": 760822,
  "countySeat": "Fort Myers",
  "majorCities": "Fort Myers, Cape Coral, Bonita Springs, Lehigh Acres",
  "metaTitle": "Bail Bonds in Lee County FL | Fort Myers Bail Bondsman | Shamrock",
  "metaDescription": "Need bail bonds in Lee County, Florida? Shamrock Bail Bonds offers 24/7 service in Fort Myers, Cape Coral, and all of Lee County. Fast release, flexible payments.",
  "isActive": true,
  "featured": true,
  "sortOrder": 1
}
```

---

## Collection 2: FAQs

**Collection ID:** `FAQs`
**Purpose:** Store frequently asked questions for FAQ pages and schema markup

### Fields

| Field Name | Field ID | Type | Required | Description |
|------------|----------|------|----------|-------------|
| Question | `title` | Text | Yes | The FAQ question |
| Answer | `answer` | Rich Text | Yes | The answer (supports formatting) |
| Category | `category` | Text | Yes | Category (General, Process, Payment, etc.) |
| Page | `page` | Text | No | Which page to display on |
| Sort Order | `sortOrder` | Number | Yes | Display order |
| Is Active | `isActive` | Boolean | Yes | Whether to show |

### Categories
- General
- Bail Process
- Payment & Costs
- After Release
- Legal

---

## Collection 3: Testimonials

**Collection ID:** `Testimonials`
**Purpose:** Store client testimonials

### Fields

| Field Name | Field ID | Type | Required | Description |
|------------|----------|------|----------|-------------|
| Quote | `title` | Text | Yes | The testimonial text |
| Client Name | `clientName` | Text | Yes | Client's name (first name + last initial) |
| Location | `location` | Text | Yes | City, FL |
| Rating | `rating` | Number | No | Star rating (1-5) |
| Date | `date` | Date | No | When received |
| Featured | `featured` | Boolean | No | Show on homepage |
| Is Active | `isActive` | Boolean | Yes | Whether to show |

---

## Collection 4: Blog Posts

**Collection ID:** `Blog/Posts`
**Purpose:** Blog content (use Wix Blog app's built-in collection)

*Note: Use Wix Blog's native collection. No custom collection needed.*

---

## Collection 5: Team Members

**Collection ID:** `TeamMembers`
**Purpose:** Staff information (optional, for About page)

### Fields

| Field Name | Field ID | Type | Required | Description |
|------------|----------|------|----------|-------------|
| Name | `title` | Text | Yes | Full name |
| Position | `position` | Text | Yes | Job title |
| Bio | `bio` | Rich Text | No | Short biography |
| Photo | `photo` | Image | No | Headshot |
| Phone | `phone` | Text | No | Direct phone |
| Email | `email` | Text | No | Email address |
| License Number | `licenseNumber` | Text | No | FL license number |
| Sort Order | `sortOrder` | Number | Yes | Display order |
| Is Active | `isActive` | Boolean | Yes | Whether to show |

---

## Collection 6: Service Areas

**Collection ID:** `ServiceAreas`
**Purpose:** Cities/areas served (for local SEO)

### Fields

| Field Name | Field ID | Type | Required | Description |
|------------|----------|------|----------|-------------|
| City Name | `title` | Text | Yes | City name |
| County | `county` | Reference | Yes | Reference to Counties |
| Zip Codes | `zipCodes` | Text | No | Comma-separated zips |
| Population | `population` | Number | No | City population |
| Is Active | `isActive` | Boolean | Yes | Whether to show |

---

## Collection 7: Contact Submissions

**Collection ID:** `ContactSubmissions`
**Purpose:** Store contact form submissions

### Fields

| Field Name | Field ID | Type | Required | Description |
|------------|----------|------|----------|-------------|
| Submission ID | `title` | Text | Yes | Auto-generated ID |
| Your Name | `yourName` | Text | Yes | Submitter's name |
| Your Phone | `yourPhone` | Text | Yes | Submitter's phone |
| Your Email | `yourEmail` | Text | No | Submitter's email |
| Relationship | `relationship` | Text | Yes | Relationship to defendant |
| Defendant Name | `defendantName` | Text | Yes | Defendant's full name |
| Defendant DOB | `defendantDob` | Date | Yes | Defendant's DOB |
| Jail Location | `jailLocation` | Text | Yes | County/facility |
| Booking Number | `bookingNumber` | Text | No | If known |
| Charges | `charges` | Text | No | If known |
| How Heard | `howHeard` | Text | No | Referral source |
| Notes | `notes` | Text | No | Additional info |
| Submitted At | `submittedAt` | Date/Time | Yes | Timestamp |
| Status | `status` | Text | Yes | New, Contacted, Converted, Closed |
| Assigned To | `assignedTo` | Text | No | Staff member |

---

## Collection 8: Bail School Signups

**Collection ID:** `BailSchoolSignups`
**Purpose:** Collect interest for Shamrock Bail School

### Fields

| Field Name | Field ID | Type | Required | Description |
|------------|----------|------|----------|-------------|
| Email | `title` | Text | Yes | Email address |
| Name | `name` | Text | No | Full name |
| Phone | `phone` | Text | No | Phone number |
| Interest Level | `interestLevel` | Text | No | Just curious, Planning to enroll, etc. |
| Signed Up At | `signedUpAt` | Date/Time | Yes | Timestamp |
| Notified | `notified` | Boolean | No | Whether they've been contacted |

---

## Setting Up Collections in Wix

### Step-by-Step Instructions

1. **Go to CMS:**
   - In Wix Dashboard, click "CMS" in the left sidebar
   - Click "Create Collection"

2. **Create Each Collection:**
   - Enter the Collection Name (e.g., "Counties")
   - Set permissions:
     - Counties, FAQs, Testimonials: "Site content" (read-only for visitors)
     - Contact Submissions, Bail School Signups: "Form submissions" (write-only for visitors)

3. **Add Fields:**
   - Click "Add Field" for each field in the tables above
   - Set field type, required status, and any validation

4. **Set Primary Field:**
   - The `title` field should be the primary display field

5. **Import Data:**
   - Use the Counties JSON data provided separately
   - Import via CSV or manual entry

### Permissions Guide

| Collection | Site Visitors | Site Members | Admin |
|------------|--------------|--------------|-------|
| Counties | Read | Read | Full |
| FAQs | Read | Read | Full |
| Testimonials | Read | Read | Full |
| Contact Submissions | Create | Create | Full |
| Bail School Signups | Create | Create | Full |
| Team Members | Read | Read | Full |
| Service Areas | Read | Read | Full |

---

## Data Relationships

```
Counties (1) ──────< (many) Service Areas
    │
    └── Referenced by Contact Submissions (jailLocation)
```

---

## Indexes for Performance

For the Counties collection, create indexes on:
- `slug` (for URL lookups)
- `region` (for filtering)
- `isActive` (for queries)
- `featured` (for homepage)

For Contact Submissions:
- `status` (for filtering)
- `submittedAt` (for sorting)
