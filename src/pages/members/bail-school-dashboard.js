import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { getStudentEnrollments } from 'backend/bailSchoolMongo';

$w.onReady(async function () {
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
        // Redirect to portal landing if not logged in
        wixLocation.to('/bail-school-login');
        return;
    }

    const email = await user.getEmail();
    
    // Apply Fortune 50 styling to loading state
    $w('#loadingSpinner').show();
    $w('#dashboardGroup').hide();
    $w('#noCoursesText').hide();
    $w('#errorText').hide();

    try {
        const enrollments = await getStudentEnrollments(email);
        
        if (!enrollments || enrollments.length === 0) {
            $w('#noCoursesText').show();
        } else {
            renderCourses(enrollments);
        }
    } catch (e) {
        console.error(e);
        $w('#errorText').text = "Failed to load courses. Please contact support.";
        $w('#errorText').show();
    } finally {
        $w('#loadingSpinner').hide();
    }
});

function renderCourses(enrollments) {
    const repeater = $w('#courseRepeater');
    
    repeater.data = enrollments.map(e => ({
        _id: e.courseId,
        courseName: e.courseId === '120-HR-PRELICENSING' ? '120-Hour Pre-Licensing Course' : (e.courseId === '20-HR-CORRESPONDENCE' ? '20-Hour Correspondence Course' : e.courseId),
        progress: e.progress || 0,
        status: e.progress === 100 ? 'Completed' : 'In Progress'
    }));
    
    repeater.onItemReady(($item, itemData, index) => {
        $item('#courseNameText').text = itemData.courseName;
        
        // Progress bar (Requires Wix UI Progress Bar Element)
        $item('#progressBar').value = itemData.progress;
        
        // Aesthetic styling based on status (Fortune 50 aesthetic / Shamrock Gold)
        if(itemData.status === 'Completed') {
            $item('#courseStatusText').html = `<h5 style="color:#003300; font-weight:bold; font-family: Inter, sans-serif;">${itemData.status}</h5>`;
            $item('#continueButton').label = "View Certificate";
        } else {
            $item('#courseStatusText').html = `<h5 style="color:#D4AF37; font-weight:bold; font-family: Inter, sans-serif;">${itemData.status}</h5>`;
            $item('#continueButton').label = "Continue Course";
        }

        // The UI/UX Pro Max rule: "Glassmorphism"
        // In Velo, we often do this via CSS classes (custom elements) or by styling the container box directly in the editor.
        // We assume the user has styled #courseBox with a blur and RGBA background.

        $item('#continueButton').onClick(() => {
            if (itemData.status === 'Completed') {
                wixLocation.to(`/bail-school/certificate/${itemData._id}`);
            } else {
                wixLocation.to(`/bail-school/course/${itemData._id}`);
            }
        });
    });
    
    $w('#dashboardGroup').show();
}
