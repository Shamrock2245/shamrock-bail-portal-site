import wixData from 'wix-data';

/**
 * Add a single pending document to the collection
 * @param {Object} docData 
 * @param {string} apiKey - Optional, for logging/auditing
 */
export async function addPendingDocument(docData, apiKey = null) {
    try {
        const toSave = {
            ...docData,
            createdAt: new Date(),
            status: docData.status || 'pending',
            _createdDate: new Date() // Force fresh date
        };

        const result = await wixData.insert('PendingDocuments', toSave, { suppressAuth: true });
        return { success: true, id: result._id };
    } catch (error) {
        console.error('Error adding pending document:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Batch add pending documents
 * @param {Array} documents 
 * @param {string} apiKey 
 */
export async function addPendingDocumentsBatch(documents, apiKey = null) {
    try {
        const toSave = documents.map(doc => ({
            ...doc,
            createdAt: new Date(),
            status: doc.status || 'pending'
        }));

        const result = await wixData.bulkInsert('PendingDocuments', toSave, { suppressAuth: true });
        return { success: true, inserted: result.inserted };
    } catch (error) {
        console.error('Error batch adding documents:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update the status of a document by SignNow ID
 * @param {string} signNowDocumentId 
 * @param {string} status 
 * @param {string} apiKey 
 */
export async function updateDocumentStatus(signNowDocumentId, status, apiKey = null) {
    try {
        // Find document(s) with this ID
        const results = await wixData.query('PendingDocuments')
            .eq('signNowDocumentId', signNowDocumentId)
            .find({ suppressAuth: true });

        if (results.items.length === 0) {
            return { success: false, message: 'Document not found' };
        }

        // Update all matches (though should be unique)
        const updates = results.items.map(item => {
            item.status = status;
            item.updatedAt = new Date();
            if (status === 'signed') {
                item.signedAt = new Date();
            }
            return item;
        });

        await wixData.bulkUpdate('PendingDocuments', updates, { suppressAuth: true });
        return { success: true, updated: updates.length };

    } catch (error) {
        console.error('Error updating document status:', error);
        return { success: false, error: error.message };
    }
}
