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
        'faq-cosigners': [
            { type: 'initials', role: 'Defendant', page_number: 0, x: 50, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Indemnitor', page_number: 0, x: 490, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Defendant', page_number: 1, x: 50, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Indemnitor', page_number: 1, x: 490, y: 748, width: 60, height: 22 },
        ],

        // ----------------------------------------------------
        // faq-defendants
        // File    : ShamrockBailBonds-FAQDefe..pdf
        // Template: 41ea80f5087f4bbca274f545b6e270748182e013
        // Note    : FLAT PDF. Both Defendant AND Indemnitor initial every page (business rule: cross-role awareness). Add SignNow initials tags manually.
        // ⚠️  ACTION: Add SignNow signature/initials tags in template editor
        'faq-defendants': [
            { type: 'initials', role: 'Defendant', page_number: 0, x: 50, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Indemnitor', page_number: 0, x: 490, y: 748, width: 60, height: 22 },
            { type: 'initials', role: 'Defendant', page_number: 1, x: 50, y: 748, width: 60, height: 22 },
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

    };
    return FIELD_DEFS[docId] || [];
}
