# Wix CMS Collections Analysis

## Current Collections in Your Wix Site

I've reviewed your existing Wix CMS collections. Here's what you already have:

### ✅ Collections Already Created (Portal-Related)
1. **Cases** - ✓ Already exists
2. **PendingDocuments** - ✓ Already exists
3. **PortalUsers** - ✓ Already exists (equivalent to our spec)
4. **MemberProfiles** - ✓ Already exists
5. **UserLocations** - ✓ Already exists (for check-ins)
6. **MagicLinks** - ✓ Already exists
7. **GeolocationCache** - ✓ Already exists
8. **MemberDocuments** - ✓ Already exists
9. **CallLogs** - ✓ Already exists
10. **SignNowHandoffs** - ✓ Already exists

### 📋 CSV Files You Uploaded

You provided 4 CSV files:
1. **Defendants-Sheet1.csv**
2. **Indemnitors-Sheet1.csv**
3. **PaymentPlans-Sheet1.csv**
4. **SigningSessions-Sheet1.csv**

### ✅ Verification: These Collections Are NEEDED

All 4 CSV files represent collections that are **required** for the portal to function:

#### 1. Defendants ✓ NEEDED
- **Purpose:** Store defendant profiles separate from member accounts
- **Why:** A defendant may have multiple cases, and we need to track their status independently
- **Schema:** Matches our implementation requirements

#### 2. Indemnitors ✓ NEEDED
- **Purpose:** Store indemnitor (co-signer) profiles
- **Why:** Multiple indemnitors per case, each with their own liability and signing requirements
- **Schema:** Matches our implementation requirements

#### 3. PaymentPlans ✓ NEEDED
- **Purpose:** Track payment plans when balance > $0
- **Why:** Auto-selected by Dashboard.html when down payment < premium
- **Schema:** Matches our implementation requirements

#### 4. SigningSessions ✓ NEEDED
- **Purpose:** Track signing sessions for all 4 methods (email/SMS/kiosk/print)
- **Why:** Monitor paperwork status and signer progress
- **Schema:** Matches our implementation requirements

### 🔍 Comparison with Deployment Checklist

From the deployment checklist, we specified 7 new collections:
1. ✅ Cases - **Already exists in your site**
2. ✅ PendingDocuments - **Already exists in your site**
3. ❌ Defendants - **NEEDS TO BE CREATED** (you have CSV)
4. ❌ Indemnitors - **NEEDS TO BE CREATED** (you have CSV)
5. ❌ PaymentPlans - **NEEDS TO BE CREATED** (you have CSV)
6. ❌ SigningSessions - **NEEDS TO BE CREATED** (you have CSV)
7. ❌ SignatureEvents - **NEEDS TO BE CREATED** (no CSV provided)

### 📊 Missing Collection: SignatureEvents

You didn't provide a CSV for **SignatureEvents**, but it's optional for now. This collection logs individual signing events (viewed, signed, declined, etc.) for analytics.

**Recommendation:** Create it later when you need detailed event logging.

---

## Next Steps

### Option 1: I Create the Collections via Wix API
I can use the Wix MCP to create the 4 missing collections (Defendants, Indemnitors, PaymentPlans, SigningSessions) with the proper schema and permissions.

### Option 2: You Import the CSVs via Wix CMS
You can manually import the 4 CSV files through the Wix CMS interface, which will automatically create the collections with the correct fields.

---

## Recommended Permissions for Each Collection

### Defendants
- **Read:** SITE_MEMBER (defendants can read their own profile)
- **Insert:** ADMIN (only staff can create defendants)
- **Update:** ADMIN (only staff can update)
- **Remove:** ADMIN (only staff can delete)

### Indemnitors
- **Read:** SITE_MEMBER (indemnitors can read their own profile)
- **Insert:** ADMIN (only staff can create indemnitors)
- **Update:** ADMIN (only staff can update)
- **Remove:** ADMIN (only staff can delete)

### PaymentPlans
- **Read:** SITE_MEMBER (indemnitors can view their payment plan)
- **Insert:** ADMIN (only staff can create payment plans)
- **Update:** ADMIN (only staff can update)
- **Remove:** ADMIN (only staff can delete)

### SigningSessions
- **Read:** SITE_MEMBER (signers can view their signing status)
- **Insert:** ADMIN (only staff can initiate signing)
- **Update:** ADMIN (only staff/webhooks can update)
- **Remove:** ADMIN (only staff can delete)

### Cases (Already Exists)
- **Read:** SITE_MEMBER (defendants/indemnitors can view their case)
- **Insert:** ADMIN (only staff can create cases)
- **Update:** ADMIN (only staff can update)
- **Remove:** ADMIN (only staff can delete)

### PendingDocuments (Already Exists)
- **Read:** SITE_MEMBER (signers can view their pending documents)
- **Insert:** ADMIN (only staff can create pending documents)
- **Update:** ADMIN (only staff/webhooks can update)
- **Remove:** ADMIN (only staff can delete)

---

## Summary

✅ **All 4 CSV files are needed** - they represent core collections for the portal
✅ **Cases and PendingDocuments already exist** - no need to recreate
❌ **4 collections need to be created:** Defendants, Indemnitors, PaymentPlans, SigningSessions
❓ **SignatureEvents** - Optional for now, can be created later

**Your Choice:** Would you like me to create these collections via the Wix API, or will you import the CSVs manually through the Wix CMS interface?
