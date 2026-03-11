/**
 * The Intelligent "Rosetta Stone" (v2.0)
 * This object maps the field names from SignNow (the "key")
 * to the field IDs from our HTML form (the "value").
 *
 * This map was auto-generated based on your provided CSV and will
 * ignore any unmatched or generic field names like "Text Field 19".
 */
function getFieldMap() {
  return {
    
    // 'SignNow_Field_Name_From_Sheet': 'HTML_Form_ID_From_Form.html',
    
    // --- Defendant Info (Auto-mapped from your CSV) ---
    'defendant_name': 'defendantFullName',
    'defendant_full_name': 'defendantFullName',
    'defendant_alias': 'defendantAlias',
    'defendant_date_of_birth': 'defendantDOB',
    'defendant_dob': 'defendantDOB',
    'defendant_ssn': 'defendantSSN',
    'defendant_dl': 'defendantDL',
    'defendant_dl_state': 'defendantDLState',
    'defendant_address': 'defendantStreetAddress',
    'defendant_street_address': 'defendantStreetAddress',
    'defendant_city': 'defendantCity',
    'defendant_state': 'defendantState',
    'defendant_zip': 'defendantZip',
    'defendant_phone_number': 'defendantPhone',
    'defendant_phone': 'defendantPhone',
    'defendant_email': 'defendantEmail',
    'defendant_height': 'defendantHeight',
    'defendant_weight': 'defendantWeight',
    'defendant_eye_color': 'defendantEyes',
    'defendant_eyes': 'defendantEyes',
    'defendant_hair_color': 'defendantHair',
    'defendant_hair': 'defendantHair',
    'defendant_race': 'defendantRace',
    'defendant_sex': 'defendantSex',
    'defendant_employer': 'defendantEmployer',
    'defendant_employer_name': 'defendantEmployer',
    'defendant_boss': 'defendantBoss',
    'defendant_employer_address': 'defendantEmployerAddress',
    'defendant_employer_phone': 'defendantEmployerPhone',
    'defendant_vehicle': 'defendantVehicle',
    'defendant_license_plate': 'defendantPlate',

    // --- Indemnitor Info (Auto-mapped from your CSV) ---
    'indemnitor_full_name': 'indemnitorFullName',
    'indemnitor_relationship': 'indemnitorRelationship',
    'indemnitor_date_of_birth': 'indemnitorDOB',
    'indemnitor_dob': 'indemnitorDOB',
    'indemnitor_ssn': 'indemnitorSSN',
    'indemnitor_dl': 'indemnitorDL',
    'indemnitor_address': 'indemnitorStreetAddress',
    'indemnitor_street_address': 'indemnitorStreetAddress',
    'indemnitor_city': 'indemnitorCity',
    'indemnitor_state': 'indemnitorState',
    'indemnitor_zip': 'indemnitorZip',
    'indemnitor_phone': 'indemnitorPhone',
    'indemnitor_phone_number': 'indemnitorPhone',
    'indemnitor_email': 'indemnitorEmail',
    'indemnitor_employer': 'indemnitorEmployer',
    'indemnitor_employer_name': 'indemnitorEmployer',
    'indemnitor_employer_phone': 'indemnitorEmployerPhone',
    'indemnitor_employer_address': 'indemnitorEmployerAddress',
    'indemnitor_mortgage_company': 'indemnitorMortgage',
    'indemnitor_mortgage_amount': 'indemnitorAmountOwed',
    'indemnitor_reference_name1': 'reference1Name',
    'indemnitor_reference_phone1': 'reference1Phone',
    'indemnitor_reference_address1': 'reference1Address',
    'indemnitor_reference_relationship1': 'reference1Relation',
    'indemnitor_reference_name2': 'reference2Name',
    'indemnitor_reference_phone2': 'reference2Phone',
    'indemnitor_reference_address2': 'reference2Address',
    'indemnitor_reference_relationship2': 'reference2Relation',

    // --- Co-Indemnitor Info (Auto-mapped from your CSV) ---
    'co_indemnitor_full_name': 'coIndemnitorFullName',
    'co_indemnitor_email': 'coIndemnitorEmail',
    'co_indemnitor_address': 'coIndemnitorAddress',
    'co_indemnitor_city': 'coIndemnitorCity',
    'co_indemnitor_state': 'coIndemnitorState',
    'co_indemnitor_zip': 'coIndemnitorZip',
    'co_indemnitor_phone': 'coIndemnitorPhone',
    'co_indemnitor_ssn': 'coIndemnitorSSN',
    'co_indemnitor_dl': 'coIndemnitorDL',

    // --- Collateral / Receipt Info (Auto-mapped from your CSV) ---
    'collateral_receipt_number': 'collateralReceiptNumber',
    'date': 'collateralDate', // Multiple 'date' fields will map to this
    'collateral_date': 'collateralDate',
    'collateral_amount': 'collateralAmount',
    'collateral_depositor': 'collateralDepositor',
    'collateral_description': 'collateralDescription',

    // --- General Bond Info (Auto-mapped from your CSV) ---
    'court_type': 'courtType',
    'court_name': 'courtType',
    'case_number': 'charge1CaseNumber', // Maps the main case # to the first charge
    'power_number': 'powerNumber', // Assumes a 'powerNumber' field might be added to the form
    'execution_date': 'collateralDate' // Reuses collateral date for execution date
    
    // NOTE: The special fields (split names, calculated totals, charges)
    // are handled automatically in Code.gs.
    // Do NOT add 'defendant_name_1', 'numeric_bond_amount', etc., here.
  };
}