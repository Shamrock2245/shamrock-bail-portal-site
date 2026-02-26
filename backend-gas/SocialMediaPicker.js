/**
 * Fetches base images and videos from the "shamrock-social-media" Google Drive folder.
 * If the folder does not exist, it creates it.
 */
function client_getSocialMediaFiles() {
    const folderName = "shamrock-social-media";
    const folders = DriveApp.getFoldersByName(folderName);
    let folder;

    if (folders.hasNext()) {
        folder = folders.next();
    } else {
        folder = DriveApp.createFolder(folderName);
    }

    const files = folder.getFiles();
    const fileList = [];

    while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();

        // Only return image or video files
        if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
            fileList.push({
                id: file.getId(),
                name: file.getName(),
                mimeType: mimeType,
                url: file.getUrl()
            });
        }
    }

    return fileList;
}

/**
 * Downloads a file by ID and returns its base64 representation.
 * Useful for attaching it to an API request directly.
 */
function client_getDriveFileBase64(fileId) {
    try {
        const file = DriveApp.getFileById(fileId);
        const blob = file.getBlob();
        return {
            success: true,
            name: file.getName(),
            mimeType: file.getMimeType(),
            base64: Utilities.base64Encode(blob.getBytes())
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Searches Pexels for royalty-free images.
 * Requires PEXELS_API_KEY in Script Properties.
 * Free tier: 200 requests/hour — more than enough for dashboard use.
 * @param {string} query - Search term
 * @param {number} [perPage] - Results per page (default 15, max 80)
 * @returns {Object} - { success, results: [{ url, thumbnailUrl, title, photographer, pexelsUrl }] }
 */
function client_searchPublicMedia(query, perPage) {
    try {
        if (!query || query.trim() === '') {
            return { success: false, error: 'Search query is required.' };
        }

        var apiKey = PropertiesService.getScriptProperties().getProperty('PEXELS_API_KEY');
        if (!apiKey) {
            return {
                success: false,
                error: 'PEXELS_API_KEY not configured. Get a free key at pexels.com/api and add it to Script Properties.'
            };
        }

        var count = perPage || 15;
        var url = 'https://api.pexels.com/v1/search?query=' + encodeURIComponent(query.trim()) +
            '&per_page=' + count + '&orientation=landscape';

        var response = UrlFetchApp.fetch(url, {
            method: 'get',
            headers: { 'Authorization': apiKey },
            muteHttpExceptions: true
        });

        if (response.getResponseCode() !== 200) {
            throw new Error('Pexels API Error ' + response.getResponseCode() + ': ' + response.getContentText());
        }

        var data = JSON.parse(response.getContentText());
        var results = (data.photos || []).map(function (photo) {
            return {
                url: photo.src.large,
                thumbnailUrl: photo.src.medium,
                title: photo.alt || 'Pexels Image',
                photographer: photo.photographer,
                pexelsUrl: photo.url,
                source: 'pexels'
            };
        });

        return { success: true, results: results, total: data.total_results };
    } catch (e) {
        console.error('client_searchPublicMedia error:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Uses Grok to generate AI image suggestions with descriptions.
 * Since Grok cannot return actual image files, this returns curated
 * suggestions that link to relevant stock/public domain images via Pexels.
 * Falls back to Pexels search powered by Grok-suggested keywords.
 * @param {string} query - What kind of image the user wants
 * @returns {Object} - { success, results: [{ url, thumbnailUrl, title, photographer, source }] }
 */
function client_searchGrokImages(query) {
    try {
        if (!query || query.trim() === '') {
            return { success: false, error: 'Search query is required.' };
        }

        var grokClient = new GrokClient();

        if (!grokClient.hasKey()) {
            return {
                success: false,
                error: 'GROK_API_KEY not configured. Add it to Script Properties.'
            };
        }

        // Use Grok to generate 3 optimized search queries for stock photos
        var systemPrompt = 'You are a creative media assistant. Given the user\'s request, generate exactly 3 short stock photo search keywords (2-4 words each) that would find relevant, professional images on a stock photo site. Return ONLY a JSON array of strings. Example: ["gavel justice", "courthouse steps", "legal team meeting"]';
        var userMessage = 'I need images for a social media post about: ' + query.trim();

        var rawResponse = grokClient.chat(userMessage, systemPrompt, { temperature: 0.6, jsonMode: true });

        if (!rawResponse) {
            // Fallback: just use the original query for Pexels
            return client_searchPublicMedia(query, 15);
        }

        // Parse Grok's keyword suggestions
        var keywords;
        try {
            var cleaned = rawResponse.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
            keywords = JSON.parse(cleaned);
        } catch (e) {
            // Fallback if Grok doesn't return valid JSON
            keywords = [query.trim()];
        }

        if (!Array.isArray(keywords) || keywords.length === 0) {
            keywords = [query.trim()];
        }

        // Check if Pexels key exists before trying
        var pexelsKey = PropertiesService.getScriptProperties().getProperty('PEXELS_API_KEY');
        if (!pexelsKey) {
            return {
                success: true,
                results: [],
                suggestions: keywords,
                note: 'Grok suggested these search terms: ' + keywords.join(', ') + '. Add PEXELS_API_KEY to enable image results.'
            };
        }

        // Search Pexels with the first Grok-suggested keyword
        var combinedResults = [];
        for (var i = 0; i < Math.min(keywords.length, 2); i++) {
            var searchResult = client_searchPublicMedia(keywords[i], 8);
            if (searchResult.success && searchResult.results) {
                combinedResults = combinedResults.concat(searchResult.results);
            }
        }

        // Deduplicate by URL
        var seen = {};
        var uniqueResults = [];
        for (var j = 0; j < combinedResults.length; j++) {
            if (!seen[combinedResults[j].url]) {
                seen[combinedResults[j].url] = true;
                combinedResults[j].source = 'grok+pexels';
                uniqueResults.push(combinedResults[j]);
            }
        }

        return {
            success: true,
            results: uniqueResults.slice(0, 15),
            suggestions: keywords,
            total: uniqueResults.length
        };
    } catch (e) {
        console.error('client_searchGrokImages error:', e);
        return { success: false, error: e.message };
    }
}
