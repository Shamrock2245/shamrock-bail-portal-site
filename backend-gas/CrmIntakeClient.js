/**
 * CrmIntakeClient.js
 *
 * Posts a lead to ShamrockLeads POST /api/intake/submit.
 * Auth is the existing script property GAS_API_KEY, else LEADS_INTERNAL_TOKEN,
 * sent as X-API-Key. The leads base is LEADS_API_URL, else SHANNON_LEADS_URL,
 * else https://leads.shamrockbailbonds.biz.
 *
 * An ID scan seeds identity. A stated name, address, phone, and the best real
 * email then replace those fields. Bond amounts and booking keys are sent
 * only when the person gave a real one.
 */

var CRM_INTAKE_DEFAULT_BASE = 'https://leads.shamrockbailbonds.biz';
var CRM_INTAKE_OFFICE_EMAIL = 'admin@shamrockbailbonds.biz';

function crmClean_(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function crmIsRealEmail_(value) {
  var email = crmClean_(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  if (email === CRM_INTAKE_OFFICE_EMAIL) return '';
  if (/^admin\+[^@]*@shamrockbailbonds\.biz$/.test(email)) return '';
  return email;
}

function crmBestEmail_(candidates) {
  var list = candidates || [];
  for (var i = 0; i < list.length; i++) {
    var email = crmIsRealEmail_(list[i]);
    if (email) return email;
  }
  return '';
}

function crmStatedBondAmount_(value) {
  var raw = crmClean_(value).replace(/[$,\s]/g, '');
  if (!raw) return '';
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return '';
  var amount = Number(raw);
  if (!isFinite(amount) || amount <= 0) return '';
  return String(amount);
}

function crmStatedBookingNumber_(value, intakeId) {
  var raw = crmClean_(value);
  if (!raw) return '';
  var lower = raw.toLowerCase();
  if (lower === 'unknown' || lower === 'tbd' || lower === 'n/a' || lower === 'na' || lower === 'none' || lower === 'skip') return '';
  if (intakeId && raw === crmClean_(intakeId)) return '';
  if (/^sh-/i.test(raw) || /^tg-/i.test(raw)) return '';
  if (/^(CA|SM|MM|NO|PN)[0-9a-f]{32}$/i.test(raw)) return '';
  if (/^(conv_|tlcal_)/i.test(raw)) return '';
  return raw;
}

function crmStatedPhone_(value, telegramUserId) {
  var digits = crmClean_(value).replace(/\D/g, '');
  if (!digits) return '';
  var chat = crmClean_(telegramUserId).replace(/\D/g, '');
  if (chat && digits === chat) return '';
  if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
  if (digits.length !== 10) return '';
  if (digits === '7272952245' || digits === '2393322245' || digits === '2399550178') return '';
  return digits;
}

function crmSplitName_(full) {
  var parts = crmClean_(full).split(/\s+/).filter(function (part) { return part; });
  if (!parts.length) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function crmCallerRole_(form) {
  var role = crmClean_(form.caller_role || form.role || form.signer_role).toLowerCase();
  return role === 'defendant' ? 'defendant' : 'indemnitor';
}

function crmPut_(target, key, value) {
  var text = crmClean_(value);
  if (text) target[key] = text;
}

function crmLogFailure_(source, status, error) {
  var line = 'CRM INTAKE FAILED source=' + (source || 'unknown') + ' status=' + (status || 0) + ' error=' + (error || 'unknown');
  try { Logger.log(line); } catch (e) {}
  try { console.error(line); } catch (e2) {}
}

function crmLeadsConfig_() {
  var key = '';
  var base = CRM_INTAKE_DEFAULT_BASE;
  try {
    var props = PropertiesService.getScriptProperties();
    key = props.getProperty('GAS_API_KEY') || props.getProperty('LEADS_INTERNAL_TOKEN') || '';
    base = props.getProperty('LEADS_API_URL') || props.getProperty('SHANNON_LEADS_URL') || base;
  } catch (e) {}
  return { key: crmClean_(key), base: crmClean_(base).replace(/\/$/, '') || CRM_INTAKE_DEFAULT_BASE };
}

/**
 * @param {string} source telegram | telegram_miniapp | shannon_voice
 * @param {object} input { form|said, scan, ocr, intakeId }
 */
function crmBuildIntakePayload_(source, input) {
  input = input || {};
  var form = input.form || input.said || {};
  var scan = input.scan || {};
  var ocr = input.ocr || {};
  var role = crmCallerRole_(form);
  var scanOnDefendant = role === 'defendant';
  var chatId = crmClean_(form.telegramUserId || form.telegram_user_id);

  var scanName = crmClean_(scan.full_name);
  var scanAddress = crmClean_(scan.address);
  var scanCity = crmClean_(scan.city);
  var scanState = crmClean_(scan.state || scan.dl_state);
  var scanZip = crmClean_(scan.zip);
  var scanDob = crmClean_(scan.dob);
  var scanDl = crmClean_(scan.dl_number || scan.dl);
  var scanDlState = crmClean_(scan.dl_state || scan.state);

  var indName = scanOnDefendant ? '' : (scanName || crmClean_(ocr.indemnitor_name || ocr.IndName || ocr.FullName));
  var indAddress = scanOnDefendant ? '' : (scanAddress || crmClean_(ocr.indemnitor_address));
  var indCity = scanOnDefendant ? '' : (scanCity || crmClean_(ocr.indemnitor_city));
  var indState = scanOnDefendant ? '' : (scanState || crmClean_(ocr.indemnitor_state));
  var indZip = scanOnDefendant ? '' : (scanZip || crmClean_(ocr.indemnitor_zip));
  var indDob = scanOnDefendant ? '' : (scanDob || crmClean_(ocr.indemnitor_dob));
  var indDl = scanOnDefendant ? '' : (scanDl || crmClean_(ocr.indemnitor_dl));

  var defName = scanOnDefendant
    ? (scanName || crmClean_(ocr.defendant_name || ocr.DefName))
    : crmClean_(ocr.defendant_name || ocr.DefName);
  var defAddress = scanOnDefendant ? (scanAddress || crmClean_(ocr.defendant_address)) : crmClean_(ocr.defendant_address);
  var defCity = scanOnDefendant ? (scanCity || crmClean_(ocr.defendant_city)) : crmClean_(ocr.defendant_city);
  var defState = scanOnDefendant ? (scanState || crmClean_(ocr.defendant_state)) : crmClean_(ocr.defendant_state);
  var defZip = scanOnDefendant ? (scanZip || crmClean_(ocr.defendant_zip)) : crmClean_(ocr.defendant_zip);
  var defDob = scanOnDefendant ? (scanDob || crmClean_(ocr.defendant_dob)) : crmClean_(ocr.defendant_dob || ocr.DefDOB);
  var defDl = scanOnDefendant ? (scanDl || crmClean_(ocr.defendant_dl)) : crmClean_(ocr.defendant_dl);

  var nestedInd = (form.indemnitor && typeof form.indemnitor === 'object') ? form.indemnitor : {};
  var nestedDef = (form.defendant && typeof form.defendant === 'object') ? form.defendant : {};
  var saidIndName = crmClean_(
    form.IndName || form.indemnitorName || form.indemnitor_name || form.IndemnitorName
    || nestedInd.name || nestedInd.full_name
    || (role === 'indemnitor' ? (form.caller_name || form.callerName) : '')
  );
  var saidDefName = crmClean_(
    form.DefName || form.defendantName || form.defendant_name
    || nestedDef.name || nestedDef.full_name
    || (role === 'defendant' ? (form.caller_name || form.callerName) : '')
  );
  if (saidIndName) indName = saidIndName;
  if (saidDefName) defName = saidDefName;

  var saidIndAddress = crmClean_(form.IndAddress || form.indemnitorAddress || form.indemnitor_address || form.address);
  var saidDefAddress = crmClean_(form.DefAddress || form.defendant_address || form.defendantAddress);
  if (saidIndAddress) indAddress = saidIndAddress;
  if (saidDefAddress) defAddress = saidDefAddress;

  var saidIndCity = crmClean_(form.IndCity || form.indemnitor_city || form.indemnitorCity);
  var saidIndState = crmClean_(form.IndState || form.indemnitor_state || form.indemnitorState);
  var saidIndZip = crmClean_(form.IndZip || form.indemnitor_zip || form.indemnitorZip);
  var saidDefCity = crmClean_(form.DefCity || form.defendant_city);
  var saidDefState = crmClean_(form.DefState || form.defendant_state);
  var saidDefZip = crmClean_(form.DefZip || form.defendant_zip);
  if (saidIndCity) indCity = saidIndCity;
  if (saidIndState) indState = saidIndState;
  if (saidIndZip) indZip = saidIndZip;
  if (saidDefCity) defCity = saidDefCity;
  if (saidDefState) defState = saidDefState;
  if (saidDefZip) defZip = saidDefZip;

  var saidIndDob = crmClean_(form.IndDOB || form.indemnitorDOB || form.indemnitor_dob);
  var saidDefDob = crmClean_(form.DefDOB || form.defendantDOB || form.defendant_dob);
  var saidIndDl = crmClean_(form.IndDL || form.indemnitor_dl || form.indemnitorDL);
  var saidDefDl = crmClean_(form.DefDL || form.defendant_dl || form.defendantDL);
  if (saidIndDob) indDob = saidIndDob;
  if (saidDefDob) defDob = saidDefDob;
  if (saidIndDl) indDl = saidIndDl;
  if (saidDefDl) defDl = saidDefDl;

  var indPhone = crmStatedPhone_(
    form.IndPhone || form.indemnitorPhone || form.indemnitor_phone || nestedInd.phone
    || (role === 'indemnitor' ? (form.caller_phone || form.callerPhone || form.phone) : ''),
    chatId
  );
  var defPhone = crmStatedPhone_(
    form.DefPhone || form.defendantPhone || form.defendant_phone
    || (role === 'defendant' ? (form.caller_phone || form.callerPhone || form.phone) : ''),
    chatId
  );
  var email = crmBestEmail_([
    form.IndEmail, form.indemnitorEmail, form.indemnitor_email, nestedInd.email,
    form.caller_email, form.email,
    form.DefEmail, form.defendantEmail, form.defendant_email, nestedDef.email
  ]);

  var intakeId = crmClean_(input.intakeId || form.intakeId || form.intake_id || form.case_reference || form.caseId);
  var indParts = crmSplitName_(indName);
  var defParts = crmSplitName_(defName);
  var body = { source: source };

  crmPut_(body, 'intakeId', intakeId);
  crmPut_(body, 'IndName', indName);
  crmPut_(body, 'indemnitorName', indName);
  crmPut_(body, 'IndFirstName', crmClean_(form.IndFirstName) || indParts.first);
  crmPut_(body, 'IndLastName', crmClean_(form.IndLastName) || indParts.last);
  crmPut_(body, 'IndAddress', indAddress);
  crmPut_(body, 'IndCity', indCity);
  crmPut_(body, 'IndState', indState);
  crmPut_(body, 'IndZip', indZip);
  crmPut_(body, 'IndDOB', indDob);
  crmPut_(body, 'IndDL', indDl);
  crmPut_(body, 'IndDLState', scanOnDefendant ? '' : scanDlState);
  crmPut_(body, 'IndPhone', indPhone);
  crmPut_(body, 'indemnitorPhone', indPhone);
  crmPut_(body, 'IndEmail', email);
  crmPut_(body, 'indemnitorEmail', email);
  crmPut_(body, 'IndRelation', form.IndRelation || form.indemnitor_relationship || form.relationship);
  crmPut_(body, 'IndEmployer', form.IndEmployer || form.indemnitor_employer);
  crmPut_(body, 'IndJobTitle', form.IndJobTitle);
  crmPut_(body, 'DefName', defName);
  crmPut_(body, 'defendantName', defName);
  crmPut_(body, 'DefFirstName', crmClean_(form.DefFirstName) || defParts.first);
  crmPut_(body, 'DefLastName', crmClean_(form.DefLastName) || defParts.last);
  crmPut_(body, 'DefAddress', defAddress);
  crmPut_(body, 'DefCity', defCity);
  crmPut_(body, 'DefState', defState);
  crmPut_(body, 'DefZip', defZip);
  crmPut_(body, 'DefDOB', defDob);
  crmPut_(body, 'DefDL', defDl);
  crmPut_(body, 'DefDLState', scanOnDefendant ? scanDlState : '');
  crmPut_(body, 'DefPhone', defPhone);
  crmPut_(body, 'defendantPhone', defPhone);
  crmPut_(body, 'DefFacility', form.DefFacility || form.facility);
  crmPut_(body, 'DefCounty', form.DefCounty || form.county);
  crmPut_(body, 'DefCharges', form.DefCharges || form.charges);

  var bond = crmStatedBondAmount_(form.DefBondAmount || form.bondAmount || form.bond_amount);
  if (bond) {
    body.DefBondAmount = bond;
    body.bondAmount = bond;
  }
  var booking = crmStatedBookingNumber_(form.bookingNumber || form.booking_number || form.DefBookingNumber, intakeId);
  if (booking) body.bookingNumber = booking;

  crmPut_(body, 'Ref1Name', form.Ref1Name);
  crmPut_(body, 'Ref1Phone', crmStatedPhone_(form.Ref1Phone, chatId));
  crmPut_(body, 'Ref1Relation', form.Ref1Relation);
  crmPut_(body, 'Ref2Name', form.Ref2Name);
  crmPut_(body, 'Ref2Phone', crmStatedPhone_(form.Ref2Phone, chatId));
  crmPut_(body, 'Ref2Relation', form.Ref2Relation);
  crmPut_(body, 'notes', form.notes);
  crmPut_(body, 'telegramUserId', chatId);
  crmPut_(body, 'telegramUsername', form.telegramUsername);
  if (form.gpsLatitude !== undefined && form.gpsLatitude !== null && form.gpsLatitude !== '') body.gpsLatitude = form.gpsLatitude;
  if (form.gpsLongitude !== undefined && form.gpsLongitude !== null && form.gpsLongitude !== '') body.gpsLongitude = form.gpsLongitude;
  if (form.manualLocation) body.manualLocation = form.manualLocation;
  if (form.consent || form.consentGiven) {
    body.consent = true;
    body.consentGiven = true;
    crmPut_(body, 'consentTimestamp', form.consentTimestamp);
  }
  return body;
}

function crmTelegramSource_(intakeData) {
  var raw = crmClean_(intakeData && (intakeData.source || intakeData.platform)).toLowerCase();
  if (raw.indexOf('mini') !== -1) return 'telegram_miniapp';
  return 'telegram';
}

function crmSubmitIntake_(body, deps) {
  deps = deps || {};
  var cfg = deps.config || crmLeadsConfig_();
  var source = body && body.source ? body.source : 'unknown';
  if (!cfg.key) {
    crmLogFailure_(source, 0, 'missing_GAS_API_KEY_or_LEADS_INTERNAL_TOKEN');
    return { ok: false, status: 0, error: 'missing_machine_key', source: source };
  }
  var url = cfg.base + '/api/intake/submit';
  var payload = JSON.stringify(body || {});
  try {
    var res;
    if (deps.fetch) {
      res = deps.fetch(url, {
        method: 'post',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.key },
        payload: payload
      });
    } else {
      res = UrlFetchApp.fetch(url, {
        method: 'post',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.key },
        payload: payload,
        muteHttpExceptions: true,
        followRedirects: true
      });
    }
    var code = res.getResponseCode();
    var parsed = {};
    try { parsed = JSON.parse(res.getContentText() || '{}'); } catch (parseErr) { parsed = {}; }
    if (code < 200 || code >= 300 || !parsed.success) {
      var error = parsed.error || parsed.message || ('http_' + code);
      crmLogFailure_(source, code, error);
      return { ok: false, status: code, error: error, source: source };
    }
    return {
      ok: true,
      status: code,
      source: parsed.source || source,
      intake_id: parsed.intake_id || (body && body.intakeId) || '',
      body: parsed
    };
  } catch (err) {
    crmLogFailure_(source, 0, err && err.message);
    return { ok: false, status: 0, error: err && err.message ? err.message : 'network', source: source };
  }
}

/**
 * Scan an ID image. Never sends a booking number, so the CRM does not attach
 * the photo to a bond folder.
 */
function crmScanIdImage_(imageB64, filename, deps) {
  deps = deps || {};
  var cfg = deps.config || crmLeadsConfig_();
  var b64 = crmClean_(imageB64);
  if (!b64 || !cfg.key) return {};
  var url = cfg.base + '/api/id/scan-ocr';
  var payload = JSON.stringify({ image_b64: b64, filename: crmClean_(filename) || 'id.jpg' });
  try {
    var res = deps.fetch
      ? deps.fetch(url, { method: 'post', headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.key }, payload: payload })
      : UrlFetchApp.fetch(url, {
          method: 'post',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.key },
          payload: payload,
          muteHttpExceptions: true,
          followRedirects: true
        });
    if (res.getResponseCode() < 200 || res.getResponseCode() >= 300) {
      crmLogFailure_('id_scan', res.getResponseCode(), 'scan_http');
      return {};
    }
    var parsed = {};
    try { parsed = JSON.parse(res.getContentText() || '{}'); } catch (e) { parsed = {}; }
    return (parsed.extracted && typeof parsed.extracted === 'object') ? parsed.extracted : {};
  } catch (err) {
    crmLogFailure_('id_scan', 0, err && err.message);
    return {};
  }
}

function crmIntakeFromTelegram_(intakeData, deps) {
  deps = deps || {};
  var source = crmTelegramSource_(intakeData);
  var body = crmBuildIntakePayload_(source, {
    form: intakeData || {},
    scan: deps.scan || {},
    ocr: deps.ocr || {},
    intakeId: intakeData && (intakeData.intakeId || intakeData.intake_id)
  });
  return crmSubmitIntake_(body, deps);
}

function crmIntakeFromShannon_(params, deps) {
  deps = deps || {};
  var body = crmBuildIntakePayload_('shannon_voice', {
    form: params || {},
    said: params || {},
    scan: deps.scan || {},
    ocr: deps.ocr || params && params.id_ocr || {},
    intakeId: params && (params.case_reference || params.intakeId || params.packet_id)
  });
  return crmSubmitIntake_(body, deps);
}
