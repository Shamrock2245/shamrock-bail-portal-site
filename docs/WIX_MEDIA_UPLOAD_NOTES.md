# Wix Media Manager Upload API - Implementation Notes

**Date:** December 26, 2025  
**Source:** https://dev.wix.com/docs/velo/apis/wix-media-backend/media-manager/upload

---

## Overview

The `wix-media-backend` module provides the `upload()` function to upload files to the Wix Media Manager from a buffer. This is the foundation for implementing document upload functionality in the member portal.

---

## API Signature

```javascript
import { mediaManager } from 'wix-media-backend';

function upload(
  path: string,
  fileContent: Buffer,
  fileName: string,
  options: UploadOptions,
): Promise<FileInfo>;
```

---

## Parameters

### 1. `path` (string, required)

The path within the Media Manager where the file will be uploaded.

**Rules:**
- If the path doesn't exist, missing folders will be created automatically
- Example: `/media/files` or `/bail-documents/member-uploads`
- If `metadataOptions.isVisitorUpload` is `true` (default), the `visitor-uploads` folder is the root
  - In this case, the full path becomes: `visitor-uploads/media/files/`

**For Shamrock Portal:**
- Use structured paths: `/bail-documents/{caseId}/{documentType}/`
- Example: `/bail-documents/case-12345/government-id/`

---

### 2. `fileContent` (Buffer, required)

Buffer containing the content to be uploaded.

**How to get Buffer:**
- From upload button: `uploadButton.value[0].fileContent`
- From base64: `Buffer.from(base64String, 'base64')`
- From external URL: Fetch and convert to buffer

---

### 3. `fileName` (string, required)

The name the file will appear as in the Media Manager.

**Best Practices:**
- Include file extension (e.g., `drivers-license.jpg`)
- Use descriptive names
- Sanitize user input to avoid special characters
- Consider adding timestamps for uniqueness

**For Shamrock Portal:**
- Format: `{memberEmail}_{documentType}_{timestamp}.{ext}`
- Example: `john-doe_government-id_1735251234567.jpg`

---

### 4. `options` (UploadOptions, required)

Configuration object with two sub-objects:

#### `mediaOptions`

```javascript
{
  mimeType: string,  // e.g., "image/jpeg", "application/pdf"
  mediaType: string, // e.g., "image", "document", "video", "audio"
}
```

**Common MIME types:**
- Images: `image/jpeg`, `image/png`, `image/gif`
- Documents: `application/pdf`, `application/msword`
- Video: `video/mp4`, `video/quicktime`
- Audio: `audio/mpeg`, `audio/wav`

#### `metadataOptions`

```javascript
{
  isPrivate: boolean,        // true = only site admins can access
  isVisitorUpload: boolean,  // true = stored in visitor-uploads folder
  context: {                 // Custom metadata (key-value pairs)
    [key: string]: string
  }
}
```

**For Shamrock Portal:**
```javascript
{
  isPrivate: true,           // Documents should be private
  isVisitorUpload: false,    // We want full control over path
  context: {
    caseId: "case-12345",
    memberId: "member-67890",
    memberEmail: "john@example.com",
    documentType: "government-id",
    uploadedAt: "2025-12-26T17:00:00Z",
    uploadedBy: "defendant",  // or "indemnitor"
    gpsCoordinates: "26.1224,-81.7937",
    deviceInfo: "iPhone 14 Pro, iOS 17.2"
  }
}
```

---

## Return Value

Returns a `Promise<FileInfo>` with the following structure:

```javascript
{
  mediaType: string,        // "image", "document", etc.
  isPrivate: boolean,       // Privacy setting
  sizeInBytes: number,      // File size
  mimeType: string,         // MIME type
  iconUrl: string,          // Thumbnail URL (for images)
  fileUrl: string,          // Full file URL (wix:image://... or wix:document://...)
  originalFileName: string, // Original file name
  hash: string,             // File hash for deduplication
  labels: string[],         // Auto-generated labels (for images)
  width?: number,           // Image width (if applicable)
  height?: number,          // Image height (if applicable)
}
```

**Important:** The `fileUrl` is what you store in the database to reference the uploaded file.

---

## Important Notes

### File Size Limits

See [Wix Media: Supported Media File Types and File Sizes](https://support.wix.com/en/article/wix-media-supported-media-file-types-and-file-sizes) for details.

**General limits:**
- Images: Up to 25 MB
- Documents: Up to 25 MB
- Videos: Up to 500 MB (but transcoding required)
- Audio: Up to 500 MB (but transcoding required)

### Async Processing

- **Images and documents:** Available immediately after upload
- **Video and audio:** Must undergo transcoding before use
  - Use `onFileUploaded()` event to detect when transcoding is complete
  - See [Importing and Uploading Files](https://dev.wix.com/docs/velo/apis/wix-media-backend/importing-and-uploading-files)

### Security

- Always use backend code (`.jsw` files) for uploads
- Never expose upload logic in frontend code
- Validate file types and sizes before uploading
- Use `isPrivate: true` for sensitive documents

---

## Example Implementation for Shamrock Portal

### Backend Module: `documentUpload.jsw`

```javascript
import { mediaManager } from 'wix-media-backend';
import wixData from 'wix-data';
import { COLLECTIONS } from 'backend/collectionIds';

/**
 * Upload a document to Media Manager and save metadata to MemberDocuments collection
 * 
 * @param {Object} uploadData
 * @param {Buffer} uploadData.fileContent - File buffer
 * @param {string} uploadData.fileName - Original file name
 * @param {string} uploadData.mimeType - MIME type
 * @param {string} uploadData.documentType - Type of document (e.g., "government-id")
 * @param {string} uploadData.memberEmail - Member email
 * @param {string} uploadData.caseId - Case ID (optional)
 * @param {Object} uploadData.metadata - Additional metadata (GPS, device info, etc.)
 * @returns {Promise<Object>} Upload result with file URL and document ID
 */
export async function uploadDocument(uploadData) {
  try {
    const {
      fileContent,
      fileName,
      mimeType,
      documentType,
      memberEmail,
      caseId,
      metadata = {}
    } = uploadData;

    // Validate inputs
    if (!fileContent || !fileName || !documentType || !memberEmail) {
      throw new Error('Missing required upload parameters');
    }

    // Determine media type from MIME type
    const mediaType = getMediaType(mimeType);

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedEmail = memberEmail.replace(/[@.]/g, '-');
    const uniqueFileName = `${sanitizedEmail}_${documentType}_${timestamp}_${fileName}`;

    // Determine upload path
    const uploadPath = caseId 
      ? `/bail-documents/${caseId}/${documentType}`
      : `/bail-documents/pending/${documentType}`;

    // Upload to Media Manager
    const uploadResult = await mediaManager.upload(
      uploadPath,
      fileContent,
      uniqueFileName,
      {
        mediaOptions: {
          mimeType: mimeType,
          mediaType: mediaType,
        },
        metadataOptions: {
          isPrivate: true,
          isVisitorUpload: false,
          context: {
            caseId: caseId || 'pending',
            memberEmail: memberEmail,
            documentType: documentType,
            uploadedAt: new Date().toISOString(),
            ...metadata
          }
        }
      }
    );

    // Save metadata to MemberDocuments collection
    const documentRecord = {
      memberEmail: memberEmail,
      caseId: caseId || null,
      documentType: documentType,
      fileName: fileName,
      fileUrl: uploadResult.fileUrl,
      mimeType: mimeType,
      sizeInBytes: uploadResult.sizeInBytes,
      uploadedAt: new Date(),
      metadata: {
        hash: uploadResult.hash,
        mediaPath: uploadPath,
        ...metadata
      }
    };

    const savedDoc = await wixData.insert(COLLECTIONS.MEMBER_DOCUMENTS, documentRecord);

    return {
      success: true,
      fileUrl: uploadResult.fileUrl,
      documentId: savedDoc._id,
      fileName: uniqueFileName,
      sizeInBytes: uploadResult.sizeInBytes
    };

  } catch (error) {
    console.error('Document upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Determine media type from MIME type
 */
function getMediaType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(mimeType, allowedTypes) {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(sizeInBytes, maxSizeInMB = 25) {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
}
```

---

## Frontend Integration Example

### Page Code: `members/Account.js`

```javascript
import { uploadDocument } from 'backend/documentUpload';

$w.onReady(function () {
  // Configure upload button
  $w('#uploadButton').fileType = 'Image';
  $w('#uploadButton').buttonLabel = 'Choose ID Document';

  // Handle upload button click
  $w('#submitUploadButton').onClick(async () => {
    const uploadedFiles = $w('#uploadButton').value;
    
    if (uploadedFiles.length === 0) {
      $w('#uploadStatus').text = 'Please select a file';
      return;
    }

    const file = uploadedFiles[0];
    
    // Validate file
    if (file.size > 25 * 1024 * 1024) {
      $w('#uploadStatus').text = 'File too large (max 25MB)';
      return;
    }

    try {
      $w('#uploadStatus').text = 'Uploading...';
      
      // Get current member info
      const currentMember = await wixUsers.currentUser.getEmail();
      
      // Get GPS coordinates (if available)
      const gpsCoords = await getGPSCoordinates();
      
      // Upload document
      const result = await uploadDocument({
        fileContent: file.fileContent,
        fileName: file.name,
        mimeType: file.type,
        documentType: 'government-id',
        memberEmail: currentMember,
        caseId: $w('#caseIdInput').value || null,
        metadata: {
          gpsCoordinates: gpsCoords,
          deviceInfo: navigator.userAgent,
          uploadSource: 'member-portal'
        }
      });

      $w('#uploadStatus').text = `Upload successful! Document ID: ${result.documentId}`;
      
    } catch (error) {
      console.error('Upload error:', error);
      $w('#uploadStatus').text = `Upload failed: ${error.message}`;
    }
  });
});

async function getGPSCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('unavailable');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(`${position.coords.latitude},${position.coords.longitude}`);
      },
      () => {
        resolve('denied');
      }
    );
  });
}
```

---

## Next Steps for Implementation

1. **Update `documentUpload.jsw`** with the full implementation above
2. **Create upload UI** in member portal pages
3. **Add file validation** (type, size, format)
4. **Implement GPS capture** for ID uploads
5. **Add progress indicators** for large files
6. **Test error handling** (network failures, invalid files)
7. **Add logging** for audit trail

---

## References

- [Wix Media Manager Upload API](https://dev.wix.com/docs/velo/apis/wix-media-backend/media-manager/upload)
- [Importing and Uploading Files](https://dev.wix.com/docs/velo/apis/wix-media-backend/importing-and-uploading-files)
- [Upload Button Element](https://dev.wix.com/docs/velo/velo-only-apis/$w/upload-button/introduction)
- [Supported File Types and Sizes](https://support.wix.com/en/article/wix-media-supported-media-file-types-and-file-sizes)
