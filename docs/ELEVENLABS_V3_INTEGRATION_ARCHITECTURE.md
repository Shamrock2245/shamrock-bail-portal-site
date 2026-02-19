# ElevenLabs V3 Integration Architecture
## Shamrock Bail Bonds - Dual-Channel AI System

**Date:** February 19, 2026  
**Status:** Design Phase  
**Goal:** Deploy AI agents for phone and WhatsApp channels

---

## Executive Summary

This document outlines the architecture for integrating ElevenLabs V3 and Conversational AI into the Shamrock Bail Bonds automation system. The design implements a **dual-channel strategy** that leverages the strengths of both synchronous (phone) and asynchronous (WhatsApp) communication.

**Key Decision:** Use **ElevenAgents** for real-time phone calls and **custom Manus implementation** for WhatsApp messaging, as WhatsApp Business API does not support real-time voice calls required by ElevenAgents.

---

## System Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                  Shamrock AI Automation System                    │
│                                                                    │
│  ┌────────────────────────┐    ┌────────────────────────┐       │
│  │   Phone Channel        │    │   WhatsApp Channel     │       │
│  │   (Real-time Voice)    │    │   (Async Text+Voice)   │       │
│  └───────────┬────────────┘    └───────────┬────────────┘       │
│              │                              │                     │
│  ┌───────────▼────────────┐    ┌───────────▼────────────┐       │
│  │  ElevenAgents Platform │    │  Custom Manus Agent    │       │
│  │  - ASR + LLM + TTS     │    │  - OpenAI GPT-4o       │       │
│  │  - Turn-taking         │    │  - ElevenLabs V3 TTS   │       │
│  │  - Sub-100ms latency   │    │  - Whisper STT         │       │
│  │  - Workflows           │    │  - Tool calling        │       │
│  └───────────┬────────────┘    └───────────┬────────────┘       │
│              │                              │                     │
│  ┌───────────▼────────────┐    ┌───────────▼────────────┐       │
│  │  Twilio SIP Trunk      │    │  WhatsApp Cloud API    │       │
│  │  239-332-2245          │    │  239-955-0178          │       │
│  └───────────┬────────────┘    └───────────┬────────────┘       │
│              │                              │                     │
│              └──────────┬───────────────────┘                     │
│                         │                                         │
│              ┌──────────▼──────────┐                             │
│              │  Google Apps Script │                             │
│              │  (Orchestrator)     │                             │
│              └──────────┬──────────┘                             │
│                         │                                         │
│         ┌───────────────┼───────────────┐                        │
│         │               │               │                        │
│  ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐                │
│  │  Wix CMS    │ │  SignNow    │ │  Drive     │                │
│  │  (Data)     │ │  (Docs)     │ │  (Storage) │                │
│  └─────────────┘ └─────────────┘ └────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Channel 1: Phone (ElevenAgents)

### Purpose
Handle **real-time voice conversations** for:
- 24/7 intake calls
- Emergency bail requests
- Complex conversations requiring immediate back-and-forth
- High-value leads needing instant response

### Technology Stack

**ElevenAgents Platform:**
- **ASR:** ElevenLabs fine-tuned Speech-to-Text
- **LLM:** OpenAI GPT-4o (or custom)
- **TTS:** ElevenLabs V3 (70+ languages, 5k+ voices)
- **Turn-taking:** Proprietary conversation timing model
- **Latency:** Sub-100ms

**Telephony:**
- **Provider:** Twilio
- **Integration:** SIP Trunk
- **Phone Number:** 239-332-2245 (existing)

**Backend:**
- **Orchestrator:** Google Apps Script
- **Webhook Handler:** `ElevenAgents_WebhookHandler.js`
- **Data Storage:** Wix CMS + Google Drive

### Agent Configuration

**Agent Name:** "Shamrock Intake Clerk"  
**Persona:** "Sarah" - Professional, empathetic, efficient  
**Voice:** Female, American accent, warm tone

**System Prompt:**
```
You are Sarah, an intake specialist at Shamrock Bail Bonds in Fort Myers, Florida. 
Your job is to help people who have a loved one in jail.

Your goals:
1. Gather the "Big 5" information: Defendant name, jail/county, charges, indemnitor name, phone
2. Provide reassurance and empathy - this is a stressful time
3. Explain the next steps clearly
4. Transfer to human agent if needed

Important facts:
- Shamrock Bail Bonds serves Lee, Collier, Charlotte, and Hendry counties
- Office hours: 8am-6pm Mon-Fri, emergency service 24/7
- Owner: Brendan (available for complex cases)
- Payment plans available

Conversation flow:
1. Greet caller warmly
2. Ask "How can I help you today?"
3. If new arrest: Collect Big 5 information
4. If check-in: Look up case and provide status
5. If payment: Transfer to payment line
6. Always end with "Is there anything else I can help you with?"

Tone: Professional, empathetic, patient, clear
```

**Workflow:**
```
[Start] → [Greeting] → [Intent Detection]
                            ↓
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
        [New Arrest]   [Check-in]      [Payment]
            ↓               ↓               ↓
        [Collect Big 5] [Lookup Case]  [Transfer]
            ↓               ↓               ↓
        [Create Lead]   [Provide Status] [End]
            ↓               ↓
        [Confirm Info]  [End]
            ↓
        [End]
```

**Tools (API Calls):**
1. **createLead(data)** - Create new lead in Wix CMS
2. **lookupCase(defendantName)** - Search existing cases
3. **sendSMS(phone, message)** - Send follow-up SMS
4. **notifyStaff(leadData)** - Alert staff via Slack

**Knowledge Base:**
- Bail bond process FAQs
- County-specific procedures
- Common charges and bail amounts
- Payment plan options
- Court locations and schedules

### Integration Flow

```
1. Caller dials 239-332-2245
2. Twilio receives call
3. Twilio forwards to ElevenAgents SIP trunk
4. ElevenAgents initiates conversation
5. Agent collects information via dialogue
6. Agent calls tools (createLead, sendSMS, etc.)
7. Tools trigger GAS functions
8. GAS updates Wix CMS and sends notifications
9. Call ends
10. ElevenAgents sends post-call webhook to GAS
11. GAS processes transcript and analysis
12. GAS saves to Drive and notifies Slack
```

### Implementation Steps

**Step 1: Create Agent via API**
```javascript
// ElevenAgents_Manager.js
function createIntakeAgent() {
    const apiKey = PropertiesService.getScriptProperties().getProperty('ELEVENLABS_API_KEY');
    
    const config = {
        name: "Shamrock Intake Clerk",
        conversation_config: {
            agent: {
                prompt: {
                    prompt: INTAKE_CLERK_SYSTEM_PROMPT
                },
                first_message: "Hi, this is Sarah with Shamrock Bail Bonds. How can I help you today?",
                language: "en"
            },
            tts: {
                model_id: "eleven_v3",
                voice_id: "21m00Tcm4TlvDq8ikWAM" // Rachel voice
            },
            asr: {
                quality: "high"
            }
        },
        platform_settings: {
            tools: [
                {
                    name: "createLead",
                    description: "Create a new lead in the CRM",
                    parameters: {
                        type: "object",
                        properties: {
                            defendantName: { type: "string" },
                            jail: { type: "string" },
                            charges: { type: "string" },
                            indemnitorName: { type: "string" },
                            indemnitorPhone: { type: "string" }
                        },
                        required: ["defendantName", "indemnitorPhone"]
                    },
                    url: GAS_WEB_APP_URL + "?action=createLead"
                }
            ]
        }
    };
    
    const options = {
        method: 'post',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        payload: JSON.stringify(config),
        muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch('https://api.elevenlabs.io/v1/convai/agents/create', options);
    const result = JSON.parse(response.getContentText());
    
    // Save agent ID
    PropertiesService.getScriptProperties().setProperty('ELEVENLABS_AGENT_ID', result.agent_id);
    
    return result;
}
```

**Step 2: Configure Twilio SIP Trunk**
- Create SIP trunk in Twilio console
- Point to ElevenAgents SIP endpoint
- Configure phone number to use SIP trunk

**Step 3: Set Up Webhooks**
```javascript
// ElevenAgents_WebhookHandler.js (update existing)
function handleElevenLabsWebhookSOC2(e) {
    const payload = JSON.parse(e.postData.contents);
    
    if (payload.type === 'post_call_transcription') {
        return handlePostCallTranscription(payload);
    }
    
    if (payload.type === 'tool_call') {
        return handleToolCall(payload);
    }
    
    return ContentService.createTextOutput("OK");
}

function handleToolCall(payload) {
    const toolName = payload.tool_name;
    const parameters = payload.parameters;
    
    if (toolName === 'createLead') {
        const leadId = createLeadInWix(parameters);
        notifyStaffOfNewLead(leadId);
        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            leadId: leadId
        }));
    }
    
    return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Unknown tool"
    }));
}
```

**Step 4: Test and Deploy**
- Test agent via ElevenLabs dashboard
- Test tool calling
- Test end-to-end flow
- Monitor first 50 calls closely
- Optimize prompt based on analytics

---

## Channel 2: WhatsApp (Custom Manus)

### Purpose
Handle **asynchronous text and voice note conversations** for:
- Document signing reminders
- Payment link delivery
- Status updates
- Simple Q&A
- Voice note explanations
- Follow-ups

### Technology Stack

**Custom Implementation:**
- **LLM:** OpenAI GPT-4o (with function calling)
- **TTS:** ElevenLabs V3 (for voice notes)
- **STT:** OpenAI Whisper API (for voice note transcription)
- **Orchestration:** Google Apps Script

**Messaging:**
- **Provider:** WhatsApp Cloud API (direct, no Twilio)
- **Phone Number:** 239-955-0178
- **Features:** Text, voice notes, images, buttons

**Backend:**
- **Orchestrator:** Google Apps Script
- **Webhook Handler:** `SOC2_WebhookHandler.js`
- **Brain:** `Manus_Brain.js`
- **Data Storage:** Wix CMS + Google Drive

### Agent Configuration

**Agent Name:** "Manus"  
**Persona:** Helpful assistant, friendly, clear  
**Voice:** Male, American accent, professional but approachable

**System Prompt:**
```
You are Manus, a helpful assistant for Shamrock Bail Bonds. You help people:
- Sign their bail bond paperwork
- Make payments
- Check case status
- Answer questions about the bail process

You communicate via WhatsApp using text and voice notes.

Available tools:
- checkCaseStatus(defendantName) - Look up case information
- generatePaymentLink(caseId, amount) - Create payment link
- sendSigningReminder(caseId) - Send document signing link
- getCourtInfo(county, courtDate) - Get court location and time

Guidelines:
1. Be concise - this is WhatsApp, not email
2. Use voice notes for complex explanations
3. Always include links when relevant
4. Confirm actions before executing
5. Escalate to human if needed

Tone: Friendly, professional, helpful, patient
```

**Conversation Examples:**

**Example 1: Signing Reminder**
```
User: "I need to sign the paperwork"
Manus (text): "I can help with that! What's the defendant's name?"
User: "John Smith"
Manus (text): "Found it! I'm sending you the signing link now. Just tap it, scroll to the bottom, and sign with your finger. Let me know if you need help!"
[Sends voice note explaining the process]
[Sends SignNow link]
```

**Example 2: Payment**
```
User: "How do I pay?"
Manus (text): "I can generate a payment link for you. What's the case number or defendant name?"
User: "Case #12345"
Manus (text): "Got it! How much would you like to pay today?"
User: "$500"
Manus (text): "Perfect! Here's your secure payment link: [link]. It's valid for 24 hours."
```

**Example 3: Status Check**
```
User: "Is he out yet?"
Manus (text): "Let me check. What's the defendant's name?"
User: "Mike Johnson"
Manus (text): "Mike Johnson was released at 2:30pm today. His court date is March 15th at 9am at Lee County Justice Center."
[Sends voice note with court directions]
```

### Upgrade to ElevenLabs V3

**Current Implementation:**
- Uses `eleven_turbo_v2_5` model
- Basic voice note generation
- No emotion control

**V3 Upgrade:**
- Use `eleven_v3` model
- Add emotion tags for empathy
- Use dialogue mode for natural flow
- Improve voice quality

**Code Changes:**

```javascript
// ElevenLabs_Client.js (update)
class ElevenLabsClient {
    constructor() {
        this.BASE_URL = 'https://api.elevenlabs.io/v1';
        this.API_KEY = PropertiesService.getScriptProperties().getProperty('ELEVENLABS_API_KEY');
        this.DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
        this.MANUS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam
    }
    
    /**
     * Generate voice note with emotion (V3)
     * @param {string} text - Text to convert
     * @param {string} emotion - Emotion tag (e.g., "friendly", "empathetic", "professional")
     * @param {string} voiceId - Optional voice ID
     * @return {Blob} MP3 audio blob
     */
    textToSpeechV3(text, emotion, voiceId) {
        if (!this.hasKey()) throw new Error("ElevenLabs API Key not configured.");
        
        const voice = voiceId || this.MANUS_VOICE_ID;
        const url = `${this.BASE_URL}/text-to-speech/${voice}`;
        
        // Add emotion tags to text
        let enhancedText = text;
        if (emotion) {
            enhancedText = `<emotion>${emotion}</emotion> ${text}`;
        }
        
        const payload = {
            text: enhancedText,
            model_id: "eleven_v3", // V3 model
            voice_settings: {
                stability: 0.6,
                similarity_boost: 0.8,
                style: 0.5 // V3 feature: style control
            }
        };
        
        const options = {
            method: 'post',
            headers: {
                'xi-api-key': this.API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };
        
        try {
            const response = UrlFetchApp.fetch(url, options);
            
            if (response.getResponseCode() !== 200) {
                console.error('ElevenLabs V3 TTS Error:', response.getContentText());
                throw new Error(`ElevenLabs/TTS Failed: ${response.getResponseCode()}`);
            }
            
            return response.getBlob().setName(`manus_voice_${new Date().getTime()}.mp3`);
            
        } catch (e) {
            console.error('ElevenLabs V3 TTS Exception:', e);
            throw e;
        }
    }
}
```

### Add Knowledge Base (RAG)

**Purpose:** Give Manus access to bail bond FAQs and procedures

**Implementation:**

**Step 1: Prepare Knowledge Base**
```javascript
// Knowledge_Base.js (new file)
const KNOWLEDGE_BASE = {
    "bail_process": {
        title: "How the Bail Process Works",
        content: `
        1. Arrest: Person is taken to jail
        2. Booking: Fingerprints, photos, charges recorded
        3. Bail Set: Judge sets bail amount
        4. Bond Posted: Bail bondsman posts bond
        5. Release: Defendant released from jail
        6. Court: Defendant must appear at all court dates
        7. Resolution: Case resolved, bond exonerated
        `
    },
    "payment_plans": {
        title: "Payment Plans",
        content: `
        Shamrock offers flexible payment plans:
        - 10% down payment required
        - Remaining balance in monthly installments
        - No credit check required
        - Collateral may be required for large bonds
        `
    },
    "counties_served": {
        title: "Counties We Serve",
        content: `
        Shamrock Bail Bonds serves:
        - Lee County (primary)
        - Collier County
        - Charlotte County
        - Hendry County
        `
    },
    "required_documents": {
        title: "Required Documents",
        content: `
        To post bail, we need:
        - Government-issued ID (indemnitor)
        - Proof of income (pay stubs, tax returns)
        - Proof of residence (utility bill, lease)
        - Collateral documents (if applicable)
        `
    }
};

function searchKnowledgeBase(query) {
    // Simple keyword matching (can be enhanced with embeddings)
    const keywords = query.toLowerCase().split(' ');
    const results = [];
    
    for (const [key, doc] of Object.entries(KNOWLEDGE_BASE)) {
        const content = (doc.title + ' ' + doc.content).toLowerCase();
        let score = 0;
        
        keywords.forEach(keyword => {
            if (content.includes(keyword)) score++;
        });
        
        if (score > 0) {
            results.push({ ...doc, score });
        }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, 3); // Top 3 results
}
```

**Step 2: Integrate with Manus**
```javascript
// Manus_Brain.js (update)
function processWhatsAppMessage(message, from) {
    const userMessage = message.text || message.transcription;
    
    // Search knowledge base
    const relevantDocs = searchKnowledgeBase(userMessage);
    const context = relevantDocs.map(doc => doc.content).join('\n\n');
    
    // Build OpenAI prompt with context
    const systemPrompt = `
    You are Manus, a helpful assistant for Shamrock Bail Bonds.
    
    Use this information to answer questions:
    ${context}
    
    If the information isn't in the context, say you'll connect them with a staff member.
    `;
    
    const response = callOpenAI(systemPrompt, userMessage);
    
    // Determine if voice note is needed
    const needsVoiceNote = shouldSendVoiceNote(userMessage, response);
    
    if (needsVoiceNote) {
        // Generate voice note with appropriate emotion
        const emotion = determineEmotion(userMessage);
        const audioBlob = new ElevenLabsClient().textToSpeechV3(response, emotion);
        sendWhatsAppAudio(from, audioBlob, response);
    } else {
        // Send text response
        sendWhatsAppText(from, response);
    }
}

function shouldSendVoiceNote(userMessage, response) {
    // Send voice note if:
    // 1. Response is long (>200 chars)
    // 2. Contains complex instructions
    // 3. User seems confused
    
    if (response.length > 200) return true;
    
    const complexKeywords = ['sign', 'court', 'payment', 'process', 'how to'];
    if (complexKeywords.some(kw => response.toLowerCase().includes(kw))) return true;
    
    const confusionKeywords = ['help', 'don\'t understand', 'confused', 'what'];
    if (confusionKeywords.some(kw => userMessage.toLowerCase().includes(kw))) return true;
    
    return false;
}

function determineEmotion(userMessage) {
    // Analyze user message to determine appropriate emotion
    const stressKeywords = ['emergency', 'urgent', 'help', 'worried', 'scared'];
    if (stressKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
        return 'empathetic';
    }
    
    const happyKeywords = ['thank', 'great', 'perfect', 'awesome'];
    if (happyKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
        return 'friendly';
    }
    
    return 'professional'; // Default
}
```

### Add Tool Calling

**Purpose:** Allow Manus to perform actions (check status, generate links, etc.)

**Implementation:**

```javascript
// OpenAI_Client.js (update)
function callOpenAIWithTools(systemPrompt, userMessage, conversationHistory) {
    const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
    
    const tools = [
        {
            type: "function",
            function: {
                name: "checkCaseStatus",
                description: "Look up the status of a bail bond case",
                parameters: {
                    type: "object",
                    properties: {
                        defendantName: {
                            type: "string",
                            description: "Full name of the defendant"
                        }
                    },
                    required: ["defendantName"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "generatePaymentLink",
                description: "Generate a secure payment link for a case",
                parameters: {
                    type: "object",
                    properties: {
                        caseId: {
                            type: "string",
                            description: "The case ID"
                        },
                        amount: {
                            type: "number",
                            description: "Payment amount in dollars"
                        }
                    },
                    required: ["caseId", "amount"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "sendSigningReminder",
                description: "Send a document signing link to the indemnitor",
                parameters: {
                    type: "object",
                    properties: {
                        caseId: {
                            type: "string",
                            description: "The case ID"
                        }
                    },
                    required: ["caseId"]
                }
            }
        }
    ];
    
    const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage }
    ];
    
    const payload = {
        model: "gpt-4o",
        messages: messages,
        tools: tools,
        tool_choice: "auto"
    };
    
    const options = {
        method: 'post',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
    const result = JSON.parse(response.getContentText());
    
    const message = result.choices[0].message;
    
    // Check if tool was called
    if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        // Execute tool
        const toolResult = executeManusToolCall(toolName, toolArgs);
        
        // Send tool result back to OpenAI for final response
        messages.push(message);
        messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
        });
        
        const finalPayload = {
            model: "gpt-4o",
            messages: messages
        };
        
        const finalOptions = {
            method: 'post',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify(finalPayload),
            muteHttpExceptions: true
        };
        
        const finalResponse = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', finalOptions);
        const finalResult = JSON.parse(finalResponse.getContentText());
        
        return finalResult.choices[0].message.content;
    }
    
    return message.content;
}

function executeManusToolCall(toolName, args) {
    switch(toolName) {
        case 'checkCaseStatus':
            return checkCaseStatusInWix(args.defendantName);
        
        case 'generatePaymentLink':
            return generatePaymentLinkStripe(args.caseId, args.amount);
        
        case 'sendSigningReminder':
            return sendSigningReminderSignNow(args.caseId);
        
        default:
            return { error: "Unknown tool" };
    }
}
```

---

## Implementation Roadmap

### Phase 2A: Manus Enhancement (WhatsApp) - PRIORITY
**Goal:** Upgrade existing WhatsApp bot with V3 and advanced features  
**Timeline:** 1-2 weeks  
**Effort:** Medium

**Tasks:**
1. ✅ Update WhatsApp to use Cloud API (DONE)
2. ⏳ Upgrade ElevenLabs_Client.js to V3
   - Add `textToSpeechV3()` method
   - Add emotion control
   - Test voice quality
3. ⏳ Create Knowledge_Base.js
   - Define FAQs and procedures
   - Implement search function
   - Test retrieval accuracy
4. ⏳ Add tool calling to Manus_Brain.js
   - Update OpenAI_Client.js for function calling
   - Implement tool execution functions
   - Test end-to-end tool flow
5. ⏳ Add conversation logging
   - Store conversations in Google Sheets
   - Track tool usage
   - Monitor performance
6. ⏳ Test and optimize
   - Test with real scenarios
   - Gather feedback
   - Refine prompts

**Deliverables:**
- Updated ElevenLabs_Client.js with V3 support
- Knowledge_Base.js with bail bond FAQs
- Enhanced Manus_Brain.js with tool calling
- Conversation logging system
- Test results and optimization report

**Success Metrics:**
- Voice note quality improved (subjective)
- Response accuracy >90% (with knowledge base)
- Tool calling success rate >95%
- Average response time <5 seconds

### Phase 2B: Manus UI Dashboard (Optional)
**Goal:** Create admin dashboard for monitoring Manus conversations  
**Timeline:** 1 week  
**Effort:** Low

**Tasks:**
1. Create Dashboard.html page in GAS
2. Display recent conversations
3. Show tool usage statistics
4. Allow manual intervention
5. Export conversation logs

**Deliverables:**
- Manus_Dashboard.html
- Real-time conversation monitoring
- Analytics and insights

### Phase 3: ElevenAgents Phone Integration
**Goal:** Deploy real-time voice agent for inbound calls  
**Timeline:** 2-3 weeks  
**Effort:** High

**Tasks:**
1. ⏳ Create ElevenAgents_Manager.js
   - Implement agent creation API
   - Implement agent configuration
   - Implement agent versioning
2. ⏳ Create "Intake Clerk" agent
   - Write system prompt
   - Configure workflow
   - Set up tools
   - Add knowledge base
3. ⏳ Configure Twilio SIP trunk
   - Create SIP trunk
   - Point to ElevenAgents
   - Test call routing
4. ⏳ Update ElevenAgents_WebhookHandler.js
   - Handle post-call webhooks
   - Handle tool calls
   - Process transcripts
5. ⏳ Test and optimize
   - Test call quality
   - Test tool calling
   - Optimize prompt
   - Monitor first 50 calls

**Deliverables:**
- ElevenAgents_Manager.js
- "Intake Clerk" agent (live)
- Twilio SIP trunk configuration
- Updated webhook handler
- Test results and call analytics

**Success Metrics:**
- Call completion rate >80%
- Information capture rate >90%
- Caller satisfaction >4/5 (survey)
- Average call duration 3-5 minutes

### Phase 4: Voice Cloning (Future)
**Goal:** Create custom voices for owner and staff  
**Timeline:** 3-4 weeks  
**Effort:** High

**Tasks:**
1. ⏳ Collect audio samples
   - Brendan: 30-60 minutes
   - Kayla: 30-60 minutes
2. ⏳ Train custom voices via API
3. ⏳ Create specialized agents
   - "Brendan" for high-value leads
   - "Kayla" for detailed explanations
4. ⏳ Deploy and test
5. ⏳ Monitor usage and feedback

**Deliverables:**
- Custom voice models
- Specialized agents
- Usage guidelines
- Performance metrics

### Phase 5: Advanced Features (Future)
**Goal:** Add analytics, testing, and optimization  
**Timeline:** 4-6 weeks  
**Effort:** High

**Tasks:**
1. ⏳ Implement conversation analytics
2. ⏳ Create automated tests
3. ⏳ Set up A/B testing
4. ⏳ Optimize LLM costs
5. ⏳ Build admin dashboard

**Deliverables:**
- Analytics dashboard
- Automated test suite
- A/B testing framework
- Cost optimization report
- Admin control panel

---

## Technical Requirements

### API Keys and Credentials

**Required Now:**
- ✅ ElevenLabs API Key (have)
- ✅ OpenAI API Key (have)
- ✅ WhatsApp Cloud API credentials (have)

**Required for Phase 3:**
- ⏳ Twilio Account SID
- ⏳ Twilio Auth Token
- ⏳ ElevenAgents account (may need upgrade)

### Infrastructure

**Current:**
- ✅ GAS backend (deployed)
- ✅ WhatsApp webhook (configured)
- ✅ Wix CMS (active)
- ✅ Google Drive (storage)

**Needed for Phase 3:**
- ⏳ Twilio phone number (239-332-2245)
- ⏳ Twilio SIP trunk
- ⏳ ElevenAgents SIP endpoint

### Code Files

**To Create:**
- Knowledge_Base.js (Phase 2A)
- ElevenAgents_Manager.js (Phase 3)
- Manus_Dashboard.html (Phase 2B, optional)

**To Update:**
- ElevenLabs_Client.js (Phase 2A)
- Manus_Brain.js (Phase 2A)
- OpenAI_Client.js (Phase 2A)
- ElevenAgents_WebhookHandler.js (Phase 3)

---

## Cost Analysis

### Phase 2A (Manus Enhancement)

**ElevenLabs V3 TTS:**
- Voice notes: ~30 seconds average
- 100 conversations/day = 50 minutes/day
- Estimated $0.10/minute = $5/day = **$150/month**

**OpenAI GPT-4o:**
- ~500 tokens per conversation
- 100 conversations/day = 50k tokens/day
- $0.005/1k tokens = $0.25/day = **$7.50/month**

**WhatsApp Cloud API:**
- Free tier: 1,000 conversations/month
- $0.005-0.009 per conversation after
- Estimated **$10-20/month** for 3,000 conversations

**Total Phase 2A:** **~$170-180/month**

### Phase 3 (ElevenAgents Phone)

**ElevenAgents Conversational AI:**
- $0.10/minute
- Average call: 5 minutes
- 50 calls/day = 250 minutes/day
- $25/day = **$750/month**

**Twilio Phone:**
- Inbound: $0.0085/minute
- 250 minutes/day = $2.13/day = **$64/month**

**Total Phase 3:** **~$814/month**

### Combined Total

**Both Phases Running:** **~$990/month** (~$12k/year)

### ROI Calculation

**Current Operation:**
- $3-5M/year in single county

**Target Operation:**
- $20-50M/year in 67 counties

**AI Investment:**
- ~$12k/year

**Conservative ROI:**
- If AI captures 1% more leads = $200k-500k additional revenue
- **ROI: 16-40x**

**Optimistic ROI:**
- If AI enables 24/7 coverage and captures 5% more leads = $1M-2.5M additional revenue
- **ROI: 83-208x**

---

## Risk Mitigation

### Risk 1: Voice Quality Not Meeting Expectations

**Mitigation:**
- Test V3 model extensively before deployment
- Use emotion tags appropriately
- Collect user feedback early
- Have fallback to text-only if needed

### Risk 2: Tool Calling Errors

**Mitigation:**
- Implement robust error handling
- Log all tool calls for debugging
- Add confirmation step before critical actions
- Have human escalation path

### Risk 3: High Costs

**Mitigation:**
- Start with low volume and scale gradually
- Monitor costs daily
- Set up billing alerts
- Optimize prompts to reduce token usage
- Use caching where possible

### Risk 4: User Confusion with AI

**Mitigation:**
- Clearly identify as AI assistant
- Provide easy escalation to human
- Use natural, conversational language
- Gather feedback and iterate

### Risk 5: Integration Failures

**Mitigation:**
- Comprehensive testing before launch
- Staged rollout (10% → 50% → 100%)
- Monitoring and alerting
- Rollback plan ready

---

## Success Metrics

### Phase 2A (Manus Enhancement)

**Quantitative:**
- Response time: <5 seconds average
- Tool calling success rate: >95%
- Knowledge base accuracy: >90%
- Voice note generation: <3 seconds

**Qualitative:**
- User satisfaction: >4/5
- Voice quality: "Natural and clear"
- Response relevance: "Helpful and accurate"

### Phase 3 (ElevenAgents Phone)

**Quantitative:**
- Call completion rate: >80%
- Information capture rate: >90%
- Average call duration: 3-5 minutes
- Tool calling success: >95%

**Qualitative:**
- Caller satisfaction: >4/5
- Voice quality: "Natural and professional"
- Conversation flow: "Smooth and efficient"

### Business Impact

**Lead Generation:**
- Increase in qualified leads: +20%
- After-hours leads captured: +50%
- Lead response time: <1 minute

**Operational Efficiency:**
- Staff time saved: 10-15 hours/week
- Call handling capacity: +100%
- Documentation accuracy: +30%

---

## Next Steps (Immediate)

1. **Review and Approve Architecture**
   - Stakeholder review
   - Confirm priorities
   - Approve budget

2. **Check Account Access**
   - ElevenLabs: Verify agent creation access
   - Twilio: Verify SIP trunk capability
   - OpenAI: Verify function calling access

3. **Prepare Knowledge Base Content**
   - Compile FAQs
   - Document procedures
   - Review with staff

4. **Begin Phase 2A Implementation**
   - Update ElevenLabs_Client.js
   - Create Knowledge_Base.js
   - Test V3 voice quality

5. **Schedule Phase 3 Planning**
   - Define agent personas
   - Write system prompts
   - Plan testing strategy

---

**Architecture Designed:** February 19, 2026  
**Next Action:** Stakeholder review and approval  
**Estimated Start:** February 20, 2026
