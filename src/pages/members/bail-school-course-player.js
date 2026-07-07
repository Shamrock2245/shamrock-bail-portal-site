import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import { getCourse, getCourseLessons, getStudentEnrollment, logStudentAction } from 'backend/bailSchoolMongo';
import { hasSignedIntegrity } from 'backend/bailSchool';

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

    $w('#loadingSpinner').show();
    $w('#contentGroup').hide();

    try {
        const [course, enrollment, courseLessons, isSigned] = await Promise.all([
            getCourse(currentCourseId),
            getStudentEnrollment(currentStudentEmail, currentCourseId),
            getCourseLessons(currentCourseId),
            hasSignedIntegrity(currentStudentEmail)
        ]);

        if (!enrollment) {
            $w('#loadingSpinner').hide();
            wixLocation.to('/members-area/my-courses');
            return;
        }

        if (!isSigned) {
            $w('#loadingSpinner').hide();
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
        
        $w('#contentGroup').show();
    } catch (e) {
        console.error("Course Player Error: ", e);
    } finally {
        $w('#loadingSpinner').hide();
    }
});

function setupSidebar() {
    const repeater = $w('#lessonRepeater');
    repeater.data = lessons;
    
    repeater.onItemReady(($item, itemData, index) => {
        $item('#lessonTitle').text = `${index + 1}. ${itemData.title}`;
        
        if (index < currentLessonIndex) {
            $item('#lessonIcon').src = "wix:image://v1/success-check.png/success"; 
        } else if (index === currentLessonIndex) {
            $item('#lessonIcon').src = "wix:image://v1/playing-icon.png/playing"; 
            $item('#lessonBox').style.backgroundColor = "rgba(212, 175, 55, 0.2)"; // Shamrock Gold highlight
        } else {
            $item('#lessonIcon').src = "wix:image://v1/locked-icon.png/locked"; 
            $item('#lessonBox').style.backgroundColor = "transparent";
        }
    });
}

function loadLesson(index) {
    if (index < 0 || index >= lessons.length) return;
    
    const lesson = lessons[index];
    $w('#lessonHeading').text = lesson.title;
    $w('#lessonDescription').text = lesson.description || "";
    
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
    $w('#videoHtmlComponent').postMessage({
        action: 'loadVideo',
        url: lesson.videoUrl,
        preventSkip: true
    });
    
    $w('#videoHtmlComponent').onMessage(async (event) => {
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
    
    $w('#nextButton').hide();
    $w('#nextButton').onClick(() => {
        loadLesson(index + 1);
    });
}

async function completeLesson(lessonId) {
    // Reveal next button
    $w('#nextButton').show();
    
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
