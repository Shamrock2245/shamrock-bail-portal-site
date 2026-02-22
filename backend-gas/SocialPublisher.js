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
    twitter:   { chars: 280,   label: 'X (Twitter)' },
    linkedin:  { chars: 3000,  label: 'LinkedIn' },
    gbp:       { chars: 1500,  label: 'Google Business Profile' },
    tiktok:    { chars: 2200,  label: 'TikTok' },
    youtube:   { chars: 5000,  label: 'YouTube Community' }
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

  // ─── PRIVATE: Twitter / X API v2 ────────────────────────────────────────────

  /**
   * Posts a tweet using Twitter API v2 with OAuth 1.0a (User Context).
   * Requires: TWITTER_API_KEY, TWITTER_API_SECRET,
   *           TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET
   */
  function postToTwitter_(content) {
    var apiKey        = PROPS.getProperty('TWITTER_API_KEY');
    var apiSecret     = PROPS.getProperty('TWITTER_API_SECRET');
    var accessToken   = PROPS.getProperty('TWITTER_ACCESS_TOKEN');
    var accessSecret  = PROPS.getProperty('TWITTER_ACCESS_TOKEN_SECRET');

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error('Twitter credentials missing. Check Script Properties: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET');
    }

    var url = 'https://api.twitter.com/2/tweets';
    var payload = JSON.stringify({ text: content });

    // Build OAuth 1.0a signature
    var oauthHeader = buildOAuth1Header_('POST', url, {}, apiKey, apiSecret, accessToken, accessSecret);

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': oauthHeader },
      payload: payload,
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
   * Minimal OAuth 1.0a header builder for Twitter.
   */
  function buildOAuth1Header_(method, url, params, consumerKey, consumerSecret, token, tokenSecret) {
    var nonce = Utilities.getUuid().replace(/-/g, '');
    var timestamp = Math.floor(Date.now() / 1000).toString();

    var oauthParams = {
      oauth_consumer_key:     consumerKey,
      oauth_nonce:            nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp:        timestamp,
      oauth_token:            token,
      oauth_version:          '1.0'
    };

    // Merge all params for signature base
    var allParams = Object.assign({}, params, oauthParams);
    var sortedKeys = Object.keys(allParams).sort();
    var paramString = sortedKeys.map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(allParams[k]);
    }).join('&');

    var signatureBase = method.toUpperCase() + '&' + encodeURIComponent(url) + '&' + encodeURIComponent(paramString);
    var signingKey = encodeURIComponent(consumerSecret) + '&' + encodeURIComponent(tokenSecret);

    var signature = Utilities.base64Encode(
      Utilities.computeHmacSha256Signature(signatureBase, signingKey)
    );
    oauthParams['oauth_signature'] = signature;

    var headerParts = Object.keys(oauthParams).sort().map(function(k) {
      return encodeURIComponent(k) + '="' + encodeURIComponent(oauthParams[k]) + '"';
    });

    return 'OAuth ' + headerParts.join(', ');
  }

  // ─── PRIVATE: LinkedIn API ──────────────────────────────────────────────────

  /**
   * Posts a text update to a LinkedIn Company Page.
   * Requires: LINKEDIN_ACCESS_TOKEN, LINKEDIN_COMPANY_URN
   */
  function postToLinkedIn_(content) {
    var accessToken  = PROPS.getProperty('LINKEDIN_ACCESS_TOKEN');
    var companyUrn   = PROPS.getProperty('LINKEDIN_COMPANY_URN');

    if (!accessToken) throw new Error('LinkedIn credentials missing. Check Script Properties: LINKEDIN_ACCESS_TOKEN, LINKEDIN_COMPANY_URN');
    if (!companyUrn)  throw new Error('LINKEDIN_COMPANY_URN not set. Format: urn:li:organization:12345678');

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
  function postToGBP_(content) {
    var accessToken = PROPS.getProperty('GBP_ACCESS_TOKEN');
    var locationId  = PROPS.getProperty('GBP_LOCATION_ID');

    if (!accessToken) throw new Error('GBP credentials missing. Check Script Properties: GBP_ACCESS_TOKEN, GBP_LOCATION_ID');
    if (!locationId)  throw new Error('GBP_LOCATION_ID not set. Find it in Google Business Profile API explorer.');

    var url = 'https://mybusiness.googleapis.com/v4/accounts/-/locations/' + locationId + '/localPosts';
    var payload = {
      languageCode: 'en-US',
      summary: content,
      topicType: 'STANDARD'
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
      return { success: true, id: body.name, platform: 'gbp' };
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
  function postToTikTok_(content) {
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
  function postToYouTube_(content) {
    var accessToken = PROPS.getProperty('YOUTUBE_ACCESS_TOKEN');
    var channelId   = PROPS.getProperty('YOUTUBE_CHANNEL_ID');

    if (!accessToken) throw new Error('YouTube credentials missing. Check Script Properties: YOUTUBE_ACCESS_TOKEN, YOUTUBE_CHANNEL_ID');
    if (!channelId)   throw new Error('YOUTUBE_CHANNEL_ID not set. Find it in YouTube Account Advanced Settings.');

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
    } else {
      throw new Error('YouTube API Error ' + code + ': ' + response.getContentText());
    }
  }

  // ─── PRIVATE: AI Draft Generator ────────────────────────────────────────────

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
      'Return a JSON object with exactly these keys: twitter, linkedin, gbp, tiktok, youtube.',
      'Each value should be a ready-to-publish post string optimized for that platform.',
      'Respect these character limits strictly: twitter=280, linkedin=3000, gbp=1500, tiktok=2200, youtube=5000.',
      'For twitter: be punchy, include 2-3 relevant hashtags.',
      'For linkedin: professional tone, can be longer, include a question to drive engagement.',
      'For gbp: focus on local SEO keywords (Southwest Florida, Lee County, etc.), include phone number.',
      'For tiktok: conversational, use line breaks for readability, include trending hashtags.',
      'For youtube: informative community post, can reference a video or blog post if relevant.',
      'Return ONLY valid JSON, no markdown code blocks, no extra text.'
    ].join('\n');

    var payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt }
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
     * @returns {Object} - { twitter, linkedin, gbp, tiktok, youtube } draft strings.
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
     * Called from Dashboard.html via google.script.run.publishPost(platform, content)
     * @param {string} platform - One of: twitter, linkedin, gbp, tiktok, youtube
     * @param {string} content  - The post content string.
     * @returns {Object} - { success, id, platform } or { success: false, error }
     */
    publishPost: function (platform, content) {
      try {
        if (!content || content.trim() === '') throw new Error('Post content cannot be empty.');

        var limit = PLATFORM_LIMITS[platform];
        if (!limit) throw new Error('Unknown platform: ' + platform + '. Valid: twitter, linkedin, gbp, tiktok, youtube');
        if (content.length > limit.chars) throw new Error(limit.label + ' post exceeds ' + limit.chars + ' character limit (' + content.length + ' chars).');

        var result;
        switch (platform) {
          case 'twitter':  result = postToTwitter_(content);  break;
          case 'linkedin': result = postToLinkedIn_(content); break;
          case 'gbp':      result = postToGBP_(content);      break;
          case 'tiktok':   result = postToTikTok_(content);   break;
          case 'youtube':  result = postToYouTube_(content);  break;
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
        var content = posts[platform];
        if (!content || content.trim() === '') {
          results[platform] = { success: false, error: 'Empty content — skipped.', platform: platform };
          continue;
        }
        results[platform] = SocialPublisher.publishPost(platform, content);
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
        twitter:  getLastPostTime_('twitter'),
        linkedin: getLastPostTime_('linkedin'),
        gbp:      getLastPostTime_('gbp'),
        tiktok:   getLastPostTime_('tiktok'),
        youtube:  getLastPostTime_('youtube')
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
            '&state=' + platform;
        }
        case 'linkedin': {
          var liClientId = PROPS.getProperty('LINKEDIN_CLIENT_ID');
          if (!liClientId) return 'ERROR: Set LINKEDIN_CLIENT_ID in Script Properties first.';
          return 'https://www.linkedin.com/oauth/v2/authorization?' +
            'response_type=code' +
            '&client_id=' + encodeURIComponent(liClientId) +
            '&redirect_uri=' + encodeURIComponent(callbackUrl) +
            '&scope=w_member_social%20r_organization_social%20w_organization_social' +
            '&state=linkedin';
        }
        case 'tiktok': {
          var ttClientKey = PROPS.getProperty('TIKTOK_CLIENT_KEY');
          if (!ttClientKey) return 'ERROR: Set TIKTOK_CLIENT_KEY in Script Properties first.';
          return 'https://www.tiktok.com/v2/auth/authorize/?' +
            'client_key=' + encodeURIComponent(ttClientKey) +
            '&response_type=code' +
            '&scope=user.info.basic,video.publish,video.upload' +
            '&redirect_uri=' + encodeURIComponent(callbackUrl) +
            '&state=tiktok';
        }
        default:
          return 'ERROR: Unknown platform "' + platform + '". Valid: gbp, linkedin, tiktok, youtube';
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
            clientId     = PROPS.getProperty('GOOGLE_OAUTH_CLIENT_ID');
            clientSecret = PROPS.getProperty('GOOGLE_OAUTH_CLIENT_SECRET');
            tokenUrl     = 'https://oauth2.googleapis.com/token';
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
            clientId     = PROPS.getProperty('LINKEDIN_CLIENT_ID');
            clientSecret = PROPS.getProperty('LINKEDIN_CLIENT_SECRET');
            tokenUrl     = 'https://www.linkedin.com/oauth/v2/accessToken';
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
            clientId     = PROPS.getProperty('TIKTOK_CLIENT_KEY');
            clientSecret = PROPS.getProperty('TIKTOK_CLIENT_SECRET');
            tokenUrl     = 'https://open.tiktokapis.com/v2/oauth/token/';
            payload = {
              client_key: clientId,
              client_secret: clientSecret,
              code: code,
              grant_type: 'authorization_code',
              redirect_uri: callbackUrl
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
      return {
        twitter:  !!(PROPS.getProperty('TWITTER_API_KEY') && PROPS.getProperty('TWITTER_ACCESS_TOKEN')),
        linkedin: !!(PROPS.getProperty('LINKEDIN_ACCESS_TOKEN')),
        gbp:      !!(PROPS.getProperty('GBP_ACCESS_TOKEN')),
        tiktok:   !!(PROPS.getProperty('TIKTOK_ACCESS_TOKEN')),
        youtube:  !!(PROPS.getProperty('YOUTUBE_ACCESS_TOKEN'))
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

function publishPost(platform, content) {
  return SocialPublisher.publishPost(platform, content);
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

function getSocialAuthUrl(platform) {
  return SocialPublisher.getAuthUrl(platform);
}
