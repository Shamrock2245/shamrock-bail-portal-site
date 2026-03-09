/**
 * CourtDocumentGenerator.js
 * 
 * Responsible for generating strictly formatted legal documents:
 * - Stipulations
 * - Motions for Remission
 * - Orders
 * - Affidavits
 * 
 * Formatting Rules Enforced:
 * - Font: Times New Roman, 12pt
 * - Margins: 1 inch (72 points) on all sides
 * - Line Spacing: Case Caption (Single), Body (Double)
 * - Alignment: Justified body, Centered titles
 */

const COURT_DOCS_FOLDER_ID = '12iJ921jS-9u2n9k8s9J-d8s9d2j'; // Replace with a real folder ID if needed, or create dynamically.

const FORMAT_RULES = {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    margin: 72 // 1 inch = 72 points
};

/**
 * Creates a blank, perfectly formatted Google Doc.
 */
function createFormattedDoc(title, folderId) {
    const doc = DocumentApp.create(title);

    // Set Margins
    const body = doc.getBody();
    body.setMarginTop(FORMAT_RULES.margin)
        .setMarginBottom(FORMAT_RULES.margin)
        .setMarginLeft(FORMAT_RULES.margin)
        .setMarginRight(FORMAT_RULES.margin);

    // Set global default font and size
    const style = {};
    style[DocumentApp.Attribute.FONT_FAMILY] = FORMAT_RULES.fontFamily;
    style[DocumentApp.Attribute.FONT_SIZE] = FORMAT_RULES.fontSize;
    body.setAttributes(style);

    // Move to folder if specified
    let fileId = doc.getId();
    if (folderId) {
        try {
            const file = DriveApp.getFileById(fileId);
            const folder = DriveApp.getFolderById(folderId);
            file.moveTo(folder);
        } catch (e) {
            Logger.log("Could not move document to folder: " + e.message);
        }
    }

    return doc;
}

/**
 * Adds the standard Florida case caption to a document.
 */
function addCaseCaption(body, data) {
    const county = (data.county || 'LEE').toUpperCase();
    const courtName = (data.courtName || 'CIRCUIT').toUpperCase();
    const defendant = (data.defendantName || 'JOHN DOE').toUpperCase();
    const caseNumber = data.caseNumber || 'XX-XX-XXXXXX';

    // Court Header
    const headerText = `IN THE ${courtName} COURT OF THE TWENTIETH JUDICIAL CIRCUIT,\nIN AND FOR ${county} COUNTY, FLORIDA\n`;
    const headerPara = body.insertParagraph(0, headerText);
    headerPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    headerPara.setBold(true);

    // Create a table for the caption (Left: Parties, Right: Case No)
    const table = body.appendTable([
        ['STATE OF FLORIDA,', `CASE NO.: ${caseNumber}`],
        ['    Plaintiff,', ''],
        ['vs.', ''],
        [`${defendant},`, ''],
        ['    Defendant.', '']
    ]);

    table.setBorderWidth(0); // Invisible borders

    // Adjust column widths (roughly 60% / 40%)
    const tableWidth = 6.5 * 72; // 8.5" page - 2" margins
    table.setColumnWidth(0, tableWidth * 0.6);
    table.setColumnWidth(1, tableWidth * 0.4);

    // Single spacing inside table
    const tableStyle = {};
    tableStyle[DocumentApp.Attribute.LINE_SPACING] = 1.0;
    table.setAttributes(tableStyle);

    body.appendParagraph('\n'); // Space after caption
}

/**
 * Generates a Motion for Remission.
 */
function generateMotionForRemission(caseData, folderId) {
    const doc = createFormattedDoc(`Motion for Remission - ${caseData.defendantName || 'Defendant'}`, folderId);
    const body = doc.getBody();

    addCaseCaption(body, caseData);

    // Title
    const title = body.appendParagraph('MOTION FOR REMISSION OF ALL OR PART OF ESTREATED BOND');
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    title.setBold(true);
    title.setUnderline(true);
    body.appendParagraph(''); // spacing

    // Body (Double Spaced)
    const intro = body.appendParagraph(`COMES NOW, the Surety, Shamrock Bail Bonds, by and through its undersigned agent, and moves this Honorable Court pursuant to Florida Statutes §903.28 for remission of all or part of the estreated bond in this cause, and as grounds therefore states as follows:`);
    intro.setLineSpacing(2.0);
    intro.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);

    const points = [
        `On ${caseData.bondDate || '[DATE]'}, the Surety posted an appearance bond in the amount of $${caseData.bondAmount || '[AMOUNT]'} on behalf of the Defendant.`,
        `On ${caseData.estreatureDate || '[DATE]'}, the Defendant failed to appear, and the Court ordered the bond estreated.`,
        `The Surety subsequently expended time, effort, and resources to locate and apprehend the Defendant.`,
        `On ${caseData.apprehensionDate || '[DATE]'}, the Defendant was surrendered / apprehended / returned to the custody of the ${caseData.county || 'Lee'} County Sheriff.`,
        `Pursuant to Florida Statutes §903.28, the Surety is entitled to a remission of the estreated bond based on the surrender of the Defendant within the statutory timeline.`
    ];

    points.forEach((point, index) => {
        const p = body.appendParagraph(`${index + 1}.  ${point}`);
        p.setLineSpacing(2.0);
        p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    });

    const prayer = body.appendParagraph(`WHEREFORE, the Surety respectfully requests this Honorable Court enter an Order for Remission of the estreated bond.`);
    prayer.setLineSpacing(2.0);
    prayer.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    body.appendParagraph('');

    addSignatureBlock(body, 'Respectfully submitted,');

    doc.saveAndClose();
    return { docId: doc.getId(), url: doc.getUrl() };
}

/**
 * Generates a Stipulation to Set Aside Estreature.
 */
function generateStipulation(caseData, folderId) {
    const doc = createFormattedDoc(`Stipulation - ${caseData.defendantName || 'Defendant'}`, folderId);
    const body = doc.getBody();

    addCaseCaption(body, caseData);

    // Title
    const title = body.appendParagraph('STIPULATION TO SET ASIDE ESTREATURE');
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    title.setBold(true);
    title.setUnderline(true);
    body.appendParagraph(''); // spacing

    // Body (Double Spaced)
    const intro = body.appendParagraph(`IT IS HEREBY STIPULATED AND AGREED by and between the State of Florida and Shamrock Bail Bonds, as Surety, that the Bond Estreature entered on ${caseData.estreatureDate || '[DATE]'} in the above-styled cause be set aside and the bond discharged. The Defendant has been surrendered or the case was otherwise resolved justifying the setting aside of the estreature.`);
    intro.setLineSpacing(2.0);
    intro.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    body.appendParagraph('');

    const signatureTable = body.appendTable([
        ['\n\n__________________________________\nAssistant State Attorney', '\n\n__________________________________\nAgent for Shamrock Bail Bonds']
    ]);
    signatureTable.setBorderWidth(0);

    doc.saveAndClose();
    return { docId: doc.getId(), url: doc.getUrl() };
}

/**
 * Generates a proposed Order.
 */
function generateOrder(caseData, folderId) {
    const doc = createFormattedDoc(`Order - ${caseData.defendantName || 'Defendant'}`, folderId);
    const body = doc.getBody();

    addCaseCaption(body, caseData);

    // Title
    const title = body.appendParagraph(`ORDER ON ${caseData.motionType ? caseData.motionType.toUpperCase() : 'MOTION FOR REMISSION'}`);
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    title.setBold(true);
    title.setUnderline(true);
    body.appendParagraph(''); // spacing

    // Body (Double Spaced)
    const intro = body.appendParagraph(`THIS CAUSE having come before the Court upon the Surety's Motion, and the Court being fully advised in the premises, it is hereby:\n\nORDERED AND ADJUDGED that the Motion is GRANTED. The bond estreature entered herein is hereby set aside and the bond is discharged.`);
    intro.setLineSpacing(2.0);
    intro.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);

    body.appendParagraph('\n\n\n');
    const signature = body.appendParagraph('DONE AND ORDERED at ' + (caseData.city || 'Fort Myers') + ', ' + (caseData.county || 'Lee') + ' County, Florida, this _____ day of __________________, 20____.');
    signature.setLineSpacing(2.0);

    body.appendParagraph('\n\n\n__________________________________\nCOUNTY COURT JUDGE');

    doc.saveAndClose();
    return { docId: doc.getId(), url: doc.getUrl() };
}

/**
 * Generates an Affidavit of Surrender/Apprehension.
 */
function generateAffidavit(caseData, folderId) {
    const doc = createFormattedDoc(`Affidavit - ${caseData.defendantName || 'Defendant'}`, folderId);
    const body = doc.getBody();

    addCaseCaption(body, caseData);

    // Title
    const title = body.appendParagraph('AFFIDAVIT OF SURETY');
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    title.setBold(true);
    title.setUnderline(true);
    body.appendParagraph(''); // spacing

    const stateVenue = body.appendParagraph('STATE OF FLORIDA\nCOUNTY OF ' + (caseData.county || 'LEE').toUpperCase());
    stateVenue.setBold(true);
    body.appendParagraph('');

    const intro = body.appendParagraph(`BEFORE ME, the undersigned authority, personally appeared the Affiant, agent for Shamrock Bail Bonds, who after being duly sworn, deposes and says:`);
    intro.setLineSpacing(2.0);

    const points = [
        `I am a duly licensed bail bond agent in the State of Florida.`,
        `On ${caseData.bondDate || '[DATE]'}, a bond was posted for the Defendant.`,
        `The Defendant was apprehended and returned to the custody of the ${caseData.county || 'Lee'} County Jail on ${caseData.apprehensionDate || '[DATE]'}.`
    ];

    points.forEach((point, index) => {
        const p = body.appendParagraph(`${index + 1}.  ${point}`);
        p.setLineSpacing(2.0);
    });

    body.appendParagraph('\nFURTHER AFFIANT SAYETH NAUGHT.\n\n');
    addSignatureBlock(body, '');

    const jurat = body.appendParagraph(`Sworn to and subscribed before me this _____ day of _______________, 20____, by the Affiant, who is personally known to me or who produced ______________________ as identification.\n\n\n__________________________________\nNOTARY PUBLIC`);
    jurat.setLineSpacing(1.5);

    doc.saveAndClose();
    return { docId: doc.getId(), url: doc.getUrl() };
}

function addSignatureBlock(body, prefix) {
    if (prefix) body.appendParagraph(prefix + '\n\n');

    const sigTable = body.appendTable([
        ['', '__________________________________'],
        ['', 'Shamrock Bail Bonds'],
        ['', 'License No.: ____________'],
        ['', 'Address: _________________'],
        ['', 'Phone: ___________________']
    ]);
    sigTable.setBorderWidth(0);
    sigTable.setColumnWidth(0, 3 * 72); // indent
    sigTable.setColumnWidth(1, 3.5 * 72);
}

// Ensure the module exports for local testing or execution
if (typeof module !== 'undefined') {
    module.exports = {
        generateMotionForRemission,
        generateStipulation,
        generateOrder,
        generateAffidavit
    };
}
