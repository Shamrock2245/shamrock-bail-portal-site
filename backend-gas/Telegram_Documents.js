/**
 * ============================================================================
 * Telegram_Documents.js
 * ============================================================================
 * Handles the Telegram Mini-App document signing workflow.
 * 
 * ACTIONS HANDLED:
 *   - telegram_document_lookup   → Case lookup + document status
 *   - telegram_get_signing_url   → Generate embedded signing link
 *   - telegram_document_status   → Check individual doc status from SignNow
 * 
 * DEPENDS ON:
 *   - SignNow_Integration_Complete.js (SN_getConfig, SN_createEmbeddedLink, SN_addFields, etc.)
 *   - Code.js (getConfig, createResponse, createErrorResponse)
 * ============================================================================
 */

// ============================================================================
// 1. SIGNNOW TEMPLATE ID MAPPING
// ============================================================================
// Maps Telegram PACKET_DOCS `id` values → SignNow template IDs
// These are the "Shamrock *" named templates in folder 8f4f9301df1d418a...
// All templates are in production SignNow (api.signnow.com)

const SIGNNOW_TEMPLATE_MAP = {
    'paperwork-header': '6bf07c9baec04210aa41ab4bed767314fd9243b9', // Shamrock Paperwork Header
    'faq-cosigners': '37725f4033cc4316a154a7edc2e0600da71f8938', // Shamrock Faq Cosigners
    'faq-defendants': '41ea80f5087f4bbca274f545b6e270748182e013', // Shamrock Faq Defendant
    'indemnity-agreement': '2c16525316f143338db14b4ef578aabe67bd47d8', // Shamrock Indemnity Agreement
    'defendant-application': '5ca8b3a3dbc748aa8e33201fcbe87f985850573f', // Shamrock Defendant Application
    'promissory-note': 'e01eb884a00a46408c056093ba0937e26715e3ae', // Shamrock Promissory Note
    'disclosure-form': '08f56f268b2c4b45a1de434b278c840936d09ad9', // Shamrock Disclosure Form
    'surety-terms': '4cd02a2dcb334fcc89499d277763fb541820ff40', // Shamrock Surety Terms Conditions
    'master-waiver': 'cc7e8c7bd0c343088ecb55b965baee881dfd1950', // Shamrock Master Waiver
    'ssa-release': '3aac5dd7cc03408594e56d4a7f1ddd9ccbdb8fe7', // Shamrock Ssa Release
    'collateral-receipt': '903275f447284cce83e973253f2760c334eb3768', // Shamrock Collateral Premium Receipt
    'payment-plan': 'ea13db9ec6e7462d963682e6b53f5ca0e46c892f'  // Shamrock Payment Plan Agreement
};

// ============================================================================
// Signature field definitions — PRODUCTION (osiforms calibrated)
// ============================================================================
// ✅ SOURCE OF TRUTH: Acrobat Pro form fields from osiforms PDFs (Feb 26 2026).
//    Visually verified and corrected based on explicit user-provided business rules.
//
// COORDINATE SYSTEM: Top-left origin, points (72 DPI) — matches SignNow API.
//
// KEY BUSINESS RULES:
//   - Data fields are PRE-FILLED by Dashboard.html automation; this map is for SIGNATURES/INITIALS ONLY.
//   - Indemnity Agreement: Signed by Indemnitor ONLY.
//   - Defendant Application: Signed by Defendant ONLY.
//   - SSA Release: One full form is generated PER PERSON (Defendant, Indemnitor, etc.).
//   - FAQ Docs: Both Defendant and Indemnitor initial ALL pages of BOTH FAQs.
//
// ⚠️ 4 docs need SignNow template editor tag additions:
//   - faq-cosigners (flat PDF, add initials tags)
//   - faq-defendants (flat PDF, add initials tags)
//   - master-waiver (verify/add signature tags on page 4)
//   - collateral-receipt (verify depositor signature tag)
// ============================================================================

/**
 * Returns field definitions for a given document ID.
 * Production coordinates from osiforms Acrobat Pro originals.
 */
/**
 * getSignatureFieldDefs(docId)
 *
 * Returns SignNow field placement definitions for each bail bond document.
 *
 * SOURCE OF TRUTH: Acrobat Pro form fields from osiforms PDFs (Feb 26 2026).
 *   Visually verified and corrected based on explicit user-provided business rules.
 *
 * COORDINATE SYSTEM: Top-left origin, points (72 DPI) — matches SignNow API.
 *
 * KEY BUSINESS RULES:
 *   - Data fields are PRE-FILLED by Dashboard.html automation; this map is for SIGNATURES/INITIALS ONLY.
 *   - Indemnity Agreement: Signed by Indemnitor ONLY.
 *   - Defendant Application: Signed by Defendant ONLY.
 *   - SSA Release: One full form is generated PER PERSON (Defendant, Indemnitor, etc.).
 *   - FAQ Docs: Both Defendant and Indemnitor initial ALL pages of BOTH FAQs.
 */
function getSignatureFieldDefs(docId) {
    var FIELD_DEFS = {

<<<<<<< Updated upstream
        // ----------------------------------------------------
        // paperwork-header
        // File    : shamrock-paperwork-header.pdf
        // Template: 6bf07c9baec04210aa41ab4bed767314fd9243b9
        // Note    : Cover page only. No signatures. Names pre-filled by SignNow invite data.
        'paperwork-header': [
            // No signature fields — see note above
        ],

        // ----------------------------------------------------
        // faq-cosigners
        // File    : ShamrockBailBonds-FAQCosigners.pdf
        // Template: 37725f4033cc4316a154a7edc2e0600da71f8938
        // Note    : FLAT PDF. Both Defendant AND Indemnitor initial every page (business rule: cross-role awareness). Add SignNow initials tags manually.
        // ⚠️  ACTION: Add SignNow signature/initials tags in template editor
=======
        // paperwork-header — Cover page. No signatures.
        'paperwork-header': [],

        // faq-cosigners — FLAT PDF. Both Defendant AND Indemnitor initial every page.
        // ⚠️ ACTION: Add SignNow initials tags in template editor
>>>>>>> Stashed changes
        'faq-cosigners': [
            { type: 'initials', role: 'Defendant', page_number: 0, x: 50, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Indemnitor', page_number: 0, x: 490, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Defendant', page_number: 1, x: 50, y: 748, width: 60, height: 22 },
<<<<<<< Updated upstream
            { type: 'initials', role: 'Indemnitor', page_number: 1, x: 490, y: 748, width: 60, height: 22 },
        ],

        // ----------------------------------------------------
        // faq-defendants
        // File    : ShamrockBailBonds-FAQDefe..pdf
        // Template: 41ea80f5087f4bbca274f545b6e270748182e013
        // Note    : FLAT PDF. Both Defendant AND Indemnitor initial every page (business rule: cross-role awareness). Add SignNow initials tags manually.
        // ⚠️  ACTION: Add SignNow signature/initials tags in template editor
=======
            { type: 'initials', role: 'Indemnitor', page_number: 1, x: 490, y: 748, width: 60, height: 22 }
        ],

        // faq-defendants — FLAT PDF. Both Defendant AND Indemnitor initial every page.
        // ⚠️ ACTION: Add SignNow initials tags in template editor
>>>>>>> Stashed changes
        'faq-defendants': [
            { type: 'initials', role: 'Defendant', page_number: 0, x: 50, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Indemnitor', page_number: 0, x: 490, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Defendant', page_number: 1, x: 50, y: 748, width: 60, height: 22 },
<<<<<<< Updated upstream
            { type: 'initials', role: 'Indemnitor', page_number: 1, x: 490, y: 748, width: 60, height: 22 },
        ],

        // ----------------------------------------------------
        // indemnity-agreement
        // File    : IndemnityAgreementFINAL.pdf
        // Template: 2c16525316f143338db14b4ef578aabe67bd47d8
        // Note    : RULE: Indemnitor signs. 1 signature only. All other fields are data-entry (pre-filled by Dashboard.html).
        'indemnity-agreement': [
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 315, y: 935, width: 249, height: 27 },  // Per user confirmation, only Indemnitor signs this form.
        ],

        // ----------------------------------------------------
        // defendant-application
        // File    : AppforAppearanceBondFINAL.pdf
        // Template: 5ca8b3a3dbc748aa8e33201fcbe87f985850573f
        // Note    : RULE: Defendant signs. 1 signature on page 2. Page 1 is data-entry (pre-filled).
        'defendant-application': [
            { type: 'signature', role: 'Defendant', page_number: 1, x: 39, y: 752, width: 247, height: 29 },  // Per user confirmation, only Defendant signs this form (on page 2).
        ],

        // ----------------------------------------------------
        // promissory-note
        // File    : PromissorySide2FINAL.pdf
        // Template: e01eb884a00a46408c056093ba0937e26715e3ae
        // Note    : Defendant + Indemnitor sign at bottom. All other fields are data-entry.
        'promissory-note': [
            { type: 'signature', role: 'Defendant', page_number: 0, x: 33, y: 888, width: 235, height: 32 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 342, y: 888, width: 234, height: 32 },
        ],

        // ----------------------------------------------------
        // disclosure-form
        // File    : DisclosureFINAL.pdf
        // Template: 08f56f268b2c4b45a1de434b278c840936d09ad9
        // Note    : 6 signature fields across 2 sections. Co-Indemnitor slots map to Indemnitor role in SignNow.
        'disclosure-form': [
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 82, y: 575, width: 213, height: 24 },  // Co-Indemnitor slot maps to Indemnitor role
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 324, y: 575, width: 232, height: 24 },  // Co-Indemnitor slot maps to Indemnitor role
            { type: 'signature', role: 'Defendant', page_number: 0, x: 82, y: 844, width: 213, height: 24 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 324, y: 844, width: 232, height: 24 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 83, y: 889, width: 213, height: 24 },  // Co-Indemnitor slot maps to Indemnitor role
            { type: 'signature', role: 'Bail Agent', page_number: 0, x: 324, y: 889, width: 232, height: 24 },
        ],

        // ----------------------------------------------------
        // surety-terms
        // File    : SuretyTermsandConditionsInformationsheetFINAL.pdf
        // Template: 4cd02a2dcb334fcc89499d277763fb541820ff40
        // Note    : Defendant + 3 Indemnitor slots. Third/fourth slots for co-indemnitors.
        'surety-terms': [
            { type: 'signature', role: 'Defendant', page_number: 0, x: 29, y: 820, width: 266, height: 22 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 333, y: 820, width: 247, height: 22 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 29, y: 897, width: 266, height: 22 },  // Co-Indemnitor slot maps to Indemnitor role
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 333, y: 897, width: 247, height: 22 },  // Co-Indemnitor slot maps to Indemnitor role
        ],

        // ----------------------------------------------------
        // master-waiver
        // File    : shamrock-master-waiver.pdf
        // Template: cc7e8c7bd0c343088ecb55b965baee881dfd1950
        // Note    : 4 pages. Signing on page 4 (index 3). Bail Agent = Surety Representative slot.
        // ⚠️  ACTION: Add SignNow signature/initials tags in template editor
        'master-waiver': [
            { type: 'signature', role: 'Bail Agent', page_number: 3, x: 28, y: 453, width: 290, height: 27 },  // Surety Representative
            { type: 'signature', role: 'Defendant', page_number: 3, x: 28, y: 482, width: 290, height: 27 },
            { type: 'signature', role: 'Indemnitor', page_number: 3, x: 28, y: 510, width: 290, height: 27 },
            { type: 'signature', role: 'Indemnitor', page_number: 3, x: 28, y: 537, width: 290, height: 27 },  // Co-Indemnitor
        ],

        // ----------------------------------------------------
        // ssa-release
        // File    : shamrock-ssa-release.pdf
        // Template: 3aac5dd7cc03408594e56d4a7f1ddd9ccbdb8fe7
        // Note    : RULE: One full form per person. The calling logic must generate a separate document for each signer (Defendant, Indemnitor, etc.). This definition is for one instance.
        'ssa-release': [
            { type: 'signature', role: 'Defendant', page_number: 0, x: 205, y: 618, width: 249, height: 30 },  // One form per person. Role will be overridden by calling logic for Indemnitors.
        ],

        // ----------------------------------------------------
        // collateral-receipt
        // File    : osi-premium-collateral-template.pdf
        // Template: 903275f447284cce83e973253f2760c334eb3768
        // Note    : Two sections: Collateral Receipt (depositor/indemnitor sig) + Premium Receipt (agent sig ×2).
        // ⚠️  ACTION: Add SignNow signature/initials tags in template editor
        'collateral-receipt': [
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 350, y: 580, width: 220, height: 25 },  // Depositor's Signature
            { type: 'signature', role: 'Bail Agent', page_number: 0, x: 75, y: 793, width: 221, height: 20 },  // Receipt for Return of Collateral
            { type: 'signature', role: 'Bail Agent', page_number: 0, x: 393, y: 945, width: 184, height: 23 },  // Premium Receipt section
        ],

        // ----------------------------------------------------
        // payment-plan
        // File    : shamrock-premium-finance-notice.pdf
        // Template: ea13db9ec6e7462d963682e6b53f5ca0e46c892f
        // Note    : 4 pages. Defendant + Indemnitor sign on final page only.
        'payment-plan': [
            { type: 'signature', role: 'Defendant', page_number: 3, x: 185, y: 99, width: 168, height: 27 },
            { type: 'signature', role: 'Indemnitor', page_number: 3, x: 191, y: 127, width: 162, height: 27 },
        ],

=======
            { type: 'initials', role: 'Indemnitor', page_number: 1, x: 490, y: 748, width: 60, height: 22 }
        ],

        // indemnity-agreement — Indemnitor signs. 1 signature only.
        'indemnity-agreement': [
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 315, y: 935, width: 249, height: 27 }
        ],

        // defendant-application — Defendant signs page 2 only.
        'defendant-application': [
            { type: 'signature', role: 'Defendant', page_number: 1, x: 39, y: 752, width: 247, height: 29 }
        ],

        // promissory-note — Defendant + Indemnitor sign at bottom.
        'promissory-note': [
            { type: 'signature', role: 'Defendant', page_number: 0, x: 33, y: 888, width: 235, height: 32 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 342, y: 888, width: 234, height: 32 }
        ],

        // disclosure-form — 6 sigs across 2 sections. Co-Indemnitor → Indemnitor role.
        'disclosure-form': [
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 82, y: 575, width: 213, height: 24 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 324, y: 575, width: 232, height: 24 },
            { type: 'signature', role: 'Defendant', page_number: 0, x: 82, y: 844, width: 213, height: 24 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 324, y: 844, width: 232, height: 24 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 83, y: 889, width: 213, height: 24 },
            { type: 'signature', role: 'Bail Agent', page_number: 0, x: 324, y: 889, width: 232, height: 24 }
        ],

        // surety-terms — Defendant + 3 Indemnitor slots.
        'surety-terms': [
            { type: 'signature', role: 'Defendant', page_number: 0, x: 29, y: 820, width: 266, height: 22 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 333, y: 820, width: 247, height: 22 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 29, y: 897, width: 266, height: 22 },
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 333, y: 897, width: 247, height: 22 }
        ],

        // master-waiver — 4 pages. Signing on page 4 (index 3). Bail Agent = Surety Rep.
        // ⚠️ ACTION: Verify/add signature tags on page 4 in SignNow editor
        'master-waiver': [
            { type: 'signature', role: 'Bail Agent', page_number: 3, x: 28, y: 453, width: 290, height: 27 },
            { type: 'signature', role: 'Defendant', page_number: 3, x: 28, y: 482, width: 290, height: 27 },
            { type: 'signature', role: 'Indemnitor', page_number: 3, x: 28, y: 510, width: 290, height: 27 },
            { type: 'signature', role: 'Indemnitor', page_number: 3, x: 28, y: 537, width: 290, height: 27 }
        ],

        // ssa-release — One full form per person. Role overridden by calling logic.
        'ssa-release': [
            { type: 'signature', role: 'Defendant', page_number: 0, x: 205, y: 618, width: 249, height: 30 }
        ],

        // collateral-receipt — 2 sections: Collateral Receipt + Premium Receipt.
        // ⚠️ ACTION: Verify depositor signature tag position in SignNow editor
        'collateral-receipt': [
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 350, y: 580, width: 220, height: 25 },
            { type: 'signature', role: 'Bail Agent', page_number: 0, x: 75, y: 793, width: 221, height: 20 },
            { type: 'signature', role: 'Bail Agent', page_number: 0, x: 393, y: 945, width: 184, height: 23 }
        ],

        // payment-plan — 4 pages. Sigs on final page only.
        'payment-plan': [
            { type: 'signature', role: 'Defendant', page_number: 3, x: 185, y: 99, width: 168, height: 27 },
            { type: 'signature', role: 'Indemnitor', page_number: 3, x: 191, y: 127, width: 162, height: 27 }
        ]
>>>>>>> Stashed changes
    };
    return FIELD_DEFS[docId] || [];
}


// ============================================================================
// 2. HANDLER: telegram_document_lookup
// ============================================================================
// Called by Telegram Documents app when user enters phone/case number.
// Returns: case info + per-document signing statuses.

function handleTelegramDocumentLookup(data) {
    try {
        Logger.log('📄 Document lookup: phone=' + (data.phone || '') + ' case=' + (data.caseNumber || ''));

        var ss = SpreadsheetApp.getActiveSpreadsheet();

        // --- Log the lookup ---
        var logSheet = ss.getSheetByName('DocSigningLookups');
        if (!logSheet) {
            logSheet = ss.insertSheet('DocSigningLookups');
            logSheet.appendRow(['Timestamp', 'Phone', 'CaseNumber', 'TelegramUserID', 'Result']);
            logSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
        }

        // --- Find case in IntakeQueue ---
        var cleanPhone = (data.phone || '').replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '1' + cleanPhone;
        var caseNumber = (data.caseNumber || '').trim();

        var iq = ss.getSheetByName('IntakeQueue');
        if (!iq || iq.getLastRow() < 2) {
            logSheet.appendRow([new Date(), data.phone, caseNumber, data.telegramUserId || '', 'NOT_FOUND']);
            return { success: false, error: 'no_cases', message: 'No cases found. Please check your information.' };
        }

        var iqData = iq.getDataRange().getValues();
        var headers = iqData[0];
        var colIdx = {};
        headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

        var matchedRow = null;
        for (var r = iqData.length - 1; r >= 1; r--) {
            var row = iqData[r];

            // Match by case/booking number
            if (caseNumber) {
                var rowCase = String(row[colIdx['casenumber'] || colIdx['case number'] || colIdx['bookingnumber'] || colIdx['booking number']] || '').trim();
                if (rowCase && rowCase.toLowerCase() === caseNumber.toLowerCase()) {
                    matchedRow = row;
                    break;
                }
            }

            // Match by phone
            if (cleanPhone) {
                var indPhone = String(row[colIdx['indphone'] || colIdx['ind phone'] || colIdx['phone']] || '').replace(/\D/g, '');
                var defPhone = String(row[colIdx['defphone'] || colIdx['def phone']] || '').replace(/\D/g, '');
                if (indPhone.length === 10) indPhone = '1' + indPhone;
                if (defPhone.length === 10) defPhone = '1' + defPhone;

                if ((cleanPhone && indPhone && indPhone.slice(-10) === cleanPhone.slice(-10)) ||
                    (cleanPhone && defPhone && defPhone.slice(-10) === cleanPhone.slice(-10))) {
                    matchedRow = row;
                    break;
                }
            }
        }

        if (!matchedRow) {
            logSheet.appendRow([new Date(), data.phone, caseNumber, data.telegramUserId || '', 'NOT_FOUND']);
            return { success: false, error: 'no_cases', message: 'No matching case found.' };
        }

        // --- Build case data from matched row ---
        var getValue = function (keys) {
            for (var k = 0; k < keys.length; k++) {
                var idx = colIdx[keys[k].toLowerCase()];
                if (idx !== undefined && matchedRow[idx]) return String(matchedRow[idx]);
            }
            return '';
        };

        var defendantName = getValue(['DefendantName', 'Defendant Name', 'defendant_name', 'FullName', 'Full Name']);
        if (!defendantName) {
            var fn = getValue(['FirstName', 'First Name', 'defendant-first-name']);
            var ln = getValue(['LastName', 'Last Name', 'defendant-last-name']);
            defendantName = (fn + ' ' + ln).trim();
        }
        var indemnitorName = getValue(['IndemnitorName', 'Indemnitor Name', 'indemnitor_name']);
        var indemnitorEmail = getValue(['IndemnitorEmail', 'Indemnitor Email', 'indemnitor_email', 'Email']);
        var indemnitorPhone = getValue(['IndPhone', 'Ind Phone', 'Phone', 'indemnitor_phone']);
        var foundCase = getValue(['CaseNumber', 'Case Number', 'BookingNumber', 'Booking Number']);

        // --- Check document signing statuses ---
        var docStatuses = getDocumentStatuses_(foundCase || caseNumber || cleanPhone, ss);

        logSheet.appendRow([new Date(), data.phone, caseNumber, data.telegramUserId || '', 'FOUND:' + defendantName]);

        return {
            success: true,
            caseData: {
                caseNumber: foundCase || caseNumber,
                defendantName: defendantName,
                indemnitorName: indemnitorName,
                indemnitorEmail: indemnitorEmail,
                indemnitorPhone: indemnitorPhone,
                bondAmount: getValue(['BondAmount', 'Bond Amount', 'bond_amount']),
                charges: getValue(['Charges', 'charges']),
                county: getValue(['County', 'county']),
                status: getValue(['Status', 'status']) || 'pending',
                documentStatuses: docStatuses
            }
        };

    } catch (e) {
        Logger.log('❌ Document lookup error: ' + e.toString());
        return { success: false, error: 'server_error', message: 'Unable to look up documents. ' + e.message };
    }
}


// ============================================================================
// 3. HANDLER: telegram_get_signing_url
// ============================================================================
// Called when user taps "Sign" on a specific document.
// Flow: Template → Create Document Copy → Add Fields → Create Embedded Link

function handleTelegramGetSigningUrl(data) {
    try {
        var docId = data.documentId;  // e.g. 'indemnity-agreement'
        var signerRole = data.role || 'Indemnitor';
        var signerEmail = data.email || '';
        var caseNumber = data.caseNumber || '';

        Logger.log('🖊️ Signing URL request: doc=' + docId + ' role=' + signerRole + ' case=' + caseNumber);

        // Validate document ID
        if (!SIGNNOW_TEMPLATE_MAP[docId]) {
            return { success: false, error: 'invalid_doc', message: 'Unknown document: ' + docId };
        }

        // Appearance bonds are print-only
        if (docId === 'appearance-bonds') {
            return { success: false, error: 'print_only', message: 'Appearance bonds require wet signature — not available for digital signing.' };
        }

        // Paperwork header is read-only
        if (docId === 'paperwork-header') {
            return { success: false, error: 'readonly', message: 'The paperwork header is a cover page and does not require signing.' };
        }

        var config = SN_getConfig();
        var templateId = SIGNNOW_TEMPLATE_MAP[docId];

        // --- Step 1: Check if we already have a document copy for this case ---
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var existingDocId = getExistingSignNowDocId_(caseNumber, docId, ss);

        var signNowDocId;

        if (existingDocId) {
            // Reuse existing document copy
            Logger.log('♻️ Reusing existing doc copy: ' + existingDocId);
            signNowDocId = existingDocId;
        } else {
            // --- Step 2: Create a new document from the template ---
            Logger.log('📋 Creating document from template: ' + templateId);
            var createUrl = config.API_BASE + '/template/' + templateId + '/copy';
            var createPayload = {
                document_name: 'Shamrock_' + docId + '_' + (caseNumber || Date.now())
            };

            var createRes = UrlFetchApp.fetch(createUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                },
                payload: JSON.stringify(createPayload),
                muteHttpExceptions: true
            });

            var createJson = JSON.parse(createRes.getContentText());
            if (!createJson.id) {
                Logger.log('❌ Template copy failed: ' + createRes.getContentText());
                return { success: false, error: 'template_error', message: 'Failed to create document from template.' };
            }

            signNowDocId = createJson.id;
            Logger.log('✅ Document copy created: ' + signNowDocId);

            // --- Step 3: Add signature/initials fields to the document ---
            var fieldDefs = getSignatureFieldDefs(docId);
            if (fieldDefs.length > 0) {
                var snFields = fieldDefs.map(function (f) {
                    return {
                        type: f.type,
                        role: f.role,
                        page_number: f.page_number,
                        x: f.x,
                        y: f.y,
                        width: f.width,
                        height: f.height,
                        required: true
                    };
                });

                var addResult = SN_addFields(signNowDocId, snFields);
                if (!addResult.success) {
                    Logger.log('⚠️ Field addition partial/failed: ' + JSON.stringify(addResult));
                    // Continue anyway — fields may already exist
                } else {
                    Logger.log('✅ Added ' + snFields.length + ' fields to document');
                }
            }

            // --- Step 4: Save the document ID for this case ---
            saveSignNowDocId_(caseNumber, docId, signNowDocId, ss);
        }

        // --- Step 5: Create the embedded signing link ---
        var linkResult = SN_createEmbeddedLink(signNowDocId, signerRole, signerEmail, {
            redirect_uri: 'https://shamrock-telegram.netlify.app/documents/',
            decline_redirect_uri: 'https://shamrock-telegram.netlify.app/documents/',
            close_redirect_uri: 'https://shamrock-telegram.netlify.app/documents/',
            expiration: 45
        });

        if (!linkResult.success) {
            Logger.log('❌ Embedded link creation failed: ' + linkResult.error);
            return { success: false, error: 'link_error', message: 'Failed to create signing link. ' + (linkResult.error || '') };
        }

        Logger.log('✅ Signing link created for ' + signerRole + ': ' + linkResult.link.substring(0, 60) + '...');

        return {
            success: true,
            signingUrl: linkResult.link,
            documentId: signNowDocId,
            role: signerRole,
            expiresInMinutes: 45
        };

    } catch (e) {
        Logger.log('❌ Signing URL error: ' + e.toString());
        return { success: false, error: 'server_error', message: 'Unable to generate signing link. ' + e.message };
    }
}


// ============================================================================
// 4. HANDLER: telegram_document_status
// ============================================================================
// Returns the signing status of a specific SignNow document.

function handleTelegramDocumentStatus(data) {
    try {
        var signNowDocId = data.signNowDocId;
        if (!signNowDocId) {
            return { success: false, error: 'missing_doc_id', message: 'No document ID provided.' };
        }

        var config = SN_getConfig();
        var url = config.API_BASE + '/document/' + signNowDocId;

        var res = UrlFetchApp.fetch(url, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
            muteHttpExceptions: true
        });

        if (res.getResponseCode() !== 200) {
            return { success: false, error: 'api_error', message: 'SignNow returned ' + res.getResponseCode() };
        }

        var doc = JSON.parse(res.getContentText());

        // Determine status from field_invites and signatures
        var fieldInvites = doc.field_invites || [];
        var signatures = doc.signatures || [];

        var status = 'pending';
        if (signatures.length > 0) {
            // Check if all roles have signed
            var rolesNeeded = {};
            fieldInvites.forEach(function (inv) { rolesNeeded[inv.role] = false; });
            signatures.forEach(function (sig) { rolesNeeded[sig.signer_role || 'unknown'] = true; });

            var allSigned = Object.keys(rolesNeeded).length > 0 &&
                Object.values(rolesNeeded).every(function (v) { return v; });
            status = allSigned ? 'completed' : 'partially_signed';
        } else if (fieldInvites.length > 0) {
            status = 'sent';
        }

        return {
            success: true,
            status: status,
            documentName: doc.document_name,
            signatureCount: signatures.length,
            pendingInvites: fieldInvites.filter(function (inv) { return inv.status !== 'fulfilled'; }).length
        };

    } catch (e) {
        Logger.log('❌ Document status error: ' + e.toString());
        return { success: false, error: 'server_error', message: e.message };
    }
}


// ============================================================================
// 5. HELPER: Document Status Tracking (Spreadsheet-Based)
// ============================================================================

/**
 * Get document signing statuses for a case from the tracking sheet.
 * Falls back to 'pending' for all docs if no tracking data exists.
 */
function getDocumentStatuses_(caseKey, ss) {
    var statuses = {};

    // Default all documents to pending
    Object.keys(SIGNNOW_TEMPLATE_MAP).forEach(function (docId) {
        statuses[docId] = 'pending';
    });

    var sheet = ss.getSheetByName('DocSigningTracker');
    if (!sheet || sheet.getLastRow() < 2) return statuses;

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var colIdx = {};
    headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

    var caseCol = colIdx['casekey'] || colIdx['case key'] || 0;
    var docCol = colIdx['documentid'] || colIdx['document id'] || 1;
    var statusCol = colIdx['status'] || 2;

    for (var r = 1; r < data.length; r++) {
        var rowKey = String(data[r][caseCol] || '').trim();
        if (rowKey === caseKey) {
            var docId = String(data[r][docCol] || '').trim();
            var docStatus = String(data[r][statusCol] || 'pending').trim();
            if (docId && statuses.hasOwnProperty(docId)) {
                statuses[docId] = docStatus;
            }
        }
    }

    return statuses;
}

/**
 * Look up an existing SignNow document ID for a case+document combo.
 */
function getExistingSignNowDocId_(caseKey, docId, ss) {
    var sheet = ss.getSheetByName('DocSigningTracker');
    if (!sheet || sheet.getLastRow() < 2) return null;

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var colIdx = {};
    headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

    var caseCol = colIdx['casekey'] || colIdx['case key'] || 0;
    var docCol = colIdx['documentid'] || colIdx['document id'] || 1;
    var snDocCol = colIdx['signnowdocid'] || colIdx['signnow doc id'] || 3;

    for (var r = data.length - 1; r >= 1; r--) {
        var rowKey = String(data[r][caseCol] || '').trim();
        var rowDoc = String(data[r][docCol] || '').trim();
        if (rowKey === caseKey && rowDoc === docId) {
            var snId = String(data[r][snDocCol] || '').trim();
            if (snId) return snId;
        }
    }
    return null;
}

/**
 * Save a SignNow document ID to the tracking sheet.
 */
function saveSignNowDocId_(caseKey, docId, signNowDocId, ss) {
    var sheet = ss.getSheetByName('DocSigningTracker');
    if (!sheet) {
        sheet = ss.insertSheet('DocSigningTracker');
        sheet.appendRow(['CaseKey', 'DocumentId', 'Status', 'SignNowDocId', 'CreatedAt', 'UpdatedAt']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    }

    sheet.appendRow([
        caseKey,
        docId,
        'created',
        signNowDocId,
        new Date().toISOString(),
        new Date().toISOString()
    ]);
}

/**
 * Update a document's signing status in the tracker.
 * Called by webhook handlers when a document is signed.
 */
function updateDocSigningStatus_(caseKey, docId, newStatus, ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('DocSigningTracker');
    if (!sheet || sheet.getLastRow() < 2) return;

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var colIdx = {};
    headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

    var caseCol = colIdx['casekey'] || 0;
    var docCol = colIdx['documentid'] || 1;
    var statusCol = colIdx['status'] || 2;
    var updatedCol = colIdx['updatedat'] || 5;

    for (var r = data.length - 1; r >= 1; r--) {
        if (String(data[r][caseCol]).trim() === caseKey &&
            String(data[r][docCol]).trim() === docId) {
            sheet.getRange(r + 1, statusCol + 1).setValue(newStatus);
            sheet.getRange(r + 1, updatedCol + 1).setValue(new Date().toISOString());
            return;
        }
    }
}


// ============================================================================
// 6. UTILITY: Template Field Setup (Run Once)
// ============================================================================
// Use this function to verify template field status across all templates.
// Run from the Script Editor to audit.

function auditSignNowTemplateFields() {
    var config = SN_getConfig();
    var results = [];

    Object.keys(SIGNNOW_TEMPLATE_MAP).forEach(function (docId) {
        var templateId = SIGNNOW_TEMPLATE_MAP[docId];
        try {
            var url = config.API_BASE + '/document/' + templateId;
            var res = UrlFetchApp.fetch(url, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
                muteHttpExceptions: true
            });

            if (res.getResponseCode() === 200) {
                var doc = JSON.parse(res.getContentText());
                results.push({
                    docId: docId,
                    templateId: templateId,
                    name: doc.document_name,
                    roles: (doc.roles || []).length,
                    fields: (doc.fields || []).length,
                    fieldInvites: (doc.field_invites || []).length,
                    signatures: (doc.signatures || []).length,
                    status: (doc.roles || []).length > 0 ? '✅ HAS_ROLES' : '⚠️ NO_ROLES'
                });
            } else {
                results.push({ docId: docId, templateId: templateId, status: '❌ HTTP_' + res.getResponseCode() });
            }
        } catch (e) {
            results.push({ docId: docId, templateId: templateId, status: '❌ ERROR: ' + e.message });
        }
    });

    Logger.log('=== SignNow Template Field Audit ===');
    results.forEach(function (r) {
        Logger.log(r.docId + ': ' + r.status + ' (roles=' + (r.roles || 0) + ', fields=' + (r.fields || 0) + ')');
    });

    return results;
}
