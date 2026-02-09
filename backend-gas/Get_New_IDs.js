/**
 * Get_New_IDs.js
 * 
 * Helper script to find the File IDs for the new SSA Release and FAQ forms.
 * 
 * INSTRUCTIONS:
 * 1. Push this file to your Google Apps Script project.
 * 2. Run the function `listFilesInNewFolder`.
 * 3. View the execution logs.
 * 4. Copy the File ID for 'ssa-release.pdf' (and others) and provide them to the agent.
 */

function listFilesInNewFolder() {
    const folderId = '1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3'; // The folder provided by the user

    try {
        const folder = DriveApp.getFolderById(folderId);
        const files = folder.getFiles();

        console.log('--- FINDING NEW TEMPLATE IDS ---');
        console.log(`Scanning Folder: ${folder.getName()} (${folderId})`);

        const found = [];

        while (files.hasNext()) {
            const file = files.next();
            const info = {
                name: file.getName(),
                id: file.getId(),
                url: file.getUrl()
            };
            found.push(info);
            console.log(`\n📄 Name: ${info.name}`);
            console.log(`   ID:   ${info.id}`);
        }

        if (found.length === 0) {
            console.log('⚠️ No files found in this folder.');
        }

        console.log('\n--- END SCAN ---');

    } catch (e) {
        console.error('❌ Error: ' + e.toString());
        console.log('Make sure the account running this script has access to the folder.');
    }
}
