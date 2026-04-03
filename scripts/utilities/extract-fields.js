const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const masterDict = [
    "DefName", "DefFirstName", "DefLastName", "DefMiddle", "DefAlias", "DefDOB", "DefSSN",
    "DefAddress", "DefCity", "DefState", "DefZip", "DefTimeAtAddr", "DefFormerAddress",
    "DefPhone", "DefEmail", "DefDL", "DefBookingNum", "DefFacility", "DefCounty", "DefCharges",
    "DefArrestDate", "DefCourtDate", "DefAttorney", "DefAttorneyPhone", "DefHeight", "DefWeight",
    "DefEyes", "DefHair", "DefRace", "DefScars", "DefGlasses", "DefBeard", "DefSpouseName",
    "DefSpousePhone", "DefFatherName", "DefMotherName", "DefPrevArrests", "DefProbation",
    "DefSocialMedia", "DefCarYear", "DefCarMake", "DefCarModel", "DefCarColor", "DefCarPlate",
    "DefCarVin", "IndName", "IndFirstName", "IndLastName", "IndRelation", "IndAddress", "IndCity",
    "IndState", "IndZip", "IndPhone", "IndEmail", "IndDL", "IndSSN", "IndDOB", "IndEmployer",
    "IndEmpPhone", "IndEmpAddress", "IndSupervisor", "Ref1Name", "Ref1Phone", "Ref1Relation",
    "Ref1Address", "Ref2Name", "Ref2Phone", "Ref2Relation", "Ref2Address", "TotalBond", "Premium",
    "PremiumPaid", "BalanceDue", "CaseNum", "PowerNum", "Date", "IndSignature", "DefSignature", "AgentSignature",
    "TotalBond2", "Premium2", "CaseNum2", "PowerNum2", "TotalBond3", "Premium3", "CaseNum3", "PowerNum3",
    "DefCharges2", "DefCharges3", "DefCharges4", "CaseNum4", "PowerNum4", "TotalBond4", "DateDay", "DateMonth", "DateYear", "IndCityStateZip"
];

async function extractAllFields() {
    const dir = '/Users/brendan/Desktop/osi-final-pdfs';
    const outDir = '/Users/brendan/Desktop/shamrock-bail-portal-site';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

    const allFields = new Set();

    for (const file of files) {
        const filePath = path.join(dir, file);
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        fields.forEach(field => {
            allFields.add(field.getName());
        });
    }

    const uniqueFields = Array.from(allFields).sort();

    const mappingTemplate = {};
    uniqueFields.forEach(f => {
        // Attempt auto-map
        let bestMatch = "";
        if (masterDict.includes(f)) {
            bestMatch = f;
        } else {
            const lowerF = f.toLowerCase();
            bestMatch = masterDict.find(m => m.toLowerCase() === lowerF || lowerF.includes(m.toLowerCase())) || "";
        }
        mappingTemplate[f] = bestMatch;
    });

    fs.writeFileSync('/tmp/pdf-inspect/field-mapping.json', JSON.stringify(mappingTemplate, null, 2));
    console.log('Saved field-mapping.json to /tmp/pdf-inspect. Please review and edit mapping.');
}

extractAllFields().catch(console.error);
