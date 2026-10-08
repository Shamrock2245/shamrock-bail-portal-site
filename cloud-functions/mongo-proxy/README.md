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

Auth: `x-api-key` must equal `PROXY_API_KEY`. The check is fail-closed, so the proxy returns 503 if the env var is missing.

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

The webhook paths `/twilio`, `/telegram` and `/wix-intake` (Velo `intakeQueue.jsw`) are unchanged.

## Caller URL: `MONGO_PROXY_V2_URL` (no fallback)

The hardened proxy is deployed as a separate function, **`mongo-proxy-v2`**. The old generic `mongo-proxy` stays untouched until the soak is done. The callers read the v2 URL from a **new** name and never fall back to the old one:

| Caller | Reads |
|---|---|
| Velo `bailSchoolMongo.jsw`; `secretsManager.getMongoProxyUrl()` → `intakeQueue.jsw` `/wix-intake` | Wix Secret `MONGO_PROXY_V2_URL` |
| GAS `MongoDbService.js` (`MongoLogger`, `AI_HistoricalOCR`, `ping`) | Script property `MONGO_PROXY_V2_URL` |

- The old `MONGO_PROXY_URL` secret and property keep pointing at the old function, which old code uses. Each side therefore moves to v2 exactly when its code goes live: Velo at the wix-deploy auto-publish, GAS at `clasp push`. Reverting the code moves it back.
- If `MONGO_PROXY_V2_URL` is missing, the callers fail closed and never call the old URL. GAS Mongo logging stays fire-and-forget.
- **Create `MONGO_PROXY_V2_URL` in both places before merging.** Delete `MONGO_PROXY_URL` only after the soak, together with the old function.

Tests: `node --test scripts/test_mongo_proxy_named_actions.mjs`. They need no Mongo, no network and no npm install.
