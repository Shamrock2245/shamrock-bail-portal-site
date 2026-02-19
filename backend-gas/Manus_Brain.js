/**
 * Manus_Brain.js
 * 
 * Core logic for "The Manus Project" - WhatsApp Facilitator.
 * Orchestrates:
 * 1. Twilio (WhatsApp Inbound/Outbound)
 * 2. OpenAI (Reasoning & Audio Transcription)
 * 3. ElevenLabs (Voice Note Generation)
 */

const MANUS_SYSTEM_PROMPT = `
You are "Manus", the digital facilitator for Shamrock Bail Bonds on WhatsApp. 
Your job is to guide clients through the bond signing process.
You are helpful, reassuring, and extremely clear.

Channel Context: WhatsApp. Keep text messages short/punchy.

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
 * Handle incoming WhatsApp message (Text or Audio)
 * @param {Object} data - WhatsApp Cloud API inbound data from WhatsApp_Webhook
 */
function handleManusWhatsApp(data) {
    const { from, name, body, type, mediaId, mimeType } = data;

    let userMessage = body || '';
    let inputType = type || 'text';

    try {
        const whatsapp = new WhatsAppCloudAPI();

        // 1. Transcribe Audio if present
        if (inputType === 'audio' && mediaId) {
            const audioBlob = whatsapp.downloadMedia(mediaId);
            const transcript = transcribeAudio(audioBlob); // Uses OpenAIClient.js
            if (transcript) {
                userMessage = transcript;
                logProcessingEvent("MANUS_AUDIO_TRANSCRIBED", { from: from, text: userMessage });
            } else {
                whatsapp.sendText(from, "Sorry, I couldn't hear that clearly. Could you type it?");
                return ContentService.createTextOutput("Audio transcription failed");
            }
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

        // 2. Query OpenAI for Response
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

        // 3. Send Text Response
        if (replyText) {
            whatsapp.sendText(from, replyText);
        }

        // 4. Send Voice Note (if applicable)
        if (voiceScript && voiceScript.length > 10) {
            generateAndSendVoiceNote(from, voiceScript);
        }

        return ContentService.createTextOutput("Manus processed message");

    } catch (e) {
        console.error("Manus Brain Error:", e);
        // Use direct WhatsApp Cloud API
        const whatsapp = new WhatsAppCloudAPI();
        whatsapp.sendText(from, "I'm having a little trouble thinking right now. A human agent will be with you shortly.");
        return ContentService.createTextOutput("Error: " + e.message);
    }
}

/**
 * Generate Voice Note via ElevenLabs and Send via WhatsApp
 */
function generateAndSendVoiceNote(to, script) {
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

        // C. Send via WhatsApp Cloud API
        const whatsapp = new WhatsAppCloudAPI();
        whatsapp.sendAudio(to, directUrl);

    } catch (e) {
        console.error("Manus Voice Generation Failed:", e);
        // Fallback: The text message was already sent, so we just fail silently on the voice part
    }
}
