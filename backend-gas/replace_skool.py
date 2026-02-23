import sys

file_path = "/Users/brendan/Desktop/shamrock-bail-portal-site/backend-gas/SocialPublisher.js"
with open(file_path, "r") as f:
    content = f.read()

replacements = []

target_limits = """  var PLATFORM_LIMITS = {
    twitter: { chars: 280, label: 'X (Twitter)' },
    linkedin: { chars: 3000, label: 'LinkedIn' },
    gbp: { chars: 1500, label: 'Google Business Profile' },
    tiktok: { chars: 2200, label: 'TikTok' },
    youtube: { chars: 5000, label: 'YouTube Community' },
    telegram: { chars: 4096, label: 'Telegram' },
    facebook: { chars: 63206, label: 'Facebook' },
    instagram: { chars: 2200, label: 'Instagram' },
    threads: { chars: 500, label: 'Threads' }
  };"""

new_limits = """  var PLATFORM_LIMITS = {
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
  };"""
replacements.append((target_limits, new_limits))

target_ai = """      'Return a JSON object with exactly these keys: twitter, linkedin, gbp, tiktok, youtube, telegram, facebook, instagram, threads.',
      'Each value should be a ready-to-publish post string optimized for that platform.',
      'Respect these character limits strictly: twitter=280, linkedin=3000, gbp=1500, tiktok=2200, youtube=5000, telegram=4096, facebook=63206, instagram=2200, threads=500.',"""

new_ai = """      'Return a JSON object with exactly these keys: twitter, linkedin, gbp, tiktok, youtube, telegram, facebook, instagram, threads, skool, patreon.',
      'Each value should be a ready-to-publish post string optimized for that platform.',
      'Respect these character limits strictly: twitter=280, linkedin=3000, gbp=1500, tiktok=2200, youtube=5000, telegram=4096, facebook=63206, instagram=2200, threads=500, skool=10000, patreon=10000.',"""
replacements.append((target_ai, new_ai))

target_ai_hints = """      'For youtube: informative community post, can reference a video or blog post if relevant.',
      'Return ONLY valid JSON, no markdown code blocks, no extra text.'"""

new_ai_hints = """      'For youtube: informative community post, can reference a video or blog post if relevant.',
      'For skool: engaging community post to spark discussion in a course/group setting.',
      'For patreon: exclusive behind-the-scenes content or updates for supporters.',
      'Return ONLY valid JSON, no markdown code blocks, no extra text.'"""
replacements.append((target_ai_hints, new_ai_hints))

target_draft_docs = """     * @returns {Object} - { twitter, linkedin, gbp, tiktok, youtube, telegram, facebook, instagram, threads } draft strings."""
new_draft_docs = """     * @returns {Object} - { twitter, linkedin, gbp, tiktok, youtube, telegram, facebook, instagram, threads, skool, patreon } draft strings."""
replacements.append((target_draft_docs, new_draft_docs))

target_switch = """        switch (platform) {
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

new_switch = """        switch (platform) {
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
        }"""
replacements.append((target_switch, new_switch))

target_post_funcs = """  function postToThreads_(content, postOptions) {
    var token = PROPS.getProperty('THREADS_ACCESS_TOKEN');"""

new_post_funcs = """  function postToSkool_(content, postOptions) {
    // Skool does not currently have a public API for creating posts.
    return { success: false, platform: 'skool', note: 'Skool API posting not currently supported. Please copy the text and post manually.' };
  }

  function postToPatreon_(content, postOptions) {
    // Patreon requires complex OAuth flow for user tokens to create posts. 
    return { success: false, platform: 'patreon', note: 'Patreon API posting for creators requires advanced OAuth. Please copy the text and post manually.' };
  }

  function postToThreads_(content, postOptions) {
    var token = PROPS.getProperty('THREADS_ACCESS_TOKEN');"""
replacements.append((target_post_funcs, new_post_funcs))

for old_t, new_t in replacements:
    if old_t not in content:
        print(f"FAILED TO FIND TARGET: {old_t[:100]}")
        sys.exit(1)
    content = content.replace(old_t, new_t)
    print(f"Successfully replaced part starting with: {old_t[:50]}")

with open(file_path, "w") as f:
    f.write(content)

print("ALL DONE")
