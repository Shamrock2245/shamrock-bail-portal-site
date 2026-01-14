# API Specification - Shamrock Bail Suite

Reference for internal and external API interactions within the Shamrock system.

## 1. Wix Backend Modules (.jsw)

### `routing.jsw`
- `getPhoneNumber(context)`
  - **Input:** `{ county: string, language: 'en'|'es', device: string }`
  - **Output:** `{ success: boolean, number: string, display: string, source: string }`

### `geocoding.jsw`
- `detectCounty(lat, lng)`
  - **Input:** `latitude: number, longitude: number`
  - **Output:** `{ success: boolean, county: string, state: string, confidence: number }`

### `portal-auth.jsw`
- `getUserRole()`
  - **Output:** `enum { DEFENDANT, INDEMNITOR, STAFF, ADMIN }`

## 2. Google Apps Script (GAS) Endpoints
The backend Master Sheet is controlled via the following web app endpoints:

- `GET /exec?action=getLeads&county=[lee]`
  - Returns current qualified leads for a specific county.
- `POST /exec?action=updateRecord`
  - Body: `{ bookingNumber, updateData }`
  - Updates a specific row in the Master Sheet.

## 3. SignNow Webhooks
The system listens for these events to update the Master Sheet:
- `document.complete`: Triggers "Paperwork Signed" status in Master Sheet.
- `document.viewed`: Logs when a client views the bond package.

## 4. Frontend Utilities (Public)

### `phone-injector.js`
- `initializePhoneInjection(options)`
  - Site-wide tool for dynamic number swapping.

### `geolocation-client.js`
- `captureGeolocation(requireConsent)`
  - Handles the browser location request and user consent.

> [!NOTE]
> All backend functions require `.jsw` exports and should only be called from frontend modules or other backend services.
