---
name: ElevenLabs MCP Server
description: Official ElevenLabs MCP server for Text-to-Speech and Audio generation.
---

# ElevenLabs MCP Server

This skill enables the agent to interact with ElevenLabs' powerful audio capabilities directly through the Model Context Protocol.

## Capabilities
-   **Text-to-Speech**: Generate audio from text using premium voices.
-   **Voice Cloning**: Create and manage cloned voices.
-   **Sound Effects**: Generate sound effects from text descriptions.
-   **Audio Isolation**: Remove background noise from audio.

### Related Strategy
For the **Conversational AI Strategy** (Intake Clerk, Voice Cloning), please refer to:
- [docs/ElevenLabs_Strategy.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/ElevenLabs_Strategy.md)
- [ElevenLabs_Manus_Prompt.md](file:///Users/brendan/.gemini/antigravity/brain/8876c38e-3765-4f54-b27d-3170dd958985/ElevenLabs_Manus_Prompt.md)


## Installation & Configuration

### Prerequisites
-   **ElevenLabs API Key**: Get it from [ElevenLabs Dashboard](https://elevenlabs.io).
-   **MCP Client**: Claude Desktop, Cursor, or similar.
-   **uv** (Recommended): `pip install uv`

### Configuration Payload

Add this to your MCP User Settings (e.g., `claude_desktop_config.json` or VS Code `settings.json`):

```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "uvx",
      "args": [
        "elevenlabs-mcp"
      ],
      "env": {
        "ELEVENLABS_API_KEY": "YOUR_ELEVENLABS_API_KEY"
      }
    }
  }
}
```

## Usage
Once configured, you can ask the agent to:
-   "List available voices."

## Webhook Integration (Conversational AI)

For the **Web Voice Agent** and **Inbound Calls**, we rely on webhooks to process conversation data.

### 1. Webhook Endpoint
The Google Apps Script (GAS) backend exposes a single endpoint for all ElevenLabs events:
-   **URL**: `[GAS_WEB_APP_URL]?source=elevenlabs`
-   **Method**: `POST`
-   **Handler**: `backend-gas/ElevenLabs_WebhookHandler.js`

### 2. Supported Events
Configure these in the [ElevenLabs Developer Console](https://elevenlabs.io/app/developers/webhooks):

#### A. `post_call_transcription`
-   **Trigger**: Fires when a conversational agent finishes a call.
-   **Payload**: Full transcript, conversation analysis (success/failure), duration.
-   **Action**: Logs transcript to Slack (`#ai-conversations`) and saves archive to Google Drive.

#### B. `call_initiation_failure`
-   **Trigger**: Fires if an outbound call fails to connect.
-   **Action**: Logs error to Slack (`#alerts`).

### 3. Security
-   **HMAC Verification**: ElevenLabs sends an `elevenlabs-signature` header.
-   **Secret**: You must add your signing secret to GAS Script Properties as `ELEVENLABS_WEBHOOK_SECRET`.

