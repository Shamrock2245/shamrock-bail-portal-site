/**
 * This file contains client-side wrappers for calling server-side Google Apps Script functions.
 * These functions are called from Dashboard.html via google.script.run.
 */

function client_generateSocialPosts(basePost, platforms, useOpus) {
  return SocialPublisher.draftPosts(basePost, { platforms: platforms, useOpus: useOpus });
}

function client_getScheduledPosts() {
  return SocialCalendar.getScheduledPosts();
}

function client_scheduleSocialPosts(posts, scheduledDate) {
  return SocialCalendar.schedulePosts(posts, scheduledDate);
}

function client_fetchTrendingNews(topic) {
  return NewsService.fetchTrendingNews(topic);
}
