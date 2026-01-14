# System Configuration (CONFIG) - Shamrock Bail Suite

Central registry of IDs, URLs, and environment-specific settings.

## 1. Critical IDs
- **Master Sheet ID:** `121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E`
- **Wix Site ID:** `a00e3857-675a-493b-91d8-a1dbc5e7c499`
- **GAS Web App URL:** (Stored in Wix Secrets as `GAS_BACKEND_URL`)

## 2. Phone Registry
Phone routing is managed through `src/backend/data/phone-registry.json`.
- **Primary:** (239) 332-2245 (Lee/Collier)
- **Spanish:** (239) 955-0305 (Statewide)

## 3. API Keys & Secrets
**DO NOT COMMIT KEYS TO THE REPO.** Use the proper platform secrets:
- **Wix:** Site Dashboard -> Settings -> Secrets Manager
- **GAS:** Project Settings -> Script Properties
- **GitHub:** Repo Settings -> Secrets and Variables

### Required Secrets:
- `GOOGLE_GEOCODING_API_KEY`
- `SIGNNOW_API_TOKEN`
- `SLACK_WEBHOOK_URL`
- `SHEETS_SERVICE_ACCOUNT_KEY`

## 4. Environment Flags
- `DEVELOPMENT_MODE`: Set to `true` to skip real SMS/Notifications during testing.
- `BYPASS_LOCATION`: Set to `true` to force a specific county for testing.

> [!WARNING]
> Any file containing a raw API key or token will be flagged for immediate deletion.
