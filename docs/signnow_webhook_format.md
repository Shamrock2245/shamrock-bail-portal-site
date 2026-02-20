# SignNow Webhook Creation - Correct Format

## Key Finding

The `callback` field must be **inside** the `attributes` object, not at the root level.

## Correct Request Format

```json
{
  "event": "document.complete",
  "entity_id": "22121bf4f6bb4682aeb53f963df5098c2b442ac1",
  "attributes": {
    "callback": "https://www.shamrockbailbonds.biz/_functions/webhookSignnow",
    "secret_key": "REDACTED_SIGNNOW_WEBHOOK_SECRET",
    "use_tls_12": true,
    "retry_count": 3
  }
}
```

## Field Locations

### Root Level
- `event` (required) - Event name (e.g., "document.complete")
- `entity_id` (required) - User ID, document ID, or document group ID

### Inside `attributes` Object
- `callback` (required) - Webhook URL
- `secret_key` (optional) - HMAC signature secret
- `use_tls_12` (optional) - Use TLS 1.2
- `retry_count` (optional) - Number of retries (1-10)
- `delay` (optional) - Delay in seconds (0-100)
- `delete_access_token` (optional) - Remove token from payload
- `docid_queryparam` (optional) - Include doc ID as query param
- `headers` (optional) - Custom HTTP headers
- `include_metadata` (optional) - Include doc metadata

## Entity ID Options

Depending on the event type:

1. **User-level events** - Use user_id
2. **Document-level events** - Use document_id  
3. **Document group events** - Use document_group_id

For our case (user-level subscription), we use the user_id from the account.
