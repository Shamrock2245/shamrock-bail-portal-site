/**
 * GrokDashboardHandlers.js
 * 
 * Server-side GAS functions callable from Dashboard.html via google.script.run.
 * Powers three Grok-integrated features:
 *   1. Social Media Post Generation (multi-platform)
 *   2. Outreach Message AI Rewrite (personalized SMS)
 *   3. Grok Chat (general-purpose KB assistant)
 * 
 * All functions use callGrok() from GrokClient.js with the full Shamrock KB.
 */

// ─── Platform Configurations ───
const SOCIAL_PLATFORM_CONFIG = {
  x: { name: 'X (Twitter)', maxChars: 280, icon: '𝕏', tone: 'punchy, concise, hashtags' },
  facebook: { name: 'Facebook', maxChars: 2000, icon: '📘', tone: 'warm, community-focused, conversational' },
  instagram: { name: 'Instagram', maxChars: 2200, icon: '📸', tone: 'visual storytelling, emoji-rich, inspirational' },
  threads: { name: 'Threads', maxChars: 500, icon: '🧵', tone: 'casual, conversational, authentic' },
  linkedin: { name: 'LinkedIn', maxChars: 3000, icon: '💼', tone: 'professional, authoritative, educational' },
  google: { name: 'Google Business', maxChars: 1500, icon: '📍', tone: 'local SEO, service-focused, clear call-to-action' },
  telegram: { name: 'Telegram', maxChars: 4096, icon: '✈️', tone: 'direct, informative, client-friendly' },
  youtube: { name: 'YouTube', maxChars: 5000, icon: '▶️', tone: 'video description style, detailed, keyword-rich' },
  tiktok: { name: 'TikTok', maxChars: 2200, icon: '🎵', tone: 'trendy, Gen-Z friendly, casual, catchy hooks' }
};

// ─── 1. Social Media Post Generation ───

/**
 * Generate platform-specific social media post variants from a base idea/post.
 * Called from Dashboard.html via google.script.run.grokGenerateSocialPosts(data)
 * 
 * @param {Object} data - { basePost: string, platforms: string[] }
 * @returns {Object} { success: boolean, variants: { [platform]: { text, charCount, hashtags } }, error?: string }
 */
function grokGenerateSocialPosts(data) {
  try {
    if (!data || !data.basePost) {
      return { success: false, error: 'Base post content is required.' };
    }

    const platforms = data.platforms || ['x', 'facebook', 'instagram'];
    
    // Build platform instructions
    const platformInstructions = platforms.map(p => {
      const config = SOCIAL_PLATFORM_CONFIG[p];
      if (!config) return null;
      return `- **${config.name}** (${config.icon}): Max ${config.maxChars} characters. Tone: ${config.tone}.`;
    }).filter(Boolean).join('\n');

    const systemPrompt = `You are the Social Media Manager for Shamrock Bail Bonds, a premium bail bond agency in Southwest Florida.

BRAND VOICE:
- Professional, helpful, calm, and community-oriented
- Never shame anyone for being arrested — it's a stressful time and we're here to help
- Never give legal advice — always say "consult your attorney"
- Emphasize: 24/7 availability, fast service, all 67 Florida counties, mobile-first experience
- Use the ☘️ shamrock emoji occasionally but don't overdo it
- Office: 1528 Broadway, Fort Myers, FL 33901 | Phone: (727) 295-2245
- Website: shamrockbailbonds.biz

TASK:
Given the base post idea below, generate ONE optimized variant for EACH of the following platforms. Each variant should be tailored to the platform's character limits, audience, and tone.

PLATFORMS:
${platformInstructions}

RULES:
1. Each variant must be its OWN original take — not just the same text truncated
2. Include relevant hashtags where appropriate (X, Instagram, TikTok)
3. Include a call-to-action where appropriate
4. Never use the word "bail" in a negative/shameful context
5. Stay 10DLC compliant — no spam language
6. Do NOT include platform labels — just provide the content

Respond in valid JSON format:
{
  "variants": {
    "<platform_key>": {
      "text": "the post text",
      "hashtags": ["tag1", "tag2"]
    }
  }
}`;

    const response = callGrok(systemPrompt, `Base post idea: "${data.basePost}"`, {
      useKnowledgeBase: true,
      temperature: 0.85,
      jsonMode: true
    });

    if (!response) {
      return { success: false, error: 'Grok returned no response. Check API key.' };
    }

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return { success: false, error: 'Failed to parse Grok response.', raw: response };
      }
    }

    // Enrich with metadata
    const enrichedVariants = {};
    for (const [platform, variant] of Object.entries(parsed.variants || {})) {
      const config = SOCIAL_PLATFORM_CONFIG[platform];
      enrichedVariants[platform] = {
        text: variant.text || '',
        hashtags: variant.hashtags || [],
        charCount: (variant.text || '').length,
        maxChars: config ? config.maxChars : 0,
        platformName: config ? config.name : platform,
        icon: config ? config.icon : '📝',
        isOverLimit: config ? (variant.text || '').length > config.maxChars : false
      };
    }

    return { success: true, variants: enrichedVariants };

  } catch (e) {
    console.error('⛔ grokGenerateSocialPosts error:', e);
    return { success: false, error: e.message || 'Unknown error generating social posts.' };
  }
}


// ─── 2. Outreach Message AI Rewrite ───

/**
 * Generate a personalized, natural-sounding outreach message using Grok + KB.
 * Returns 3 variants so the agent can pick their favorite.
 * Called from Dashboard.html via google.script.run.grokGenerateOutreachMessage(data)
 * 
 * @param {Object} data - { defendantName, county, agentName, template, tone }
 * @returns {Object} { success: boolean, variants: string[], error?: string }
 */
function grokGenerateOutreachMessage(data) {
  try {
    if (!data) {
      return { success: false, error: 'Outreach data is required.' };
    }

    const defendantName = data.defendantName || 'the defendant';
    const county = data.county || 'their county';
    const agentName = data.agentName || 'Brendan';
    const template = data.template || 'arrest_outreach';
    const tone = data.tone || 'professional and warm';

    let contextDescription = '';
    if (template === 'arrest_outreach') {
      contextDescription = `This is a FIRST CONTACT message. ${defendantName} was recently arrested in ${county} County and we want to offer our bail bond services.`;
    } else if (template === 'follow_up') {
      contextDescription = `This is a FOLLOW-UP message. We previously reached out about ${defendantName} in ${county} County and want to check if they still need help.`;
    } else {
      contextDescription = `This is a ${template} message regarding ${defendantName} in ${county} County.`;
    }

    const systemPrompt = `You are writing SMS text messages on behalf of ${agentName} from Shamrock Bail Bonds, a trusted bail bond agency in Southwest Florida.

CONTEXT:
${contextDescription}

CRITICAL RULES:
1. Keep messages SHORT — under 160 characters ideal, 300 max. This is SMS.
2. Sound like a REAL PERSON, not a robot — natural, empathetic, helpful
3. NEVER shame the person for being arrested
4. NEVER provide legal advice
5. Include the agent's first name (${agentName})
6. Mention "Shamrock Bail Bonds" once
7. Include a call-to-action (call us, reply to this text, etc.)
8. Be 10DLC compliant — no spam triggers, no ALL CAPS, no excessive punctuation
9. Use the defendant's FIRST NAME only (${defendantName})
10. Reference ${county} County if natural to do so

TONE: ${tone}

Generate EXACTLY 3 different message variants. Each should feel unique — different angles, different hooks.

Respond in valid JSON format:
{
  "variants": [
    "message 1 text",
    "message 2 text",
    "message 3 text"
  ]
}`;

    const response = callGrok(systemPrompt, `Generate 3 outreach message variants for ${defendantName} in ${county} County.`, {
      useKnowledgeBase: true,
      temperature: 0.9,
      jsonMode: true
    });

    if (!response) {
      return { success: false, error: 'Grok returned no response. Check API key.' };
    }

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return { success: false, error: 'Failed to parse Grok response.', raw: response };
      }
    }

    const variants = parsed.variants || [];
    if (variants.length === 0) {
      return { success: false, error: 'Grok returned no variants.' };
    }

    return { success: true, variants: variants };

  } catch (e) {
    console.error('⛔ grokGenerateOutreachMessage error:', e);
    return { success: false, error: e.message || 'Unknown error generating outreach message.' };
  }
}


// ─── 3. Grok Chat (General KB Assistant) ───

/**
 * General-purpose Grok chat with full Shamrock KB context.
 * Supports conversation history for multi-turn interactions.
 * Called from Dashboard.html via google.script.run.grokChat(data)
 * 
 * @param {Object} data - { message: string, conversationHistory?: [{role, content}] }
 * @returns {Object} { success: boolean, reply: string, error?: string }
 */
function grokChat(data) {
  try {
    if (!data || !data.message) {
      return { success: false, error: 'Message is required.' };
    }

    const systemPrompt = `You are "Grok" — the internal AI assistant for Shamrock Bail Bonds. You have access to the full Shamrock knowledge base covering all 67 Florida counties, bail procedures, office operations, and more.

WHO YOU SERVE:
You are talking to a Shamrock STAFF MEMBER (bondsman, agent, or manager), not a client. Be direct, professional, and helpful. You can discuss internal operations openly.

CAPABILITIES:
- Answer questions about county-specific bail procedures, jail locations, court info
- Draft client-facing messages (SMS, social media, email)
- Explain bail bond laws and procedures (FL-specific)
- Help with operational decisions (risk assessment, pricing, logistics)
- Generate content ideas for marketing and outreach

RULES:
1. Use the knowledge base data provided to give accurate, specific answers
2. If you don't know something, say so — never fabricate county data
3. Be concise but thorough
4. Use markdown formatting for readability (bold, lists, etc.)
5. When referencing county data, include specifics (jail address, court address, tips)
6. For legal questions, always caveat with "verify with counsel"`;

    // Build messages array with conversation history
    const messages = [];
    
    if (data.conversationHistory && Array.isArray(data.conversationHistory)) {
      // Only keep last 10 messages to stay within token limits
      const recentHistory = data.conversationHistory.slice(-10);
      messages.push(...recentHistory);
    }
    
    messages.push({ role: 'user', content: data.message });

    const response = callGrok(messages, systemPrompt, {
      useKnowledgeBase: true,
      temperature: 0.7
    });

    if (!response) {
      return { success: false, error: 'Grok returned no response. Check API key in Script Properties.' };
    }

    return { success: true, reply: response };

  } catch (e) {
    console.error('⛔ grokChat error:', e);
    return { success: false, error: e.message || 'Unknown error in Grok chat.' };
  }
}


// ─── Utility: Test Grok API Key ───

/**
 * Quick health check for Grok API connectivity.
 * Call from Dashboard: google.script.run.testGrokConnection()
 */
function testGrokConnection() {
  try {
    const client = new GrokClient();
    if (!client.hasKey()) {
      return { success: false, error: 'GROK_API_KEY not found in Script Properties.' };
    }
    
    const response = client.chat('Say "Shamrock connected!" in exactly 3 words.', null, { temperature: 0 });
    
    if (response) {
      return { success: true, message: response, model: client.MODEL };
    }
    return { success: false, error: 'No response received.' };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}
