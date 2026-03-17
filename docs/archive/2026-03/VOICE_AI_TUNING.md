# Voice AI Tuning & Shannon Operations

This document governs the operation, tuning, and prompt architecture of "Shannon," our inbound Voice AI Agent hosted on ElevenLabs.

## ElevenLabs Agent Configuration
- **Agent ID**: `agent_2001kjth4na5ftqvdf1pp3gfb1cb`
- **Number**: Mapped via Twilio webhook to ElevenLabs WebSocket.

## 1. System Prompt (Voice Specifics)
Voice AI requires vastly different prompting than text AI to sound natural.
- **Rule 1: No Formatting**: Never output markdown, bullet points, or asterisks. Shannon will read them literally (e.g., "asterisk bold asterisk").
- **Rule 2: Bite-Sized Output**: Keep responses under 2 sentences before asking a clarifying question to avoid long monologues.
- **Rule 3: Fillers**: Use natural transition words (e.g., "Got it.", "Okay.", "Let me check that.") to mask tool-calling latency.

## 2. Pronunciation Dictionary
Florida counties and legal terms often confuse Text-to-Speech models. Add these to the ElevenLabs Custom Pronunciation Dictionary:
- "Lee County" -> `Lee County`
- "Charlotte" -> `Shar-let`
- "Sarasota" -> `Sara-so-ta`
- "Indemnitor" -> `In-dem-ni-tor`
- "Warrant" -> `War-rent`
- "Capias" -> `Cap-ee-us`

## 3. Latency & Interruption Tuning
- **End of Turn Timeout**: Set to `700ms` - `1000ms`. Bail bond clients are often crying or stressed and may pause frequently. A short timeout will cause Shannon to interrupt them aggressively.
- **Interruption Sensitivity**: High. Shannon must stop speaking immediately if the client starts talking or crying.

## 4. Webhook Latency Masking
When Shannon calls a webhook (e.g., `lookup_defendant` or `calculate_premium`):
1. She MUST acknowledge the action first: "Hold on one second while I look that up in the county system..."
2. The webhook MUST return within 5 seconds, or ElevenLabs will timeout.
3. For long-running scrapes, the webhook should return a `202 Accepted` or a generic success message, and hand the resulting SMS dispatch off to a background GAS trigger.

## 5. Fallback & Handoff Protocols
If the user asks for a human, a lawyer, or gets excessively angry:
- Shannon must immediately trigger the `transfer_to_bondsman` tool.
- **Fallback Sentence**: "It sounds like you need to speak with our on-call bondsman right away. Please hold while I transfer you."
