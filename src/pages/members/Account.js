// Account.js (DEPRECATED - LEGACY ARTIFACT)
// This page was part of the old Wix Member system.
// Redirecting to Portal Landing to prevent confusion.

import wixLocation from 'wix-location';

$w.onReady(function () {
    console.warn("Legacy Account page accessed. Redirecting to Portal Landing.");
    wixLocation.to('/portal-landing');
});

/*
LEGACY CODE ARCHIVE:
import { currentMember } from 'wix-members';
...
*/

async function loadMemberProfile(memberId) {
    try {
        const results = await wixData.query("MemberProfiles")
            .eq("_id", memberId)
            .find();
        if (results.items.length > 0) {
            const profile = results.items[0];
            $w('#profileName').text = `${profile.firstName} ${profile.lastName}`;
            $w('#profileEmail').text = profile.email;
            $w('#profilePhone').text = profile.phone || "No phone on file";
        }
    } catch (error) {
        console.error("Profile load error:", error);
    }
}

function setupDocumentUpload(memberId) {
    $w('#idUploadBtn').fileType = "Image, Document"; // Allow images and PDFs

    $w('#idUploadBtn').onChange(async () => {
        if ($w('#idUploadBtn').value.length > 0) {
            $w('#uploadStatus').text = "Uploading...";
            $w('#uploadStatus').expand();

            try {
                const uploadedFile = await $w('#idUploadBtn').startUpload();

                // Save reference to database
                await wixData.insert(COLLECTIONS.MEMBER_DOCUMENTS, {
                    memberId: memberId,
                    fileName: uploadedFile.originalFileName,
                    fileUrl: uploadedFile.url,
                    uploadDate: new Date(),
                    type: "Government ID"
                });

                $w('#uploadStatus').text = "Upload Successful!";
                refreshDocumentList(memberId);

            } catch (error) {
                console.error("Upload failed:", error);
                $w('#uploadStatus').text = "Upload Failed. Please try again.";
            }
        }
    });

    refreshDocumentList(memberId);
}

async function refreshDocumentList(memberId) {
    const results = await wixData.query(COLLECTIONS.MEMBER_DOCUMENTS)
        .eq("memberId", memberId)
        .descending("uploadDate")
        .find();

    $w('#documentsRepeater').data = results.items;

    $w('#documentsRepeater').onItemReady(($item, itemData) => {
        $item('#docName').text = itemData.fileName;
        $item('#docDate').text = itemData.uploadDate.toLocaleDateString();
        $item('#viewDocBtn').link = itemData.fileUrl;
    });
}
