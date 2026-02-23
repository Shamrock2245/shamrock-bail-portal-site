/**
 * Fetches base images and videos from the "shamrock-social-media" Google Drive folder.
 * If the folder does not exist, it creates it.
 */
function client_getSocialMediaFiles() {
    const folderName = "shamrock-social-media";
    const folders = DriveApp.getFoldersByName(folderName);
    let folder;

    if (folders.hasNext()) {
        folder = folders.next();
    } else {
        folder = DriveApp.createFolder(folderName);
    }

    const files = folder.getFiles();
    const fileList = [];

    while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();

        // Only return image or video files
        if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
            fileList.push({
                id: file.getId(),
                name: file.getName(),
                mimeType: mimeType,
                url: file.getUrl()
            });
        }
    }

    return fileList;
}

/**
 * Downloads a file by ID and returns its base64 representation.
 * Useful for attaching it to an API request directly.
 */
function client_getDriveFileBase64(fileId) {
    try {
        const file = DriveApp.getFileById(fileId);
        const blob = file.getBlob();
        return {
            success: true,
            name: file.getName(),
            mimeType: file.getMimeType(),
            base64: Utilities.base64Encode(blob.getBytes())
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}
