/**
 * ============================================================================
 * Test_PacketSend.gs
 * ============================================================================
 * Test & utility functions for the SignNow packet workflow.
 *
 * FUNCTIONS:
 *   test_sendPacketForCristian()     — Full end-to-end packet send test
 *   discoverTemplateFields()        — Deep discovery: dump ALL fields SignNow sees
 *   auditTemplateFields()           — Quick audit: check text fields vs PDF_Mappings
 *   tagAllTemplatesWithFields()     — Add text fields matching Adobe Acrobat names
 *
 * DEPENDS ON:
 *   - Telegram_Documents.js (SIGNNOW_TEMPLATE_MAP, buildPacketManifest, prefillDocument_)
 *   - SignNow_Integration_Complete.js (SN_getConfig)
 *   - PDF_Mappings.js (buildMasterDataObject, PDF_mapDataToTags, SHAMROCK_FIELD_MAPPINGS)
 * ============================================================================
 */


// ============================================================================
// 1. END-TO-END TEST: Send Packet for Cristian Felipe Ramos
// ============================================================================

function test_sendPacketForCristian() {
  var caseData = {
    caseNumber:              '26CF014864',
    defendantFirstName:      'Cristian',
    defendantLastName:       'Felipe Ramos',
    defendantEmail:          '',
    'defendant-first-name':  'Cristian',
    'defendant-last-name':   'Felipe Ramos',
    'defendant-middle-name': 'Kevin',
    defendantFullName:       'Cristian Kevin Felipe Ramos',
    'defendant-dob':         '4/30/2002',
    'defendant-street-address': '4145 NE 14th Pl',
    'defendant-city':        'Cape Coral',
    'defendant-state':       'FL',
    'defendant-zipcode':     '33909',
    'defendant-county':      'Lee',
    'defendant-jail-facility': 'Lee County Jail',
    'defendant-booking-number': '1021243',
    'defendant-charges':     'LARC (GRAND THEFT PROPERTY VALUE $750-$5K)',
    'defendant-arrest-date': '3/12/2026',
    'defendant-court-date':  '4/13/2026',
    'defendant-court-time':  '8:30 AM',
    'defendant-court-location': 'Circuit Court',
    height:  "5'03\"",
    weight:  '220',
    race:    'W',
    bondAmount:   '2500.00',
    totalPremium: '250.00',
    balanceDue:   '250.00',
    indemnitors: [{
      firstName:    'Brian',
      lastName:     'Rodriguez',
      email:        'brianrodriguez1502@gmail.com',
      relationship: 'Indemnitor',
    }],
    'indemnitor-1-first': 'Brian',
    'indemnitor-1-last':  'Rodriguez',
    'indemnitor-1-email': 'brianrodriguez1502@gmail.com',
    'indemnitor-1-relation': 'Indemnitor',
    indemnitorFullName: 'Brian Rodriguez',
    indemnitorName:     'Brian Rodriguez',
  };

  Logger.log('========================================');
  Logger.log('🧪 TEST: Send Packet for Cristian Felipe Ramos');
  Logger.log('========================================');

  var result = sendPacketAsDocumentGroup(caseData);

  Logger.log('========================================');
  Logger.log('🏁 RESULT: ' + JSON.stringify(result, null, 2));
  Logger.log('========================================');

  if (result.success) {
    Logger.log('✅ SUCCESS — Group ID: ' + result.groupId);
    Logger.log('   Documents created: ' + result.documentIds.length);
    Logger.log('   Check email at: brianrodriguez1502@gmail.com');
  } else {
    Logger.log('❌ FAILED: ' + (result.error || 'Unknown error'));
  }

  return result;
}

/**
 * FINAL TEST (Manus handoff 2026-03-12)
 * Tests the fixed invite_actions payload via handleShannonSendPaperwork.
 * Expected result: { success: true, documentsCount: 9, signing_link: "https://..." }
 */
function test_sendPacketForCristian_FINAL() {
  var result = handleShannonSendPaperwork({
    caller_name:     'Brian Rodriguez',
    caller_email:    'brianrodriguez1502@gmail.com',
    defendant_name:  'Cristian Kevin Felipe Ramos',
    county:          'Lee',
    bond_amount:     2500,
    premium_amount:  250,
    case_number:     '26CF014864',
    court_date:      '04/13/2026',
    court_time:      '8:30 AM',
    court_location:  'Lee County Circuit Court',
    charge:          'LARC (GRAND THEFT PROPERTY VALUE $750-$5K)',
    booking_number:  '1021243',
    arrest_date:     '03/12/2026',
    jail_facility:   'Lee County Jail'
  });
  Logger.log(JSON.stringify(result, null, 2));
}


// ============================================================================
// 2. DEEP DISCOVERY: Dump ALL fields from each SignNow template
// ============================================================================
// This discovers what SignNow actually imported from the Adobe PDFs.
// Run this FIRST to understand what field names exist before mapping.

function discoverTemplateFields() {
  var config = SN_getConfig();

  Logger.log('=== SignNow Template Deep Discovery ===');
  Logger.log('Scanning ALL properties of each template...\n');

  // Properties that may contain field data
  var FIELD_PROPERTIES = ['fields', 'texts', 'checks', 'attachments', 'hyperlinks',
                          'radiobuttons', 'integration_objects', 'inserts',
                          'tags', 'field_invites', 'enumeration_options',
                          'fillable_fields'];

  var allFieldNames = {};  // docKey -> [field names]

  Object.keys(SIGNNOW_TEMPLATE_MAP).forEach(function(docKey) {
    var templateId = SIGNNOW_TEMPLATE_MAP[docKey];
    Logger.log('══════════════════════════════════════');
    Logger.log('📄 ' + docKey + ' (ID: ' + templateId.substring(0, 16) + '...)');
    Logger.log('══════════════════════════════════════');

    try {
      var url = config.API_BASE + '/document/' + templateId;
      var res = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
        muteHttpExceptions: true
      });

      if (res.getResponseCode() !== 200) {
        Logger.log('   ❌ HTTP ' + res.getResponseCode());
        return;
      }

      var doc = JSON.parse(res.getContentText());
      var docFieldNames = [];

      // Roles
      var roles = (doc.roles || []).map(function(r) { return r.name; });
      Logger.log('   Roles: ' + (roles.length > 0 ? roles.join(', ') : '(none)'));
      Logger.log('   Pages: ' + (doc.pages ? doc.pages.length : doc.page_count || '?'));

      // Check each possible field property
      FIELD_PROPERTIES.forEach(function(prop) {
        var arr = doc[prop];
        if (arr && Array.isArray(arr) && arr.length > 0) {
          Logger.log('   ── ' + prop + ' (' + arr.length + ') ──');
          arr.forEach(function(item, i) {
            var name = item.field_name || item.name || item.label || item.api_id || '(unnamed)';
            var type = item.type || item.subtype || '';
            var page = item.page_number !== undefined ? item.page_number : '?';
            var role = item.role || item.role_id || '';
            var prefilled = item.prefilled_text || '';

            var details = '      [' + i + '] name="' + name + '" type=' + type + ' page=' + page;
            if (role) details += ' role=' + role;
            if (prefilled) details += ' prefilled="' + prefilled + '"';
            Logger.log(details);

            docFieldNames.push(name);
          });
        }
      });

      // Also check top-level keys we might not know about
      var knownKeys = ['id', 'user_id', 'document_name', 'page_count', 'created', 'updated',
                       'original_filename', 'owner', 'template', 'roles', 'pages',
                       'fields', 'texts', 'checks', 'attachments', 'hyperlinks',
                       'radiobuttons', 'integration_objects', 'inserts', 'tags',
                       'field_invites', 'enumeration_options', 'fillable_fields',
                       'signing_links', 'originator_organization_settings',
                       'document_group_info', 'routing_details', 'field_validators',
                       'version_time', 'requests', 'signatures', 'seal_requests',
                       'thumbnail', 'parent_id', 'origin_document_id', 'origin_user_id',
                       'settings', 'viewer_roles', 'exported_to'];
      var unknownKeys = Object.keys(doc).filter(function(k) { return knownKeys.indexOf(k) === -1; });
      if (unknownKeys.length > 0) {
        Logger.log('   ── Unknown top-level keys ──');
        unknownKeys.forEach(function(k) {
          var val = doc[k];
          var display = typeof val === 'object' ? JSON.stringify(val).substring(0, 200) : String(val);
          Logger.log('      ' + k + ' = ' + display);
        });
      }

      if (docFieldNames.length === 0) {
        Logger.log('   ⚠️ NO FIELDS FOUND — template may need manual field placement');
      }

      allFieldNames[docKey] = docFieldNames;
      Logger.log('');

    } catch (e) {
      Logger.log('   ❌ Exception: ' + e.message);
    }
  });

  // Summary
  Logger.log('\n=== SUMMARY ===');
  Object.keys(allFieldNames).forEach(function(docKey) {
    var names = allFieldNames[docKey];
    Logger.log(docKey + ': ' + names.length + ' fields → ' + names.join(', '));
  });

  return allFieldNames;
}


// ============================================================================
// 3. AUDIT: Compare template fields vs PDF_Mappings expectations
// ============================================================================

function auditTemplateFields() {
  var config = SN_getConfig();

  Logger.log('=== SignNow Template Field Audit ===');
  Logger.log('Checking all ' + Object.keys(SIGNNOW_TEMPLATE_MAP).length + ' templates...\n');

  Object.keys(SIGNNOW_TEMPLATE_MAP).forEach(function(docKey) {
    var templateId = SIGNNOW_TEMPLATE_MAP[docKey];
    try {
      var url = config.API_BASE + '/document/' + templateId;
      var res = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
        muteHttpExceptions: true
      });

      if (res.getResponseCode() !== 200) {
        Logger.log('❌ ' + docKey + ': HTTP ' + res.getResponseCode());
        return;
      }

      var doc = JSON.parse(res.getContentText());
      var roles = (doc.roles || []).map(function(r) { return r.name; });

      // Collect ALL field names from every property
      var allNames = [];
      ['fields', 'texts', 'checks', 'tags'].forEach(function(prop) {
        (doc[prop] || []).forEach(function(item) {
          var name = item.field_name || item.name || item.label || '';
          if (name) allNames.push(name);
        });
      });

      var sigInitCount = (doc.fields || []).filter(function(f) {
        return f.type === 'signature' || f.type === 'initials';
      }).length;

      Logger.log('── ' + docKey + ' ──');
      Logger.log('   Roles: ' + (roles.length > 0 ? roles.join(', ') : '⚠️ NONE'));
      Logger.log('   Sig/Init fields: ' + sigInitCount);
      Logger.log('   Text fields (' + allNames.length + '): ' + (allNames.length > 0 ? allNames.join(', ') : '⚠️ NONE'));

      // Cross-reference with PDF_Mappings
      var filename = (typeof TEMPLATE_FILENAME_MAP !== 'undefined') ? TEMPLATE_FILENAME_MAP[docKey] : null;
      if (filename && SHAMROCK_FIELD_MAPPINGS && SHAMROCK_FIELD_MAPPINGS.pdf_mappings[filename]) {
        var pdfMap = SHAMROCK_FIELD_MAPPINGS.pdf_mappings[filename];
        var pdfFieldNames = Object.keys(pdfMap);
        var missing = pdfFieldNames.filter(function(fn) {
          return allNames.indexOf(fn) === -1;
        });
        if (missing.length > 0) {
          Logger.log('   ⚠️ Missing text fields: ' + missing.join(', '));
        } else {
          Logger.log('   ✅ All mapped fields present');
        }
      }

      Logger.log('');
    } catch (e) {
      Logger.log('❌ ' + docKey + ': ERROR — ' + e.message);
    }
  });
}


// ============================================================================
// 4. TAG TEMPLATES: Add text fields via PUT /document/{id}
// ============================================================================
// This adds named text fields to SignNow templates so that the prefill API
// can fill them. Uses the ACTUAL Adobe Acrobat field names from PDF_Mappings.
//
// The approach:
//   1. For each template, get the expected field names from SHAMROCK_FIELD_MAPPINGS
//   2. Check what fields already exist on the template
//   3. Add missing text fields via PUT /document/{id} with "texts" payload
//
// Run ONCE after uploading PDFs to SignNow.

var TEMPLATE_ROLES = {
  'paperwork-header':       ['Indemnitor'],
  'faq-cosigners':          ['Indemnitor'],
  'faq-defendants':         ['Indemnitor', 'Defendant'],
  'indemnity-agreement':    ['Indemnitor'],
  'defendant-application':  ['Defendant'],
  'promissory-note':        ['Indemnitor'],
  'disclosure-form':        ['Indemnitor'],
  'surety-terms':           ['Indemnitor'],
  'master-waiver':          ['Indemnitor'],
  'ssa-release':            ['Indemnitor', 'Defendant'],
  'collateral-receipt':     ['Indemnitor'],
  'payment-plan':           ['Indemnitor']
};

function tagAllTemplatesWithFields() {
  var config = SN_getConfig();

  Logger.log('=== Tagging All SignNow Templates ===');
  Logger.log('Templates to process: ' + Object.keys(SIGNNOW_TEMPLATE_MAP).length);

  var results = [];

  Object.keys(SIGNNOW_TEMPLATE_MAP).forEach(function(docKey) {
    if (docKey === 'appearance-bond') {
      Logger.log('⏭️ Skipping appearance-bond (print-only)');
      return;
    }

    var templateId = SIGNNOW_TEMPLATE_MAP[docKey];
    var roles = TEMPLATE_ROLES[docKey] || ['Indemnitor'];
    var primaryRole = roles[0];

    Logger.log('\n── Processing: ' + docKey + ' ──');
    Logger.log('   Template ID: ' + templateId);

    try {
      // Step 1: Get existing fields
      var getUrl = config.API_BASE + '/document/' + templateId;
      var getRes = UrlFetchApp.fetch(getUrl, {
        headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
        muteHttpExceptions: true
      });

      if (getRes.getResponseCode() !== 200) {
        Logger.log('   ❌ Cannot read template: HTTP ' + getRes.getResponseCode());
        results.push({ docKey: docKey, status: 'error', error: 'HTTP ' + getRes.getResponseCode() });
        return;
      }

      var doc = JSON.parse(getRes.getContentText());
      var existingTexts = (doc.texts || []).map(function(t) {
        return t.field_name || t.name || '';
      });

      Logger.log('   Existing text fields: ' + existingTexts.length);

      // Step 2: Get expected field names from PDF_Mappings
      var filename = (typeof TEMPLATE_FILENAME_MAP !== 'undefined') ? TEMPLATE_FILENAME_MAP[docKey] : null;
      if (!filename) {
        Logger.log('   ⚠️ No filename mapping found, skipping');
        results.push({ docKey: docKey, status: 'no_mapping' });
        return;
      }

      var pdfFieldNames = [];
      if (SHAMROCK_FIELD_MAPPINGS && SHAMROCK_FIELD_MAPPINGS.pdf_mappings[filename]) {
        pdfFieldNames = Object.keys(SHAMROCK_FIELD_MAPPINGS.pdf_mappings[filename]);
      }

      if (pdfFieldNames.length === 0) {
        Logger.log('   ⚠️ No PDF field mappings for: ' + filename);
        results.push({ docKey: docKey, status: 'no_fields' });
        return;
      }

      // Step 3: Find missing fields
      var missingFields = pdfFieldNames.filter(function(fn) {
        return existingTexts.indexOf(fn) === -1;
      });

      Logger.log('   Expected fields: ' + pdfFieldNames.length);
      Logger.log('   Missing fields: ' + missingFields.length);

      if (missingFields.length === 0) {
        Logger.log('   ✅ All fields already present');
        results.push({ docKey: docKey, status: 'already_complete' });
        return;
      }

      // Step 4: Add missing text fields via PUT
      // SignNow expects "texts" array with specific format
      var textsPayload = missingFields.map(function(fieldName, idx) {
        return {
          size: 8,
          x: 5,
          y: 5 + (idx * 2),
          page_number: 0,
          font: 'Arial',
          line_height: 9.075,
          data: '',
          field_name: fieldName,
          role: primaryRole,
          required: false,
          width: 100,
          height: 12
        };
      });

      var putUrl = config.API_BASE + '/document/' + templateId;
      var putRes = UrlFetchApp.fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify({ texts: textsPayload }),
        muteHttpExceptions: true
      });

      var putCode = putRes.getResponseCode();
      var putBody = putRes.getContentText();

      if (putCode >= 200 && putCode < 300) {
        Logger.log('   ✅ Added ' + missingFields.length + ' text fields');
        results.push({ docKey: docKey, status: 'success', fieldsAdded: missingFields.length });
      } else {
        Logger.log('   ❌ PUT failed: HTTP ' + putCode + ' — ' + putBody.substring(0, 300));
        results.push({ docKey: docKey, status: 'error', code: putCode, error: putBody.substring(0, 200) });
      }

    } catch (e) {
      Logger.log('   ❌ Exception: ' + e.message);
      results.push({ docKey: docKey, status: 'exception', error: e.message });
    }
  });

  Logger.log('\n=== Tagging Complete ===');
  Logger.log('Results: ' + JSON.stringify(results));
  return results;
}
