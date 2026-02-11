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
        'defendant-application': '1eFwOUAf4Wtlkux4DZkI9d3IJVVC-JLV9Zv5wLzG86o8',
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
        { tag: '{{DefDOB}}', regex: /Date of Birth:\s*_+/i },
        { tag: '{{DefSSN}}', regex: /SSN:\s*_+/i },
        { tag: '{{DefPhone}}', regex: /Phone:\s*_+/i },
        { tag: '{{DefEmail}}', regex: /Email:\s*_+/i },
        { tag: '{{DefAddress}}', regex: /Address:\s*_+/i },
        { tag: '{{DefCity}}', regex: /City:\s*_+/i },
        { tag: '{{DefState}}', regex: /State:\s*_+/i }, // Careful with short lines
        { tag: '{{DefZip}}', regex: /Zip:\s*_+/i },

        // Bond Info
        { tag: '{{TotalBond}}', regex: /Bond Amount:\s*\$?\s*_+/i },
        { tag: '{{PowerNum}}', regex: /Power Number:\s*_+/i },
        { tag: '{{CaseNum}}', regex: /Case Number:\s*_+/i },
        { tag: '{{DefCharges}}', regex: /Charges:\s*_+/i },

        // Indemnitor Info
        { tag: '{{IndName}}', regex: /Indemnitor Name:\s*_+/i },
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

            let replaceCount = 0;

            TAGGING_CONFIG.patterns.forEach(p => {
                // We use findText to locate the pattern
                let found = body.findText(p.regex);

                while (found) {
                    const element = found.getElement();
                    const start = found.getStartOffset();
                    const end = found.getEndOffsetInclusive();
                    const text = element.getText();

                    // We found e.g. "Name: ____________"
                    // We want to replace it with "Name: {{DefName}}"

                    // Check if it's already tagged to avoid double tagging
                    if (!text.includes(p.tag)) {
                        // Determine label from regex match (e.g. "Name: ")
                        // Simple approach: Replace the whole match string with "Label: {{Tag}}" requires knowing the label.
                        // Better approach: Regex replace on the text content of the element?

                        // Simple replaceText on body is safer for global replace
                        body.replaceText(p.regex.source, p.tag);
                        // Note: replaceText takes string pattern, not regex object in GAS? 
                        // "searchPattern	String	A regular expression pattern to search for"

                        // Wait, replaceText replaces the *whole pattern match* with the replacement.
                        // If pattern is "Name: _____", replacement is "{{DefName}}", result is "{{DefName}}".
                        // We lost "Name: ".
                        // We need to capture the label? GAS replaceText doesn't support capture groups in replacement string easily.

                        // Alternative:
                        // The pattern should include the underscores ONLY?
                        // But "________" is ambiguous.

                        // Strategy:
                        // 1. Find text.
                        // 2. Get the text string.
                        // 3. Replace within the string using JS replace (which supports groups).
                        // 4. Set the text back.
                    }

                    // Continue search
                    found = body.findText(p.regex, found);
                }
            });

            // Since specific exact-match replacement is hard with just global replaceText,
            // let's try a specific set of known full-string replacements if possible.
            // OR, iterate paragraphs.

            const paragraphs = body.getParagraphs();
            paragraphs.forEach(para => {
                let text = para.getText();
                let modified = false;

                TAGGING_CONFIG.patterns.forEach(p => {
                    if (p.regex.test(text)) {
                        // E.g. "Name: ________________" matches /Name:\s*_+/
                        // We want "Name: {{DefName}}"
                        // We need to know what part is the label.
                        // Let's assume the label is everything before the underscores?

                        // New Regex with capture: /^(.*name:)\s*_+/i
                        // But our config patterns are simple.

                        // Let's use a smart Replace:
                        // Replace the underscores with the tag?
                        // /Name:\s*(_+)/ -> replace group 1 with tag?

                        // Let's refine the regex for JS replace
                        // We need to match the Label AND the Underscores
                        const match = text.match(p.regex);
                        if (match) {
                            // We replace the underscores part with the tag?
                            // Or replace the whole match with "Safe Label" + Tag?

                            // Let's try to just replace the underscores if they follow the keyword
                            // const newText = text.replace(/(Name:\s*)(_+)/i, '$1{{DefName}}');

                            // We need dynamic regex construction based on the pattern key?
                            // Let's look at the patterns again.
                            // { tag: '{{DefName}}', regex: /Name:\s*_+/i }

                            // We can modify pattern to be: { tag: '{{DefName}}', label: 'Name' }
                            // Then regex is new RegExp(label + ':\\s*_+', 'i')
                        }
                    }
                });
            });

            // Save
            doc.saveAndClose();
            resultLog.push(`  - Done`);

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
