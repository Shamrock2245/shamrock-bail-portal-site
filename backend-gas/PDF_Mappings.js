/**
 * PDF_Mappings.js
 * 
 * "The PDF Architect"
 * Centralized definition of how JSON data maps to PDF Template Tags (SignNow).
 * 
 * Usage:
 * var fields = PDF_mapDataToTags(formData, 'defendant-application');
 */

const SHAMROCK_FIELD_MAPPINGS = {
    "master_dictionary": {
        "DefName": "Defendant Full Legal Name",
        "DefFirstName": "Defendant First Name",
        "DefLastName": "Defendant Last Name",
        "DefMiddle": "Defendant Middle Name",
        "DefAlias": "Defendant Nickname / Alias",
        "DefDOB": "Defendant Date of Birth (MM/DD/YYYY)",
        "DefSSN": "Defendant Social Security Number",
        "DefAddress": "Defendant Current Street Address",
        "DefCity": "Defendant City",
        "DefState": "Defendant State (2 chars)",
        "DefZip": "Defendant Zip Code",
        "DefTimeAtAddr": "Defendant Time at Current Address",
        "DefFormerAddress": "Defendant Former Address",
        "DefPhone": "Defendant Phone Number",
        "DefEmail": "Defendant Email Address",
        "DefDL": "Defendant Driver's License Number",
        "DefBookingNum": "Defendant Booking / Arrest Number",
        "DefFacility": "Jail Facility Name",
        "DefCounty": "Arresting County",
        "DefCharges": "List of Charges",
        "DefArrestDate": "Date of Arrest",
        "DefCourtDate": "Next Court Date",
        "DefCourtTime": "Court Time",
        "DefAttorney": "Attorney Name",
        "DefAttorneyPhone": "Attorney Phone",
        "DefHeight": "Defendant Height",
        "DefWeight": "Defendant Weight",
        "DefEyes": "Defendant Eye Color",
        "DefHair": "Defendant Hair Color",
        "DefRace": "Defendant Race / Ethnicity",
        "DefScars": "Defendant Scars, Marks, Tattoos",
        "DefGlasses": "Defendant Wears Glasses",
        "DefBeard": "Defendant Has Beard",
        "DefSpouseName": "Defendant Spouse's Name",
        "DefSpousePhone": "Defendant Spouse's Phone",
        "DefFatherName": "Defendant Father's Name",
        "DefMotherName": "Defendant Mother's Name",
        "DefPrevArrests": "Defendant Prior Arrest History",
        "DefProbation": "Defendant Probation Officer Name",
        "DefSocialMedia": "Defendant Facebook / Instagram Handle",
        "DefCarYear": "Defendant Vehicle Year",
        "DefCarMake": "Defendant Vehicle Make",
        "DefCarModel": "Defendant Vehicle Model",
        "DefCarColor": "Defendant Vehicle Color",
        "DefCarPlate": "Defendant License Plate Number",
        "DefCarVin": "Defendant Vehicle VIN",
        "DefSignature": "Defendant Signature",
        "DefPhoto": "Defendant Photo",

        "IndName": "Indemnitor Full Name",
        "IndFirstName": "Indemnitor First Name",
        "IndLastName": "Indemnitor Last Name",
        "IndRelation": "Indemnitor Relationship to Defendant",
        "IndAddress": "Indemnitor Street Address",
        "IndCity": "Indemnitor City",
        "IndState": "Indemnitor State",
        "IndZip": "Indemnitor Zip Code",
        "IndCityStateZip": "Indemnitor City, State, Zip",
        "IndPhone": "Indemnitor Phone Number",
        "IndMobilePhone": "Indemnitor Mobile Phone",
        "IndWorkPhone": "Indemnitor Work Phone",
        "IndEmail": "Indemnitor Email Address",
        "IndDL": "Indemnitor Driver's License",
        "IndSSN": "Indemnitor Social Security Number",
        "IndDOB": "Indemnitor Date of Birth",
        "IndEmployer": "Indemnitor Employer Name",
        "IndEmpPhone": "Indemnitor Employer Phone",
        "IndEmpAddress": "Indemnitor Employer Address",
        "IndSupervisor": "Indemnitor Supervisor Name",
        "IndSpouseName": "Indemnitor Spouse Name",
        "IndSpouseEmployer": "Indemnitor Spouse Employer",
        "IndHomeowner": "Indemnitor Homeowner Status",
        "IndHomeownerYes": "Indemnitor Homeowner Yes Checkbox",
        "IndMortgageCo": "Indemnitor Mortgage Company",
        "IndYearsAtAddress": "Indemnitor Years at Address",
        "IndNamePrinted": "Indemnitor Name (Printed)",
        "IndSignature": "Indemnitor Signature",
        "IndPhoto": "Indemnitor Photo",

        "Ind2Name": "Second Indemnitor Name",
        "Ind2Address": "Second Indemnitor Address",
        "Ind2DL": "Second Indemnitor Driver's License",
        "Ind2Relation": "Second Indemnitor Relation",
        "Ind2Signature": "Second Indemnitor Signature",
        "Ind3Signature": "Third Indemnitor Signature",
        "CoIndSignatureWaiver": "Co-Indemnitor Signature Waiver",

        "Ref1Name": "Reference 1 Name",
        "Ref1Phone": "Reference 1 Phone",
        "Ref1Relation": "Reference 1 Relation",
        "Ref1Address": "Reference 1 Address",
        "Ref2Name": "Reference 2 Name",
        "Ref2Phone": "Reference 2 Phone",
        "Ref2Relation": "Reference 2 Relation",
        "Ref2Address": "Reference 2 Address",

        "TotalBond": "Total Bail Amount ($)",
        "Premium": "Premium Amount ($)",
        "PremiumWritten": "Premium Amount (Written)",
        "PremiumPaid": "Amount Paid Upfront ($)",
        "PremiumPaidWritten": "Amount Paid (Written)",
        "BalanceDue": "Remaining Balance ($)",
        "BalanceDueWritten": "Balance Due (Written)",
        "CaseNum": "Court Case Number",
        "PowerNum": "Power of Attorney Number",
        "Date": "Today's Date",
        "DateDay": "Day (DD)",
        "DateMonth": "Month (MMMM or MM)",
        "DateYear": "Year (YY or YYYY)",
        "DateSigned": "Date Signed",
        "DateSigned2": "Date Signed 2",

        "CourtType": "Court Type",
        "CourtName": "Court Name",
        "County": "County",
        "Charges": "Charges",

        "AgentName": "Bail Agent Name",
        "AgentNamePrinted": "Bail Agent Name (Printed)",
        "AgentLicenseNum": "Bail Agent License Number",
        "AgentSignature": "Agent Signature",
        "AgencyName": "Agency Name",
        "AgencyAddress": "Agency Address",

        "ReceiptNum": "Receipt Number",
        "CollateralReceiptNum": "Collateral Receipt Number",
        "CollateralAmount": "Collateral Amount",
        "CollateralAmountWritten": "Collateral Amount (Written)",
        "CollateralDescription": "Collateral Description",
        "CollateralDescriptionCont": "Collateral Description (Continued)",
        "CollateralReturnDate": "Collateral Return Date",
        "CollateralReturnAmount": "Collateral Return Amount",
        "CollateralReturnDetails": "Collateral Return Details",
        "PaidOnAccount": "Paid on Account",
        "OtherFeesDue": "Other Fees Due",
        "TotalMoniesDue": "Total Monies Due",
        "CreditCardFee": "Credit Card Fee",

        "PaymentAmount": "Payment Amount",
        "PaymentCount": "Number of Payments",
        "DueDate1": "Due Date 1",
        "DueDate2": "Due Date 2",
        "DueDate3": "Due Date 3",
        "DueDate4": "Due Date 4",
        "DueDateFinal": "Final Due Date",
        "PaymentSchedule1": "Payment Schedule 1",
        "PaymentSchedule2": "Payment Schedule 2",
        "PaymentSchedule3": "Payment Schedule 3",
        "PaymentSchedule4": "Payment Schedule 4",

        "BondSeal": "Bond Seal Image",
        "FormLogo": "Form Logo Image",
        "BondParties": "Bond Parties",
        "OtherCollateralName": "Other Collateral Name"
    },

    "pdf_mappings": {
        "osi-defendant-application-shamrock-reducedsize.pdf": {
            "defendant-full-name": "DefName",
            "defendant-aka-alias": "DefAlias",
            "defendant-phone-number": "DefPhone",
            "defendant-email": "DefEmail",
            "defendant-charges1": "DefCharges",
            "county-name": "DefCounty",
            "numeric-bond-amount": "TotalBond",
            "numeric-premium-amount": "Premium",
            "written-premium-amount": "PremiumWritten",
            "power-number": "PowerNum",
            "date-bond-written": "Date",
            "day-DD": "DateDay",
            "month-MMMM": "DateMonth",
            "year-YY": "DateYear",
            "court-type": "CourtType",
            "bail-agent-full-name": "AgentName",
            "Glasses": "DefGlasses",
            "BeardMustache": "DefBeard",
            "Dentures": "DefDentures",
            "Left Handed": "DefLeftHanded",
            "Right Handed": "DefRightHanded",
            "Signature of Defendant": "DefSignature",
            "Image1_af_image": "DefPhoto"
        },

        "osi-indemnity-agreement-shamrock.pdf": {
            "Defendant": "DefName",
            "1 Name": "IndName",
            "2 Name": "Ind2Name",
            "Name": "IndName",
            "Address": "IndAddress",
            "Address_2": "Ind2Address",
            "Address_3": "IndCity",
            "Address_4": "IndState",
            "Address_5": "IndZip",
            "City  St  Zip": "IndCityStateZip",
            "DOB": "IndDOB",
            "SSN": "IndSSN",
            "Drivers Lic": "IndDL",
            "Drivers Lis": "Ind2DL",
            "Employer": "IndEmployer",
            "Spouse Name": "IndSpouseName",
            "Spouse Employer": "IndSpouseEmployer",
            "Relation": "IndRelation",
            "Relation_2": "Ind2Relation",
            "Relationship": "IndRelation",
            "Vehicles Make": "DefCarMake",
            "Models": "DefCarModel",
            "Colors": "DefCarColor",
            "Years": "DefCarYear",
            "Home owner": "IndHomeowner",
            "YES": "IndHomeownerYes",
            "NO Mortgage Co": "IndMortgageCo",
            "in the sum of": "TotalBond",
            "Amount Owed": "BalanceDue",
            "day of": "DateDay",
            "Day": "DateDay",
            "20": "DateYear",
            "PRINT": "IndNamePrinted",
            "Signature95": "IndSignature",
            "Image90_af_image": "IndPhoto",
            "Text1": "IndPhone",
            "Text2": "IndEmpPhone",
            "Text3": "IndEmpAddress",
            "Text4": "IndSupervisor",
            "Text5": "Ref1Name",
            "Text6": "Ref1Phone",
            "Text7": "Ref1Relation",
            "Text8": "Ref1Address",
            "Text9": "Ref2Name",
            "Text10": "Ref2Phone",
            "Text11": "Ref2Relation"
        },

        "osi-collateral-premium-receipt.pdf": {
            "defendant-name": "DefName",
            "defendant-charge": "DefCharges",
            "charges": "DefCharges",
            "indemnitor-name": "IndName",
            "indemnitor-full-address": "IndAddress",
            "indemnitor-phone": "IndPhone",
            "indemnitor-mobile-phone": "IndMobilePhone",
            "indemnitor-work-phone": "IndWorkPhone",
            "case-number": "CaseNum",
            "power-number": "PowerNum",
            "court": "CourtName",
            "court-type": "CourtType",
            "numeric-bond-amount": "TotalBond",
            "numeric-premium-due": "Premium",
            "numeric-paid-on-account": "PremiumPaid",
            "numeric-balance-due": "BalanceDue",
            "numeric-other-fees-due": "OtherFeesDue",
            "numeric-total-monies-due": "TotalMoniesDue",
            "premium-amount-received-numerals": "PremiumPaid",
            "premium-amount-received-written": "PremiumPaidWritten",
            "collateral-receipt-number": "CollateralReceiptNum",
            "collateral-numerals": "CollateralAmount",
            "collateral-written-numerals": "CollateralAmountWritten",
            "collateral-amount-returned-dollars": "CollateralReturnAmount",
            "collateral-description": "CollateralDescription",
            "collateral-description-continued": "CollateralDescriptionCont",
            "collateral-return-details-written": "CollateralReturnDetails",
            "date-of-paperwork": "Date",
            "date-of-collateral-return": "CollateralReturnDate",
            "receipt-number": "ReceiptNum",
            "agent-name": "AgentName",
            "bail-agent-name-printed": "AgentNamePrinted",
            "agency-address": "AgencyAddress",
            "credit-card-fee-collateral-charge": "CreditCardFee",
            "Text30": "Ref2Address",
            "Check Box4": "PaymentMethodCash",
            "Check Box5": "PaymentMethodCheck",
            "Check Box6": "PaymentMethodMoneyOrder",
            "Check Box7": "PaymentMethodCreditCard",
            "Check Box8": "PaymentMethodOther",
            "Check Box9": "CollateralTypeCash",
            "Check Box10": "CollateralTypeTitle",
            "Check Box11": "CollateralTypeDeed",
            "Check Box12": "CollateralTypeJewelry",
            "Check Box13": "CollateralTypeOther",
            "Check Box14": "CollateralReturnCash",
            "Check Box15": "CollateralReturnCheck",
            "Check Box16": "CollateralReturnOther"
        },

        "osi-appearance-bond-shamrock.pdf": {
            "defendant-name": "DefName",
            "defendant-address": "DefAddress",
            "defendant_charge": "DefCharges",
            "defendant-court-date": "DefCourtDate",
            "defendant-court-time": "DefCourtTime",
            "arrest-number-case-number": "CaseNum",
            "power-number": "PowerNum",
            "county": "County",
            "court-type": "CourtType",
            "numeric-bond-amount": "TotalBond",
            "numeric-premium-amount": "Premium",
            "written-premium-amount": "PremiumWritten",
            "day-dd": "DateDay",
            "month-mm": "DateMonth",
            "year-yy": "DateYear",
            "bail-agent-name-printed": "AgentNamePrinted",
            "bail-agent-license-number": "AgentLicenseNum",
            "liable-agency-name": "AgencyName",
            "bond-parties": "BondParties",
            "other-collateral-name": "OtherCollateralName",
            "Image114_af_image": "BondSeal",
            "Check Box115": "BondTypeAppearance",
            "Check Box116": "BondTypeSurety",
            "Check Box117": "BondTypeCash",
            "Check Box118": "BondTypeOther"
        },

        "osi-disclosure-form-shamrock.pdf": {
            "numeric-bond-amount": "TotalBond",
            "numeric-premium-amount": "Premium",
            "power-numbers-all": "PowerNum",
            "date-bond-written": "Date",
            "defendant-signature-disclosure-waiver": "DefSignature",
            "indemnitor-signature-disclosure": "IndSignature",
            "indemnitor-signature-disclosure-2": "Ind2Signature",
            "indemnitor-signature-disclosure-waiver": "IndSignatureWaiver",
            "co-indemnitor-signature-disclosure-waiver": "CoIndSignatureWaiver",
            "agent-signature-disclosure-waiver": "AgentSignature",
            "Image89_af_image": "FormLogo"
        },

        "osi-promissory-note-side2-shamrock.pdf": {
            "Defendants NameRow1": "DefName",
            "CountyRow1": "County",
            "StateRow1": "DefState",
            "Bond amount": "TotalBond",
            "Amount": "BalanceDue",
            "Dollars": "BalanceDueWritten",
            "Date": "Date",
            "defendant-signature-contingent-promissory-note": "DefSignature",
            "iindemnitor-signature-contingent-promissory-note": "IndSignature",
            "Image91_af_image": "FormLogo"
        },

        "osi-surety-terms-and-conditions-shamrock.pdf": {
            "defendant-full-name": "DefName",
            "defendant-charges1": "DefCharges1",
            "defendant-charges2": "DefCharges2",
            "defendant-charges3": "DefCharges3",
            "defendant-charges4": "DefCharges4",
            "case-number1": "CaseNum1",
            "case-number2": "CaseNum2",
            "case-number3": "CaseNum3",
            "case-number4": "CaseNum4",
            "power-number1": "PowerNum1",
            "power-number2": "PowerNum2",
            "power-number3": "PowerNum3",
            "power-number4": "PowerNum4",
            "numeric-bond-amount-1": "TotalBond1",
            "numeric-bond-amount-2": "TotalBond2",
            "numeric-bond-amount-3": "TotalBond3",
            "numeric-bond-amount-4": "TotalBond4",
            "day-dd": "DateDay",
            "month-MMMM": "DateMonth",
            "year-YY": "DateYear",
            "Principal  Defendant Signature": "DefSignature",
            "Indemnitor Signature": "IndSignature",
            "Indemnitor Signature_2": "Ind2Signature",
            "Indemnitor Signature_3": "Ind3Signature",
            "Image92_af_image": "FormLogo"
        },

        "shamrock-premium-finance-notice.pdf": {
            "defendant-full-name": "DefName",
            "indemnitor-full-name": "IndName",
            "numeric-bond-amount": "TotalBond",
            "numeric-premium-amount": "Premium",
            "down-payment-on-premium": "PremiumPaid",
            "balance-financed": "BalanceDue",
            "payment-amounts": "PaymentAmount",
            "payment-number": "PaymentCount",
            "date-of-bond": "Date",
            "due-date-first-payment": "DueDate1",
            "due-date-final-payment": "DueDateFinal",
            "Date": "DateSigned",
            "Date_2": "DateSigned2",
            "Due Date 1": "DueDate1",
            "Due Date 2": "DueDate2",
            "Due Date 3": "DueDate3",
            "Due Date 4": "DueDate4",
            "Defendant Signature": "DefSignature",
            "Indemnitor Signature": "IndSignature",
            "undefined": "PaymentSchedule1",
            "undefined_2": "PaymentSchedule2",
            "undefined_3": "PaymentSchedule3",
            "undefined_4": "PaymentSchedule4"
        },

        "shamrock-paperwork-header.pdf": {
            "defendant-full-name": "DefName",
            "indemnitor-full-name": "IndName",
            "defendant-case-number": "CaseNum",
            "date-of-bond": "Date"
        },

        "shamrock-master-waiver.pdf": {
            "date-signed-waiver": "Date"
        }
    }
};

/**
 * Maps logical keys from Dashboard to the actual PDF filenames from Manus.
 */
const TEMPLATE_FILENAME_MAP = {
    'defendant-application': 'osi-defendant-application-shamrock-reducedsize.pdf',
    'indemnity-agreement': 'osi-indemnity-agreement-shamrock.pdf',
    'collateral-receipt': 'osi-collateral-premium-receipt.pdf',
    'appearance-bond': 'osi-appearance-bond-shamrock.pdf',
    'disclosure-form': 'osi-disclosure-form-shamrock.pdf',
    'promissory-note': 'osi-promissory-note-side2-shamrock.pdf',
    'surety-terms': 'osi-surety-terms-and-conditions-shamrock.pdf',
    'payment-plan': 'shamrock-premium-finance-notice.pdf',
    'paperwork-header': 'shamrock-paperwork-header.pdf',
    'master-waiver': 'shamrock-master-waiver.pdf',
    'ssa-release': 'shamrock-ssa-release.pdf',
    'faq-defendants': 'Shamrock Bail Bonds- FAQ Defe..pdf',
    'faq-cosigners': 'Shamrock Bail Bonds - FAQ Cosigners.pdf'
};

/**
 * Maps raw form data to PDF-SPECIFIC field names using the Manus Mapping Layer.
 * @param {Object} data - The raw form data (normalized to Master Tag definitions)
 * @param {String} templateKey - The Dashboard template key (e.g. 'defendant-application')
 * @returns {Array} - [{name: 'pdf-field-name', value: 'Value'}, ...]
 */
function PDF_mapDataToTags(data, templateKey) {
    if (!templateKey) throw new Error("Template Key is required for mapping.");

    // 1. Resolve Filename from Key
    const filename = TEMPLATE_FILENAME_MAP[templateKey];
    if (!filename) {
        console.warn(`No filename mapping for key: ${templateKey}. Returning empty fields.`);
        return [];
    }

    // 2. Get the specific map for this PDF
    const fieldMap = SHAMROCK_FIELD_MAPPINGS.pdf_mappings[filename];
    if (!fieldMap) {
        console.warn(`No field map found for file: ${filename}. Returning empty fields.`);
        return [];
    }

    // 3. Prepare Master Data Object (Normalize raw input to Master Keys)
    // We construct a "MasterData" object where keys are "DefName", "IndAddress", etc.
    // This allows us to just look up values by Master Key.
    const masterData = buildMasterDataObject(data);

    const pdfFields = [];

    // 4. Iterate through the PDF's specific fields
    // fieldName = "defendant-full-name" (PDF Side)
    // masterTag = "DefName" (Our Side)
    for (const [fieldName, masterTag] of Object.entries(fieldMap)) {
        let value = masterData[masterTag];

        // Ensure value is not undefined/null
        if (value !== undefined && value !== null) {
            pdfFields.push({ name: fieldName, value: String(value) });
        }
    }

    console.log(`[Mapper] Mapped ${pdfFields.length} fields for ${filename}`);
    return pdfFields;
}

/**
 * Helper to build the "Master Dictionary" object from raw form input.
 * This bridges the gap between what "collectFormData()" returns and what the Mapping JSON expects.
 */
function buildMasterDataObject(data) {
    return {
        // --- DEFENDANT ---
        'DefName': data.defendantFullName || `${data['defendant-first-name']} ${data['defendant-last-name']}`,
        'DefFirstName': data['defendant-first-name'],
        'DefLastName': data['defendant-last-name'],
        'DefMiddle': data['defendant-middle-name'],
        'DefAlias': data['defendant-alias'] || data['nickname'],
        'DefDOB': data['defendant-dob'],
        'DefSSN': data['defendant-ssn'],
        'DefAddress': data['defendant-street-address'],
        'DefCity': data['defendant-city'],
        'DefState': data['defendant-state'] || 'FL',
        'DefZip': data['defendantZipCode'] || data['defendant-zipcode'],
        'DefPhone': data['defendant-phone'],
        'DefEmail': data['defendant-email'],
        'DefDL': data['defendant-dl-number'],
        'DefBookingNum': data['defendant-booking-number'],
        'DefFacility': data['defendant-jail-facility'] || data['jailFacility'],
        'DefCounty': data['defendant-county'] || data['county'],
        'DefCharges': data['defendant-charges'] || data['charges'],
        'DefArrestDate': data['defendant-arrest-date'] || data['arrestDate'],
        'DefCourtDate': data['defendant-court-date'] || data['nextCourtDate'],

        // --- INDEMNITOR ---
        'IndName': data.indemnitorFullName || data.indemnitorName,
        'IndFirstName': data['indemnitor-1-first'],
        'IndLastName': data['indemnitor-1-last'],
        'IndAddress': data['indemnitor-1-address'],
        'IndCity': data['indemnitor-1-city'],
        'IndState': data['indemnitor-1-state'],
        'IndZip': data['indemnitor-1-zip'],
        'IndCityStateZip': `${data['indemnitor-1-city']}, ${data['indemnitor-1-state']} ${data['indemnitor-1-zip']}`,
        'IndPhone': data['indemnitor-1-phone'],
        'IndEmpPhone': data['indemnitor-1-employer-phone'],
        'IndEmail': data['indemnitor-1-email'],
        'IndDL': data['indemnitor-1-dl'],
        'IndSSN': data['indemnitor-1-ssn'],
        'IndDOB': data['indemnitor-1-dob'],
        'IndEmployer': data['indemnitor-1-employer'],
        'IndEmpAddress': data.indemnitorEmployerAddress, // logic handled in form collector usually
        'IndSupervisor': data['indemnitor-1-supervisor'],
        'IndRelation': data['indemnitor-1-relation'],

        // --- FINANCIAL ---
        'TotalBond': data.totalBond || data.bondAmount,
        'Premium': data.totalPremium || data.premiumAmount,
        'PremiumPaid': data.downPayment || data['payment-down-payment'],
        'BalanceDue': data.balanceDue || data.remainingBalance,
        'CaseNum': data.caseNumber || data['case-number'],
        'PowerNum': data.powerNumber || data['power-number'],
        'Date': data.todaysDate || new Date().toLocaleDateString('en-US'),
        'DateDay': new Date().getDate().toString(),
        'DateMonth': new Date().toLocaleString('default', { month: 'long' }),
        'DateYear': new Date().getFullYear().toString().slice(-2),

        // --- REFERENCES ---
        'Ref1Name': data['indemnitor-1-ref1-name'],
        'Ref1Phone': data['indemnitor-1-ref1-phone'],
        'Ref1Relation': data['indemnitor-1-ref1-relation'],
        'Ref1Address': data['indemnitor-1-ref1-address'],
        'Ref2Name': data['indemnitor-1-ref2-name'],
        'Ref2Phone': data['indemnitor-1-ref2-phone'],
        'Ref2Relation': data['indemnitor-1-ref2-relation'],
        'Ref2Address': data['indemnitor-1-ref2-address'],

        // --- EXTENDED DEFENDANT ---
        'DefHeight': data['height'],
        'DefWeight': data['weight'],
        'DefEyes': data['eyes'],
        'DefHair': data['hair'],
        'DefRace': data['race'],
        'DefScars': data['scars-tattoos'],
        'DefSpouseName': data['spouse-name'],
        'DefFatherName': data['father-name'],
        'DefMotherName': data['mother-name'],
        'DefCarMake': data['car-make'],
        'DefCarModel': data['car-model'],
        'DefCarPlate': data['plate-number'],
        'DefAttorney': data['attorney-name']
    };
}
