import sys

file_path = "/Users/brendan/Desktop/shamrock-bail-portal-site/backend-gas/SocialPublisher.js"
with open(file_path, "r") as f:
    content = f.read()

replacements = []

# 1. postToTwitter
target1 = """  function postToTwitter_(content) {
    var apiKey = PROPS.getProperty('TWITTER_API_KEY');
    var apiSecret = PROPS.getProperty('TWITTER_API_SECRET');
    var accessToken = PROPS.getProperty('TWITTER_ACCESS_TOKEN');
    var accessSecret = PROPS.getProperty('TWITTER_ACCESS_TOKEN_SECRET');

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
    };"""

new1 = """  function postToTwitter_(content, postOptions) {
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
    };"""

replacements.append((target1, new1))

# 2. insert helpers after buildOAuth1Header_
target2 = """    return 'OAuth ' + headerParts.join(', ');
  }"""

new2 = """    return 'OAuth ' + headerParts.join(', ');
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
  }"""
replacements.append((target2, new2))

# 3. postToLinkedIn
target3 = """  function postToLinkedIn_(content) {
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
    };"""

new3 = """  function postToLinkedIn_(content, postOptions) {
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
    }"""
replacements.append((target3, new3))

# 4. postToGBP
target4 = """  function postToGBP_(content) {
    var accessToken = PROPS.getProperty('GBP_ACCESS_TOKEN');
    var locationId = PROPS.getProperty('GBP_LOCATION_ID');

    if (!accessToken) throw new Error('GBP credentials missing. Check Script Properties: GBP_ACCESS_TOKEN, GBP_LOCATION_ID');
    if (!locationId) throw new Error('GBP_LOCATION_ID not set. Find it in Google Business Profile API explorer.');

    var url = 'https://mybusiness.googleapis.com/v4/accounts/-/locations/' + locationId + '/localPosts';
    var payload = {
      languageCode: 'en-US',
      summary: content,
      topicType: 'STANDARD'
    };"""

new4 = """  function postToGBP_(content, postOptions) {
    var accessToken = PROPS.getProperty('GBP_ACCESS_TOKEN');
    var locationId = PROPS.getProperty('GBP_LOCATION_ID');

    if (!accessToken) throw new Error('GBP credentials missing. Check Script Properties: GBP_ACCESS_TOKEN, GBP_LOCATION_ID');
    if (!locationId) throw new Error('GBP_LOCATION_ID not set. Find it in Google Business Profile API explorer.');

    var url = 'https://mybusiness.googleapis.com/v4/accounts/-/locations/' + locationId + '/localPosts';
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
    }"""
replacements.append((target4, new4))

# 5. postToTikTok
target5 = """  function postToTikTok_(content) {
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
    };"""

new5 = """  function postToTikTok_(content, postOptions) {
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
    }"""
replacements.append((target5, new5))

# 6. postToYouTube
target6 = """  function postToYouTube_(content) {"""
new6 = """  function postToYouTube_(content, postOptions) {"""
replacements.append((target6, new6))

# 7. postToTelegram
target7 = """  function postToTelegram_(content) {
    var botToken = PROPS.getProperty('TELEGRAM_BOT_TOKEN');
    var chatId = PROPS.getProperty('TELEGRAM_CHAT_ID');
    if (!botToken || !chatId) {
      throw new Error('Telegram credentials missing. Check Script Properties: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
    }

    var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    var payload = { chat_id: chatId, text: content };

    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };"""

new7 = """  function postToTelegram_(content, postOptions) {
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
    }"""
replacements.append((target7, new7))

# 8. postToFacebook
target8 = """  function postToFacebook_(content) {
    var token = PROPS.getProperty('FB_PAGE_ACCESS_TOKEN');
    var pageId = PROPS.getProperty('FB_PAGE_ID');
    if (!token || !pageId) {
      throw new Error('Facebook credentials missing. Check Script Properties: FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID');
    }

    var url = 'https://graph.facebook.com/v19.0/' + pageId + '/feed';
    var payload = { message: content, access_token: token };

    var options = {
      method: 'post',
      payload: payload,
      muteHttpExceptions: true
    };"""

new8 = """  function postToFacebook_(content, postOptions) {
    var token = PROPS.getProperty('FB_PAGE_ACCESS_TOKEN');
    var pageId = PROPS.getProperty('FB_PAGE_ID');
    if (!token || !pageId) {
      throw new Error('Facebook credentials missing. Check Script Properties: FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID');
    }

    var url, payload;
    if (postOptions && postOptions.driveFileId) {
      url = 'https://graph.facebook.com/v19.0/' + pageId + '/photos';
      payload = {
        message: content,
        access_token: token,
        source: DriveApp.getFileById(postOptions.driveFileId).getBlob()
      };
    } else {
      url = 'https://graph.facebook.com/v19.0/' + pageId + '/feed';
      payload = { message: content, access_token: token };
    }

    var options = {
      method: 'post',
      payload: payload,
      muteHttpExceptions: true
    };"""
replacements.append((target8, new8))

# 9. postToInstagram
target9 = """  function postToInstagram_(content) {
    throw new Error('Instagram Graph API requires an image or video for feed posts. Text-only posting is unsupported by Meta API. Please copy the text and post manually.');
  }"""

new9 = """  function postToInstagram_(content, postOptions) {
    if (!postOptions || !postOptions.driveFileId) {
      throw new Error('Instagram Graph API requires an image or video for feed posts. Text-only posting is unsupported by Meta API. Please attach media.');
    }
    
    var token = PROPS.getProperty('FB_PAGE_ACCESS_TOKEN');
    var pageId = PROPS.getProperty('FB_PAGE_ID');
    var instaAccountId = PROPS.getProperty('INSTAGRAM_ACCOUNT_ID');
    
    if (!token || !pageId) {
      throw new Error('Facebook/Instagram credentials missing. Check Script Properties for FB_PAGE_ACCESS_TOKEN.');
    }

    if (!instaAccountId) {
       var igFetch = UrlFetchApp.fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=instagram_business_account&access_token=' + token, { muteHttpExceptions: true });
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

    var publicUrl = getDriveFilePublicUrl_(postOptions.driveFileId);
    
    // Step 1: Create media container
    var initUrl = 'https://graph.facebook.com/v19.0/' + instaAccountId + '/media?image_url=' + encodeURIComponent(publicUrl) + '&caption=' + encodeURIComponent(content) + '&access_token=' + token;
    var initRes = UrlFetchApp.fetch(initUrl, { method: 'post', muteHttpExceptions: true });
    
    if (initRes.getResponseCode() >= 300) {
      throw new Error('Instagram Media Init Error: ' + initRes.getContentText());
    }
    var creationId = JSON.parse(initRes.getContentText()).id;

    // Step 2: Publish media container
    var pubUrl = 'https://graph.facebook.com/v19.0/' + instaAccountId + '/media_publish?creation_id=' + creationId + '&access_token=' + token;
    var pubRes = UrlFetchApp.fetch(pubUrl, { method: 'post', muteHttpExceptions: true });
    
    var pCode = pubRes.getResponseCode();
    if (pCode >= 200 && pCode < 300) {
      return { success: true, id: JSON.parse(pubRes.getContentText()).id, platform: 'instagram' };
    } else {
      throw new Error('Instagram Publish Error ' + pCode + ': ' + pubRes.getContentText());
    }
  }"""
replacements.append((target9, new9))

# 10. postToThreads
target10 = """  function postToThreads_(content) {
    var token = PROPS.getProperty('THREADS_ACCESS_TOKEN');
    var userId = PROPS.getProperty('THREADS_USER_ID');
    if (!token || !userId) {
      throw new Error('Threads credentials missing. Check Script Properties: THREADS_ACCESS_TOKEN, THREADS_USER_ID');
    }

    // Step 1: Create media container
    var initUrl = 'https://graph.threads.net/v1.0/' + userId + '/threads?media_type=TEXT&text=' + encodeURIComponent(content) + '&access_token=' + token;
    var initRes = UrlFetchApp.fetch(initUrl, { method: 'post', muteHttpExceptions: true });"""

new10 = """  function postToThreads_(content, postOptions) {
    var token = PROPS.getProperty('THREADS_ACCESS_TOKEN');
    var userId = PROPS.getProperty('THREADS_USER_ID');
    if (!token || !userId) {
      throw new Error('Threads credentials missing. Check Script Properties: THREADS_ACCESS_TOKEN, THREADS_USER_ID');
    }

    var initUrl;
    if (postOptions && postOptions.driveFileId) {
      var publicUrl = getDriveFilePublicUrl_(postOptions.driveFileId);
      initUrl = 'https://graph.threads.net/v1.0/' + userId + '/threads?media_type=IMAGE&image_url=' + encodeURIComponent(publicUrl) + '&text=' + encodeURIComponent(content) + '&access_token=' + token;
    } else {
      initUrl = 'https://graph.threads.net/v1.0/' + userId + '/threads?media_type=TEXT&text=' + encodeURIComponent(content) + '&access_token=' + token;
    }

    var initRes = UrlFetchApp.fetch(initUrl, { method: 'post', muteHttpExceptions: true });"""
replacements.append((target10, new10))


target11 = """        switch (platform) {
          case 'twitter': result = postToTwitter_(content); break;
          case 'linkedin': result = postToLinkedIn_(content); break;
          case 'gbp': result = postToGBP_(content); break;
          case 'tiktok': result = postToTikTok_(content); break;
          case 'youtube': result = postToYouTube_(content); break;
          case 'telegram': result = postToTelegram_(content); break;
          case 'facebook': result = postToFacebook_(content); break;
          case 'instagram': result = postToInstagram_(content); break;
          case 'threads': result = postToThreads_(content); break;
        }"""
        
new11 = """        switch (platform) {
          case 'twitter': result = postToTwitter_(content, options); break;
          case 'linkedin': result = postToLinkedIn_(content, options); break;
          case 'gbp': result = postToGBP_(content, options); break;
          case 'tiktok': result = postToTikTok_(content, options); break;
          case 'youtube': result = postToYouTube_(content, options); break;
          case 'telegram': result = postToTelegram_(content, options); break;
          case 'facebook': result = postToFacebook_(content, options); break;
          case 'instagram': result = postToInstagram_(content, options); break;
          case 'threads': result = postToThreads_(content, options); break;
        }"""
replacements.append((target11, new11))

for old_t, new_t in replacements:
    if old_t not in content:
        print(f"FAILED TO FIND TARGET: {old_t[:100]}")
        sys.exit(1)
    content = content.replace(old_t, new_t)
    print(f"Successfully replaced part starting with: {old_t[:50]}")

with open(file_path, "w") as f:
    f.write(content)

print("ALL DONE")
