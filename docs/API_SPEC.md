# 🔌 API Specification

> **Last Updated:** 2026-08-21  
> **Signing Boundary:** DocuSeal is the sole active signing provider. Wix acts as a non-issuing clipboard launchpad. SignNow is retired.

---

## 1. New Velo Web Methods (`src/backend/*.jsw`)

### `id-ocr-service.jsw`
| Method | Auth | Arguments | Returns | Failure Modes |
|---|---|---|---|---|
| `processIdPhotoOcr` | Anonymous / Member | `{ fileUrl, base64Image, side: 'front' \| 'back', signerRole: 'defendant' \| 'indemnitor' \| 'coindemnitor' }` | `{ success: boolean, extractedData: Object, confidenceScore: number, role: string }` | • Missing image payload<br>• Vision API quota/timeout<br>• Blocks writing to `defendant.*` if role is indemnitor/coindemnitor |

### `case-facts-hydrator.jsw`
| Method | Auth | Arguments | Returns | Failure Modes |
|---|---|---|---|---|
| `lookupDefendantCaseFacts` | Anonymous / Member | `{ firstName, lastName, county, bookingNumber, dob }` | `{ success: boolean, matched: boolean, caseFacts: Object, charges: Array, totalBond: number, estimatedPremium: number }` | • No match (returns empty defaults, never invents data)<br>• Missing last name |
| `pushStaffCaseCorrection` | Staff / Owner | `{ caseId, correctedFacts, staffEmail }` | `{ success: boolean, caseId: string, updatedFields: Array }` | • Unauthorized non-staff caller<br>• Invalid caseId |

### `wizard-draft-service.jsw`
| Method | Auth | Arguments | Returns | Failure Modes |
|---|---|---|---|---|
| `saveWizardDraft` | Anonymous / Member | `{ caseId, role, currentStep, canonicalCase, contactIdentifier }` | `{ success: boolean, draftId: string, lastSavedStep: number, updatedAt: string }` | • Missing caseId<br>• CMS write timeout (falls back to local draft) |
| `getWizardDraft` | Anonymous / Member | `(caseId, contactIdentifier)` | `{ success: boolean, hasDraft: boolean, draft: Object }` | • Draft expired (>7 days)<br>• Case not found |
| `clearWizardDraft` | Anonymous / Member | `(caseId)` | `{ success: boolean }` | • Invalid caseId |

### `canonical-sync-service.jsw`
| Method | Auth | Arguments | Returns | Failure Modes |
|---|---|---|---|---|
| `persistCanonicalCaseToCms` | Staff / Member | `(canonicalCase)` | `{ success: boolean, caseId: string, defendantId: string, indemnitorId: string }` | • Missing required case data<br>• Database constraint violation |
| `syncCanonicalCaseToGas` | Staff / Member | `(canonicalCase)` | `{ success: boolean, gasSyncStatus: 'synced', gasResponse: Object }` | • GAS network timeout<br>• Netlify proxy unreachable |

### `signing-session-service.jsw` (READ-Only Launchpad)
| Method | Auth | Arguments | Returns | Failure Modes |
|---|---|---|---|---|
| `validateSigningSession` | Anonymous / Member | `(sessionId, caseId)` | `{ success: boolean, isValid: boolean, isExpired: boolean, status: string, embedUrl: string }` | • Session expired (>24h)<br>• Invalid sessionId |
| `requestFreshSigningLink` | Anonymous / Member | `{ caseId, signerEmail, signerPhone, signerRole }` | `{ success: boolean, message: string }` | • Missing contact info<br>• Dispatches 1-tap recovery via BlueBubbles/SMS to staff |
| `recordSignatureCompletion` | Anonymous / Member | `{ caseId, signerRole, completionTimestamp }` | `{ success: boolean, receiptSent: boolean }` | • Missing caseId<br>• Updates CMS and dispatches SMS receipt |

### `lobby-tablet-service.jsw` (Lobby Kiosk Engine)
| Method | Auth | Arguments | Returns | Failure Modes |
|---|---|---|---|---|
| `startWalkInPacket` | Staff / Owner | `{ initialRole, staffEmail, county, defendantName }` | `{ success: boolean, caseId: string, launchUrl: string, pinCode: string }` | • Unauthorized non-staff caller<br>• Missing staff credentials |
| `searchOpenLeadsForTablet` | Staff / Owner | `{ query, county, limit }` | `{ success: boolean, leads: Array }` | • Scraper backend timeout<br>• Non-staff access denied |
| `markReadyForSuperCrm` | Staff / Owner | `{ caseId, staffNotes, staffEmail }` | `{ success: boolean, notifiedUnderwriter: boolean }` | • Case not in valid state<br>• Alerts Super CRM queue and Slack |

### `service-areas.jsw`
| Method | Auth | Arguments | Returns | Failure Modes |
|---|---|---|---|---|
| `getLiveServiceAreas` | Public | `()` | `{ success: boolean, states: Array<{ state: string, slug: string, status: 'live' }> }` | • None (defaults to Florida if CMS empty) |
| `getServiceAreaByState` | Public | `(stateSlug)` | `{ success: boolean, area: Object \| null }` | • State not found or not live (returns null for 404 router) |
| `isStateLive` | Public | `(stateSlug)` | `boolean` | • Returns false for unlisted/planned states |

### `bluebubbles.jsw`
| Method | Auth | Arguments | Returns | Failure Modes |
|---|---|---|---|---|
| `sendBlueBubblesMessage` | Staff / Member | `{ to, message, subject }` | `{ success: boolean, messageId: string, channel: 'imessage' \| 'sms' }` | • Missing recipient/text<br>• Cloudflare tunnel unreachable (fails closed with safe error) |

---

## 2. Router & HTTP Functions

| Endpoint / Router | Method / Type | Purpose | Auth / Boundary |
|---|---|---|---|
| `/florida-bail-bonds/:slug` | Wix Router | Dynamic programmatic 67 Florida county landing pages | Public |
| `/bail-bonds/:state/:county` | Multi-State Router | Multi-state expansion directory | Strictly returns `ok()` if `isStateLive(state)` is true; 404 otherwise |
| `/_functions/triggerCountySync` | GET | Admin cron sync of Florida county metadata | HMAC / `GAS_API_KEY` required |
| `/_functions/llmsTxt` | GET | Generative Engine Optimization feed for AI search engines | Public |
