/**
 * AI_Broadcaster.js
 * 
 * Handles the generation of multi-platform social media posts via Grok.
 */

function client_generateSocialPosts(basePost, platforms, useOpus = false) {
    try {
        const grokClient = new GrokClient();

        if (!grokClient.hasKey()) {
            return {
                success: false,
                error: "GROK_API_KEY is not configured in Script Properties. Please add it via Setup_Properties.js."
            };
        }

        let personaGuidelines = `
- **YouTube/TikTok/Opus Clips (Long Form/Video Focus):** "The Expert Educator/Bondsman". Focus on CEUs, masterclass knowledge, and deeper explanations of the bail process.
- **Facebook/X/LinkedIn/GBP/Telegram/Threads:** "The Helpful Bondsman". Fast, reassuring, local-SEO focused (for GBP), and highly responsive to current events.
- **Skool/Patreon (Community/Premium):** "The Insider/Mentor". Exclusive content, behind-the-scenes insights, and community-building focus.`;

        const systemPrompt = `You are the expert social media manager for 'Shamrock Bail Bonds', the premier and most modern bail bond agency in Southwest Florida.
Your tone is professional, reassuring, fast-acting ("The Uber of Bail Bonds"), and highly authoritative. 
Do not use cheap, spammy sales tactics. We are a premium service. Always emphasize our speed, 24/7 availability, and frictionless process (e.g., electronic paperwork).

The user will provide a "Base Post" or idea. Your task is to rewrite this idea into optimized, ready-to-publish posts for the requested platforms.
Follow all character limits, hashtag best practices, and stylistic conventions for each specific platform.
Make sure to include a clear Call-to-Action (CTA) such as calling our office or visiting our website.

Apply these dynamic persona styles based on the target platform:
${personaGuidelines}

CRITICAL INSTRUCTION: You MUST return strictly a valid JSON object. Do not wrap it in markdown codeblocks. 
The keys of the JSON object must be exactly the platform identifiers requested, in lowercase. The values must be the finalized post text.

Example format:
{
  "facebook": "Text for Facebook...",
  "twitter": "Text for X (Twitter)...",
  "skool": "Text for Skool..."
}`;

        let userMessage = `Rewrite the following base post for these platforms: ${platforms.join(', ')}.\n\nBase Post:\n"${basePost}"`;
        if (useOpus) {
            userMessage += `\n\nNOTE: The user has opted to generate short-form videos using Opus Clips. For platforms like TikTok, Instagram, and YouTube Shorts, please write the post as a video hook/script accompanied by the caption text.`;
        }

        const responseText = grokClient.chat(userMessage, systemPrompt, { temperature: 0.7, jsonMode: true });

        if (!responseText) {
            return { success: false, error: "Received empty response from Grok." };
        }

        // Clean up markdown wrapping if Grok ignores the instruction or response format fails
        let rawJson = responseText.trim();
        if (rawJson.startsWith('```json')) {
            rawJson = rawJson.substring(7);
        }
        if (rawJson.startsWith('```')) {
            rawJson = rawJson.substring(3);
        }
        if (rawJson.endsWith('```')) {
            rawJson = rawJson.substring(0, rawJson.length - 3);
        }
        rawJson = rawJson.trim();

        let variants = {};
        try {
            variants = JSON.parse(rawJson);
        } catch (parseError) {
            console.error("Failed to parse Grok JSON:", responseText);
            return { success: false, error: "Failed to parse AI response as JSON. Try modifying the prompt." };
        }

        return {
            success: true,
            variants: variants
        };
    } catch (e) {
        console.error("client_generateSocialPosts Error:", e);
        return {
            success: false,
            error: e.message
        };
    }
}

/**
 * client_fetchTrendingNews
 * Fetches trending news or synthesizes a post based on a topic using Grok (acting as the News Reactor).
 * Future enhancement: Integrate directly with X API to grab live trending hashtags before prompting Grok.
 */
function client_fetchTrendingNews(topic) {
    try {
        const grokClient = new GrokClient();

        if (!grokClient.hasKey()) {
            return {
                success: false,
                error: "GROK_API_KEY is not configured in Script Properties."
            };
        }

        const systemPrompt = `You are the expert social media manager for 'Shamrock Bail Bonds', the premier and most modern bail bond agency in Southwest Florida.
Your tone is professional, reassuring, fast-acting, and highly authoritative. 
Your task is to act as the "News Reactor". The user will provide a topic (or leave it blank for general trending bail news).
You must write a highly engaging, single-paragraph "Base Post" that reacts to this news or topic. It should be formatted as a draft that will later be repurposed for multiple platforms. Do not include hashtags. Keep it under 400 characters.`;

        let userMessage = topic ? `Write a news-reactive base post about: ${topic}` : `What is a good trending topic in the bail bonds/criminal justice space right now? Write a reactive base post about it.`;

        const responseText = grokClient.chat(userMessage, systemPrompt, { temperature: 0.8 });

        if (!responseText) {
            return { success: false, error: "Received empty response from Grok." };
        }

        return {
            success: true,
            draft: responseText.trim()
        };
    } catch (e) {
        console.error("client_fetchTrendingNews Error:", e);
        return {
            success: false,
            error: e.message
        };
    }
}
