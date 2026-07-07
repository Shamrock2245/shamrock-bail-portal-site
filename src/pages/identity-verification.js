import wixWindow from 'wix-window';
import { logStudentAction } from 'backend/bailSchoolMongo';
// Assuming we have a backend function to handle Drive uploads from Base64
import { uploadSelfieToDrive } from 'backend/bailSchoolMongo'; 

let studentEmail;
let checkType;

$w.onReady(function () {
    const context = wixWindow.lightbox.getContext();
    if (context) {
        studentEmail = context.studentEmail;
        checkType = context.type; // 'mid-course' or 'random'
    }

    if (checkType === 'mid-course') {
        $w('#titleText').text = "Mid-Course Identity Verification";
        $w('#instructionText').text = "FLDFS requires a mid-course identity check. Please allow camera access and take a clear photo of your face.";
    } else {
        $w('#titleText').text = "Random Identity Verification";
        $w('#instructionText').text = "FLDFS requires random identity checks throughout the course. Please look at the camera and take a photo.";
    }

    // Set up the HTML component containing the webcam script
    const htmlComponent = $w('#webcamHtml');
    htmlComponent.postMessage({ action: 'init_camera' });

    htmlComponent.onMessage(async (event) => {
        const message = event.data;
        if (message.type === 'photo_captured') {
            $w('#loadingSpinner').show();
            try {
                // message.data contains the base64 encoded image
                const fileUrl = await uploadSelfieToDrive(studentEmail, message.data, checkType);
                
                // Log to AuditLogs
                await logStudentAction(studentEmail, "IDENTITY_CHECK", checkType, "Unknown", { fileUrl: fileUrl, success: true });
                
                wixWindow.lightbox.close({ verified: true });
            } catch (e) {
                console.error("Verification failed", e);
                $w('#errorText').text = "Verification failed. Please try again.";
                $w('#errorText').show();
                htmlComponent.postMessage({ action: 'reset_camera' });
            } finally {
                $w('#loadingSpinner').hide();
            }
        } else if (message.type === 'camera_error') {
            $w('#errorText').text = "Camera access denied or unavailable. This is required to continue the course.";
            $w('#errorText').show();
        }
    });

    $w('#captureButton').onClick(() => {
        htmlComponent.postMessage({ action: 'capture_photo' });
    });
});
