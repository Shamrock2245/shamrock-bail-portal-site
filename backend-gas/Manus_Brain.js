/**
 * Manus_Brain.js
 * 
 * Core logic for "The Manus Project" - Telegram Facilitator.
 * Orchestrates:
 * 1. Telegram Cloud API (Inbound/Outbound)
 * 2. OpenAI/Grok (Reasoning & Audio Transcription)
 * 3. ElevenLabs V3 (Voice Note Generation)
 * 4. Intake Flow (Conversational Data Collection)
 * 5. Document Generation (Automatic Paperwork)
 * 
 * Version: 2.0.0 - Telegram Intake Integration
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
 * Handle incoming Telegram or Telegram message (Text or Audio)
 * @param {Object} data - Telegram or Telegram inbound data from webhook
 */
function handleManus(data) {
    const { from, name, body, type, mediaId, mimeType, chatId } = data;

    let userMessage = body || '';
    let inputType = type || 'text';

    try {
        // Initialize platform-specific API client
        const apiClient = new TelegramBotAPI();

        // 1. Transcribe Audio if present
        if (inputType === 'audio' && mediaId) {
            // Download audio
            const audioBlob = apiClient.downloadFile(mediaId);

            const transcript = transcribeAudio(audioBlob); // Uses OpenAIClient.js
            if (transcript) {
                userMessage = transcript;
                logProcessingEvent("MANUS_AUDIO_TRANSCRIBED", { from: from, text: userMessage, platform: 'telegram' });
            } else {
                const errorMsg = "Sorry, I couldn't hear that clearly. Could you type it?";
                apiClient.sendMessage(chatId, errorMsg);
                return ContentService.createTextOutput("Audio transcription failed");
            }
        }

        // 2. Check if user is in intake flow
        const intakeResult = checkAndProcessIntake(from, userMessage, name, chatId);
        if (intakeResult.handled) {
            // Intake flow handled the message - send response
            if (intakeResult.text) {
                apiClient.sendMessage(chatId, intakeResult.text);
            }
            if (intakeResult.voice_script) {
                generateAndSendVoiceNote(intakeResult.voice_script, chatId);
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

        // 4. Send Text Response
        if (replyText) {
            apiClient.sendMessage(chatId, replyText);
        }

        // 5. Send Voice Note (if applicable)
        if (voiceScript && voiceScript.length > 10) {
            generateAndSendVoiceNote(voiceScript, chatId);
        }

        return ContentService.createTextOutput("Manus processed message");

    } catch (e) {
        console.error("Manus Brain Error:", e);
        // Send error message (platform-specific)
        const errorMsg = "I'm having a little trouble thinking right now. A human agent will be with you shortly.";
        try {
            const telegram = new TelegramBotAPI();
            telegram.sendMessage(chatId, errorMsg);
        } catch (sendError) {
            console.error("Failed to send error message:", sendError);
        }
        return ContentService.createTextOutput("Error: " + e.message);
    }
}

/**
 * Generate Voice Note via ElevenLabs and Send via Telegram or Telegram
 * @param {string} to - Phone number or user ID
 * @param {string} script - Text to speak
 * @param {string} platform - 'telegram' or 'telegram'
 * @param {string} chatId - Telegram chat ID (optional, only for Telegram)
 */
function generateAndSendVoiceNote(script, chatId) {
    try {
        // A. Generate Audio
        const manusVoiceId = PropertiesService.getScriptProperties().getProperty('MANUS_VOICE_ID');
        const audioBlob = EL_generateAudio(script, manusVoiceId); // Uses ElevenLabs_Client.js

        // B. Upload to Drive (Public) for Telegram API
        const folderId = PropertiesService.getScriptProperties().getProperty('GOOGLE_DRIVE_OUTPUT_FOLDER_ID');
        const folder = DriveApp.getFolderById(folderId);

        const file = folder.createFile(audioBlob);
        file.setName(`Manus_Voice_${new Date().getTime()}.mp3`);

        // Ensure public visibility for Telegram to fetch it via URL
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const directUrl = `https://drive.google.com/uc?export=download&id=${file.getId()}`;

        // C. Send via platform-specific API
        const telegram = new TelegramBotAPI();
        telegram.sendVoice(chatId, directUrl);

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
 * @param {string} from - User's phone number or ID
 * @param {string} message - User's message
 * @param {string} name - User's name from Telegram profile
 * @param {string} chatId - Telegram chat ID to send replies directly
 * @returns {object} - { handled: boolean, text: string, voice_script: string }
 */
function checkAndProcessIntake(from, message, name, chatId) {
    // Check if processIntakeMessage function exists (from Telegram_IntakeFlow.js)
    if (typeof processIntakeMessage !== 'function') {
        console.warn('processIntakeMessage function not found - intake flow disabled');
        return { handled: false };
    }

    // IMPORTANT: Numbered menu choices (1-5) are handled upstream in Telegram_Webhook.js
    // BEFORE this function is ever called. By the time we reach handleManus(), the user
    // is either mid-intake (active state machine) or asking a general AI question.
    // We must NOT start a new intake here — that is _handleMenuPostBail's exclusive job.
    //
    // The only job of this function is to continue an ALREADY-ACTIVE intake session.

    // Use chatId as the reliable unique identifier for Telegram
    const stateId = chatId || from;
    const state = getConversationState(stateId);

    // Only intercept if user is actively mid-intake (not at greeting, not complete)
    const isActiveIntake = state &&
        state.step &&
        state.step !== 'complete' &&
        state.step !== 'greeting';

    if (isActiveIntake) {
        // User is mid-intake: route through the state machine
        const result = processIntakeMessage(stateId, message, name);
        return {
            handled:      true,
            text:         result.text         || null,
            voice_script: result.voice_script  || null,
            intakeId:     result.intakeId      || null
        };
    }

    // Not an active intake — let the general Manus AI handle it
    return { handled: false };
}
