# Wix CMS Collections Audit

## Collections Used in Codebase

Based on code analysis, here are all the CMS collections referenced:

### Core Portal Collections
| Collection Name | Used In | Purpose |
|----------------|---------|---------|
| `Magiclinks` | portal-auth.jsw, magic-link-manager.jsw | Magic link tokens for authentication |
| `Portal Sessions` | portal-auth.jsw | Active user sessions (NOTE: has space!) |
| `Portal Users` | portal-auth.jsw | User profiles |
| `Cases` | portal-auth.jsw, http-functions.js, signing-methods.jsw | Case data |

### Authentication & Access
| Collection Name | Used In | Purpose |
|----------------|---------|---------|
| `AccessCodeUsage` | accessCodes.jsw | Track access code usage |
| `MagicLinkLogs` | magic-link-manager.jsw | Log magic link sends |

### Analytics & Logging
| Collection Name | Used In | Purpose |
|----------------|---------|---------|
| `AnalyticsEvents` | analytics.jsw | Event tracking |
| `CallLogs` | call-tracking.jsw, routing.jsw | Phone call logs |
| `CountyMetrics` | call-tracking.jsw | County-level metrics |
| `WebhookLogs` | signnow-webhooks.jsw | Webhook event logs |
| `NotificationLogs` | notificationService.jsw | Notification history |

### Document & Signing
| Collection Name | Used In | Purpose |
|----------------|---------|---------|
| `PendingDocuments` | integrations.web.js, signing-methods.jsw, wixApi.js | Documents awaiting signature |
| `SigningSessions` | googleDriveService.jsw, signing-methods.jsw, signnow-webhooks.jsw | Active signing sessions |
| `SignatureEvents` | signing-methods.jsw, signnow-webhooks.jsw | Signature event log |
| `RequiredDocuments` | documentUpload.jsw | Required document definitions |

### Location & Geolocation
| Collection Name | Used In | Purpose |
|----------------|---------|---------|
| `UserLocations` | location.jsw, location-enhanced.jsw, scheduler.jsw | User location data |
| `GeolocationCache` | geocoding.jsw | Cached geocoding results |
| `GeolocationEvents` | geocoding.jsw | Geolocation event log |

### County & Booking Data
| Collection Name | Used In | Purpose |
|----------------|---------|---------|
| `FloridaCounties` | counties.jsw, http-functions.js | Florida county data |
| `Counties` | bailCalculator.jsw | County information |
| `BookingCache` | bailCalculator.jsw | Cached booking data |
| `ArrestLeads` | integrations.web.js | Arrest lead data |

### Other Collections
| Collection Name | Used In | Purpose |
|----------------|---------|---------|
| `BailSchoolSignups` | bailSchoolInterest.jsw | Bail school interest signups |
| `CaseFolders` | googleDriveService.jsw | Google Drive folder references |
| `DocumentSaves` | googleDriveService.jsw | Document save records |
| `InAppNotifications` | notificationService.jsw | In-app notifications |
| `PaymentAuthorizations` | payments.jsw | Payment auth records |
| `PaymentEventLog` | payments.jsw | Payment event log |
| `Defendants` | portal-sync.jsw | Defendant data |
| `Indemnitors` | portal-sync.jsw | Indemnitor data |
| `PaymentPlans` | portal-sync.jsw | Payment plan data |
| `FinancialObligations` | portal-auth.jsw | Financial obligations |
| `Testimonials` | Testimonials page | Customer testimonials |
| `Blog/Posts` | Post page | Blog posts |
| `SmsDeliveryLogs` | http-functions.js | SMS delivery logs |

## Critical Collections for Magic Link Flow

For the Magic Link authentication to work, these collections MUST exist:

1. **Magiclinks** - Stores magic link tokens
   - `token` (Text) - 64-char token
   - `email` (Text) - User email
   - `phone` (Text) - User phone
   - `role` (Text) - User role
   - `personId` (Text) - Reference to Case/User
   - `expiresAt` (DateTime) - Expiration time
   - `used` (Boolean) - Whether used

2. **Portal Sessions** - Stores active sessions (NOTE: has space in name!)
   - `userId` (Text) - User ID
   - `key` (Text) - Session key
   - `timestamp` (DateTime) - Created time
   - `lastActivity` (DateTime) - Last activity
   - `role` (Text) - User role
   - `caseId` (Text) - Associated case

3. **Cases** - Core case data
   - Already exists per screenshot

## Notes

- Collection name `Magiclinks` is used (lowercase 'l')
- Collection name `Portal Sessions` has a SPACE - this is unusual but intentional
- The code uses `suppressAuth: true` for most operations
