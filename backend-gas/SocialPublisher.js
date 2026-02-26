/**
 * ============================================================================
 * SocialPublisher.js
 * ============================================================================
 * One-click multi-platform social media publisher for Shamrock Bail Bonds.
 * Supports: Google Business Profile, X (Twitter), LinkedIn, TikTok, YouTube.
 *
 * Architecture:
 *   1. AI Agent (OpenAI) drafts platform-specific copy from a topic/prompt.
 *   2. Human reviews and edits drafts in Dashboard.html "Social" tab.
 *   3. Human clicks "Publish" — this file handles the API calls.
 *
 * All credentials are stored in GAS Script Properties (PropertiesService).
 * See SOCIAL_MEDIA_SETUP_GUIDE.md for setup instructions.
 *
 * Public Functions (called from Dashboard.html via google.script.run):
 *   - SocialPublisher.draftPosts(topic)
 *   - SocialPublisher.publishPost(platform, content, options)
 *   - SocialPublisher.publishAll(posts)
 *   - SocialPublisher.getLastPostTimes()
 *   - SocialPublisher.getAuthUrl(platform)
 *   - SocialPublisher.handleOAuthCallback(platform, code)
 * ============================================================================
 */

var SocialPublisher = (function () {

  // ─── PRIVATE: Config ────────────────────────────────────────────────────────

  var PROPS = PropertiesService.getScriptProperties();

  var PLATFORM_LIMITS = {
    twitter: { chars: 280, label: 'X (Twitter)' },
    linkedin: { chars: 3000, label: 'LinkedIn' },
    gbp: { chars: 1500, label: 'Google Business Profile' },
    tiktok: { chars: 2200, label: 'TikTok' },
    youtube: { chars: 5000, label: 'YouTube Community' },
    telegram: { chars: 4096, label: 'Telegram' },
    facebook: { chars: 63206, label: 'Facebook' },
    instagram: { chars: 2200, label: 'Instagram' },
    threads: { chars: 500, label: 'Threads' },
    skool: { chars: 10000, label: 'Skool' },
    patreon: { chars: 10000, label: 'Patreon' }
  };

  var LOG_SHEET_NAME = 'Social_Posts_Log';

  // ─── PRIVATE: Logging ───────────────────────────────────────────────────────

  function logPost_(platform, content, status, error) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(LOG_SHEET_NAME);
      if (!sheet) {
        sheet = ss.insertSheet(LOG_SHEET_NAME);
        sheet.appendRow(['Timestamp', 'Platform', 'Content Preview', 'Status', 'Error', 'Posted By']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
      }
      sheet.appendRow([
        new Date(),
        platform,
        content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        status,
        error || '',
        Session.getActiveUser().getEmail()
      ]);
    } catch (e) {
      console.warn('SocialPublisher: Could not write to log sheet: ' + e.message);
    }
  }

  function getLastPostTime_(platform) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(LOG_SHEET_NAME);
      if (!sheet) return null;
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][1] === platform && data[i][3] === 'success') {
          return data[i][0];
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ─── PRIVATE: OAuth Token Helpers ───────────────────────────────────────────

  function getStoredToken_(platform) {
    return PROPS.getProperty(platform.toUpperCase() + '_ACCESS_TOKEN');
  }

  function storeToken_(platform, token) {
    PROPS.setProperty(platform.toUpperCase() + '_ACCESS_TOKEN', token);
  }

  /**
   * Refreshes an OAuth access token using the stored refresh token.
   * Currently supports Google (GBP/YouTube).
   */
  function refreshAccessToken_(platform) {
    var refreshToken = PROPS.getProperty(platform.toUpperCase() + '_REFRESH_TOKEN');
    if (!refreshToken) {
      throw new Error('No refresh token available for ' + platform + '. Please re-authenticate.');
    }

    var tokenUrl, payload;

    switch (platform) {
      case 'gbp':
      case 'youtube':
        var clientId = PROPS.getProperty('GOOGLE_OAUTH_CLIENT_ID');
        var clientSecret = PROPS.getProperty('GOOGLE_OAUTH_CLIENT_SECRET');
        if (!clientId || !clientSecret) {
          throw new Error('Google OAuth credentials missing.');
        }
        tokenUrl = 'https://oauth2.googleapis.com/token';
        payload = {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        };
        break;
      // TikTok and LinkedIn have different refresh flows, can be added later if needed.
      default:
        throw new Error('Token refresh not implemented for ' + platform);
    }

    var options = {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: payload,
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(tokenUrl, options);
    var code = response.getResponseCode();
    var body = JSON.parse(response.getContentText());

    if (code >= 200 && code < 300 && body.access_token) {
      storeToken_(platform, body.access_token);
      if (body.refresh_token) {
        // Sometimes a new refresh token is issued
        PROPS.setProperty(platform.toUpperCase() + '_REFRESH_TOKEN', body.refresh_token);
      }
      return body.access_token;
    } else {
      throw new Error('Failed to refresh ' + platform + ' token (' + code + '): ' + response.getContentText());
    }
  }

  // ─── PRIVATE: Twitter / X API v2 ────────────────────────────────────────────

  /**
   * Posts a tweet using Twitter API v2 with OAuth 1.0a (User Context).
   * Requires: TWITTER_API_KEY, TWITTER_API_SECRET,
   *           TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET
   */
  function postToTwitter_(content, postOptions) {
    var apiKey = PROPS.getProperty('TWITTER_API_KEY');
    var apiSecret = PROPS.getProperty('TWITTER_API_SECRET');
    var accessToken = PROPS.getProperty('TWITTER_ACCESS_TOKEN');
    var accessSecret = PROPS.getProperty('TWITTER_ACCESS_TOKEN_SECRET');

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error('Twitter credentials missing. Check Script Properties: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET');
    }

    var url = 'https://api.twitter.com/2/tweets';
    var payloadObj = { text: content };

    if (postOptions && postOptions.driveFileId) {
      try {
        var mediaId = uploadToTwitter_(postOptions.driveFileId, apiKey, apiSecret, accessToken, accessSecret);
        if (mediaId) {
          payloadObj.media = { media_ids: [mediaId] };
        }
      } catch (e) {
        console.warn('Twitter Media Upload failed: ' + e.message);
      }
    }

    // Build OAuth 1.0a signature
    var oauthHeader = buildOAuth1Header_('POST', url, {}, apiKey, apiSecret, accessToken, accessSecret);

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': oauthHeader },
      payload: JSON.stringify(payloadObj),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var body = JSON.parse(response.getContentText());

    if (code >= 200 && code < 300) {
      return { success: true, id: body.data && body.data.id, platform: 'twitter' };
    } else {
      throw new Error('Twitter API Error ' + code + ': ' + JSON.stringify(body));
    }
  }

  /**
   * Helper function for exact RFC 3986 encoding required by Twitter OAuth 1.0a.
   */
  function rfc3986_(str) {
    if (str == null) return '';
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
      });
  }

  /**
   * Minimal OAuth 1.0a header builder for Twitter.
   */
  function buildOAuth1Header_(method, url, params, consumerKey, consumerSecret, token, tokenSecret) {
    var nonce = Utilities.getUuid().replace(/-/g, '');
    var timestamp = Math.floor(Date.now() / 1000).toString();

    var oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: token,
      oauth_version: '1.0'
    };

    // Merge all params for signature base
    var allParams = Object.assign({}, params, oauthParams);
    var sortedKeys = Object.keys(allParams).sort();
    var paramString = sortedKeys.map(function (k) {
      return rfc3986_(k) + '=' + rfc3986_(allParams[k]);
    }).join('&');

    var signatureBase = method.toUpperCase() + '&' + rfc3986_(url) + '&' + rfc3986_(paramString);
    var signingKey = rfc3986_(consumerSecret) + '&' + rfc3986_(tokenSecret);

    var signature = Utilities.base64Encode(
      Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1, signatureBase, signingKey)
    );
    oauthParams['oauth_signature'] = signature;

    var headerParts = Object.keys(oauthParams).sort().map(function (k) {
      return rfc3986_(k) + '="' + rfc3986_(oauthParams[k]) + '"';
    });

    return 'OAuth ' + headerParts.join(', ');
  }

  function uploadToTwitter_(fileId, consumerKey, consumerSecret, token, tokenSecret) {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var mimeType = blob.getContentType();

    var initUrl = 'https://upload.twitter.com/1.1/media/upload.json?command=INIT&total_bytes=' + blob.getBytes().length + '&media_category=tweet_image';
    var initAuth = buildOAuth1Header_('POST', 'https://upload.twitter.com/1.1/media/upload.json', { 'command': 'INIT', 'total_bytes': blob.getBytes().length.toString(), 'media_category': 'tweet_image' }, consumerKey, consumerSecret, token, tokenSecret);

    var initRes = UrlFetchApp.fetch(initUrl, {
      method: 'post',
      headers: { 'Authorization': initAuth },
      muteHttpExceptions: true
    });
    if (initRes.getResponseCode() >= 300) throw new Error('Twitter INIT error: ' + initRes.getContentText());
    var mediaId = JSON.parse(initRes.getContentText()).media_id_string;

    var appendUrl = 'https://upload.twitter.com/1.1/media/upload.json?command=APPEND&media_id=' + mediaId + '&segment_index=0';
    var appendAuth = buildOAuth1Header_('POST', 'https://upload.twitter.com/1.1/media/upload.json', { 'command': 'APPEND', 'media_id': mediaId, 'segment_index': '0' }, consumerKey, consumerSecret, token, tokenSecret);

    var appendRes = UrlFetchApp.fetch(appendUrl, {
      method: 'post',
      headers: { 'Authorization': appendAuth },
      payload: { media: blob },
      muteHttpExceptions: true
    });
    if (appendRes.getResponseCode() >= 300) throw new Error('Twitter APPEND error: ' + appendRes.getContentText());

    var finUrl = 'https://upload.twitter.com/1.1/media/upload.json?command=FINALIZE&media_id=' + mediaId;
    var finAuth = buildOAuth1Header_('POST', 'https://upload.twitter.com/1.1/media/upload.json', { 'command': 'FINALIZE', 'media_id': mediaId }, consumerKey, consumerSecret, token, tokenSecret);

    var finRes = UrlFetchApp.fetch(finUrl, {
      method: 'post',
      headers: { 'Authorization': finAuth },
      muteHttpExceptions: true
    });
    if (finRes.getResponseCode() >= 300) throw new Error('Twitter FINALIZE error: ' + finRes.getContentText());

    return mediaId;
  }

  function getDriveFilePublicUrl_(fileId) {
    var file = DriveApp.getFileById(fileId);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://drive.google.com/uc?export=download&id=' + fileId;
  }

  function uploadToLinkedIn_(fileId, accessToken, companyUrn) {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();

    var registerUrl = 'https://api.linkedin.com/v2/assets?action=registerUpload';
    var registerPayload = {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: companyUrn,
        supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD']
      }
    };
    var registerRes = UrlFetchApp.fetch(registerUrl, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'X-Restli-Protocol-Version': '2.0.0' },
      payload: JSON.stringify(registerPayload),
      muteHttpExceptions: true
    });
    if (registerRes.getResponseCode() >= 300) throw new Error('LinkedIn Register Upload error: ' + registerRes.getContentText());

    var regData = JSON.parse(registerRes.getContentText());
    var uploadMechanism = regData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
    var uploadUrl = uploadMechanism.uploadUrl;
    var assetUrn = regData.value.asset;

    var uploadRes = UrlFetchApp.fetch(uploadUrl, {
      method: 'put',
      headers: { 'Authorization': 'Bearer ' + accessToken },
      payload: blob,
      muteHttpExceptions: true
    });
    if (uploadRes.getResponseCode() >= 300) throw new Error('LinkedIn Media Upload error: ' + uploadRes.getContentText());

    return assetUrn;
  }

  // ─── PRIVATE: LinkedIn API ──────────────────────────────────────────────────

  /**
   * Posts a text update to a LinkedIn Company Page.
   * Requires: LINKEDIN_ACCESS_TOKEN, LINKEDIN_COMPANY_URN
   */
  function postToLinkedIn_(content, postOptions) {
    var accessToken = PROPS.getProperty('LINKEDIN_ACCESS_TOKEN');
    var companyUrn = PROPS.getProperty('LINKEDIN_COMPANY_URN');

    if (!accessToken) throw new Error('LinkedIn credentials missing. Check Script Properties: LINKEDIN_ACCESS_TOKEN, LINKEDIN_COMPANY_URN');
    if (!companyUrn) throw new Error('LINKEDIN_COMPANY_URN not set. Format: urn:li:organization:12345678');

    var url = 'https://api.linkedin.com/v2/ugcPosts';
    var payload = {
      author: companyUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    if (postOptions && postOptions.driveFileId) {
      try {
        var assetUrn = uploadToLinkedIn_(postOptions.driveFileId, accessToken, companyUrn);
        payload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
        payload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          media: assetUrn,
          status: 'READY'
        }];
      } catch (e) {
        console.warn('LinkedIn Media Upload failed: ' + e.message);
      }
    }

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code >= 200 && code < 300) {
      var body = JSON.parse(response.getContentText());
      return { success: true, id: body.id, platform: 'linkedin' };
    } else {
      throw new Error('LinkedIn API Error ' + code + ': ' + response.getContentText());
    }
  }

  // ─── PRIVATE: Google Business Profile API ───────────────────────────────────

  /**
   * Creates a Google Business Profile post (Local Post).
   * Requires: GBP_ACCESS_TOKEN, GBP_LOCATION_ID
   */
  function postToGBP_(content, postOptions) {
    var accessToken = PROPS.getProperty('GBP_ACCESS_TOKEN');
    var locationId = PROPS.getProperty('GBP_LOCATION_ID');

    if (!accessToken) throw new Error('GBP credentials missing. Check Script Properties: GBP_ACCESS_TOKEN, GBP_LOCATION_ID');
    if (!locationId) throw new Error('GBP_LOCATION_ID not set. Find it in Google Business Profile API explorer.');

    var url = 'https://mybusinesspostingapi.googleapis.com/v1/locations/' + locationId + '/localPosts';
    var payload = {
      languageCode: 'en-US',
      summary: content,
      topicType: 'STANDARD'
    };

    if (postOptions && postOptions.driveFileId) {
      payload.media = [{
        mediaFormat: 'PHOTO',
        sourceUrl: getDriveFilePublicUrl_(postOptions.driveFileId)
      }];
    }

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + accessToken },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code >= 200 && code < 300) {
      var body = JSON.parse(response.getContentText());
      return { success: true, id: body.name, platform: 'gbp' };
    } else if (code === 401) {
      // Token expired — attempt refresh and retry once
      try {
        var newToken = refreshAccessToken_('gbp');
        options.headers['Authorization'] = 'Bearer ' + newToken;
        var retryResp = UrlFetchApp.fetch(url, options);
        var retryCode = retryResp.getResponseCode();
        if (retryCode >= 200 && retryCode < 300) {
          var retryBody = JSON.parse(retryResp.getContentText());
          return { success: true, id: retryBody.name, platform: 'gbp' };
        } else {
          throw new Error('GBP API Error after token refresh (' + retryCode + '): ' + retryResp.getContentText());
        }
      } catch (refreshErr) {
        throw new Error('GBP API Error 401 (Refresh failed): ' + refreshErr.message);
      }
    } else {
      throw new Error('Google Business Profile API Error ' + code + ': ' + response.getContentText());
    }
  }

  // ─── PRIVATE: TikTok Content Posting API ────────────────────────────────────

  /**
   * Creates a TikTok text post (direct post, no video required for text posts).
   * Requires: TIKTOK_ACCESS_TOKEN
   * Note: TikTok's Content Posting API currently supports video and photo posts.
   * Text-only posts are created as photo posts with a placeholder image or
   * as a "direct post" if the account has that capability.
   */
  function postToTikTok_(content, postOptions) {
    var accessToken = PROPS.getProperty('TIKTOK_ACCESS_TOKEN');

    if (!accessToken) throw new Error('TikTok credentials missing. Check Script Properties: TIKTOK_ACCESS_TOKEN');

    // TikTok Content Posting API v2 - Initialize a direct post
    var url = 'https://open.tiktokapis.com/v2/post/publish/content/init/';
    var payload = {
      post_info: {
        title: content.substring(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: 0,
        chunk_size: 0,
        total_chunk_count: 0
      },
      post_mode: 'DIRECT_POST',
      media_type: 'PHOTO'
    };

    if (postOptions && postOptions.driveFileId) {
      payload.source_info.source = 'PULL_FROM_URL';
      payload.source_info.photo_images = [getDriveFilePublicUrl_(postOptions.driveFileId)];
    }

    var options = {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: { 'Authorization': 'Bearer ' + accessToken },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code >= 200 && code < 300) {
      var body = JSON.parse(response.getContentText());
      return { success: true, id: body.data && body.data.publish_id, platform: 'tiktok' };
    } else {
      // TikTok text-only posts via API are limited — log as pending for manual posting
      console.warn('TikTok API response ' + code + ': ' + response.getContentText());
      return { success: false, platform: 'tiktok', note: 'TikTok text-only posts require manual posting or a video attachment. Content has been logged.', code: code };
    }
  }

  // ─── PRIVATE: YouTube Data API v3 ───────────────────────────────────────────

  /**
   * Posts a YouTube Community Post (text update on the Community tab).
   * Requires: YOUTUBE_ACCESS_TOKEN, YOUTUBE_CHANNEL_ID
   * Note: Community Posts API requires the channel to have 500+ subscribers.
   */
  function postToYouTube_(content, postOptions) {
    var accessToken = PROPS.getProperty('YOUTUBE_ACCESS_TOKEN');
    var channelId = PROPS.getProperty('YOUTUBE_CHANNEL_ID');

    if (!accessToken) throw new Error('YouTube credentials missing. Check Script Properties: YOUTUBE_ACCESS_TOKEN, YOUTUBE_CHANNEL_ID');
    if (!channelId) throw new Error('YOUTUBE_CHANNEL_ID not set. Find it in YouTube Account Advanced Settings.');

    // NOTE: YouTube Community Posts API requires 500+ subscribers on the channel AND
    // the channel must be approved for Community Posts by YouTube.
    // If the channel is not eligible, this will return HTTP 403. The error is surfaced
    // to the user via the standard broadcastAll error handler — no silent failures.
    var url = 'https://www.googleapis.com/youtube/v3/communityPosts?part=snippet';
    var payload = {
      snippet: {
        type: 'textPost',
        textOriginal: content
      }
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + accessToken },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code >= 200 && code < 300) {
      var body = JSON.parse(response.getContentText());
      return { success: true, id: body.id, platform: 'youtube' };
    } else if (code === 401) {
      // Token expired, attempt refresh
      try {
        var newTokens = refreshAccessToken_('youtube');
        options.headers['Authorization'] = 'Bearer ' + newTokens; // refreshAccessToken_ returns the token string directly
        var retryResponse = UrlFetchApp.fetch(url, options);
        var retryCode = retryResponse.getResponseCode();
        if (retryCode >= 200 && retryCode < 300) {
          var retryBody = JSON.parse(retryResponse.getContentText());
          return { success: true, id: retryBody.id, platform: 'youtube' };
        } else {
          throw new Error('YouTube API Error after refresh ' + retryCode + ': ' + retryResponse.getContentText());
        }
      } catch (refreshErr) {
        throw new Error('YouTube API Error 401 (Refresh failed): ' + refreshErr.message);
      }
    } else {
      throw new Error('YouTube API Error ' + code + ': ' + response.getContentText());
    }
  }

  // ─── PRIVATE: Telegram API ──────────────────────────────────────────────────

  /**
   * Posts to a Telegram Channel or Group.
   * Requires: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (e.g. @yourchannel or ID)
   */
  function postToTelegram_(content, postOptions) {
    var botToken = PROPS.getProperty('TELEGRAM_BOT_TOKEN');
    var chatId = PROPS.getProperty('TELEGRAM_CHAT_ID');
    if (!botToken || !chatId) {
      throw new Error('Telegram credentials missing. Check Script Properties: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
    }

    var url, payload;
    if (postOptions && postOptions.driveFileId) {
      url = 'https://api.telegram.org/bot' + botToken + '/sendPhoto';
      payload = {
        chat_id: chatId,
        caption: content,
        photo: DriveApp.getFileById(postOptions.driveFileId).getBlob()
      };
    } else {
      url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
      payload = { chat_id: chatId, text: content };
    }

    var options = {
      method: 'post',
      payload: (postOptions && postOptions.driveFileId) ? payload : JSON.stringify(payload),
      muteHttpExceptions: true
    };

    if (!postOptions || !postOptions.driveFileId) {
      options.contentType = 'application/json';
    }

    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code >= 200 && code < 300) {
      var body = JSON.parse(response.getContentText());
      return { success: true, id: body.result.message_id, platform: 'telegram' };
    } else {
      throw new Error('Telegram API Error ' + code + ': ' + response.getContentText());
    }
  }

  // ─── PRIVATE: Facebook Pages API ────────────────────────────────────────────

  /**
   * Posts to a Facebook Page.
   * Requires: FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID
   */
  function postToFacebook_(content, postOptions) {
    var token = PROPS.getProperty('FB_PAGE_ACCESS_TOKEN');
    var pageId = PROPS.getProperty('FB_PAGE_ID');
    if (!token || !pageId) {
      throw new Error('Facebook credentials missing. Check Script Properties: FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID');
    }

    var url, payload;
    if (postOptions && postOptions.driveFileId) {
      url = 'https://graph.facebook.com/v21.0/' + pageId + '/photos';
      payload = {
        message: content,
        access_token: token,
        source: DriveApp.getFileById(postOptions.driveFileId).getBlob()
      };
    } else {
      url = 'https://graph.facebook.com/v21.0/' + pageId + '/feed';
      payload = { message: content, access_token: token };
    }

    var options = {
      method: 'post',
      payload: payload,
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code >= 200 && code < 300) {
      var body = JSON.parse(response.getContentText());
      return { success: true, id: body.id, platform: 'facebook' };
    } else {
      throw new Error('Facebook API Error ' + code + ': ' + response.getContentText());
    }
  }

  // ─── PRIVATE: Instagram Graph API ───────────────────────────────────────────

  /**
   * Posts to Instagram via the Instagram Graph API (via Facebook Page Access Token).
   * Requires: FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID, INSTAGRAM_ACCOUNT_ID (auto-discovered if not set).
   *
   * Note: The Instagram Graph API requires an image or video URL for feed posts.
   * Text-only posts are not supported by the API — the function returns a graceful failure
   * with a manual posting link if no media is attached.
   *
   * For media posts, the media file must be publicly accessible (e.g., via Google Drive public link).
   */
  function postToInstagram_(content, postOptions) {
    var token = PROPS.getProperty('FB_PAGE_ACCESS_TOKEN');
    var pageId = PROPS.getProperty('FB_PAGE_ID');
    var instaAccountId = PROPS.getProperty('INSTAGRAM_ACCOUNT_ID');

    if (!token || !pageId) {
      throw new Error('Facebook/Instagram credentials missing. Check Script Properties for FB_PAGE_ACCESS_TOKEN.');
    }

    if (!instaAccountId) {
      var igFetch = UrlFetchApp.fetch('https://graph.facebook.com/v21.0/' + pageId + '?fields=instagram_business_account&access_token=' + token, { muteHttpExceptions: true });
      if (igFetch.getResponseCode() === 200) {
        var igData = JSON.parse(igFetch.getContentText());
        if (igData.instagram_business_account) {
          instaAccountId = igData.instagram_business_account.id;
          PROPS.setProperty('INSTAGRAM_ACCOUNT_ID', instaAccountId);
        }
      }
    }

    if (!instaAccountId) {
      throw new Error('Could not find connected Instagram Business Account for the Facebook Page. Please link it in Page Settings.');
    }

    // Instagram Graph API does not support text-only posts.
    // If no media is attached, return a graceful failure with a manual posting link.
    if (!postOptions || !postOptions.driveFileId) {
      return {
        success: false,
        platform: 'instagram',
        note: 'Instagram requires an image or video for feed posts. Please attach media or post manually at instagram.com.'
      };
    }

    var publicUrl = getDriveFilePublicUrl_(postOptions.driveFileId);

    // Step 1: Create media container
    var initUrl = 'https://graph.facebook.com/v21.0/' + instaAccountId + '/media?image_url=' + encodeURIComponent(publicUrl) + '&caption=' + encodeURIComponent(content) + '&access_token=' + token;
    var initRes = UrlFetchApp.fetch(initUrl, { method: 'post', muteHttpExceptions: true });

    if (initRes.getResponseCode() >= 300) {
      throw new Error('Instagram Media Init Error: ' + initRes.getContentText());
    }
    var creationId = JSON.parse(initRes.getContentText()).id;

    // Step 2: Publish media container
    var pubUrl = 'https://graph.facebook.com/v21.0/' + instaAccountId + '/media_publish?creation_id=' + creationId + '&access_token=' + token;
    var pubRes = UrlFetchApp.fetch(pubUrl, { method: 'post', muteHttpExceptions: true });

    var pCode = pubRes.getResponseCode();
    if (pCode >= 200 && pCode < 300) {
      return { success: true, id: JSON.parse(pubRes.getContentText()).id, platform: 'instagram' };
    } else {
      throw new Error('Instagram Publish Error ' + pCode + ': ' + pubRes.getContentText());
    }
  }

  // ─── PRIVATE: Threads API ───────────────────────────────────────────────────

  /**
   * Posts a text update to Threads.
   * Requires: THREADS_ACCESS_TOKEN, THREADS_USER_ID
   */
  function postToSkool_(content, postOptions) {
    // Skool does not currently have a public API for creating posts.
    return { success: false, platform: 'skool', note: 'Skool API posting not currently supported. Please copy the text and post manually.' };
  }

  function postToPatreon_(content, postOptions) {
    // Patreon requires complex OAuth flow for user tokens to create posts. 
    return { success: false, platform: 'patreon', note: 'Patreon API posting for creators requires advanced OAuth. Please copy the text and post manually.' };
  }

  /**
   * Posts to Threads via the Threads API.
   * Requires: THREADS_ACCESS_TOKEN, THREADS_USER_ID
   * Supports: Text-only posts and image posts (image must be publicly accessible).
   * Text posts are limited to 500 characters.
   * Uses the two-step create container + publish flow.
   */
  function postToThreads_(content, postOptions) {
    var token = PROPS.getProperty('THREADS_ACCESS_TOKEN');
    var userId = PROPS.getProperty('THREADS_USER_ID');
    if (!token || !userId) {
      throw new Error('Threads credentials missing. Check Script Properties: THREADS_ACCESS_TOKEN, THREADS_USER_ID');
    }

    // Step 1: Create media container
    var initUrl = 'https://graph.threads.net/v1.0/' + userId + '/threads';
    var initPayload;
    if (postOptions && postOptions.driveFileId) {
      var publicUrl = getDriveFilePublicUrl_(postOptions.driveFileId);
      initPayload = {
        media_type: 'IMAGE',
        image_url: publicUrl,
        text: content,
        access_token: token
      };
    } else {
      initPayload = {
        media_type: 'TEXT',
        text: content,
        access_token: token
      };
    }

    var initOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(initPayload),
      muteHttpExceptions: true
    };

    var initRes = UrlFetchApp.fetch(initUrl, initOptions);
    var initCode = initRes.getResponseCode();

    if (initCode < 200 || initCode >= 300) {
      throw new Error('Threads Create Container Error ' + initCode + ': ' + initRes.getContentText());
    }

    var containerId = JSON.parse(initRes.getContentText()).id;
    if (!containerId) {
      throw new Error('Threads API did not return a container ID. Response: ' + initRes.getContentText());
    }

    // Step 2: Publish the container
    var pubUrl = 'https://graph.threads.net/v1.0/' + userId + '/threads_publish';
    var pubPayload = {
      creation_id: containerId,
      access_token: token
    };
    var pubOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(pubPayload),
      muteHttpExceptions: true
    };

    var pubRes = UrlFetchApp.fetch(pubUrl, pubOptions);
    var pCode = pubRes.getResponseCode();

    if (pCode >= 200 && pCode < 300) {
      return { success: true, id: JSON.parse(pubRes.getContentText()).id, platform: 'threads' };
    } else {
      throw new Error('Threads Publish Error ' + pCode + ': ' + pubRes.getContentText());
    }
  }

  /**
   * Calls OpenAI to generate platform-specific post drafts from a topic.
   * Uses the same OpenAI key already configured in the GAS project.
   */
  function generateDrafts_(topic, context) {
    var openAiKey = PROPS.getProperty('OPENAI_API_KEY');
    if (!openAiKey) throw new Error('OPENAI_API_KEY not found in Script Properties.');

    var systemPrompt = [
      'You are a professional social media manager for Shamrock Bail Bonds, a licensed bail bond company in Southwest Florida.',
      'Your tone is calm, professional, trustworthy, and empathetic — never sensational or fear-mongering.',
      'You write content that builds trust, educates the public about the bail process, and positions Shamrock as the go-to expert.',
      'You always write in the first-person plural ("we", "our team") unless the platform convention differs.',
      'You never make legal promises or guarantees.',
      'You always include a call to action appropriate for the platform.',
      'Company phone: (239) 351-7171 | Website: shamrockbailbonds.biz'
    ].join(' ');

    var userPrompt = [
      'Generate social media post drafts for the following topic: "' + topic + '".',
      context ? 'Additional context: ' + context : '',
      '',
      'Return a JSON object with exactly these keys: twitter, linkedin, gbp, tiktok, youtube, telegram, facebook, instagram, threads, skool, patreon.',
      'Each value should be a ready-to-publish post string optimized for that platform.',
      'Respect these character limits strictly: twitter=280, linkedin=3000, gbp=1500, tiktok=2200, youtube=5000, telegram=4096, facebook=63206, instagram=2200, threads=500, skool=10000, patreon=10000.',
      'For twitter: be punchy, include 2-3 relevant hashtags.',
      'For linkedin: professional tone, can be longer, include a question to drive engagement.',
      'For gbp: focus on local SEO keywords (Southwest Florida, Lee County, etc.), include phone number.',
      'For tiktok: conversational, use line breaks for readability, include trending hashtags.',
      'For youtube: informative community post, can reference a video or blog post if relevant.',
      'For skool: engaging community post to spark discussion in a course/group setting.',
      'For patreon: exclusive behind-the-scenes content or updates for supporters.',
      'Return ONLY valid JSON, no markdown code blocks, no extra text.'
    ].join('\n');

    var payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + openAiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
    var code = response.getResponseCode();

    if (code !== 200) {
      throw new Error('OpenAI API Error ' + code + ': ' + response.getContentText());
    }

    var body = JSON.parse(response.getContentText());
    var rawContent = body.choices[0].message.content.trim();

    // Strip markdown code fences if present
    rawContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    try {
      return JSON.parse(rawContent);
    } catch (e) {
      throw new Error('AI returned invalid JSON. Raw response: ' + rawContent.substring(0, 200));
    }
  }

  // ─── PUBLIC API ─────────────────────────────────────────────────────────────

  return {

    /**
     * Generate AI drafts for all platforms from a topic string.
     * Called from Dashboard.html via google.script.run.draftPosts(topic, context)
     * @param {string} topic - The post topic or prompt.
     * @param {string} [context] - Optional additional context.
     * @returns {Object} - { twitter, linkedin, gbp, tiktok, youtube, telegram, facebook, instagram, threads, skool, patreon } draft strings.
     */
    draftPosts: function (topic, context) {
      try {
        if (!topic || topic.trim() === '') throw new Error('Topic is required to generate drafts.');
        var drafts = generateDrafts_(topic, context || '');
        return { success: true, drafts: drafts };
      } catch (e) {
        console.error('SocialPublisher.draftPosts error: ' + e.message);
        return { success: false, error: e.message };
      }
    },

    /**
     * Publish a post to a single platform.
     * Called from Dashboard.html via google.script.run.publishPost(platform, content, options)
     * @param {string} platform - One of: twitter, linkedin, gbp, tiktok, youtube, telegram, facebook, instagram, threads
     * @param {string} content  - The post content string.
     * @param {Object} [options] - Optional settings, e.g., { driveFileId: '123abc_' }
     * @returns {Object} - { success, id, platform } or { success: false, error }
     */
    publishPost: function (platform, content, options) {
      try {
        if (!content || content.trim() === '') throw new Error('Post content cannot be empty.');
        options = options || {};

        var limit = PLATFORM_LIMITS[platform];
        if (!limit) throw new Error('Unknown platform: ' + platform + '. Valid: twitter, linkedin, gbp, tiktok, youtube');
        if (content.length > limit.chars) throw new Error(limit.label + ' post exceeds ' + limit.chars + ' character limit (' + content.length + ' chars).');

        var result;
        switch (platform) {
          case 'twitter': result = postToTwitter_(content, options); break;
          case 'linkedin': result = postToLinkedIn_(content, options); break;
          case 'gbp': result = postToGBP_(content, options); break;
          case 'tiktok': result = postToTikTok_(content, options); break;
          case 'youtube': result = postToYouTube_(content, options); break;
          case 'telegram': result = postToTelegram_(content, options); break;
          case 'facebook': result = postToFacebook_(content, options); break;
          case 'instagram': result = postToInstagram_(content, options); break;
          case 'threads': result = postToThreads_(content, options); break;
          case 'skool': result = postToSkool_(content, options); break;
          case 'patreon': result = postToPatreon_(content, options); break;
        }

        logPost_(platform, content, result.success ? 'success' : 'partial', result.note || null);
        return result;

      } catch (e) {
        console.error('SocialPublisher.publishPost [' + platform + '] error: ' + e.message);
        logPost_(platform, content || '', 'error', e.message);
        return { success: false, error: e.message, platform: platform };
      }
    },

    /**
     * Publish posts to all platforms in one call.
     * Called from Dashboard.html via google.script.run.publishAll(posts)
     * @param {Object} posts - { twitter: "...", linkedin: "...", gbp: "...", tiktok: "...", youtube: "..." }
     *                         Any platform can be omitted to skip it.
     * @returns {Object} - { results: { twitter: {...}, linkedin: {...}, ... } }
     */
    publishAll: function (posts) {
      var results = {};
      var platforms = Object.keys(posts);

      for (var i = 0; i < platforms.length; i++) {
        var platform = platforms[i];
        var data = posts[platform];
        // Handle both simple strings and objects { content, driveFileId }
        var content = typeof data === 'string' ? data : (data ? data.content : null);
        var options = typeof data === 'string' ? {} : { driveFileId: data ? data.driveFileId : null };

        if (!content || content.trim() === '') {
          results[platform] = { success: false, error: 'Empty content — skipped.', platform: platform };
          continue;
        }
        results[platform] = SocialPublisher.publishPost(platform, content, options);
        // Brief pause between API calls to avoid rate limiting
        Utilities.sleep(500);
      }

      return { success: true, results: results };
    },

    /**
     * Returns the last successful post time for each platform.
     * Used by Dashboard.html to show "Last posted: X ago" indicators.
     * @returns {Object} - { twitter: Date|null, linkedin: Date|null, ... }
     */
    getLastPostTimes: function () {
      return {
        twitter: getLastPostTime_('twitter'),
        linkedin: getLastPostTime_('linkedin'),
        gbp: getLastPostTime_('gbp'),
        tiktok: getLastPostTime_('tiktok'),
        youtube: getLastPostTime_('youtube'),
        telegram: getLastPostTime_('telegram'),
        facebook: getLastPostTime_('facebook'),
        instagram: getLastPostTime_('instagram'),
        threads: getLastPostTime_('threads'),
        skool: getLastPostTime_('skool'),
        patreon: getLastPostTime_('patreon')
      };
    },

    /**
     * Returns the OAuth authorization URL for a platform.
     * Run this function manually in GAS to get the URL, then visit it to authorize.
     * @param {string} platform - One of: gbp, linkedin, tiktok, youtube
     * @returns {string} - The authorization URL to visit.
     */
    getAuthUrl: function (platform) {
      var scriptId = ScriptApp.getScriptId();
      var callbackUrl = 'https://script.google.com/macros/d/' + scriptId + '/usercallback';

      // Generate a state token for the built-in GAS callback endpoint
      var stateToken = ScriptApp.newStateToken()
        .withMethod('socialAuthCallback')
        .withArgument('platform', platform)
        .withTimeout(3600)
        .createToken();

      switch (platform) {
        case 'gbp':
        case 'youtube': {
          var googleClientId = PROPS.getProperty('GOOGLE_OAUTH_CLIENT_ID');
          if (!googleClientId) return 'ERROR: Set GOOGLE_OAUTH_CLIENT_ID in Script Properties first.';
          var scopes = platform === 'gbp'
            ? 'https://www.googleapis.com/auth/business.manage'
            : 'https://www.googleapis.com/auth/youtube';
          return 'https://accounts.google.com/o/oauth2/v2/auth?' +
            'client_id=' + encodeURIComponent(googleClientId) +
            '&redirect_uri=' + encodeURIComponent(callbackUrl) +
            '&response_type=code' +
            '&scope=' + encodeURIComponent(scopes) +
            '&access_type=offline&prompt=consent' +
            '&state=' + encodeURIComponent(stateToken);
        }
        case 'linkedin': {
          var liClientId = PROPS.getProperty('LINKEDIN_CLIENT_ID');
          if (!liClientId) return 'ERROR: Set LINKEDIN_CLIENT_ID in Script Properties first.';
          return 'https://www.linkedin.com/oauth/v2/authorization?' +
            'response_type=code' +
            '&client_id=' + encodeURIComponent(liClientId) +
            '&redirect_uri=' + encodeURIComponent(callbackUrl) +
            '&scope=w_member_social%20r_organization_social%20w_organization_social' +
            '&state=' + encodeURIComponent(stateToken);
        }
        case 'tiktok': {
          var ttClientKey = PROPS.getProperty('TIKTOK_CLIENT_KEY');
          if (!ttClientKey) return 'ERROR: Set TIKTOK_CLIENT_KEY in Script Properties first.';
          return 'https://www.tiktok.com/v2/auth/authorize/?' +
            'client_key=' + encodeURIComponent(ttClientKey) +
            '&response_type=code' +
            '&scope=user.info.basic,video.publish,video.upload' +
            '&redirect_uri=' + encodeURIComponent(callbackUrl) +
            '&state=' + encodeURIComponent(stateToken);
        }
        case 'facebook':
        case 'instagram': {
          var fbClientId = PROPS.getProperty('FACEBOOK_CLIENT_ID');
          if (!fbClientId) return 'ERROR: Set FACEBOOK_CLIENT_ID in Script Properties first.';
          return 'https://www.facebook.com/v21.0/dialog/oauth?' +
            'client_id=' + encodeURIComponent(fbClientId) +
            '&redirect_uri=' + encodeURIComponent(callbackUrl) +
            '&response_type=code' +
            '&scope=' + encodeURIComponent('pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish') +
            '&state=' + encodeURIComponent(stateToken);
        }
        case 'threads': {
          var threadsClientId = PROPS.getProperty('THREADS_CLIENT_ID');
          if (!threadsClientId) return 'ERROR: Set THREADS_CLIENT_ID in Script Properties first.';
          return 'https://threads.net/oauth/authorize?' +
            'client_id=' + encodeURIComponent(threadsClientId) +
            '&redirect_uri=' + encodeURIComponent(callbackUrl) +
            '&response_type=code' +
            '&scope=' + encodeURIComponent('threads_basic,threads_content_publish') +
            '&state=' + encodeURIComponent(stateToken);
        }
        default:
          return 'ERROR: Unknown platform "' + platform + '". Valid: gbp, linkedin, tiktok, youtube, facebook, instagram, threads';
      }
    },

    /**
     * Handles the OAuth callback and exchanges the code for an access token.
     * This is called by the GAS web app doGet() handler when the OAuth redirect fires.
     * @param {string} platform - The platform from the state parameter.
     * @param {string} code - The authorization code from the OAuth redirect.
     * @returns {Object} - { success, message }
     */
    handleOAuthCallback: function (platform, code) {
      try {
        var scriptId = ScriptApp.getScriptId();
        var callbackUrl = 'https://script.google.com/macros/d/' + scriptId + '/usercallback';
        var tokenUrl, payload, clientId, clientSecret;

        switch (platform) {
          case 'gbp':
          case 'youtube': {
            clientId = PROPS.getProperty('GOOGLE_OAUTH_CLIENT_ID');
            clientSecret = PROPS.getProperty('GOOGLE_OAUTH_CLIENT_SECRET');
            tokenUrl = 'https://oauth2.googleapis.com/token';
            payload = {
              code: code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: callbackUrl,
              grant_type: 'authorization_code'
            };
            break;
          }
          case 'linkedin': {
            clientId = PROPS.getProperty('LINKEDIN_CLIENT_ID');
            clientSecret = PROPS.getProperty('LINKEDIN_CLIENT_SECRET');
            tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
            payload = {
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: callbackUrl,
              client_id: clientId,
              client_secret: clientSecret
            };
            break;
          }
          case 'tiktok': {
            clientId = PROPS.getProperty('TIKTOK_CLIENT_KEY');
            clientSecret = PROPS.getProperty('TIKTOK_CLIENT_SECRET');
            tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
            payload = {
              client_key: clientId,
              client_secret: clientSecret,
              code: code,
              grant_type: 'authorization_code',
              redirect_uri: callbackUrl
            };
            break;
          }
          case 'facebook':
          case 'instagram': {
            clientId = PROPS.getProperty('FACEBOOK_CLIENT_ID');
            clientSecret = PROPS.getProperty('FACEBOOK_CLIENT_SECRET');
            tokenUrl = 'https://graph.facebook.com/v21.0/oauth/access_token';
            payload = {
              code: code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: callbackUrl,
              grant_type: 'authorization_code'
            };
            break;
          }
          case 'threads': {
            clientId = PROPS.getProperty('THREADS_CLIENT_ID');
            clientSecret = PROPS.getProperty('THREADS_CLIENT_SECRET');
            tokenUrl = 'https://graph.threads.net/oauth/access_token';
            payload = {
              code: code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: callbackUrl,
              grant_type: 'authorization_code'
            };
            break;
          }
          default:
            throw new Error('Unknown platform: ' + platform);
        }

        var options = {
          method: 'post',
          contentType: 'application/x-www-form-urlencoded',
          payload: payload,
          muteHttpExceptions: true
        };

        var response = UrlFetchApp.fetch(tokenUrl, options);
        var body = JSON.parse(response.getContentText());

        if (body.access_token) {
          storeToken_(platform, body.access_token);
          if (body.refresh_token) {
            PROPS.setProperty(platform.toUpperCase() + '_REFRESH_TOKEN', body.refresh_token);
          }
          return { success: true, message: platform + ' access token stored successfully.' };
        } else {
          throw new Error('No access_token in response: ' + JSON.stringify(body));
        }

      } catch (e) {
        console.error('SocialPublisher.handleOAuthCallback error: ' + e.message);
        return { success: false, error: e.message };
      }
    },

    /**
     * Checks which platforms have credentials configured.
     * Called from Dashboard.html on load to show credential status indicators.
     * @returns {Object} - { twitter: bool, linkedin: bool, gbp: bool, tiktok: bool, youtube: bool }
     */
    getCredentialStatus: function () {
      // Returns true/false per platform — false = credentials not yet provisioned (graceful, no errors thrown)
      return {
        twitter: !!(PROPS.getProperty('TWITTER_API_KEY') && PROPS.getProperty('TWITTER_ACCESS_TOKEN')),
        linkedin: !!(PROPS.getProperty('LINKEDIN_ACCESS_TOKEN')),
        gbp: !!(PROPS.getProperty('GBP_ACCESS_TOKEN') && PROPS.getProperty('GBP_LOCATION_ID')),
        tiktok: !!(PROPS.getProperty('TIKTOK_ACCESS_TOKEN')),
        youtube: !!(PROPS.getProperty('YOUTUBE_ACCESS_TOKEN') && PROPS.getProperty('YOUTUBE_CHANNEL_ID')),
        facebook: !!(PROPS.getProperty('FB_PAGE_ACCESS_TOKEN') && PROPS.getProperty('FB_PAGE_ID')),
        instagram: !!(PROPS.getProperty("FB_PAGE_ACCESS_TOKEN") && PROPS.getProperty("INSTAGRAM_ACCOUNT_ID")),
        telegram: !!(PROPS.getProperty('TELEGRAM_BOT_TOKEN') && PROPS.getProperty('TELEGRAM_CHAT_ID')),
        threads: !!(PROPS.getProperty('THREADS_ACCESS_TOKEN')),
        skool: !!(PROPS.getProperty('SKOOL_API_KEY')),
        patreon: !!(PROPS.getProperty('PATREON_ACCESS_TOKEN'))
      };
    }

  };

})(); // end SocialPublisher


// ─── GAS Entry Points (called by google.script.run from Dashboard.html) ────────

/**
 * These wrapper functions expose SocialPublisher methods to the client-side HTML.
 * GAS requires top-level functions for google.script.run calls.
 */

function draftPosts(topic, context) {
  return SocialPublisher.draftPosts(topic, context);
}

function publishPost(platform, content, options) {
  return SocialPublisher.publishPost(platform, content, options);
}

function publishAll(posts) {
  return SocialPublisher.publishAll(posts);
}

function getSocialLastPostTimes() {
  return SocialPublisher.getLastPostTimes();
}

function getSocialCredentialStatus() {
  return SocialPublisher.getCredentialStatus();
}

/**
 * Run this function from the IDE to get the Google Business Profile authorization URL in the Execution Log
 */
function logAuthUrl_GBP() {
  var url = SocialPublisher.getAuthUrl('gbp');
  console.log('\\n=========================================\\n\\nGBP Auth URL (Visit this in your browser):\\n\\n' + url + '\\n\\n=========================================\\n');
}

/**
 * Helper function to fetch and list all Google Business Profile locations 
 * so the user can easily find their GBP_LOCATION_ID without manual API calls.
 */
function logGbpLocations() {
  var PROPS = PropertiesService.getScriptProperties();
  var accessToken = PROPS.getProperty('GBP_ACCESS_TOKEN');
  if (!accessToken) {
    console.error("Missing GBP_ACCESS_TOKEN. Please run logAuthUrl_GBP() and authorize first.");
    return;
  }

  // 1. Get Accounts
  var accountsUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
  var options = {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    muteHttpExceptions: true
  };

  console.log("Fetching GBP Accounts...");
  var accountsResponse = UrlFetchApp.fetch(accountsUrl, options);
  if (accountsResponse.getResponseCode() !== 200) {
    console.error("Failed to fetch accounts:", accountsResponse.getContentText());
    return;
  }

  var accountsData = JSON.parse(accountsResponse.getContentText());
  var accounts = accountsData.accounts || [];

  if (accounts.length === 0) {
    console.log("No GBP accounts found. Does this Google user manage any Business Profiles?");
    return;
  }

  console.log("Found " + accounts.length + " GBP Account(s). Fetching locations...");

  // 2. Look up locations for each account
  accounts.forEach(function (account) {
    console.log("\\n--- Account: " + account.accountName + " (" + account.name + ") ---");
    var locationsUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1/' + account.name + '/locations?readMask=name,title';
    var locResponse = UrlFetchApp.fetch(locationsUrl, options);

    if (locResponse.getResponseCode() === 200) {
      var locData = JSON.parse(locResponse.getContentText());
      var locations = locData.locations || [];
      if (locations.length === 0) {
        console.log("  No locations found in this account.");
      } else {
        locations.forEach(function (loc) {
          console.log("  => Business Title: " + loc.title);
          var locationId = loc.name.split('/')[1]; // locations/1234 -> 1234
          console.log("  => GBP_LOCATION_ID to save: " + locationId);
        });
      }
    } else {
      console.error("  Failed to fetch locations for this account:", locResponse.getContentText());
    }
  });

  console.log("\\n=========================================\\nCopy the correct GBP_LOCATION_ID from above and save it in Project Settings -> Script Properties.\\n=========================================\\n");
}

/**
 * Run this function from the IDE to get the YouTube authorization URL in the Execution Log
 */
function logAuthUrl_YouTube() {
  var url = SocialPublisher.getAuthUrl('youtube');
  console.log('\\n=========================================\\n\\nYouTube Auth URL (Visit this in your browser):\\n\\n' + url + '\\n\\n=========================================\\n');
}

/**
 * Run this function from the IDE to get the TikTok authorization URL in the Execution Log.
 * Prerequisites: TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET must already be set in Script Properties.
 * Use setTikTokTokens() in ScriptProperties_Temp.js to set those first.
 */
function logAuthUrl_TikTok() {
  var url = SocialPublisher.getAuthUrl('tiktok');
  console.log('\n=========================================\n\nTikTok Auth URL (Visit this in your browser):\n\n' + url + '\n\n=========================================\n');
}
/**
 * Run this function from the IDE to get the LinkedIn authorization URL in the Execution Log.
 * Prerequisites: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set in Script Properties.
 */
function logAuthUrl_LinkedIn() {
  var url = SocialPublisher.getAuthUrl('linkedin');
  console.log('\n=========================================\n\nLinkedIn Auth URL (Visit this in your browser):\n\n' + url + '\n\n=========================================\n');
}
/**
 * Run this function from the IDE to get the Facebook authorization URL in the Execution Log.
 * Prerequisites: FACEBOOK_CLIENT_ID must be set in Script Properties.
 */
function logAuthUrl_Facebook() {
  var url = SocialPublisher.getAuthUrl('facebook');
  console.log('\n=========================================\n\nFacebook Auth URL (Visit this in your browser):\n\n' + url + '\n\n=========================================\n');
}

/**
 * Run this function from the IDE to get the Threads authorization URL in the Execution Log.
 * Prerequisites: THREADS_CLIENT_ID must be set in Script Properties.
 */
function logAuthUrl_Threads() {
  var url = SocialPublisher.getAuthUrl('threads');
  console.log('\n=========================================\n\nThreads Auth URL (Visit this in your browser):\n\n' + url + '\n\n=========================================\n');
}

/**
 * After Facebook OAuth completes, this helper exchanges the short-lived user token
 * for a long-lived Page Access Token and stores it automatically.
 * Run this once after logAuthUrl_Facebook() and completing the OAuth flow.
 * The FB_USER_ACCESS_TOKEN must be set manually first from the OAuth callback.
 */
function exchangeFacebookTokenForPageToken() {
  var PROPS = PropertiesService.getScriptProperties();
  var userToken = PROPS.getProperty('FB_USER_ACCESS_TOKEN');
  var clientId = PROPS.getProperty('FACEBOOK_CLIENT_ID');
  var clientSecret = PROPS.getProperty('FACEBOOK_CLIENT_SECRET');
  var pageId = PROPS.getProperty('FB_PAGE_ID');

  if (!userToken) {
    console.error('FB_USER_ACCESS_TOKEN not set. Complete the OAuth flow first and manually set this property.');
    return;
  }
  if (!clientId || !clientSecret) {
    console.error('FACEBOOK_CLIENT_ID or FACEBOOK_CLIENT_SECRET not set.');
    return;
  }

  // Step 1: Exchange short-lived token for long-lived user token
  var llUrl = 'https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=' + clientId + '&client_secret=' + clientSecret + '&fb_exchange_token=' + userToken;
  var llRes = UrlFetchApp.fetch(llUrl, { muteHttpExceptions: true });
  if (llRes.getResponseCode() !== 200) {
    console.error('Failed to exchange token:', llRes.getContentText());
    return;
  }
  var llToken = JSON.parse(llRes.getContentText()).access_token;
  console.log('Long-lived user token obtained.');

  // Step 2: Get Page Access Token
  if (!pageId) {
    // List pages to find the ID
    var pagesUrl = 'https://graph.facebook.com/v21.0/me/accounts?access_token=' + llToken;
    var pagesRes = UrlFetchApp.fetch(pagesUrl, { muteHttpExceptions: true });
    var pagesData = JSON.parse(pagesRes.getContentText());
    console.log('Your Facebook Pages:');
    (pagesData.data || []).forEach(function (p) {
      console.log('  Page: ' + p.name + ' | ID: ' + p.id + ' | Token: ' + p.access_token.substring(0, 20) + '...');
    });
    console.log('Set FB_PAGE_ID in Script Properties to one of the IDs above, then run this function again.');
    return;
  }

  var pageTokenUrl = 'https://graph.facebook.com/v21.0/' + pageId + '?fields=access_token&access_token=' + llToken;
  var pageTokenRes = UrlFetchApp.fetch(pageTokenUrl, { muteHttpExceptions: true });
  if (pageTokenRes.getResponseCode() !== 200) {
    console.error('Failed to get page token:', pageTokenRes.getContentText());
    return;
  }
  var pageToken = JSON.parse(pageTokenRes.getContentText()).access_token;
  PROPS.setProperty('FB_PAGE_ACCESS_TOKEN', pageToken);
  console.log('\u2705 FB_PAGE_ACCESS_TOKEN stored successfully for page ' + pageId + '.');
  console.log('Instagram Business Account will be auto-discovered on first Instagram post.');
}

/**
 * After Threads OAuth completes, this helper exchanges the short-lived token
 * for a long-lived Threads access token (valid 60 days) and stores it.
 * The THREADS_SHORT_LIVED_TOKEN must be set manually first from the OAuth callback.
 */
function exchangeThreadsTokenForLongLived() {
  var PROPS = PropertiesService.getScriptProperties();
  var shortToken = PROPS.getProperty('THREADS_SHORT_LIVED_TOKEN');
  var clientId = PROPS.getProperty('THREADS_CLIENT_ID');
  var clientSecret = PROPS.getProperty('THREADS_CLIENT_SECRET');

  if (!shortToken || !clientId || !clientSecret) {
    console.error('THREADS_SHORT_LIVED_TOKEN, THREADS_CLIENT_ID, or THREADS_CLIENT_SECRET not set.');
    return;
  }

  var url = 'https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=' + clientSecret + '&access_token=' + shortToken;
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    console.error('Failed to exchange Threads token:', res.getContentText());
    return;
  }
  var data = JSON.parse(res.getContentText());
  PROPS.setProperty('THREADS_ACCESS_TOKEN', data.access_token);
  PROPS.setProperty('THREADS_USER_ID', String(data.user_id));
  console.log('\u2705 THREADS_ACCESS_TOKEN and THREADS_USER_ID stored. Token valid for 60 days.');
}

/**
 * Sets the TELEGRAM_CHAT_ID for social broadcasting (the channel/group to post to).
 * This is SEPARATE from the intake bot — the bot token (TELEGRAM_BOT_TOKEN) is already set.
 * The TELEGRAM_CHAT_ID for social posts is the @username or numeric ID of your public channel.
 *
 * To find your channel ID:
 *   1. Add your bot to the Telegram channel as an admin.
 *   2. Send a test message to the channel.
 *   3. Visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
 *   4. Look for "chat": { "id": -100XXXXXXXXXX } — that is your TELEGRAM_CHAT_ID.
 *   5. Replace 'YOUR_CHANNEL_ID_HERE' below with that value and run this function once.
 */
function setTelegramSocialChatId() {
  var props = PropertiesService.getScriptProperties();
  // Replace with your actual Telegram channel ID (e.g. '@shamrockbailbonds' or '-100123456789')
  props.setProperty('TELEGRAM_CHAT_ID', 'YOUR_CHANNEL_ID_HERE');
  console.log('✅ Set TELEGRAM_CHAT_ID. Telegram social broadcasting is now active.');
  console.log('   Bot token already present:', !!(props.getProperty('TELEGRAM_BOT_TOKEN')));
}
/**
 * Legacy wrapper fallback, defaulting to gbp if run without arguments
 */
function getSocialAuthUrl(platform) {
  var p = platform || 'gbp';
  var url = SocialPublisher.getAuthUrl(p);
  console.log('Auth URL for ' + p + ':', url);
  return url;
}

/**
 * Native GAS callback for OAuth flows using /usercallback.
 * Defers to SocialPublisher.handleOAuthCallback.
 */
function socialAuthCallback(request) {
  var platform = request.parameter.platform;
  var code = request.parameter.code;

  if (!platform || !code) {
    return HtmlService.createHtmlOutput('<h1>Error</h1><p>Missing platform or authorization code in callback request.</p>');
  }

  var result = SocialPublisher.handleOAuthCallback(platform, code);

  if (result.success) {
    return HtmlService.createHtmlOutput('<h1>Authorization Successful!</h1><p>' + result.message + '</p><p>You may now close this tab.</p>');
  } else {
    return HtmlService.createHtmlOutput('<h1>Authorization Failed</h1><p>' + result.error + '</p>');
  }
}


// NOTE: client_generateSocialPosts lives in AI_Broadcaster.js (uses GrokClient).
// DO NOT add a duplicate here — SocialPublisher.js loads AFTER AI_Broadcaster.js
// alphabetically and would shadow the Grok-powered version.
