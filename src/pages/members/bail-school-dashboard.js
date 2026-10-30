import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { getStudentEnrollments } from 'backend/bailSchoolMongo';

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

$w.onReady(async function () {
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
        // Redirect to portal landing if not logged in
        wixLocation.to('/bail-school-login');
        return;
    }

    const email = await user.getEmail();
    
    // Apply Fortune 50 styling to loading state
    show('#loadingSpinner');
    hide('#dashboardGroup');
    hide('#noCoursesText');
    hide('#errorText');

    try {
        const enrollments = await getStudentEnrollments(email);
        
        if (!enrollments || enrollments.length === 0) {
            show('#noCoursesText');
        } else {
            renderCourses(enrollments);
        }
    } catch (e) {
        console.error(e);
        const errorText = el('#errorText');
        if (errorText) {
            try { errorText.text = "Failed to load courses. Please contact support."; } catch (e) { /* optional */ }
        }
        show('#errorText');
    } finally {
        hide('#loadingSpinner');
    }
});

function renderCourses(enrollments) {
    const repeater = el('#courseRepeater');
    if (!repeater) {
        show('#dashboardGroup');
        return;
    }

    repeater.data = enrollments.map(e => ({
        _id: e.courseId,
        courseName: e.courseId === '120-HR-PRELICENSING' ? '120-Hour Pre-Licensing Course' : (e.courseId === '20-HR-CORRESPONDENCE' ? '20-Hour Correspondence Course' : e.courseId),
        progress: e.progress || 0,
        status: e.progress === 100 ? 'Completed' : 'In Progress'
    }));
    
    repeater.onItemReady(($item, itemData) => {
        const name = itemEl($item, '#courseNameText');
        if (name) { try { name.text = itemData.courseName; } catch (e) { /* optional */ } }

        const bar = itemEl($item, '#progressBar');
        if (bar) { try { bar.value = itemData.progress; } catch (e) { /* optional */ } }

        const status = itemEl($item, '#courseStatusText');
        const button = itemEl($item, '#continueButton');
        if (itemData.status === 'Completed') {
            if (status) {
                try { status.html = `<h5 style="color:#003300; font-weight:bold; font-family: Inter, sans-serif;">${itemData.status}</h5>`; } catch (e) { /* optional */ }
            }
            if (button) { try { button.label = "View Certificate"; } catch (e) { /* optional */ } }
        } else {
            if (status) {
                try { status.html = `<h5 style="color:#D4AF37; font-weight:bold; font-family: Inter, sans-serif;">${itemData.status}</h5>`; } catch (e) { /* optional */ }
            }
            if (button) { try { button.label = "Continue Course"; } catch (e) { /* optional */ } }
        }

        if (button && typeof button.onClick === 'function') {
            button.onClick(() => {
                if (itemData.status === 'Completed') {
                    wixLocation.to(`/bail-school/certificate/${itemData._id}`);
                } else {
                    wixLocation.to(`/bail-school/course/${itemData._id}`);
                }
            });
        }
    });

    show('#dashboardGroup');
}
