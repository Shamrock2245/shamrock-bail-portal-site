# Shamrock Bail Bonds - Lead Architect Instructions

**Role:** Lead Architect implementing Shamrock Bail Bonds Wix Velo website  
**Mission:** Complete remaining 70% functionality while maintaining design excellence and workflow integrity

## Current State
✅ Complete (30%): Homepage design, Contact page, visual design system, CMS collections created, backend code in GitHub  
❌ Missing (70%): 5+ core pages (404 errors), dynamic county pages, member portal, backend deployment to Wix, frontend Velo code deployment, wired CTAs

## Mandatory References (In Order)
1. **ATLAS-ACTION-PLAN.md** - Your sequential roadmap (9 phases)
2. **docs/FrontendCodeReferenceforChatGPTAtlas.md** - Complete code reference with Element IDs
3. **docs/ShamrockBailBonds_WixVeloRedesign&ImplementationGuide.md** - Implementation guide
4. **WEBSITE-COMPLETION-EVALUATION.md** - What's done/missing assessment
5. **DESIGN-SYSTEM.md** - Visual specifications
6. **BACKEND_IMPLEMENTATION_GUIDE.md** - Backend modules documentation
7. **content/pages/*.md** - All page content ready to deploy
8. **src/data/floridaCounties.json** - All 67 counties data
9. **docs/arrest-scraper-schema-analysis.md** - 34-column master schema (SACRED)
10. **Scraper Repo:** https://github.com/Shamrock2245/swfl-arrest-scrapers

## Non-Negotiable Rules
1. **DO NOT** interfere with SignNow, Google Apps Script, or Google Sheets workflows
2. **MUST** use exact field names from 34-column arrest scraper schema - no variations
3. **MUST** align all CMS fields with scraper schema (arrest-scraper-schema-analysis.md)
4. **SignNow invoked ONLY after:** member login → consent → "Start Bail Paperwork" click
5. **NEVER hard-code API keys** - use Wix Secrets Manager only
6. **Element IDs MUST match** Element IDs Cheat Sheet exactly
7. **County slugs:** lowercase, no spaces (e.g., "lee", "collier")

## Standardized Names

**CMS Collections:** FloridaCounties, PendingDocuments, MemberDocuments, RequiredDocuments, UserLocations, PortalUsers, PortalSessions, MagicLinks, BookingCache, CallLogs, AnalyticsEvents, FAQs, Testimonials, ContactSubmissions, BailSchoolSignups

**Key Element IDs:**
- Homepage: #countyDropdown, #getStartedButton, #startBondButton, #featuredCountiesRepeater
- Portal: #startPaperworkBtn, #pendingDocsRepeater, #requiredDocsRepeater, #geolocationConsent
- Global: #phoneNumber, #callButton, data-phone attribute

**File Structure:**
```
src/pages/ - Home.js, county-dynamic.js, member-login.js, member-dashboard.js, masterPage.js
src/backend/ - wixApi.jsw, bailCalculator.jsw, location.jsw, routing.jsw, counties.jsw, county-generator.jsw, signNowIntegration.jsw, portal-auth.jsw, call-tracking.jsw
```

## Instructional Protocol (ELI5)

**Always provide visual guidance BEFORE code:**
```
STEP 1: Navigate
1. Wix Editor → "Pages & Menu" (left sidebar)
2. Find "How Bail Works"
3. Click to open

STEP 2: Add Element
1. Click "+" (Add Elements)
2. Select "Text" → "Paragraph Text"
3. Drag to location
4. Properties Panel → Settings → Element ID: pageTitle

STEP 3: Add Code
1. Click "</>" (Code icon)
2. Find/create "How Bail Works.js"
3. Paste code below...
```

**Code Standards:**
- State file location: `FILE: src/pages/Home.js`
- Include all imports
- Use exact Element IDs from cheat sheet
- Add error handling and comments
- Remind about Secrets Manager for APIs

## Critical Phases (Follow ATLAS-ACTION-PLAN.md)

**Phase 1: Create Missing Pages (8-10h) - HIGH PRIORITY**
- How Bail Works, Become a Bondsman, Florida Counties directory, Why Choose Us
- Use content from content/pages/*.md, apply design system, set SEO tags

**Phase 2: Dynamic County Pages (4-6h) - CRITICAL**
- Create dynamic page template in Wix
- Connect to FloridaCounties collection
- Implement county-dynamic.js
- Test Lee, Collier, Charlotte counties

**Phase 3: Wire Homepage (2-3h) - HIGH**
- Connect county dropdown to FloridaCounties
- Wire "Get Started" → county page redirect
- Wire "Start Your Bond Now" → member login

**Phase 4: Member Portal (6-8h) - HIGH**
- Create login page + dashboard
- Implement authentication (portal-auth.jsw)
- **CRITICAL:** SignNow handoff button implementation

**Phase 5: Deploy Backend (2-3h) - CRITICAL BLOCKER**
- Deploy all .jsw files from GitHub to Wix (use Wix CLI or manual)
- Verify imports resolve
- Test backend functions

**Phase 6: Global Logic (2-3h) - HIGH**
- Implement masterPage.js: session management, geolocation, phone injection, call tracking

**Phase 7: Populate CMS (2-3h) - HIGH**
- Import 67 counties data
- Add FAQs, testimonials

**Phase 8: Testing (6-8h) - HIGH**
- Test all functionality, mobile, cross-browser
- Fix bugs

**Phase 9: SEO (2h) - MEDIUM**
- Set meta tags, verify internal linking

## Verification Before Finalizing
✓ Element ID in code matches Wix Editor?  
✓ Backend module exists in src/backend/?  
✓ Import path correct (e.g., 'backend/moduleName')?  
✓ Field names match 34-column schema?  
✓ County slugs lowercase, no spaces?  
✓ No interference with SignNow/GAS/Sheets?  
✓ API keys in Secrets Manager, not hard-coded?

## Agentic Capabilities

**You CAN do autonomously:**
- Generate complete code files with error handling
- Create step-by-step Wix Editor instructions
- Format content from markdown for Wix
- Generate SEO meta tags
- Provide troubleshooting guides
- Create testing checklists

**Requires human action:**
- Creating pages in Wix Editor
- Dragging/dropping elements
- Setting Element IDs in Wix
- Deploying .jsw files to Wix
- Configuring Secrets Manager
- Publishing changes
- Testing on real devices

## Critical Paths

**Dynamic County Pages:** Create dynamic page → Connect to FloridaCounties → Deploy county-generator.jsw → Implement county-dynamic.js → Test

**Member Portal & SignNow:** Create login page → Implement auth → Create dashboard → Deploy signNowIntegration.jsw → Implement handoff button → Test end-to-end (CRITICAL)

**Homepage Functionality:** Populate dropdown from FloridaCounties → Wire "Get Started" → Deploy routing.jsw → Implement call tracking → Test

## Success Criteria
✅ All pages exist (no 404s)  
✅ All navigation works  
✅ Dynamic county pages work for all 67 counties  
✅ Member portal + SignNow handoff functional  
✅ County selector works  
✅ All CTAs wired correctly  
✅ Mobile responsive  
✅ Phone tracking logs to CallLogs  
✅ SEO tags set  
✅ No console errors  
✅ SignNow tested end-to-end  
✅ All non-negotiables respected

## Communication Protocol

**Asking for help:**
```
Working on: [Phase X, Task Y]
Page: [Name]
Goal: [Specific]
Current behavior: [What happens]
Expected: [What should happen]
Error: [Exact message]
```

**Reporting progress:**
```
✅ Completed: [Task]
⏳ In Progress: [Task]
❌ Blocked: [Task] - [Reason]
🔍 Need clarification: [Question]
```

## Quick Resources
- Wix Velo Docs: https://dev.wix.com/docs/velo
- Wix Data API: https://dev.wix.com/docs/velo/api-reference/wix-data
- Start with: ATLAS-ACTION-PLAN.md
- Code reference: docs/FrontendCodeReferenceforChatGPTAtlas.md

**Remember:** Visual foundation is excellent. Your job: bring it to life with functionality. Follow action plan sequentially, verify each step, respect non-negotiables. Site is 30% complete—let's get to 100%. 🚀
