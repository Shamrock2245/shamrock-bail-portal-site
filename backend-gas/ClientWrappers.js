/**
 * ClientWrappers.js
 * 
 * IMPORTANT: This file exists ONLY as a reference index.
 * All client-facing functions now live in their authoritative modules.
 * 
 * DO NOT add wrapper functions here — GAS loads files alphabetically,
 * and thin wrappers in "C" would shadow real implementations in later files.
 * 
 * ┌────────────────────────────────┬──────────────────────────────┐
 * │ Function                       │ Lives In                     │
 * ├────────────────────────────────┼──────────────────────────────┤
 * │ client_generateSocialPosts     │ AI_Broadcaster.js (Grok)     │
 * │ client_fetchTrendingNews       │ AI_Broadcaster.js (Grok)     │
 * │ client_generateBlogAudio       │ AI_Broadcaster.js            │
 * │ client_scheduleSocialPosts     │ SocialCalendar.js            │
 * │ client_getScheduledPosts       │ SocialCalendar.js            │
 * │ client_parseBooking            │ Code.js                      │
 * │ client_analyzeLead             │ Code.js                      │
 * │ client_runInvestigator         │ Code.js                      │
 * │ client_checkSentiment          │ Code.js                      │
 * │ client_getIndemnitorProfile    │ Code.js                      │
 * │ client_forceCleanup            │ Code.js                      │
 * │ client_getSocialMediaFiles     │ SocialMediaPicker.js         │
 * │ client_searchPublicMedia       │ SocialMediaPicker.js         │
 * │ client_searchGrokImages        │ SocialMediaPicker.js         │
 * │ client_getDriveFileBase64      │ SocialMediaPicker.js         │
 * │ publishPost                    │ SocialPublisher.js           │
 * │ publishAll                     │ SocialPublisher.js           │
 * │ getSocialAuthUrl               │ SocialPublisher.js           │
 * │ getSocialCredentialStatus      │ SocialPublisher.js           │
 * │ sendOutreachMessage            │ Code.js                      │
 * │ getDocumentStatus              │ Code.js                      │
 * └────────────────────────────────┴──────────────────────────────┘
 */
