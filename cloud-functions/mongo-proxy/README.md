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

Tests: `node --test scripts/test_mongo_proxy_named_actions.mjs`. They need no Mongo, no network and no npm install.
