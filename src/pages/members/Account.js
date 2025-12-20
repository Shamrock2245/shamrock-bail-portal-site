// Account.js (Members Only)
import wixData from 'wix-data';
import { currentMember } from 'wix-members';

$w.onReady(async function () {
    const member = await currentMember.getMember();
    if (member) {
        loadMemberProfile(member._id);
        setupDocumentUpload(member._id);
    }
});

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
                await wixData.insert("MemberDocuments", {
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
    const results = await wixData.query("MemberDocuments")
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
