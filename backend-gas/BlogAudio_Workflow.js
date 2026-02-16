/**
 * Workflow: Blog to Audio
 * Orchestrates text fetching, audio generation, and Drive saving.
 */

const BLOG_AUDIO_FOLDER_NAME = "Shamrock_Blog_Audio";

function getOrCreateAudioFolder() {
    const rootParams = { q: "mimeType = 'application/vnd.google-apps.folder' and name = 'Shamrock_Blog_Audio' and trashed = false" };
    const folders = DriveApp.searchFolders(rootParams.q);

    if (folders.hasNext()) {
        return folders.next();
    } else {
        return DriveApp.createFolder(BLOG_AUDIO_FOLDER_NAME);
    }
}

/**
 * Main Entry Point: Convert Blog Text to Audio File
 * @param {string} text - Content to narrate
 * @param {string} title - Title for the file
 * @param {string} voiceId - Selected Voice ID
 */
function WORKFLOW_createBlogAudio(text, title, voiceId) {
    try {
        if (!text) throw new Error("No text provided");

        // 1. Generate Audio
        const client = new ElevenLabsClient();
        if (!client.hasKey()) throw new Error("API Key missing. Please set ELEVENLABS_API_KEY.");

        const mp3Blob = client.textToSpeech(text, voiceId);

        // 2. Save to Drive
        const folder = getOrCreateAudioFolder();
        const safeTitle = (title || 'blog_audio').replace(/[^a-z0-9]/gi, '_');
        const filename = `${safeTitle}_${new Date().toISOString().split('T')[0]}.mp3`;

        mp3Blob.setName(filename);
        const file = folder.createFile(mp3Blob);

        // 3. Return Metadata
        return {
            success: true,
            filename: file.getName(),
            url: file.getUrl(),
            downloadUrl: file.getDownloadUrl(),
            driveId: file.getId()
        };

    } catch (e) {
        console.error("Workflow Failed:", e);
        return {
            success: false,
            error: e.message
        };
    }
}

/**
 * Helper: Create default folder if strictly needed
 */
function setupAudioAndVideoFolders() {
    getOrCreateAudioFolder();
    return "Folders Ready";
}
