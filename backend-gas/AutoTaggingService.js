/**
 * AutoTaggingService.js
 * 
 * Automates the replacement of "_____" placeholders with Magic Tags
 * based on the patterns defined in the Unified Tag Strategy.
 * 
 * Usage:
 * Run `runAutoTagging()` from the GAS Editor.
 * It will process the defined list of Google Docs.
 */

const TAGGING_CONFIG = {
    // Map of Doc Name (for logging) to ID
    docs: {
        'appearance-bond': '1pH1ZFWmrSSliM7ojsNlQ8J41Q-3AbVS7Rn5FKFCwllY',
        'collateral-receipt': '1x8DR6l1WOq3sCaOnxi0aOFGrzM1DrlS9nEGeQh9nLek',
        'defendant-application': '1Gz4kbZSli03EE7QWnlNkh_9eFqzwzMSDwajF8RYr6P0',
        'disclosure-form': '1-2H13q6KhOuOhYhUCY1l0gM2FezBmejHShVv0eiuB_Q',
        'faq-cosigners': '1zmAJyuMPZtOG-Is-8tPfkQWEmK043VR571GCYXB3EKY',
        'faq-defendants': '1J2cgPoz1gomuCxrAyS69KwsEm570O0mn5m2__0pm3-E',
        'indemnity-agreement': '125cAWaM1CKjEc7OWEbPlVU7w-gixNkV1Fw_6gaFHTpM',
        'master-waiver': '1PJ1DseAMA9k-aLyszm_21wHIjSOJU9wFtpWFse72eGs',
        'paperwork-header': '1ttnAeKyJWCYBeemDj80TJjPijZYDdFFwE45XSiCEexA',
        'payment-plan': '1Xg7r0RVwYyuWznxYpO-YSW9Cybyf6f6NHIhh5_nNzbw',
        'promissory-note': '1QE5pd5JeusdOVetrTWd052RTS6z9uzi2o9MalFYXweQ',
        'ssa-release': '1O-qxrn_K7M6bNlkA3tqsAD6bcjcxKmfGysliLOqnkAg',
        'surety-terms': '1BlLmT2bLKoCChhhRqG1O7HuU9ibCFlZoYxd5lJBUekA'
    },

    // Regex Patterns to Find and Replace
    // Key: Magic Tag to Insert
    // Value: Regex to match the label + underscore line
    patterns: [
        // Defendant Info
        { tag: '{{DefName}}', regex: /Name:\s*_+/i },
        { tag: '{{DefName}}', regex: /Defendant Name:\s*_+/i },
        { tag: '{{DefName}}', regex: /Defendant:\s*_+/i }, // Added based on finding
        { tag: '{{DefDOB}}', regex: /Date of Birth:\s*_+/i },
        { tag: '{{DefSSN}}', regex: /SSN:\s*_+/i },
        { tag: '{{DefPhone}}', regex: /Phone:\s*_+/i },
        { tag: '{{DefEmail}}', regex: /Email:\s*_+/i },
        { tag: '{{DefAddress}}', regex: /Address:\s*_+/i },
        { tag: '{{DefCity}}', regex: /City:\s*_+/i },
        { tag: '{{DefState}}', regex: /State:\s*_+/i },
        { tag: '{{DefZip}}', regex: /Zip:\s*_+/i },

        // Bond Info
        { tag: '{{TotalBond}}', regex: /Bond Amount:\s*\$?\s*_+/i },
        { tag: '{{PowerNum}}', regex: /Power Number:\s*_+/i },
        { tag: '{{CaseNum}}', regex: /Case Number:\s*_+/i },
        { tag: '{{DefCharges}}', regex: /Charges:\s*_+/i },

        // Indemnitor Info
        { tag: '{{IndName}}', regex: /Indemnitor Name:\s*_+/i },
        { tag: '{{IndName}}', regex: /Indemnitor\(s\):\s*_+/i }, // Added based on finding
        { tag: '{{IndAddress}}', regex: /Indemnitor Address:\s*_+/i },

        // Dates
        { tag: '{{Date}}', regex: /Date:\s*_+/i },

        // Signatures (Be careful not to tag the line itself if it's for signing)
        // We typically want to LEAVE the signature line, but maybe add a label?
        // Guide says: "Signature lines are clear (no tags on signature lines)"
        // So we SKIP signature patterns.
    ]
};

function runAutoTagging() {
    const resultLog = [];

    for (const [name, id] of Object.entries(TAGGING_CONFIG.docs)) {
        resultLog.push(`Processing: ${name}`);
        try {
            const doc = DocumentApp.openById(id);
            const body = doc.getBody();

            // DEBUG PROBES
            if (name === 'paperwork-header') {
                resultLog.push(`DEBUG: Searching 'paperwork-header'...`);
                resultLog.push(`Found 'Defendant'? ${body.findText('Defendant') ? 'YES' : 'NO'}`);
                resultLog.push(`Found underscores? ${body.findText('______') ? 'YES' : 'NO'}`);
                resultLog.push(`Found 'Defendant: ______'? ${body.findText('Defendant: ______') ? 'YES' : 'NO'}`);
                resultLog.push(`Found /Defendant:.*_+/? ${body.findText('Defendant:.*_+') ? 'YES' : 'NO'}`);
            }

            let replaceCount = 0;

            TAGGING_CONFIG.patterns.forEach(p => {
                // Find all occurrences of the pattern
                // passing the source string, not the RegExp object
                let patternSource = p.regex.source;
                let found = body.findText(patternSource);

                while (found) {
                    const element = found.getElement().asText();
                    const startOffset = found.getStartOffset();
                    const endOffset = found.getEndOffsetInclusive();
                    const text = element.getText();

                    // Extract the matched text (e.g., "Name: ______")
                    // Note: findText returns a range, but getText returns the whole element text.
                    // We need to match precisely to replace safely.

                    const match = text.substring(startOffset, endOffset + 1);

                    // Create replacement: "Name: ______" -> "Name: {{Tag}}"
                    // We replace the underscores within the match with the tag.
                    const newTextForMatch = match.replace(/_+/, p.tag);

                    // We can use deleteText and insertText to be precise
                    element.deleteText(startOffset, endOffset);
                    element.insertText(startOffset, newTextForMatch);

                    replaceCount++;

                    // Continue search from the end of the insertion
                    // Note: After modification, offsets change. 
                    // findText continues from the *next* occurrence naturally if we call it again?
                    // Actually, findText(searchPattern, startFrom) requires a RangeElement.
                    // Easiest way in GAS loop is nicely handled if we are careful.
                    // But modifying the document invalidates the 'found' range often.
                    // Safest approach: Loop until no found (but strictly move forward).
                    // Or, since we modified the text, the regex might not match anymore (good!).
                    found = body.findText(p.regex, found);
                }
            });

            doc.saveAndClose();
            resultLog.push(`  - Done (${replaceCount} replacements)`);

        } catch (e) {
            resultLog.push(`  - Error: ${e.message}`);
        }
    }

    return resultLog.join('\n');
}

function analyzeTagPatterns() {
    const report = [];
    for (const [name, id] of Object.entries(TAGGING_CONFIG.docs)) {
        report.push(`\n--- DOCUMENT: ${name} (${id}) ---`);
        try {
            const doc = DocumentApp.openById(id);
            const output = [];
            const body = doc.getBody();
            const text = body.getText();
            const lines = text.split('\n');

            lines.forEach((line, index) => {
                if (line.includes('___')) {
                    let snippet = line.trim();
                    if (snippet.length > 100) snippet = snippet.substring(0, 100) + '...';
                    output.push(`Line ${index + 1}: ${snippet}`);
                }
            });

            if (output.length === 0) {
                report.push('(No underscore patterns found)');
            } else {
                report.push(output.join('\n'));
            }
        } catch (e) {
            report.push(`Error: ${e.message}`);
        }
    }
    return report.join('\n');
}

function inspectDoc(docNameKey) {
    const id = TAGGING_CONFIG.docs[docNameKey];
    if (!id) return `Error: Doc key '${docNameKey}' not found.`;

    try {
        const doc = DocumentApp.openById(id);
        const body = doc.getBody();
        const text = body.getText();
        return `--- Document Content for ${docNameKey} (${id}) ---\nLength: ${text.length} chars\nPreview:\n${text.substring(0, 1000)}\n--- End Preview ---`;
    } catch (e) {
        return `Error reading doc: ${e.message}`;
    }
}
