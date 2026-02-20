/**
 * Manus_Brain.js
 * 
 * Core logic for "The Manus Project" - Telegram Facilitator.
 * Orchestrates:
 * 1. Telegram Bot API (Inbound/Outbound)
 * 2. OpenAI/Grok (Reasoning & Audio Transcription)
 * 3. ElevenLabs V3 (Voice Note Generation)
 * 4. Intake Flow (Conversational Data Collection)
 * 5. Document Generation (Automatic Paperwork)
 * 
 * Version: 3.0.0 - Telegram-Native (WhatsApp removed - ToS violation)
 * Date: 2026-02-19
 */

const MANUS_SYSTEM_PROMPT = `
You are "Manus", the digital facilitator for Shamrock Bail Bonds on Telegram. 
Your job is to guide clients through the bond signing process.
You are helpful, reassuring, and extremely clear.

Channel Context: Telegram. Keep text messages short/punchy.

Objectives:
1. Get the Signature: "Tap the link, sign at the bottom."
2. Answer Questions: Explain workflow simply.
3. Reassurance: "This is standard procedure."

Tone: Competent, Patient, Action-Oriented.
Do NOT give legal advice. Do NOT negotiate prices.

RESPONSE FORMAT:
You must respond in valid JSON format:
{
  "text": "The text message to send. Include links here.",
  "voice_script": "Optional. Text to be spoken in a voice note IF the topic is complex, confusing, or needs reassurance. Leave empty if text is sufficient."
}
`;

/**
 * Handle incoming Telegram message (Text or Audio)
 * @param {Object} data - Telegram inbound data from webhook
 */
function handleManusMessage(data) {
    const { from, name, body, type, mediaId, mimeType, platform, chatId } = data;
    const messagePlatform = platform || 'telegram';

    let userMessage = body || '';
    let inputType = type || 'text';

    try {
        // Initialize platform-specific API client
        let apiClient;
        if (messagePlatform === 'telegram') {
            apiClient = new TelegramBotAPI();
        } else {
            throw new Error('Unsupported platform');
        }

        // 1. Transcribe Audio if present
        if (inputType === 'audio' && mediaId) {
            // Download audio (platform-specific)
            let audioBlob;
            if (messagePlatform === 'telegram') {
                audioBlob = apiClient.downloadFile(mediaId);
            } else {
                throw new Error('Unsupported platform');
            }
            
            const transcript = transcribeAudio(audioBlob); // Uses OpenAIClient.js
            if (transcript) {
                userMessage = transcript;
                logProcessingEvent("MANUS_AUDIO_TRANSCRIBED", { from: from, text: userMessage, platform: messagePlatform });
            } else {
                const errorMsg = "Sorry, I couldn't hear that clearly. Could you type it?";
                if (messagePlatform === 'telegram') {
                    apiClient.sendMessage(chatId, errorMsg);
                } else {
                    throw new Error('Unsupported platform');
                }
                return ContentService.createTextOutput("Audio transcription failed");
            }
        }

        // 2. Check if user is in intake flow
        const intakeResult = checkAndProcessIntake(from, userMessage, name);
        if (intakeResult.handled) {
            // Intake flow handled the message - send response
            if (intakeResult.text) {
                if (messagePlatform === 'telegram') {
                    apiClient.sendMessage(chatId, intakeResult.text);
                } else {
                    throw new Error('Unsupported platform');
                }
            }
            if (intakeResult.voice_script) {
                generateAndSendVoiceNote(from, intakeResult.voice_script, messagePlatform, chatId);
            }
            return ContentService.createTextOutput("Intake flow processed");
        }

        // Incorporate Knowledge Base (RAG) context
        let ragContext = "";
        try {
            const kb = RAG_getKnowledge();
            ragContext = "\n\nShamrock Bail Bonds Knowledge Base Data:\n" + JSON.stringify(kb, null, 2);
        } catch (e) {
            console.warn("RAG fetch failed", e);
        }

        const fullPrompt = MANUS_SYSTEM_PROMPT + ragContext;

        // 3. Query OpenAI for Response
        const responseJson = callOpenAI(
            fullPrompt,
            `User (${name}) said: "${userMessage}"`,
            { jsonMode: true, temperature: 0.7 }
        );

        if (!responseJson) {
            throw new Error("OpenAI returned null response");
        }

        const replyText = responseJson.text;
        const voiceScript = responseJson.voice_script;

        // 4. Send Text Response (platform-specific)
        if (replyText) {
            if (messagePlatform === 'telegram') {
                apiClient.sendMessage(chatId, replyText);
            } else {
                throw new Error('Unsupported platform');
            }
        }

        // 5. Send Voice Note (if applicable)
        if (voiceScript && voiceScript.length > 10) {
            generateAndSendVoiceNote(from, voiceScript, messagePlatform, chatId);
        }

        return ContentService.createTextOutput("Manus processed message");

    } catch (e) {
        console.error("Manus Brain Error:", e);
        // Send error message (platform-specific)
        const errorMsg = "I'm having a little trouble thinking right now. A human agent will be with you shortly.";
        try {
            if (messagePlatform === 'telegram') {
                const telegram = new TelegramBotAPI();
                telegram.sendMessage(chatId, errorMsg);
            } else {
                throw new Error('Unsupported platform');
            }
        } catch (sendError) {
            console.error("Failed to send error message:", sendError);
        }
        return ContentService.createTextOutput("Error: " + e.message);
    }
}

/**
 * Generate Voice Note via ElevenLabs and Send via Telegram
 * @param {string} to - Phone number or user ID
 * @param {string} script - Text to speak
 * @param {string} platform - 'telegram'
 * @param {string} chatId - Telegram chat ID (optional, only for Telegram)
 */
function generateAndSendVoiceNote(to, script, platform = 'telegram', chatId = null) {
    try {
        // A. Generate Audio
        const manusVoiceId = PropertiesService.getScriptProperties().getProperty('MANUS_VOICE_ID');
        const audioBlob = EL_generateAudio(script, manusVoiceId); // Uses ElevenLabs_Client.js

        // B. Upload to Drive (Public) for WhatsApp Cloud API
        const folderId = PropertiesService.getScriptProperties().getProperty('GOOGLE_DRIVE_OUTPUT_FOLDER_ID');
        const folder = DriveApp.getFolderById(folderId);

        const file = folder.createFile(audioBlob);
        file.setName(`Manus_Voice_${new Date().getTime()}.mp3`);

        // Ensure public visibility for WhatsApp to fetch it via URL
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const directUrl = `https://drive.google.com/uc?export=download&id=${file.getId()}`;

        // C. Send via platform-specific API
        if (platform === 'telegram') {
            const telegram = new TelegramBotAPI();
            telegram.sendVoice(chatId || to, directUrl);
        } else {
            throw new Error('Unsupported platform');
        }

    } catch (e) {
        console.error("Manus Voice Generation Failed:", e);
        // Fallback: The text message was already sent, so we just fail silently on the voice part
    }
}


// =============================================================================
// INTAKE FLOW INTEGRATION
// =============================================================================

/**
 * Check if user is in intake flow and process accordingly
 * @param {string} from - User's phone number
 * @param {string} message - User's message
 * @param {string} name - User's name from Telegram profile
 * @returns {object} - { handled: boolean, text: string, voice_script: string }
 */
function checkAndProcessIntake(from, message, name) {
    // Check if processIntakeConversation function exists (from Telegram_IntakeFlow.js)
    if (typeof processIntakeConversation !== 'function') {
        console.warn('processIntakeConversation function not found - intake flow disabled');
        return { handled: false };
    }
    
    // Get conversation state
    const state = getConversationState(from);
    
    // Determine if this message should be handled by intake flow
    const lowerMsg = message.toLowerCase();
    const intakeKeywords = ['bail', 'arrested', 'jail', 'bond', 'help', 'release'];
    const isIntakeRequest = intakeKeywords.some(kw => lowerMsg.includes(kw));
    
    // If user is in an active intake flow, OR if they're requesting intake
    if (state.step !== 'complete' && state.step !== 'greeting') {
        // User is mid-intake, process their message
        const result = processIntakeConversation(from, message, name);
        return {
            handled: true,
            text: result.text,
            voice_script: result.voice_script
        };
    } else if (isIntakeRequest && state.step === 'greeting') {
        // User is starting a new intake
        const result = processIntakeConversation(from, message, name);
        return {
            handled: true,
            text: result.text,
            voice_script: result.voice_script
        };
    }
    
    // Not an intake flow message - let general AI handle it
    return { handled: false };
}
