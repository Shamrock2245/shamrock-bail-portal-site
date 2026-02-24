# ElevenLabs V3 & Conversational AI Research

**Date:** February 19, 2026  
**Purpose:** Understand ElevenLabs V3 capabilities and plan integration for Shamrock Bail Bonds

---

## Key Findings

### 1. ElevenLabs V3 Model (Latest)

**Released:** February 4, 2026  
**Status:** Alpha

**Key Features:**
- **70+ languages** supported
- **Advanced audio tags** for emotion and direction control
- **Dialogue mode** for natural conversations
- **High emotional range** and contextual understanding
- **Text to Dialogue API** for generating natural, lifelike dialogue

**Model ID:** `eleven_v3` (for API calls)

### 2. ElevenAgents Platform (Conversational AI 2.0)

**Released:** January 21, 2026  
**Status:** Production

**Architecture Components:**
1. **Speech to Text (ASR)** - Fine-tuned for conversation
2. **Language Model** - Your choice (GPT-4o, Claude, custom)
3. **Text to Speech (TTS)** - Low-latency, 5k+ voices, 70+ languages
4. **Turn-taking model** - Proprietary conversation timing

**Key Capabilities:**
- **Sub-100ms latency** for real-time conversations
- **32+ languages** supported
- **Multimodal** - Voice and text
- **Workflows** - Visual workflow builder for complex conversations
- **Tools** - Connect to external APIs and services
- **Knowledge Base** - Upload documents for RAG (Retrieval Augmented Generation)
- **Personalization** - Dynamic variables per conversation
- **Authentication** - Custom auth for protected access

### 3. Deployment Options

**Available Channels:**
- ✅ **Web Widget** - Embed in website
- ✅ **React SDK** - Voice-enabled React components
- ✅ **Swift SDK** - Native iOS apps
- ✅ **Kotlin SDK** - Native Android apps
- ✅ **React Native SDK** - Cross-platform mobile
- ✅ **SIP Trunk** - Existing telephony infrastructure
- ✅ **Twilio** - Native integration for phone calls
- ✅ **WebSocket API** - Custom implementations
- ❌ **WhatsApp** - Documentation page not found (404)

**Note:** WhatsApp integration documentation is missing, suggesting it may be:
- Not yet available
- In beta/private preview
- Requires custom implementation via WebSocket API

### 4. Agent Creation API

**Endpoint:** `POST /v1/convai/agents/create`

**Required Parameters:**
- `conversation_config` (object) - Conversation orchestration settings
  - System prompt
  - LLM selection
  - Voice settings
  - Turn-taking configuration
  - Timeout settings
- `platform_settings` (object, optional) - Non-conversation settings
- `workflow` (object, optional) - Define conversation flow and tool interactions
- `name` (string, optional) - Agent name
- `tags` (array, optional) - Classification tags

**Response:**
- `agent_id` (string) - ID of created agent

### 5. Monitoring & Analytics

**Built-in Features:**
- **Testing** - Automated tests for agent behavior
- **Conversation Analysis** - Extract insights and evaluate outcomes
- **Analytics** - Performance metrics and conversation history
- **Real-time Monitoring** - Live conversation tracking
- **Privacy** - Configurable data retention policies
- **Cost Optimization** - Monitor and optimize LLM expenses

### 6. Pricing (2026)

**Conversational AI:**
- **$0.10/minute** (50% reduction from 2025)
- Includes ASR + LLM + TTS + turn-taking

**Text to Speech (V3):**
- Pricing varies by usage tier
- Enterprise pricing available

---

## Current Implementation Status (Shamrock)

### ✅ What's Already Built

1. **ElevenLabs_Client.js** (GAS Backend)
   - Text-to-Speech API integration
   - Uses `eleven_turbo_v2_5` model
   - Voice selection support
   - MP3 audio generation

2. **ElevenLabs_WebhookHandler.js** (GAS Backend)
   - Handles `post_call_transcription` events
   - Handles `call_initiation_failure` events
   - Saves transcripts to Google Drive
   - Slack notifications for AI conversations

3. **elevenLabs.jsw** (Wix Backend)
   - Proxies audio generation requests to GAS
   - Blog post audio generation

4. **Manus AI Agent** (WhatsApp)
   - Text + voice note responses
   - OpenAI GPT-4o for logic
   - ElevenLabs for voice notes
   - Whisper API for transcription
   - **Currently uses Twilio** (being replaced with WhatsApp Cloud API)

5. **Strategy Document**
   - Defined "Intake Clerk" persona (Sarah)
   - Defined owner personas (Brendan, Kayla)
   - Voice cloning strategy
   - Workflow architecture

### ❌ What's Missing for V3 Agents

1. **Agent Creation**
   - No programmatic agent creation via API
   - No agent configuration management
   - No agent versioning

2. **Conversational AI Integration**
   - Not using ElevenAgents platform
   - Not using real-time conversation capabilities
   - Not using workflow builder

3. **WhatsApp Integration**
   - No direct ElevenAgents → WhatsApp connection
   - Currently using custom Manus implementation
   - No voice call support on WhatsApp (only voice notes)

4. **Advanced Features**
   - No knowledge base integration
   - No tool calling (external APIs)
   - No conversation analytics
   - No automated testing

5. **Voice Cloning**
   - Training data not collected
   - Custom voices not created
   - No voice cloning API integration

---

## Integration Gaps Analysis

### Gap 1: ElevenAgents vs. Current Manus Implementation

**Current Manus (Custom):**
- Asynchronous (text + voice notes)
- WhatsApp-based
- OpenAI GPT-4o + ElevenLabs TTS
- Manual orchestration in GAS

**ElevenAgents (Platform):**
- Real-time conversation (phone, web)
- Built-in ASR + LLM + TTS + turn-taking
- Automatic orchestration
- Analytics and testing

**Conflict:** ElevenAgents is designed for **synchronous, real-time voice conversations** (phone calls, web calls), not **asynchronous text/voice note messaging** (WhatsApp).

**Implication:** ElevenAgents may not be suitable for WhatsApp use case without significant adaptation.

### Gap 2: WhatsApp Voice Calls vs. Voice Notes

**WhatsApp Capabilities:**
- ✅ Text messages
- ✅ Voice notes (asynchronous audio messages)
- ❌ Voice calls (peer-to-peer, not API-accessible)

**ElevenAgents Requirements:**
- Real-time bidirectional audio stream
- Sub-100ms latency
- Continuous conversation

**Conflict:** WhatsApp Business API does **not support** real-time voice calls. Only voice notes (pre-recorded audio files).

**Implication:** Cannot use ElevenAgents for WhatsApp conversations. Must continue with custom Manus implementation.

### Gap 3: Phone vs. WhatsApp Strategy

**Option A: ElevenAgents for Phone Calls**
- Use ElevenAgents for **inbound phone calls** (Twilio integration)
- "Intake Clerk" agent for 24/7 phone support
- Real-time conversation with sub-100ms latency

**Option B: Custom Manus for WhatsApp**
- Keep custom implementation for **WhatsApp messaging**
- Text + voice notes (asynchronous)
- OpenAI + ElevenLabs TTS

**Recommendation:** Use **both** - ElevenAgents for phone, custom Manus for WhatsApp.

---

## Recommended Architecture

### Dual-Channel AI Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Shamrock AI System                        │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐      ┌──────▼──────┐
        │  Phone Channel │      │   WhatsApp  │
        │  (Real-time)   │      │  (Async)    │
        └───────┬────────┘      └──────┬──────┘
                │                      │
        ┌───────▼────────┐      ┌──────▼──────────┐
        │ ElevenAgents   │      │ Custom Manus    │
        │ Platform       │      │ Implementation  │
        └───────┬────────┘      └──────┬──────────┘
                │                      │
        ┌───────▼────────┐      ┌──────▼──────────┐
        │ Twilio SIP     │      │ WhatsApp Cloud  │
        │ Trunk          │      │ API             │
        └───────┬────────┘      └──────┬──────────┘
                │                      │
        ┌───────▼────────┐      ┌──────▼──────────┐
        │ Inbound Phone  │      │ WhatsApp        │
        │ 239-332-2245   │      │ 239-955-0178    │
        └────────────────┘      └─────────────────┘
```

### Channel-Specific Use Cases

**Phone Channel (ElevenAgents):**
- 24/7 intake calls
- Emergency bail requests
- Complex conversations requiring back-and-forth
- High-value leads needing immediate response
- Voice cloning for owner/staff personas

**WhatsApp Channel (Custom Manus):**
- Document signing reminders
- Payment link delivery
- Status updates
- Simple Q&A
- Voice note explanations
- Async follow-ups

---

## Implementation Priorities

### Phase 1: WhatsApp OTP Login (✅ COMPLETE)
- Direct WhatsApp Cloud API integration
- OTP authentication
- No Twilio dependency for messaging

### Phase 2: Enhance Manus (WhatsApp) - CURRENT
**Goal:** Improve existing WhatsApp bot with better AI and voice

**Tasks:**
1. ✅ Update to use WhatsApp Cloud API (no Twilio)
2. ⏳ Upgrade to ElevenLabs V3 model for voice notes
3. ⏳ Add knowledge base (RAG) for bail bond FAQs
4. ⏳ Implement tool calling for:
   - Check case status
   - Generate payment links
   - Send signing reminders
5. ⏳ Add conversation logging and analytics

**Estimated Time:** 1-2 weeks

### Phase 3: Create ElevenAgents for Phone - NEXT
**Goal:** Deploy real-time voice agent for inbound calls

**Tasks:**
1. ⏳ Create "Intake Clerk" agent via API
2. ⏳ Configure system prompt and workflow
3. ⏳ Integrate with Twilio phone number
4. ⏳ Set up post-call webhooks to GAS
5. ⏳ Test and optimize conversation flow

**Estimated Time:** 2-3 weeks

### Phase 4: Voice Cloning - FUTURE
**Goal:** Create custom voices for owner and staff

**Tasks:**
1. ⏳ Collect 30-60 min of audio from Brendan
2. ⏳ Collect 30-60 min of audio from Kayla
3. ⏳ Train custom voices via ElevenLabs API
4. ⏳ Create specialized agents with cloned voices
5. ⏳ Deploy for high-value touchpoints

**Estimated Time:** 3-4 weeks

### Phase 5: Advanced Features - FUTURE
**Goal:** Add analytics, testing, and optimization

**Tasks:**
1. ⏳ Implement conversation analytics
2. ⏳ Create automated tests for agents
3. ⏳ Set up A/B testing for prompts
4. ⏳ Optimize LLM costs
5. ⏳ Build admin dashboard for monitoring

**Estimated Time:** 4-6 weeks

---

## Technical Requirements

### For Phase 2 (Manus Enhancement)

**API Keys Needed:**
- ✅ ElevenLabs API Key (already have)
- ✅ OpenAI API Key (already have)
- ✅ WhatsApp Cloud API credentials (just set up)

**Code Updates:**
- ✅ `WhatsApp_CloudAPI.js` - Direct API client (done)
- ⏳ `ElevenLabs_Client.js` - Upgrade to V3 model
- ⏳ `Manus_Brain.js` - Add knowledge base and tools
- ⏳ `OpenAI_Client.js` - Add function calling support

**Infrastructure:**
- ✅ GAS backend (already deployed)
- ✅ WhatsApp webhook (already configured)
- ⏳ Knowledge base storage (Google Drive or Wix CMS)
- ⏳ Conversation logging (Google Sheets or BigQuery)

### For Phase 3 (ElevenAgents Phone)

**API Keys Needed:**
- ⏳ ElevenLabs API Key (already have, need agent creation access)
- ⏳ Twilio Account SID and Auth Token (may already have)

**Code Updates:**
- ⏳ `ElevenAgents_Manager.js` - New file for agent CRUD
- ⏳ `ElevenAgents_WebhookHandler.js` - Update for agent webhooks
- ⏳ `Twilio_Integration.js` - SIP trunk configuration

**Infrastructure:**
- ⏳ Twilio phone number (239-332-2245)
- ⏳ Twilio SIP trunk
- ⏳ ElevenAgents account (may need upgrade)

---

## Cost Estimates

### Phase 2 (Manus Enhancement)

**ElevenLabs V3 TTS:**
- Voice notes: ~30 seconds average
- 100 conversations/day = 50 minutes/day
- $0.10/minute (est.) = $5/day = $150/month

**OpenAI GPT-4o:**
- ~500 tokens per conversation
- 100 conversations/day = 50k tokens/day
- $0.005/1k tokens = $0.25/day = $7.50/month

**WhatsApp Cloud API:**
- Free tier: 1,000 conversations/month
- $0.005-0.009 per conversation after
- Est. $10-20/month for 3,000 conversations

**Total Phase 2:** ~$170-180/month

### Phase 3 (ElevenAgents Phone)

**ElevenAgents Conversational AI:**
- $0.10/minute
- Average call: 5 minutes
- 50 calls/day = 250 minutes/day
- $25/day = $750/month

**Twilio Phone:**
- Inbound: $0.0085/minute
- 250 minutes/day = $2.13/day = $64/month

**Total Phase 3:** ~$814/month

**Combined (Both Phases):** ~$990/month

**ROI Calculation:**
- Current: $3-5M/year in single county
- Target: $20-50M/year in 67 counties
- AI cost: ~$12k/year
- If AI captures 1% more leads = $200k-500k additional revenue
- **ROI: 16-40x**

---

## Next Steps (Immediate)

1. **Review this research** with stakeholder
2. **Confirm priorities** - Phase 2 or Phase 3 first?
3. **Check ElevenLabs account** - Do we have agent creation access?
4. **Check Twilio account** - Do we have SIP trunk capability?
5. **Decide on knowledge base** - What content should Manus know?

---

**Research completed:** February 19, 2026  
**Next action:** Create implementation plan based on priorities
