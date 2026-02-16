/**
 * ElevenLabs API Client for Shamrock Bail Bonds
 * Documentation: https://elevenlabs.io/docs/api-reference/introduction
 * 
 * USAGE:
 * var client = new ElevenLabsClient();
 * var mp3Blob = client.textToSpeech("Hello world", "voice_id");
 */

class ElevenLabsClient {
    constructor() {
        this.BASE_URL = 'https://api.elevenlabs.io/v1';
        this.API_KEY = PropertiesService.getScriptProperties().getProperty('ELEVENLABS_API_KEY');

        // Default Voice: "Rachel" (American, clear) if none selected
        this.DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
    }

    /**
     * Validates API Key availability
     */
    hasKey() {
        return !!this.API_KEY;
    }

    /**
     * Get list of available voices
     * @return {Array} List of voice objects {id, name, category}
     */
    getVoices() {
        if (!this.hasKey()) return [];

        try {
            const options = {
                method: 'get',
                headers: {
                    'xi-api-key': this.API_KEY,
                    'Content-Type': 'application/json'
                },
                muteHttpExceptions: true
            };

            const response = UrlFetchApp.fetch(`${this.BASE_URL}/voices`, options);
            if (response.getResponseCode() !== 200) {
                console.error('ElevenLabs GetVoices Error:', response.getContentText());
                return [];
            }

            const data = JSON.parse(response.getContentText());
            return data.voices.map(v => ({
                id: v.voice_id,
                name: v.name,
                category: v.category,
                preview_url: v.preview_url
            }));

        } catch (e) {
            console.error('ElevenLabs Exception:', e);
            return [];
        }
    }

    /**
     * Convert Text to Speech
     * @param {string} text - The text to convert (max 5000 chars recommended)
     * @param {string} voiceId - (Optional) Voice ID
     * @return {Blob} MP3 Audio Blob or null on failure
     */
    textToSpeech(text, voiceId) {
        if (!this.hasKey()) throw new Error("ElevenLabs API Key not configured.");

        const voice = voiceId || this.DEFAULT_VOICE_ID;
        const url = `${this.BASE_URL}/text-to-speech/${voice}`;

        const payload = {
            text: text,
            model_id: "eleven_turbo_v2_5", // Use latest Turbo model for speed
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
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
                console.error('ElevenLabs TTS Error:', response.getContentText());
                throw new Error(`ElevenLabs/TTS Failed: ${response.getResponseCode()}`);
            }

            return response.getBlob().setName(`narration_${new Date().getTime()}.mp3`);

        } catch (e) {
            console.error('ElevenLabs TTS Exception:', e);
            throw e;
        }
    }
}

// Global Export for procedural use
function EL_getVoices() {
    return new ElevenLabsClient().getVoices();
}

function EL_generateAudio(text, voiceId) {
    return new ElevenLabsClient().textToSpeech(text, voiceId);
}
