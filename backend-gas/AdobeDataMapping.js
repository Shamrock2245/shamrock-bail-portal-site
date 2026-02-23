/**
 * AdobeDataMapping.js
 * 
 * Data mapping functions to convert intakeData from Dashboard.html
 * into exact fields matching the Master Data Dictionary for Adobe PDF Services.
 */

/**
 * Format date utility
 */
function _formatDateForAdobe(dateObj) {
    if (!dateObj) return '';
    return Utilities.formatDate(dateObj, 'America/New_York', 'MM/dd/yyyy');
}

/**
 * Common mapped fields across all forms
 */
function _getCommonAdobeFields(data) {
    return {
        // Financial & Case Details
        'TotalBond': data.totalBond || data.bondAmount || data['numeric-bond-amount'] || '',
        'Premium': data.totalPremium || data.premiumAmount || data['numeric-premium-amount'] || '',
        'PremiumPaid': data.downPayment || data['payment-down-payment'] || '',
        'BalanceDue': data.balanceDue || data.remainingBalance || '',
        'CaseNum': data.caseNumber || data['case-number'] || '',
        'PowerNum': data.powerNumber || data['power-number'] || '',
        'CourtName': data.courtName || data['court-name'] || '',
        'CourtType': data.courtType || data['court-type'] || '',

        // Dates
        'Date': data.todaysDate || _formatDateForAdobe(new Date()),

        // Agent
        'AgentName': data.agentName || 'Brendan Shamrock',
        'AgentLicenseNum': data.agentLicenseNum || '',
        'AgencyName': data.agencyName || 'Shamrock Bail Bonds',
        'AgencyAddress': data.agencyAddress || '123 Bail Way'
    };
}

/**
 * Map intake data to PDF field names for OSI Defendant Application
 */
function mapIntakeDataToDefendantApplication(intakeData) {
    const common = _getCommonAdobeFields(intakeData);
    return {
        ...common,
        // Defendant Info
        'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',
        'DefFirstName': intakeData['defendant-first-name'] || '',
        'DefLastName': intakeData['defendant-last-name'] || '',
        'DefMiddle': intakeData['defendant-middle-name'] || '',
        'DefAlias': intakeData['defendant-alias'] || intakeData.nickname || '',
        'DefDOB': intakeData['defendant-dob'] || '',
        'DefSSN': intakeData['defendant-ssn'] || '',
        'DefAddress': intakeData['defendant-street-address'] || '',
        'DefCity': intakeData['defendant-city'] || '',
        'DefState': intakeData['defendant-state'] || 'FL',
        'DefZip': intakeData.defendantZipCode || intakeData['defendant-zipcode'] || '',
        'DefPhone': intakeData['defendant-phone'] || '',
        'DefEmail': intakeData['defendant-email'] || '',
        'DefDL': intakeData['defendant-dl-number'] || '',
        'DefCounty': intakeData['defendant-county'] || intakeData.county || '',
        'DefCharges': intakeData['defendant-charges'] || intakeData.charges || '',

        // Extended Defendant
        'DefHeight': intakeData.height || '',
        'DefWeight': intakeData.weight || '',
        'DefEyes': intakeData.eyes || '',
        'DefHair': intakeData.hair || '',
        'DefRace': intakeData.race || '',
        'DefScars': intakeData['scars-tattoos'] || '',

        'DefCarYear': intakeData['car-year'] || '',
        'DefCarMake': intakeData['car-make'] || '',
        'DefCarModel': intakeData['car-model'] || '',
        'DefCarColor': intakeData['car-color'] || '',
        'DefCarPlate': intakeData['plate-number'] || '',
        'DefCarVin': intakeData['car-vin'] || ''
    };
}

/**
 * Map intake data for OSI Indemnity Agreement
 */
function mapIntakeDataToIndemnityAgreement(intakeData) {
    const common = _getCommonAdobeFields(intakeData);
    return {
        ...common,
        'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',

        // Indemnitor Info
        'IndName': intakeData.indemnitorFullName || intakeData.indemnitorName || '',
        'IndFirstName': intakeData['indemnitor-1-first'] || '',
        'IndLastName': intakeData['indemnitor-1-last'] || '',
        'IndRelation': intakeData['indemnitor-1-relation'] || '',
        'IndAddress': intakeData['indemnitor-1-address'] || '',
        'IndCity': intakeData['indemnitor-1-city'] || '',
        'IndState': intakeData['indemnitor-1-state'] || '',
        'IndZip': intakeData['indemnitor-1-zip'] || '',
        'IndPhone': intakeData['indemnitor-1-phone'] || '',
        'IndEmail': intakeData['indemnitor-1-email'] || '',
        'IndDOB': intakeData['indemnitor-1-dob'] || '',
        'IndSSN': intakeData['indemnitor-1-ssn'] || '',
        'IndDL': intakeData['indemnitor-1-dl'] || '',
        'IndEmployer': intakeData['indemnitor-1-employer'] || '',
        'IndEmpPhone': intakeData['indemnitor-1-employer-phone'] || '',
        'IndSupervisor': intakeData['indemnitor-1-supervisor'] || '',

        // References
        'Ref1Name': intakeData['indemnitor-1-ref1-name'] || '',
        'Ref1Phone': intakeData['indemnitor-1-ref1-phone'] || '',
        'Ref1Relation': intakeData['indemnitor-1-ref1-relation'] || '',
        'Ref1Address': intakeData['indemnitor-1-ref1-address'] || '',
        'Ref2Name': intakeData['indemnitor-1-ref2-name'] || '',
        'Ref2Phone': intakeData['indemnitor-1-ref2-phone'] || '',
        'Ref2Relation': intakeData['indemnitor-1-ref2-relation'] || '',
        'Ref2Address': intakeData['indemnitor-1-ref2-address'] || ''
    };
}

/**
 * Map intake data for Promissory Note
 */
function mapIntakeDataToPromissoryNote(intakeData) {
    const common = _getCommonAdobeFields(intakeData);
    return {
        ...common,
        'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',
        'DefState': intakeData['defendant-state'] || 'FL',
        'County': intakeData.county || intakeData['defendant-county'] || ''
    };
}

/**
 * Map intake data for SSA Release
 */
function mapIntakeDataToSSARelease(intakeData) {
    const common = _getCommonAdobeFields(intakeData);
    return {
        ...common,
        'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',
        'DefSSN': intakeData['defendant-ssn'] || '',
        'DefDOB': intakeData['defendant-dob'] || ''
    };
}

/**
 * Map intake data for Appearance Bond
 */
function mapIntakeDataToAppearanceBond(intakeData) {
    const common = _getCommonAdobeFields(intakeData);
    return {
        ...common,
        'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',
        'DefAddress': intakeData['defendant-street-address'] || '',
        'DefCharges': intakeData['defendant-charges'] || intakeData.charges || '',
        'DefCourtDate': intakeData['defendant-court-date'] || intakeData.nextCourtDate || '',
        'DefCourtTime': intakeData.courtTime || '',
        'County': intakeData.county || intakeData['defendant-county'] || ''
    };
}

/**
 * Map intake data for Receipt (Collateral Premium Receipt)
 */
function mapIntakeDataToCollateralReceipt(intakeData) {
    const common = _getCommonAdobeFields(intakeData);
    return {
        ...common,
        'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',
        'DefCharges': intakeData['defendant-charges'] || intakeData.charges || '',
        'IndName': intakeData.indemnitorFullName || intakeData.indemnitorName || '',
        'IndAddress': intakeData['indemnitor-1-address'] || '',
        'IndPhone': intakeData['indemnitor-1-phone'] || '',
        'CollateralReceiptNum': intakeData.collateralReceiptNum || '',
        'CollateralAmount': intakeData.collateralAmount || '',
        'CollateralDescription': intakeData.collateralDescription || '',
        'TotalMoniesDue': intakeData.totalMoniesDue || '',
        'ReceiptNum': intakeData.receiptNum || ''
    };
}

/**
 * Map intake data for Payment Plan Agreement
 */
function mapIntakeDataToPaymentPlanAgreement(intakeData) {
    const common = _getCommonAdobeFields(intakeData);
    return {
        ...common,
        'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',
        'IndName': intakeData.indemnitorFullName || intakeData.indemnitorName || '',
        'PaymentAmount': intakeData.paymentAmount || '',
        'PaymentCount': intakeData.paymentCount || '',
        'DueDate1': intakeData.dueDate1 || '',
        'DueDateFinal': intakeData.dueDateFinal || ''
    };
}

/**
 * Map intake data for Surety Terms
 */
function mapIntakeDataToSuretyTerms(intakeData) {
    const common = _getCommonAdobeFields(intakeData);
    return {
        ...common,
        'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',
        'DefCharges1': intakeData.charges || intakeData['defendant-charges'] || '',
        'CaseNum1': intakeData.caseNumber || intakeData['case-number'] || '',
        'PowerNum1': intakeData.powerNumber || intakeData['power-number'] || '',
        'TotalBond1': data.totalBond || data.bondAmount || data['numeric-bond-amount'] || ''
    };
}

/**
 * Map for Disclosure Form
 */
function mapIntakeDataToDisclosureForm(intakeData) {
    return _getCommonAdobeFields(intakeData);
}

/**
 * Export specific mappings depending on document type
 */
function getMappingForDocumentTemplate(templateKey, intakeData) {
    switch (templateKey) {
        case 'defendant-application':
            return mapIntakeDataToDefendantApplication(intakeData);
        case 'indemnity-agreement':
            return mapIntakeDataToIndemnityAgreement(intakeData);
        case 'promissory-note':
            return mapIntakeDataToPromissoryNote(intakeData);
        case 'ssa-release':
            return mapIntakeDataToSSARelease(intakeData);
        case 'appearance-bond':
            return mapIntakeDataToAppearanceBond(intakeData);
        case 'collateral-receipt':
            return mapIntakeDataToCollateralReceipt(intakeData);
        case 'payment-plan':
            return mapIntakeDataToPaymentPlanAgreement(intakeData);
        case 'surety-terms':
            return mapIntakeDataToSuretyTerms(intakeData);
        case 'disclosure-form':
            return mapIntakeDataToDisclosureForm(intakeData);
        default:
            // Fallback
            return Object.assign({}, _getCommonAdobeFields(intakeData), {
                'DefName': intakeData.defendantFullName || `${intakeData['defendant-first-name']} ${intakeData['defendant-last-name']}` || '',
                'IndName': intakeData.indemnitorFullName || intakeData.indemnitorName || ''
            });
    }
}
