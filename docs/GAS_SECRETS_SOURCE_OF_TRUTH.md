# GAS secrets — source of truth

**Policy:** Runtime secrets that reference the Google Apps Script web app (Wix Secrets, Netlify env, Node-RED `.env`, Telegram Netlify, etc.) **must match** the portal repo’s [`.gas-config.json`](../.gas-config.json) only.

Do **not** rotate deployment IDs, mint new web-app deployments, or change live GAS URLs without **Brendan** approval.

## Canonical values (from `.gas-config.json`)

| Key | Value |
|---|---|
| `deploymentId` (factory / portal / leads) | `AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z` |
| `gasWebAppUrl` | `https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec` |
| `schoolDeploymentId` (bail school — separate) | `AKfycbyV48043q007TwWikAIFfyma5TNKjOF6nHDaza-hRMefEVmMM3xKamujQeKFBkZQa_DMg` |
| `schoolGasWebAppUrl` | `https://script.google.com/macros/s/AKfycbyV48043q007TwWikAIFfyma5TNKjOF6nHDaza-hRMefEVmMM3xKamujQeKFBkZQa_DMg/exec` |

If a surface still points at a different ID, treat it as a **documented mismatch** — fix only with Brendan (do not silently rotate).

Retired Universal bookmarklet IDs that 404 (historical only — do not revive):

- Universal AI: `AKfycbybvb6EpI6Aop5RSDvweHceD1LQpjMoomEHro5zH9fNbR_-OVCqISX5lTa4lMuNR6EXYw`
- UniversalBookmarklet_Minified: `AKfycbxdKuWmcBo7Cu0RXsBgongINERqFoPE8CmfcdxtLdnJoM3SxuqBHGJY-pIrMbRi72_rnQ`

See also: `backend-gas/Bookmarklets.md`, `shamrock-leads/docs/policies/gas-url-policy.md`.
