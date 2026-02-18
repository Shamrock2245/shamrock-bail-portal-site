/**
 * Magic Tags System - Document Filler
 * 
 * This class handles the population of Google Docs templates with data using "Magic Tags".
 * Tags are formatted as {{key_name}}.
 * 
 * Features:
 * - Simple text replacement
 * - Nested object access (e.g., {{indemnitor.firstName}})
 * - Conditional blocks ({{#if condition}}...{{/if}}) - *Planned*
 * - Image replacement - *Planned*
 */

class DocFiller {
    /**
     * @param {string} templateId - The ID of the Google Doc template
     * @param {string} folderId - The ID of the folder to save the generated doc (optional)
     */
    constructor(templateId, folderId) {
        this.templateId = templateId;
        this.folderId = folderId;
        this.doc = null;
        this.body = null;
    }

    /**
     * Creates a copy of the template and opens it for editing
     * @param {string} newTitle - Title for the new document
     * @return {string} The ID of the new document
     */
    createCopy(newTitle) {
        const templateFile = DriveApp.getFileById(this.templateId);
        let newFile;

        if (this.folderId) {
            const folder = DriveApp.getFolderById(this.folderId);
            newFile = templateFile.makeCopy(newTitle, folder);
        } else {
            newFile = templateFile.makeCopy(newTitle);
        }

        this.doc = DocumentApp.openById(newFile.getId());
        this.body = this.doc.getBody();
        return newFile.getId();
    }

    /**
     * Fills the document with data using Magic Tags
     * @param {Object} data - The data object containing values for tags
     */
    fillData(data) {
        if (!this.doc) throw new Error("Document not open. Call createCopy() first.");

        // Flatten data for easier replacement (handle nested objects)
        const flatData = this._flattenObject(data);

        for (const [key, value] of Object.entries(flatData)) {
            const tag = `{{${key}}}`;
            // Replace all occurrences of the tag
            // Note: replaceText returns null if no match, which is fine
            // We process value to ensure it's a string
            const replacement = value === null || value === undefined ? "" : String(value);
            this.body.replaceText(tag, replacement);
        }

        // Save and close
        this.doc.saveAndClose();
    }

    /**
     * Helper to flatten nested objects
     * e.g., { user: { name: "John" } } -> { "user.name": "John" }
     */
    _flattenObject(obj, prefix = '') {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date)) {
                Object.assign(acc, this._flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    }
}

/**
 * Global helper function to fill a document
 * @param {string} templateId 
 * @param {string} folderId 
 * @param {string} title 
 * @param {Object} data 
 * @return {string} The ID of the generated document
 */
function fillDocumentTemplate(templateId, folderId, title, data) {
    const filler = new DocFiller(templateId, folderId);
    const newDocId = filler.createCopy(title);
    filler.fillData(data);
    return newDocId;
}
