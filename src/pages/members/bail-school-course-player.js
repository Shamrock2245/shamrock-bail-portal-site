import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import { getCourse, getCourseLessons, getStudentEnrollment, logStudentAction } from 'backend/bailSchoolMongo';
import { hasSignedIntegrity } from 'backend/bailSchool';

function el(id) {
    try { return $w(id) || null; } catch (e) { return null; }
}
function itemEl($item, id) {
    try { return $item(id) || null; } catch (e) { return null; }
}
function show(id) {
    const node = el(id);
    if (node && typeof node.show === 'function') { try { node.show(); } catch (e) { /* optional */ } }
}
function hide(id) {
    const node = el(id);
    if (node && typeof node.hide === 'function') { try { node.hide(); } catch (e) { /* optional */ } }
}
function setText(id, value) {
    const node = el(id);
    if (node) { try { node.text = value; } catch (e) { /* optional */ } }
}

let currentCourseId;
let currentStudentEmail;
let lessons = [];
let currentLessonIndex = 0;
let hasPassedMidCourseCheck = false;

$w.onReady(async function () {
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
        wixLocation.to('/bail-school-login');
        return;
    }

    currentStudentEmail = await user.getEmail();
    
    // Parse courseId from query param or dynamic page URL
    const queryParams = wixLocation.query;
    currentCourseId = queryParams.courseId || wixLocation.path[0];
    
    if (!currentCourseId) {
        console.error("No course ID provided.");
        return;
    }

    show('#loadingSpinner');
    hide('#contentGroup');

    try {
        const [course, enrollment, courseLessons, isSigned] = await Promise.all([
            getCourse(currentCourseId),
            getStudentEnrollment(currentStudentEmail, currentCourseId),
            getCourseLessons(currentCourseId),
            hasSignedIntegrity(currentStudentEmail)
        ]);

        if (!enrollment) {
            hide('#loadingSpinner');
            wixLocation.to('/members-area/my-courses');
            return;
        }

        if (!isSigned) {
            hide('#loadingSpinner');
            // Block course player and force signature via Lightbox
            wixWindow.openLightbox('StudentIntegrityLightbox', { studentEmail: currentStudentEmail })
                .then((data) => {
                    if (data && data.signed) {
                        // Reload the page to start the course
                        wixLocation.to(wixLocation.url);
                    } else {
                        wixLocation.to('/members-area/my-courses');
                    }
                });
            return;
        }

        lessons = courseLessons;
        
        // Find where the student left off
        const completedLessonIds = enrollment.completedLessons || [];
        currentLessonIndex = lessons.findIndex(l => !completedLessonIds.includes(l._id));
        if (currentLessonIndex === -1) currentLessonIndex = lessons.length - 1; // Completed all, show last
        
        hasPassedMidCourseCheck = enrollment.hasPassedMidCourseCheck || false;
        
        setupSidebar();
        loadLesson(currentLessonIndex);
        
        show('#contentGroup');
    } catch (e) {
        console.error("Course Player Error: ", e);
    } finally {
        hide('#loadingSpinner');
    }
});

function setupSidebar() {
    const repeater = el('#lessonRepeater');
    if (!repeater) return;
    repeater.data = lessons;

    repeater.onItemReady(($item, itemData, index) => {
        const title = itemEl($item, '#lessonTitle');
        if (title) { try { title.text = `${index + 1}. ${itemData.title}`; } catch (e) { /* optional */ } }

        const icon = itemEl($item, '#lessonIcon');
        const box = itemEl($item, '#lessonBox');
        if (index < currentLessonIndex) {
            if (icon) { try { icon.src = "wix:image://v1/success-check.png/success"; } catch (e) { /* optional */ } }
        } else if (index === currentLessonIndex) {
            if (icon) { try { icon.src = "wix:image://v1/playing-icon.png/playing"; } catch (e) { /* optional */ } }
            if (box && box.style) { try { box.style.backgroundColor = "rgba(212, 175, 55, 0.2)"; } catch (e) { /* optional */ } }
        } else {
            if (icon) { try { icon.src = "wix:image://v1/locked-icon.png/locked"; } catch (e) { /* optional */ } }
            if (box && box.style) { try { box.style.backgroundColor = "transparent"; } catch (e) { /* optional */ } }
        }
    });
}

function loadLesson(index) {
    if (index < 0 || index >= lessons.length) return;
    
    const lesson = lessons[index];
    setText('#lessonHeading', lesson.title);
    setText('#lessonDescription', lesson.description || "");
    
    // Check for Mid-Course Identity Check Trigger
    if (index === Math.floor(lessons.length / 2) && !hasPassedMidCourseCheck) {
        triggerIdentityCheck("mid-course");
        return;
    }
    
    // Check for random selfie prompt (10% chance per lesson)
    if (Math.random() < 0.1 && index > 0) {
        triggerIdentityCheck("random");
    }

    // Set up Video HTML Component
    // The HTML Component should send messages to Velo: { type: 'progress', time: 10 }, { type: 'ended' }
    const video = el('#videoHtmlComponent');
    if (video && typeof video.postMessage === 'function') {
        video.postMessage({
            action: 'loadVideo',
            url: lesson.videoUrl,
            preventSkip: true
        });
    }

    if (video && typeof video.onMessage === 'function') video.onMessage(async (event) => {
        const msg = event.data;
        if (msg.type === 'ended') {
            await completeLesson(lesson._id);
        } else if (msg.type === 'progress') {
            // Log progress occasionally if needed
            if (msg.time % 60 === 0) {
                logStudentAction(currentStudentEmail, lesson._id, 'VIDEO_PROGRESS', "Unknown", { time: msg.time });
            }
        }
    });
    
    logStudentAction(currentStudentEmail, lesson._id, 'STARTED_LESSON');
    
    hide('#nextButton');
    const next = el('#nextButton');
    if (next && typeof next.onClick === 'function') {
        next.onClick(() => {
            loadLesson(index + 1);
        });
    }
}

async function completeLesson(lessonId) {
    // Reveal next button
    show('#nextButton');
    
    // In production, we'd call the backend to mark it complete and update enrollment progress.
    await logStudentAction(currentStudentEmail, lessonId, 'COMPLETED_LESSON');
    
    // Also trigger update on enrollment to add lessonId to completedLessons array
    // (A backend function like updateEnrollmentProgress(studentId, courseId, lessonId) would be called here)
}

function triggerIdentityCheck(type) {
    // Open the Lightbox
    import('wix-window').then(wixWindow => {
        wixWindow.openLightbox('Identity Verification', { type: type, studentEmail: currentStudentEmail })
        .then((data) => {
            if (data && data.verified) {
                if (type === 'mid-course') hasPassedMidCourseCheck = true;
                // Resume lesson load
                // We'd actually reload the lesson logic without triggering the check again
                // For simplicity:
            } else {
                wixLocation.to('/members-area/my-courses');
            }
        });
    });
}
