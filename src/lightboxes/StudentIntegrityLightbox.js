import wixData from 'wix-data';
import wixWindow from 'wix-window';
import wixUsers from 'wix-users';

// This lightbox blocks the course player until the student signs the mandatory
// DFS Integrity Acknowledgment.
$w.onReady(function () {
    const receivedData = wixWindow.lightbox.getContext();
    const studentEmail = receivedData?.studentEmail || "";

    $w('#signButton').onClick(async () => {
        const signatureName = $w('#signatureInput').value;
        const isChecked = $w('#agreeCheckbox').checked;

        if (!signatureName || !isChecked) {
            $w('#errorText').text = "You must check the box and type your name to agree.";
            $w('#errorText').show();
            return;
        }

        $w('#signButton').disable();
        $w('#signButton').label = "Submitting...";

        try {
            const user = wixUsers.currentUser;
            const memberId = user.id;
            
            // Write to the CMS Collection we created programmatically
            await wixData.insert("education-acknowledgments", {
                studentEmail: studentEmail,
                memberId: memberId,
                acknowledged: true,
                signatureName: signatureName,
                ipAddress: "captured_by_backend_or_wix" 
            });

            wixWindow.lightbox.close({ signed: true });
        } catch (e) {
            console.error("Failed to submit integrity acknowledgment", e);
            $w('#errorText').text = "Failed to submit. Please try again or contact support.";
            $w('#errorText').show();
            $w('#signButton').enable();
            $w('#signButton').label = "I Agree & Sign";
        }
    });

    $w('#cancelButton').onClick(() => {
        wixWindow.lightbox.close({ signed: false });
    });
});
