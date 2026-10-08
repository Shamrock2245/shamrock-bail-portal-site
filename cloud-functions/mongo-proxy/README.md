# Shamrock mongo-proxy (Cloud Function, gen2)

The proxy has **named, fixed-scope actions only** (`named-actions.js`). The old generic
handler took a caller-supplied `database` / `collection` / `filter` / `update` / `pipeline`
and is gone. Calls that use the generic action names (`find`, `findOne`, `insertOne`,
`insertMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `aggregate`,
`countDocuments`) get **410 Gone**.

Every action:
- uses database `ShamrockBailDB` and a hardcoded collection;
- ignores `database`, `dataSource`, `db`, `collection` and `tenant` in the body;
- stores only whitelisted fields, coerced to scalars and length-capped;
- accepts filter values only as plain strings, so operator objects get **400** before any DB connection is opened.

## Caller keys

Each caller sends its own `x-api-key` and may only use its own actions. A key used for another caller's action gets **403**. The check is fail-closed.

| Env var on the function | Holder (where it is stored) | Allowed |
|---|---|---|
| `PROXY_API_KEY_GAS` | GAS script property `PROXY_API_KEY_GAS` | `ping` and every `log*` action, plus `insertHistoricalBond` |
| `PROXY_API_KEY_VELO` | Wix Secret `PROXY_API_KEY_VELO` | Bail School actions and `/wix-intake` |
| `PROXY_API_KEY` (**legacy**) | GAS property / Wix Secret `PROXY_API_KEY` | everything; transitional only |

- No key configured gives **503**. A wrong key gives **401**. Identical GAS and Velo keys give **503**, because the two keys must differ.
- Callers try their own key first and fall back to the legacy name. That keeps working before the rotation.
- Remove `PROXY_API_KEY` from the function once both callers send their own key. The legacy key is then rejected with 401. After that, delete the legacy GAS property and Wix Secret.
- Keys are only read server-side: GAS script properties, and Velo backend code using wix-secrets-backend. `secretsManager.jsw` is not invokable from the browser.

## Deploy (`npm run deploy`)

- `--update-secrets` maps each Secret Manager secret to the env var of the same name at `:latest`: `MONGO_URI`, `PROXY_API_KEY` (legacy), `PROXY_API_KEY_GAS`, `PROXY_API_KEY_VELO`, `TWILIO_AUTH_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`. Every secret must exist in Secret Manager in `swfl-arrest-scrapers` before the deploy. The function's service account also needs Secret Accessor on each one.
- `--update-secrets` keeps secrets that are already set. The script sets no env vars, so a redeploy keeps `TWILIO_WEBHOOK_URL`. Set that value once to the exact Twilio console URL, for example with `gcloud functions deploy mongo-proxy ... --update-env-vars=TWILIO_WEBHOOK_URL=<exact URL>` or in the Cloud Run console.
- A name cannot be a plain env var and a secret at the same time. If any of these names is currently set as a plain env var, remove it with `--remove-env-vars` before the first deploy.

## Webhooks (fail-closed, no write on rejection)

| Path | Check | Env |
|---|---|---|
| `/twilio` | `X-Twilio-Signature` = base64(HMAC-SHA1(`TWILIO_AUTH_TOKEN`, `TWILIO_WEBHOOK_URL` + sorted POST key+value)), constant-time compare; `:443` variant accepted like twilio-node | `TWILIO_AUTH_TOKEN`, `TWILIO_WEBHOOK_URL` |
| `/telegram` | `X-Telegram-Bot-Api-Secret-Token` = `TELEGRAM_WEBHOOK_SECRET` (constant-time) | `TELEGRAM_WEBHOOK_SECRET` |
| `/wix-intake` | Velo (or legacy) `x-api-key` | `PROXY_API_KEY_VELO` |

- `TWILIO_WEBHOOK_URL` must be the **exact** URL in the Twilio console, including any query string. Behind gen2 / Cloud Run, the host and path the function sees differ from the URL Twilio signed, so this URL is never derived from the request.
- `/twilio` and `/telegram` store one whitelisted `Communications` doc and no raw payload:
  - Twilio: direction, platform, from, to, body, messageId, numMedia, timestamp.
  - Telegram: direction, platform, from (chat id), body, messageId, updateId, timestamp.
- The signature code uses Node built-ins only. It was cross-checked against twilio-node 5.13.1 `validateRequest` and `getExpectedTwilioSignature` on 3,000 randomized cases (arrays, ports, unicode). It also reproduces the Twilio docs vector `L/OH5YylLD5NRKLltdqwSvS0BnU=`.

| Action | Collection | Caller |
|---|---|---|
| `ping` | — (`db.command({ping:1})`) | GAS `MongoDbService.ping()` |
| `logActivity` | ActivityLog | GAS `MongoLogger.logActivity` |
| `logIntake` | Intakes | GAS `MongoLogger.logIntake` |
| `logSignNowEvent` | SignNowEvents | GAS `MongoLogger.logSignNow` |
| `logPayment` | Payments | GAS `MongoLogger.logPayment` |
| `logCourtDate` | CourtDates | GAS `MongoLogger.logCourtDate` |
| `logCheckIn` | CheckIns | GAS `MongoLogger.logCheckIn` (portal `logDefendantLocation`, Telegram, Twilio check-ins) |
| `logCommunication` | Communications | GAS `MongoLogger.logComm` |
| `logLeadScore` | LeadScoring | GAS `MongoLogger.logLeadScore` |
| `insertHistoricalBond` | HistoricalBonds | GAS `AI_HistoricalOCR` |
| `getCourse` | Courses | Velo `backend/bailSchoolMongo.jsw` |
| `listCourseLessons` | CourseLessons | Velo |
| `getStudentEnrollment`, `listStudentEnrollments`, `markLessonComplete` | StudentEnrollments | Velo |
| `logStudentAction`, `listStudentAuditLogs` | AuditLogs | Velo |

Tests: `node --test scripts/test_mongo_proxy_named_actions.mjs scripts/test_mongo_proxy_webhooks_and_keys.mjs`. They need no Mongo, no network and no npm install.
