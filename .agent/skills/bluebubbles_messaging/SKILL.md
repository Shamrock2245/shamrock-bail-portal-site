---
name: BlueBubbles Messaging
description: Complete reference and patterns for the BlueBubbles iMessage bridge, high-conversion outreach, auto-reply brains, and human-feel messaging.
version: 1.0.0
---

# Skill: BlueBubbles Messaging

> **Channel Status:** BlueBubbles iMessage is the **primary high-conversion messaging engine** for Shamrock Bail Bonds (98%+ read rates). Twilio SMS serves as the carrier fallback for non-Apple devices.

Use this skill when architecting or maintaining client communication workflows, auto-reply AI brains, lead outreach sequences, and delivery of paperwork launchpad links.

---

## 1. System Architecture & Infrastructure

- **Dedicated Server Host:** Office iMac running BlueBubbles Server (macOS 14.4+).
- **Apple ID Account:** `shamrockbailoffice@gmail.com` · Phone: `(239) 955-0178` / `(239) 332-2245`.
- **Permanent Cloudflare Named Tunnel:** `https://bb.shamrockbailbonds.biz` (Wix DNS CNAME → `cfargotunnel.com`).
- **REST API Port:** `1234` / Cloudflare HTTPS endpoint.
- **Private API Capabilities:** Typing indicators, tapback reactions (love/like/emphasize), message editing, unsend, and visual effects.

```
Client (iPhone / iMessage)
        │
    BlueBubbles Server (Office iMac)
        │ (Cloudflare Tunnel: bb.shamrockbailbonds.biz)
        ▼
Super CRM (`shamrock-leads` Python Engine) ──→ AI Auto-Reply Brain (GPT-4o)
        │
    Handoff to Staff / Paperwork Launchpad Delivery
```

---

## 2. Human-Feel Messaging Philosophy

All automated messages through BlueBubbles MUST adhere to the **Human-Feel Standard**:

1. **Natural Formatting:** Avoid rigid boilerplate, bullet points, corporate robotic jargon, or obvious templates.
2. **Typing Indicators:** Send typing indicators for 1.5s to 3s before dispatching messages to mimic natural human typing.
3. **Conversational Empathy:** Clients are experiencing an emergency. Be warm, fast, reassuring, and direct.
4. **Actionable Links:** Send the mobile intake launchpad link cleanly:  
   *"Hey, this is Shamrock Bail Bonds. You can start the paperwork in 60 seconds right from your phone here: https://www.shamrockbailbonds.biz/portal"*

---

## 3. Integration Patterns (Python / Super CRM)

```python
import os
import requests

BB_BASE_URL = os.environ.get("BLUEBUBBLES_URL", "https://bb.shamrockbailbonds.biz")
BB_PASSWORD = os.environ.get("BLUEBUBBLES_PASSWORD")

def send_imessage(chat_guid: str, message: str) -> dict:
    """
    Send an iMessage via the BlueBubbles REST API.
    """
    url = f"{BB_BASE_URL}/api/v1/message/text"
    headers = {"Content-Type": "application/json"}
    params = {"password": BB_PASSWORD}
    payload = {
        "chatGuid": chat_guid,
        "text": message,
        "method": "private-api"
    }
    
    response = requests.post(url, json=payload, params=params, headers=headers, timeout=10)
    return response.json()
```

---

## 4. Fallback Routing Policy

1. **iMessage Check:** Check if the recipient phone number is registered on iMessage (blue bubble).
2. **Primary Route:** If blue bubble → send via BlueBubbles iMessage bridge.
3. **Fallback Route:** If green bubble (Android / SMS only) or tunnel offline → gracefully fall back to Twilio 10DLC-compliant SMS.
