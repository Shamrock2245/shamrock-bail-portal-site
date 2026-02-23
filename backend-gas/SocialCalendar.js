/**
 * SocialCalendar.js
 * 
 * Handles scheduling social media posts to Google Calendar and fetching upcoming scheduled posts.
 * Represents the backend logic for the Campaign Planner feature in the Social Hub.
 */

const SOCIAL_CALENDAR_ID_PROPERTY = "SOCIAL_CALENDAR_ID";

/**
 * Get or create the Google Calendar used for Social Media Planning
 */
function _getOrCreateSocialCalendar() {
    let calendarId = PropertiesService.getScriptProperties().getProperty(SOCIAL_CALENDAR_ID_PROPERTY);
    let calendar = null;

    if (calendarId) {
        try {
            calendar = CalendarApp.getCalendarById(calendarId);
        } catch (e) {
            console.warn("Saved social calendar ID not found or accessible. Creating a new one.");
        }
    }

    if (!calendar) {
        calendar = CalendarApp.createCalendar("Shamrock Social Hub Planner", {
            summary: "Campaign Planner timeline for Shamrock Bail Bonds social media posts.",
            color: CalendarApp.Color.GREEN
        });
        PropertiesService.getScriptProperties().setProperty(SOCIAL_CALENDAR_ID_PROPERTY, calendar.getId());
    }

    return calendar;
}

/**
 * client_scheduleSocialPosts
 * Schedules approved variants to Google Calendar.
 * 
 * @param {Object} posts - Dictionary of platforms and their corresponding post text
 * @param {String} scheduledDateStr - User-provided date/time string
 */
function client_scheduleSocialPosts(posts, scheduledDateStr) {
    try {
        if (!posts || Object.keys(posts).length === 0) {
            return { success: false, error: "No posts provided to schedule." };
        }

        // Parse date
        let scheduledDate = new Date(scheduledDateStr);
        // If the user just typed "2024-05-01", parse handles it but might make it midnight UTC.
        // Let's ensure it's a valid date.
        if (isNaN(scheduledDate.getTime())) {
            return { success: false, error: "Invalid date format provided. Please use YYYY-MM-DD HH:MM." };
        }

        // If time wasn't explicitly provided (e.g. they just entered YYYY-MM-DD), default to 9:00 AM local time.
        // A simple check: if hours and minutes are both 0 and it's UTC midnight, maybe they didn't provide time.
        // But for simplicity, we just use the parsed date. If they want a specific time, they should provide it.

        const calendar = _getOrCreateSocialCalendar();
        if (!calendar) {
            return { success: false, error: "Failed to access or create Google Calendar." };
        }

        const platforms = Object.keys(posts).join(', ');
        const title = `Social Post [${platforms}]`;

        let descriptionHTML = `<b>Scheduled for:</b><br/>${platforms}<br/><br/><b>Variants:</b><br/>`;
        for (const [platform, content] of Object.entries(posts)) {
            descriptionHTML += `<b>${platform.toUpperCase()}:</b><br/>${content}<br/><hr/>`;
        }

        // Add 1 hour duration.
        const endDate = new Date(scheduledDate.getTime() + (60 * 60 * 1000));

        const event = calendar.createEvent(title, scheduledDate, endDate, {
            description: descriptionHTML
        });

        return {
            success: true,
            eventId: event.getId()
        };
    } catch (e) {
        console.error("client_scheduleSocialPosts Error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * client_getScheduledPosts
 * Fetches upcoming scheduled posts from the Campaign Planner calendar.
 * Next 60 days.
 */
function client_getScheduledPosts() {
    try {
        const calendar = _getOrCreateSocialCalendar();
        if (!calendar) {
            return { success: false, error: "Failed to access Google Calendar." };
        }

        const now = new Date();
        const sixtyDaysFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

        const events = calendar.getEvents(now, sixtyDaysFromNow);

        const mappedEvents = events.map(ev => {
            // Extract platforms from title (e.g. "Social Post [facebook, twitter]")
            let platforms = [];
            const titleMatch = ev.getTitle().match(/\[(.*?)\]/);
            if (titleMatch && titleMatch[1]) {
                platforms = titleMatch[1].split(',').map(s => s.trim());
            }

            // Extract a snippet of the first post for preview
            let snippet = "No content Preview";
            const desc = ev.getDescription() || '';
            const variantsMatch = desc.split('<b>Variants:</b><br/>');
            if (variantsMatch && variantsMatch[1]) {
                // remove HTML tags to make a clean snippet
                let cleanText = variantsMatch[1].replace(/<[^>]*>?/gm, '');
                snippet = cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : '');
            }

            return {
                id: ev.getId(),
                title: snippet,
                date: ev.getStartTime().toISOString(),
                platforms: platforms
            };
        });

        // Sort ascending by date
        mappedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            success: true,
            events: mappedEvents
        };
    } catch (e) {
        console.error("client_getScheduledPosts Error:", e);
        return { success: false, error: e.message };
    }
}
