/**
 * TikTokVideoUploader.js
 * 
 * Handles video and photo uploads to TikTok via the Content Posting API v2.
 * Extends the basic postToTikTok_ in SocialPublisher.js with full media support.
 * 
 * API Reference: https://developers.tiktok.com/doc/content-posting-api-get-started/
 *
 * Flow:
 *   1. Query creator info to check posting eligibility
 *   2. Initialize upload (get upload URL)
 *   3. Upload video chunks (or provide URL for PULL_FROM_URL)
 *   4. Publish the uploaded video
 *   5. Check publish status
 */

var TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

// =============================================================================
// 1. CREATOR INFO
// =============================================================================

/**
 * Query TikTok creator info to verify posting eligibility and limits.
 * 
 * @returns {Object} { success, data: { creator_avatar_url, creator_username, max_video_post_duration_sec, ... } }
 */
function tiktok_getCreatorInfo() {
    var props = PropertiesService.getScriptProperties();
    var accessToken = props.getProperty('TIKTOK_ACCESS_TOKEN');

    if (!accessToken) {
        return { success: false, error: 'TIKTOK_ACCESS_TOKEN not configured.' };
    }

    try {
        var response = UrlFetchApp.fetch(TIKTOK_API_BASE + '/post/publish/creator_info/query/', {
            method: 'post',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify({}),
            muteHttpExceptions: true
        });

        var body = JSON.parse(response.getContentText());

        if (body.error && body.error.code !== 'ok') {
            return { success: false, error: body.error.message || JSON.stringify(body.error) };
        }

        return { success: true, data: body.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 2. VIDEO UPLOAD (PULL FROM URL)
// =============================================================================

/**
 * Upload a video to TikTok by providing a public URL.
 * The video must be hosted on a verified domain.
 * 
 * @param {string} videoUrl - Public URL of the video file (MP4)
 * @param {Object} options - { title, privacyLevel, disableComment, disableDuet, disableStitch }
 * @returns {Object} { success, publishId, statusUrl }
 */
function tiktok_uploadVideoByUrl(videoUrl, options) {
    var props = PropertiesService.getScriptProperties();
    var accessToken = props.getProperty('TIKTOK_ACCESS_TOKEN');
    options = options || {};

    if (!accessToken) {
        return { success: false, error: 'TIKTOK_ACCESS_TOKEN not configured.' };
    }

    try {
        var payload = {
            post_info: {
                title: options.title || 'Shamrock Bail Bonds',
                privacy_level: options.privacyLevel || 'PUBLIC_TO_EVERYONE',
                disable_comment: options.disableComment || false,
                disable_duet: options.disableDuet || false,
                disable_stitch: options.disableStitch || false
            },
            source_info: {
                source: 'PULL_FROM_URL',
                video_url: videoUrl
            }
        };

        var response = UrlFetchApp.fetch(TIKTOK_API_BASE + '/post/publish/video/init/', {
            method: 'post',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        var body = JSON.parse(response.getContentText());

        if (body.error && body.error.code !== 'ok') {
            return { success: false, error: body.error.message || JSON.stringify(body.error) };
        }

        return {
            success: true,
            publishId: body.data.publish_id,
            message: 'Video submitted for publishing. Use tiktok_checkPublishStatus() to monitor.'
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 3. VIDEO UPLOAD (FILE UPLOAD - FROM DRIVE)
// =============================================================================

/**
 * Upload a video from Google Drive to TikTok.
 * Handles the multi-step FILE_UPLOAD flow.
 * 
 * @param {string} driveFileId - Google Drive file ID of the video
 * @param {Object} options - { title, privacyLevel }
 * @returns {Object} { success, publishId }
 */
function tiktok_uploadVideoFromDrive(driveFileId, options) {
    var props = PropertiesService.getScriptProperties();
    var accessToken = props.getProperty('TIKTOK_ACCESS_TOKEN');
    options = options || {};

    if (!accessToken) {
        return { success: false, error: 'TIKTOK_ACCESS_TOKEN not configured.' };
    }

    try {
        // Get file metadata from Drive
        var file = DriveApp.getFileById(driveFileId);
        var fileSize = file.getSize();
        var fileName = file.getName();

        // Step 1: Initialize upload
        var initPayload = {
            post_info: {
                title: options.title || fileName.replace(/\.[^/.]+$/, ''),
                privacy_level: options.privacyLevel || 'PUBLIC_TO_EVERYONE',
                disable_comment: false,
                disable_duet: false,
                disable_stitch: false
            },
            source_info: {
                source: 'FILE_UPLOAD',
                video_size: fileSize,
                chunk_size: fileSize, // Single chunk for files under 64MB
                total_chunk_count: 1
            }
        };

        var initResponse = UrlFetchApp.fetch(TIKTOK_API_BASE + '/post/publish/video/init/', {
            method: 'post',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify(initPayload),
            muteHttpExceptions: true
        });

        var initBody = JSON.parse(initResponse.getContentText());
        if (initBody.error && initBody.error.code !== 'ok') {
            return { success: false, error: 'Init failed: ' + (initBody.error.message || JSON.stringify(initBody.error)) };
        }

        var uploadUrl = initBody.data.upload_url;
        var publishId = initBody.data.publish_id;

        // Step 2: Upload the file
        var videoBlob = file.getBlob();

        var uploadResponse = UrlFetchApp.fetch(uploadUrl, {
            method: 'put',
            headers: {
                'Content-Range': 'bytes 0-' + (fileSize - 1) + '/' + fileSize,
                'Content-Type': 'video/mp4'
            },
            payload: videoBlob.getBytes(),
            muteHttpExceptions: true
        });

        if (uploadResponse.getResponseCode() !== 200 && uploadResponse.getResponseCode() !== 201) {
            return { success: false, error: 'Upload failed: HTTP ' + uploadResponse.getResponseCode() };
        }

        console.log('✅ TikTok Video Uploaded: ' + publishId + ' (' + fileName + ')');

        return {
            success: true,
            publishId: publishId,
            message: 'Video uploaded and submitted for publishing.'
        };

    } catch (e) {
        console.error('TikTok Drive Upload Error:', e);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 4. PHOTO POST
// =============================================================================

/**
 * Post photos to TikTok (carousel style).
 * Photos must be accessible via public URLs on a verified domain.
 * 
 * @param {string[]} photoUrls - Array of public image URLs (max 35)
 * @param {Object} options - { title, privacyLevel }
 * @returns {Object} { success, publishId }
 */
function tiktok_postPhotos(photoUrls, options) {
    var props = PropertiesService.getScriptProperties();
    var accessToken = props.getProperty('TIKTOK_ACCESS_TOKEN');
    options = options || {};

    if (!accessToken) {
        return { success: false, error: 'TIKTOK_ACCESS_TOKEN not configured.' };
    }

    if (!photoUrls || photoUrls.length === 0) {
        return { success: false, error: 'No photo URLs provided.' };
    }

    try {
        var payload = {
            post_info: {
                title: options.title || 'Shamrock Bail Bonds',
                privacy_level: options.privacyLevel || 'PUBLIC_TO_EVERYONE',
                disable_comment: false
            },
            source_info: {
                source: 'PULL_FROM_URL',
                photo_urls: photoUrls,
                photo_cover_index: 0
            },
            media_type: 'PHOTO'
        };

        var response = UrlFetchApp.fetch(TIKTOK_API_BASE + '/post/publish/content/init/', {
            method: 'post',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        var body = JSON.parse(response.getContentText());

        if (body.error && body.error.code !== 'ok') {
            return { success: false, error: body.error.message || JSON.stringify(body.error) };
        }

        return { success: true, publishId: body.data.publish_id };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 5. PUBLISH STATUS CHECK
// =============================================================================

/**
 * Check the publishing status of a TikTok upload.
 * 
 * @param {string} publishId - The publish ID from a previous upload
 * @returns {Object} { success, status, failReason }
 */
function tiktok_checkPublishStatus(publishId) {
    var props = PropertiesService.getScriptProperties();
    var accessToken = props.getProperty('TIKTOK_ACCESS_TOKEN');

    if (!accessToken) {
        return { success: false, error: 'TIKTOK_ACCESS_TOKEN not configured.' };
    }

    try {
        var response = UrlFetchApp.fetch(TIKTOK_API_BASE + '/post/publish/status/fetch/', {
            method: 'post',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify({ publish_id: publishId }),
            muteHttpExceptions: true
        });

        var body = JSON.parse(response.getContentText());

        if (body.error && body.error.code !== 'ok') {
            return { success: false, error: body.error.message };
        }

        return {
            success: true,
            status: body.data.status, // PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, SEND_TO_USER_INBOX, PUBLISH_COMPLETE, FAILED
            failReason: body.data.fail_reason || null
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}
