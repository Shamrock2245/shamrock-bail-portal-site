
function findGoogleDocTemplates() {
    const pdfId = '1Raa2gzHOlO5kSJOeDE25eBh2H8LcjN5L'; // Indemnity Agreement PDF ID

    try {
        const file = DriveApp.getFileById(pdfId);
        const parents = file.getParents();

        if (parents.hasNext()) {
            const folder = parents.next();
            console.log(`Scanning Folder: ${folder.getName()} (ID: ${folder.getId()})`);

            const files = folder.getFiles();
            const results = [];

            while (files.hasNext()) {
                const f = files.next();
                results.push({
                    name: f.getName(),
                    id: f.getId(),
                    mimeType: f.getMimeType()
                });
            }

            // Filter for Google Docs
            const docs = results.filter(r => r.mimeType === MimeType.GOOGLE_DOCS);

            console.log('✅ Found ' + docs.length + ' Google Docs:');
            docs.forEach(d => console.log(`[DOC] ${d.name} | ID: ${d.id}`));

            // Also log everything else for context
            console.log('---------------------------------------------------');
            console.log('📂 All Files in Folder:');
            results.forEach(r => console.log(`[${r.mimeType}] ${r.name} | ID: ${r.id}`));

            return docs;
        } else {
            console.warn('⚠️ PDF has no parent folder?');
        }

    } catch (e) {
        console.error('❌ Error finding templates:', e.message);
    }
}
