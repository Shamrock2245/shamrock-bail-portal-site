# 📊 Data Schemas

> **Last Updated:** 2026-08-21  
> **Signer Boundary:** DocuSeal is the sole active signing provider. Canonical schemas map to any surety packet (OSI, Accredited, Bankers, Palmetto) without tying UI to raw PDF coordinates.

---

## 1. Canonical Paperwork Schema (`src/public/canonical-paperwork-mapper.js`)

The core object model used by the Studio clipboard wizards, ID OCR hydrator, and Super CRM sync bridge.

### Canonical Person Object (`CanonicalPerson`)
```typescript
interface CanonicalPerson {
    role: 'defendant' | 'indemnitor' | 'coindemnitor';
    identity: {
        firstName: string;
        middleName: string;
        lastName: string;
        fullName: string;
        dob: string; // YYYY-MM-DD
        ssn: string; // Redacted or raw
        driversLicense: string;
        dlState: string;
        citizenship: string;
    };
    contact: {
        email: string;
        phone: string;
        altPhone: string;
    };
    address: {
        street: string;
        unit: string;
        city: string;
        state: string;
        zip: string;
        residenceType: 'own' | 'rent' | 'family' | 'other';
        monthsAtAddress: number;
    };
    employment: {
        employer: string;
        position: string;
        supervisor: string;
        phone: string;
        monthlyIncome: number;
        monthsEmployed: number;
    };
    references: Array<{
        name: string;
        relationship: string;
        phone: string;
        address: string;
    }>;
    vehicles: Array<{
        make: string;
        model: string;
        year: number;
        color: string;
        vin: string;
        plate: string;
    }>;
    indemnitorSpecific?: {
        relationshipToDefendant: string;
        ownHome: boolean;
        homeValue: number;
        mortgageBalance: number;
        collateralOffered: string;
    };
}
```

### Canonical Case Object (`CanonicalCase`)
```typescript
interface CanonicalCase {
    caseId: string; // e.g. "CASE-2026-0821-X9A2"
    county: string; // e.g. "lee"
    bookingNumber: string;
    jailFacility: string;
    arrestDate: string; // YYYY-MM-DD
    courtName: string;
    courtDate: string;
    caseNumber: string;
    charges: Array<{
        statute: string;
        description: string;
        bondAmount: number;
        bondType: string;
        fee: number; // Statutory 10% or $100 min
    }>;
    financials: {
        totalBondAmount: number;
        statutoryPremium: number;
        transferFee: number;
        totalDue: number;
        amountPaid: number;
        balanceRemaining: number;
    };
    defendant: CanonicalPerson;
    indemnitor: CanonicalPerson;
    coIndemnitor?: CanonicalPerson;
    metadata: {
        createdAt: string;
        updatedAt: string;
        source: 'web_portal' | 'lobby_tablet' | 'telegram' | 'voice_ai';
        isDraft: boolean;
        lastSavedStep: number;
        docuSealSubmissionId?: string;
        signingSessionStatus: 'draft' | 'pending_review' | 'issued' | 'completed';
    };
}
```

---

## 2. Wix CMS Collections

### `IntakeQueue` (Primary Intake & Drafts Collection)

| Field | Type | Required | Description |
|---|---|---|---|
| `caseId` | TEXT | ✅ | Unique case identifier (`CASE-2026-XXXX`) |
| `isDraft` | BOOLEAN | | `true` while intake is incomplete; `false` when ready for underwriter |
| `lastSavedStep` | NUMBER | | Step number (1-5) for cross-device resumption |
| `draftData` | TEXT | | JSON payload of `CanonicalCase` draft |
| `defendantName` | TEXT | ✅ | Full defendant name |
| `defendantFirstName` | TEXT | | First name |
| `defendantLastName` | TEXT | | Last name |
| `defendantEmail` | TEXT | | Email |
| `defendantPhone` | TEXT | | Mobile phone |
| `defendantBookingNumber` | TEXT | | Jail booking number |
| `indemnitorName` | TEXT | | Primary indemnitor full name |
| `indemnitorEmail` | TEXT | | Primary indemnitor email |
| `indemnitorPhone` | TEXT | | Primary indemnitor phone |
| `county` | TEXT | ✅ | Lowercase county slug (e.g., `lee`, `collier`) |
| `bondAmount` | NUMBER | | Total bond face value |
| `premiumAmount` | NUMBER | | Total statutory fee ($100 min/charge) |
| `status` | TEXT | | `draft` \| `pending_review` \| `ready_for_super_crm` \| `issued` \| `completed` |
| `docuSealSubmissionId` | TEXT | | Staff-issued DocuSeal submission ID |
| `signingSessionId` | TEXT | | Active signing session ID |

### `ServiceAreas` (Multi-State Expansion CMS)

| Field | Type | Required | Description |
|---|---|---|---|
| `state` | TEXT | ✅ | Full state name (e.g. `"Florida"`, `"Texas"`) |
| `slug` | TEXT | ✅ | URL slug (e.g. `"florida"`, `"texas"`) |
| `stateCode` | TEXT | ✅ | 2-letter postal code (e.g. `"FL"`, `"TX"`) |
| `status` | TEXT | ✅ | `"live"` (publicly routed) \| `"planned"` (returns 404) |
| `licensingNote` | TEXT | | State statutory licensing disclaimer |
| `primaryPhone` | TEXT | | Dispatch phone line for this state |

---

## 3. Arrest Record — The Master 34

The operational data structure output by county scrapers (`shamrock-leads`). Dedup key: `Booking_Number + County`.

| # | Column | Type | Required | Notes |
|---|---|---|---|---|
| 1 | `Scrape_Timestamp` | ISO Date | ✅ | When the record was scraped |
| 2 | `County` | String | ✅ | Lowercase (e.g., `"lee"`) |
| 3 | `Booking_Number` | String | ✅ | Primary Key (with County) |
| 4 | `Full_Name` | String | ✅ | `"LAST, FIRST MIDDLE"` |
| 5 | `First_Name` | String | ✅ | Title Case |
| 6 | `Last_Name` | String | ✅ | Title Case |
| 7 | `DOB` | String | | `YYYY-MM-DD` |
| 8 | `Booking_Date` | String | ✅ | `YYYY-MM-DD` |
| 9 | `Facility` | String | | Jail facility name |
| 10 | `Charges` | String | | Pipe-separated list |
| 11 | `Bond_Amount` | Number | ✅ | Total bond in dollars |
| 12 | `Court_Date` | String | | `YYYY-MM-DD` |
| 13 | `Case_Number` | String | | Court clerk case number |
| 14 | `Lead_Score` | Number | | 0-100 (urgency × bond × county) |
| 15 | `Lead_Status` | String | | Hot / Warm / Cold / Disqualified |
