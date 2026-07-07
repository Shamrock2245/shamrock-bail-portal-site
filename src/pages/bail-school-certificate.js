import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { getStudentEnrollment } from 'backend/bailSchoolMongo';

$w.onReady(async function () {
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
        wixLocation.to('/bail-school-login');
        return;
    }
    
    // In Wix, a dynamic page URL looks like /bail-school-certificate/{courseId}
    // We can pull courseId from the dynamic path
    const path = wixLocation.path;
    const courseId = path[0] || wixLocation.query.courseId;
    
    if (!courseId) {
        $w('#errorText').text = "Certificate not found.";
        $w('#errorText').show();
        return;
    }

    const email = await user.getEmail();

    try {
        const enrollment = await getStudentEnrollment(email, courseId);
        
        if (!enrollment || enrollment.progress < 100) {
            $w('#errorText').text = "You have not completed this course.";
            $w('#errorText').show();
            return;
        }

        // Render certificate details
        $w('#studentNameText').text = email; // Replace with actual name if available
        $w('#courseNameText').text = courseId === '120-HR-PRELICENSING' ? '120-Hour Pre-Licensing Course' : courseId;
        $w('#dateText').text = new Date().toLocaleDateString();
        
        // Show the generated PDF link if available in enrollment data
        if (enrollment.certificateUrl) {
            $w('#downloadButton').link = enrollment.certificateUrl;
            $w('#downloadButton').show();
        } else {
            // Certificate generation in GAS is async, might take a few seconds
            $w('#downloadButton').label = "Generating PDF...";
            $w('#downloadButton').disable();
            $w('#downloadButton').show();
            // Polling logic could be added here
        }
        
    } catch (e) {
        console.error(e);
        $w('#errorText').text = "Failed to load certificate.";
        $w('#errorText').show();
    }
});
