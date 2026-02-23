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
    if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
      fileList.push({
        id: file.getId(),
        name: file.getName(),
        mimeType: mimeType,
        url: file.getUrl(),
        downloadUrl: file.getDownloadUrl()
      });
    }
  }
  return fileList;
}
