/**
 * Shannon_PaperworkTools.js
 *
 * Voice paperwork interview tools: incremental save + email DocuSeal
 * signing + payment links to the indemnitor.
 *
 * Shannon never uses SignNow. Staff still matches surety/POA in Super CRM.
 */

var SHANNON_PAPERWORK_SHEET = 'ShannonPaperwork';
var SHANNON_PAYMENT_LINK = 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';
var SHANNON_PORTAL_URL = 'https://paperwork.shamrockbailbonds.biz';
var SHANNON_LEADS_URL = 'https://leads.shamrockbailbonds.biz';
var SHANNON_ID_UPLOAD_URL = 'https://www.shamrockbailbonds.biz/portal-start';
var SHANNON_ID_INBOX = 'admin@shamrockbailbonds.biz';

function shannonPaperworkSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHANNON_PAPERWORK_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SHANNON_PAPERWORK_SHEET);
    sheet.appendRow(['UpdatedAt', 'CaseRef', 'CallerPhone', 'CallerRole', 'DefendantName', 'IndemnitorEmail', 'Status', 'PayloadJson']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function shannonCaseKey_(params) {
  var ref = String(params.case_reference || params.packet_id || '').trim();
  if (ref) return ref;
  var phone = String(params.caller_phone || params.indemnitor_phone || '').replace(/\D/g, '').slice(-10);
  var defName = String(params.defendant_name || '').trim().toUpperCase().replace(/\s+/g, '-').slice(0, 24);
  return 'SH-' + (phone || 'UNK') + '-' + (defName || Date.now().toString(36).toUpperCase());
}

function shannonLoadDraft_(caseRef) {
  var sheet = shannonPaperworkSheet_();
  var data = sheet.getDataRange().getValues();
  for (var r = data.length - 1; r >= 1; r--) {
    if (String(data[r][1]) === caseRef) {
      try {
        return { row: r + 1, payload: JSON.parse(data[r][7] || '{}') };
      } catch (e) {
        return { row: r + 1, payload: {} };
      }
    }
  }
  return { row: 0, payload: {} };
}

function shannonMerge_(base, incoming) {
  var out = base || {};
  Object.keys(incoming || {}).forEach(function (key) {
    var val = incoming[key];
    if (val === undefined || val === null || val === '') return;
    if (typeof val === 'object' && !Array.isArray(val) && typeof out[key] === 'object' && out[key]) {
      out[key] = shannonMerge_(out[key], val);
    } else {
      out[key] = val;
    }
  });
  return out;
}

function toolSavePaperworkAnswers(params) {
  var caseRef = shannonCaseKey_(params);
  var existing = shannonLoadDraft_(caseRef);
  var merged = shannonMerge_(existing.payload, params);
  merged.case_reference = caseRef;
  merged.updated_at = new Date().toISOString();
  var sheet = shannonPaperworkSheet_();
  var row = [
    new Date(),
    caseRef,
    params.caller_phone || merged.caller_phone || '',
    params.caller_role || merged.caller_role || '',
    params.defendant_name || merged.defendant_name || '',
    params.indemnitor_email || (merged.indemnitor && merged.indemnitor.email) || '',
    'in_progress',
    JSON.stringify(merged)
  ];
  if (existing.row) {
    sheet.getRange(existing.row, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: 'saved',
    case_reference: caseRef,
    caller_role: merged.caller_role || params.caller_role || '',
    message: 'Saved. Keep going with the next missing field.'
  })).setMimeType(ContentService.MimeType.JSON);
}

function shannonLeadsHeaders_() {
  var key = '';
  try { key = PropertiesService.getScriptProperties().getProperty('GAS_API_KEY') || ''; } catch (e) {}
  return { 'Content-Type': 'application/json', 'X-API-Key': key };
}

function sendShannonText_(to, body) {
  if (!to || !body) return { success: false, error: 'missing_to_or_body' };
  try {
    var res = UrlFetchApp.fetch(SHANNON_LEADS_URL + '/api/imessage/shannon/send', {
      method: 'post',
      headers: shannonLeadsHeaders_(),
      payload: JSON.stringify({ phone: to, message: body, source: 'shannon_voice' }),
      muteHttpExceptions: true,
      followRedirects: true
    });
    var parsed = {};
    try { parsed = JSON.parse(res.getContentText() || '{}'); } catch (e) { parsed = {}; }
    var ok = res.getResponseCode() >= 200 && res.getResponseCode() < 300 &&
      (parsed.success || parsed.sent || parsed.queued);
    return {
      success: !!ok,
      sent: !!parsed.sent,
      queued: !!parsed.queued,
      channel: parsed.channel || 'bluebubbles',
      error: parsed.error || (ok ? '' : ('http_' + res.getResponseCode()))
    };
  } catch (err) {
    Logger.log('Shannon BlueBubbles text failed: ' + err.message);
    return { success: false, error: err.message };
  }
}

function shannonSyncIntakeToCrm_(params) {
  var url = SHANNON_LEADS_URL + '/api/intake/submit';
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: shannonLeadsHeaders_(),
    payload: JSON.stringify({
      source: 'elevenlabs_voice',
      intakeId: params.case_reference || '',
      caseId: params.case_reference || '',
      defendantName: params.defendant_name || '',
      county: params.county || '',
      charges: params.charges || '',
      bondAmount: params.bond_amount || '',
      facility: params.facility || '',
      indemnitorName: params.indemnitor_name || params.caller_name || '',
      indemnitorPhone: params.indemnitor_phone || params.caller_phone || '',
      indemnitorEmail: params.indemnitor_email || '',
      notes: (params.notes || '') + ' | role=' + (params.caller_role || '')
    }),
    muteHttpExceptions: true,
    followRedirects: true
  });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    Logger.log('Shannon CRM intake ' + code + ': ' + String(res.getContentText() || '').substring(0, 180));
  }
  return code;
}

function handleShannonNotifyBondsman(params) {
  params = params || {};
  var callerName = String(params.caller_name || params.indemnitor_name || '').trim();
  var callerPhone = String(params.caller_phone || params.indemnitor_phone || '').trim();
  var defName = String(params.defendant_name || '').trim();
  var county = String(params.county || '').trim();
  var notes = String(params.notes || '').trim();
  var preferredTime = String(params.preferred_time || 'ASAP').trim();

  try {
    if (typeof toolScheduleCallback === 'function' && callerPhone) {
      toolScheduleCallback({
        caller_name: callerName,
        caller_phone: callerPhone,
        preferred_time: preferredTime,
        notes: notes + (defName ? ' | defendant=' + defName : '') + (county ? ' | county=' + county : '')
      });
    }
  } catch (cbErr) {
    Logger.log('Shannon notify callback non-fatal: ' + cbErr.message);
  }

  try {
    if (typeof sendSlackMessage === 'function') {
      sendSlackMessage('#intake-alerts',
        '📞 *Shannon asked a bondsman to follow up*\n' +
        '• Caller: ' + (callerName || 'Unknown') + '\n' +
        '• Phone: ' + (callerPhone || 'none') + '\n' +
        '• Defendant: ' + (defName || 'TBD') + '\n' +
        '• County: ' + (county || 'TBD') + '\n' +
        '• Notes: ' + (notes || 'None'),
        null
      );
    }
  } catch (slackErr) {}

  return {
    success: true,
    status: 'notified',
    message: 'You can reach our office at 239-332-2245. I also notified a bondsman who can call you back ' +
      (preferredTime && preferredTime !== 'ASAP' ? 'around ' + preferredTime : 'as soon as possible') + '.'
  };
}

function shannonCreateDocusealViaCrm_(payload) {
  var url = SHANNON_LEADS_URL + '/api/paperwork/shannon/email';
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: shannonLeadsHeaders_(),
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    followRedirects: true
  });
  var code = res.getResponseCode();
  var body = {};
  try { body = JSON.parse(res.getContentText() || '{}'); } catch (e) { body = { raw: res.getContentText() }; }
  if (code >= 200 && code < 300 && body.success) return body;
  throw new Error('CRM paperwork ' + code + ': ' + (body.error || res.getContentText().substring(0, 180)));
}

function shannonCreateDocusealDirect_(payload, packetId) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('DOCUSEAL_API_KEY') || '';
  var base = (props.getProperty('DOCUSEAL_URL') || 'https://sign.shamrockbailbonds.biz').replace(/\/$/, '');
  var templateId = props.getProperty('DOCUSEAL_TEMPLATE_ID_OSI') || props.getProperty('DOCUSEAL_TEMPLATE_ID') || '1';
  if (!apiKey) throw new Error('DOCUSEAL_API_KEY not set');

  var indemnitor = payload.indemnitor || {};
  var defendant = payload.defendant || {};
  var co = payload.coindemnitor || {};
  var defEmail = defendant.email || ('admin+shannon-def-' + packetId.toLowerCase() + '@shamrockbailbonds.biz');
  var values = {
    defendant_name: payload.defendant_name || defendant.name || '',
    indemnitor_name: [indemnitor.name || payload.indemnitor_name || '', co.name || ''].filter(Boolean).join(' / '),
    county: payload.county || 'Lee',
    county_full: (payload.county || 'Lee') + ' County',
    case_number: payload.case_number || 'TBN',
    poa_number: payload.poa_number || 'TBN',
    numeric_full_bond_amount: String(payload.bond_amount || ''),
    charges_summary: payload.charges || '',
    agent_name: "Brendan O'Neal"
  };
  var submitters = [
    { role: 'bondsman', email: 'admin@shamrockbailbonds.biz', name: "Brendan O'Neal", send_email: false, values: values },
    { role: 'indemnitor', email: indemnitor.email || payload.indemnitor_email, name: indemnitor.name || payload.indemnitor_name, send_email: false, values: values }
  ];
  if (co.email && co.name) {
    submitters.push({ role: 'coindemnitor', email: co.email, name: co.name, send_email: false, values: values });
  }
  submitters.push({ role: 'defendant', email: defEmail, name: payload.defendant_name || defendant.name, send_email: false, values: values });

  var res = UrlFetchApp.fetch(base + '/api/submissions', {
    method: 'post',
    headers: { 'X-Auth-Token': apiKey, 'Content-Type': 'application/json' },
    payload: JSON.stringify({ template_id: parseInt(templateId, 10) || templateId, send_email: false, order: 'random', submitters: submitters }),
    muteHttpExceptions: true
  });
  var body = JSON.parse(res.getContentText() || '{}');
  if (res.getResponseCode() >= 300) throw new Error('DocuSeal ' + res.getResponseCode());
  var list = Array.isArray(body) ? body : (body.submitters || [body]);
  var out = { success: true, packet_id: packetId, submission_id: body.submission_id || (list[0] && list[0].submission_id), indemnitor_sign_url: '', coindemnitor_sign_url: '', defendant_sign_url: '', payment_link: SHANNON_PAYMENT_LINK, portal_url: SHANNON_PORTAL_URL };
  list.forEach(function (s) {
    var role = String(s.role || '').toLowerCase();
    var url = s.embed_src || (s.slug ? (base + '/s/' + s.slug) : '');
    if (role === 'indemnitor') out.indemnitor_sign_url = url;
    if (role === 'coindemnitor') out.coindemnitor_sign_url = url;
    if (role === 'defendant') out.defendant_sign_url = url;
    if (!out.submission_id) out.submission_id = s.submission_id;
  });
  return out;
}

function shannonSendIndemnitorEmail_(toEmail, toName, defendantName, county, links) {
  var signUrl = links.indemnitor_sign_url || links.portal_url || SHANNON_PORTAL_URL;
  var payUrl = links.payment_link || SHANNON_PAYMENT_LINK;
  var subject = 'Shamrock Bail Bonds — sign paperwork and pay for ' + defendantName;
  var html = '' +
    '<div style="font-family:Arial,sans-serif;color:#1A3D2B;max-width:640px">' +
    '<h2>☘️ Shamrock Bail Bonds</h2>' +
    '<p>Hi ' + (toName || 'there') + ',</p>' +
    '<p>Shannon started your bond paperwork for <strong>' + defendantName + '</strong>' +
    (county ? ' in ' + county + ' County' : '') + '.</p>' +
    '<p><strong>1. Sign the paperwork</strong><br>' +
    '<a href="' + signUrl + '">Open your secure signing link</a></p>' +
    (links.coindemnitor_sign_url ? '<p>Additional cosigner link: <a href="' + links.coindemnitor_sign_url + '">co-indemnitor signing</a></p>' : '') +
    '<p><strong>2. Pay the premium</strong><br>' +
    '<a href="' + payUrl + '">Pay securely with SwipeSimple</a></p>' +
    '<p>You can also finish remaining details at <a href="' + (links.portal_url || SHANNON_PORTAL_URL) + '">our paperwork portal</a>.</p>' +
    '<p>A Shamrock bondsman will review the case, surety, and power number. Call (239) 332-2245 anytime.</p>' +
    '<p>Shamrock Bail Bonds<br>1528 Broadway, Fort Myers, FL 33901</p></div>';
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: html,
    name: 'Shamrock Bail Bonds'
  });
}

function toolEmailPaperworkToIndemnitor(params) {
  var draftKey = shannonCaseKey_(params);
  var stored = shannonLoadDraft_(draftKey).payload || {};
  var payload = shannonMerge_(stored, params);
  payload.case_reference = draftKey;
  payload.packet_id = draftKey;

  var indemnitor = payload.indemnitor || {};
  var indEmail = String(payload.indemnitor_email || indemnitor.email || '').trim();
  var indName = String(payload.indemnitor_name || indemnitor.name || payload.caller_name || '').trim();
  var defName = String(payload.defendant_name || (payload.defendant && payload.defendant.name) || '').trim();
  var county = String(payload.county || '').trim();

  if (!indEmail || indEmail.indexOf('@') < 0) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'I still need the indemnitor email address before I can send the signing and payment email.'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  if (!indName || !defName) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'I need the indemnitor name and the defendant name before sending paperwork.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  payload.indemnitor = shannonMerge_(indemnitor, { name: indName, email: indEmail, phone: payload.indemnitor_phone || indemnitor.phone || payload.caller_phone || '' });
  payload.defendant = shannonMerge_(payload.defendant || {}, { name: defName, email: payload.defendant_email || (payload.defendant && payload.defendant.email) || '' });
  payload.surety_id = payload.surety_id || 'osi';

  var links = null;
  var source = 'super_crm';
  try {
    links = shannonCreateDocusealViaCrm_(payload);
  } catch (crmErr) {
    Logger.log('Shannon CRM paperwork failed (no GAS DocuSeal fallback): ' + crmErr.message);
    try {
      if (typeof sendSlackMessage === 'function') {
        sendSlackMessage('#intake-alerts',
          '⚠️ Shannon could not create a DocuSeal packet in Super CRM for `' + draftKey +
          '`. No GAS fallback ran. Staff: issue the packet in Super CRM.',
          null);
      }
    } catch (slackErr) {}
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      case_reference: draftKey,
      message: 'I could not create the signing packet just now. I can text the payment link, or you can reach our office at 239-332-2245.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    shannonSendIndemnitorEmail_(indEmail, indName, defName, county, links);
  } catch (mailErr) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Could not send the email. Confirm the address and I will try again, or I can text the payment link.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var phone = String(payload.indemnitor_phone || payload.caller_phone || '').trim();
  if (phone && links.indemnitor_sign_url) {
    try {
      sendShannonText_(phone, '☘️ Shamrock Bail Bonds: Sign paperwork for ' + defName + ': ' + links.indemnitor_sign_url + ' Pay: ' + (links.payment_link || SHANNON_PAYMENT_LINK));
    } catch (smsErr) {
      Logger.log('Shannon paperwork text non-fatal: ' + smsErr.message);
    }
  }

  var sheet = shannonPaperworkSheet_();
  var existing = shannonLoadDraft_(draftKey);
  var statusRow = [
    new Date(), draftKey, payload.caller_phone || '', payload.caller_role || '', defName, indEmail, 'emailed', JSON.stringify(payload)
  ];
  if (existing.row) sheet.getRange(existing.row, 1, 1, statusRow.length).setValues([statusRow]);
  else sheet.appendRow(statusRow);

  try {
    if (typeof sendSlackMessage === 'function') {
      sendSlackMessage('#intake-alerts',
        '🎙 *Shannon emailed paperwork to indemnitor*\n' +
        '• Defendant: ' + defName + '\n' +
        '• Indemnitor: ' + indName + '\n' +
        '• County: ' + (county || 'TBD') + '\n' +
        '• Packet: `' + draftKey + '`\n' +
        '• Source: ' + source + '\n' +
        '• Signing: ' + (links.indemnitor_sign_url ? 'DocuSeal link sent' : 'portal/payment only') + '\n' +
        'Staff: match bond, surety, and POA in Super CRM.',
        null
      );
    }
  } catch (slackErr) {}

  var spoken = links.indemnitor_sign_url
    ? 'I emailed the signing link and payment link to ' + indEmail + '. They can sign on their phone and pay the premium from that email.'
    : 'I emailed payment instructions and our paperwork portal to ' + indEmail + '. A bondsman will attach the official signing packet as soon as the case is matched.';

  return ContentService.createTextOutput(JSON.stringify({
    status: 'sent',
    case_reference: draftKey,
    emailed_to: indEmail,
    signing_link_included: !!links.indemnitor_sign_url,
    payment_link: links.payment_link || SHANNON_PAYMENT_LINK,
    source: source,
    message: spoken
  })).setMimeType(ContentService.MimeType.JSON);
}

function toolRequestIdPhoto(params) {
  params = params || {};
  var method = String(params.method || params.channel || 'upload').toLowerCase();
  if (method === 'text' || method === 'link' || method === 'sms' || method === 'imessage' || method === 'scan') {
    method = 'upload';
  }
  if (method === 'mail' || method === 'e-mail') method = 'email';
  if (method !== 'email' && method !== 'both') method = 'upload';

  var role = String(params.signer_role || params.caller_role || 'indemnitor').toLowerCase();
  if (role === 'cosigner' || role === 'primary') role = 'indemnitor';
  var caseRef = shannonCaseKey_(params);
  var phone = String(params.phone || params.to_phone || params.caller_phone || params.indemnitor_phone || '').trim();
  var email = String(params.email || params.indemnitor_email || '').trim();
  var name = String(params.caller_name || params.indemnitor_name || '').trim();
  var defName = String(params.defendant_name || '').trim();

  if (role === 'defendant' && method === 'email') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Do not email the jail. I can text a photo-upload link to the family member posting the bond instead.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var uploadUrl = SHANNON_ID_UPLOAD_URL + '?source=shannon&role=' + encodeURIComponent(role);
  if (caseRef) uploadUrl += '&case=' + encodeURIComponent(caseRef);
  try {
    var linkRes = UrlFetchApp.fetch(SHANNON_LEADS_URL + '/api/paperwork/shannon/id-link', {
      method: 'post',
      headers: shannonLeadsHeaders_(),
      payload: JSON.stringify({
        packet_id: caseRef,
        case_reference: caseRef,
        caller_role: role,
        defendant_name: defName
      }),
      muteHttpExceptions: true,
      followRedirects: true
    });
    var linkBody = {};
    try { linkBody = JSON.parse(linkRes.getContentText() || '{}'); } catch (e) { linkBody = {}; }
    if (linkRes.getResponseCode() >= 200 && linkRes.getResponseCode() < 300 && linkBody.upload_url) {
      uploadUrl = String(linkBody.upload_url);
      if (linkBody.packet_id) caseRef = String(linkBody.packet_id);
    }
  } catch (linkErr) {
    Logger.log('Shannon ID link CRM miss, using portal-start: ' + linkErr.message);
  }

  var sentText = false;
  var sentEmail = false;

  if (method === 'email' || method === 'both') {
    if (!email || email.indexOf('@') < 0) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'I need their email address to send the ID instructions, or I can text an upload link instead.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    var subject = 'Shamrock Bail Bonds — send a photo of your ID' + (defName ? (' for ' + defName) : '');
    var html = '' +
      '<div style="font-family:Arial,sans-serif;color:#1A3D2B;max-width:640px">' +
      '<h2>☘️ Shamrock Bail Bonds</h2>' +
      '<p>Hi ' + (name || 'there') + ',</p>' +
      '<p>Please send a clear photo of the <strong>front and back</strong> of your driver license or state ID' +
      (defName ? (' for the bond for <strong>' + defName + '</strong>') : '') + '.</p>' +
      '<p><strong>Easiest:</strong> open this link on your phone and photograph it:<br>' +
      '<a href="' + uploadUrl + '">' + uploadUrl + '</a></p>' +
      '<p>Or reply to this email with the two photos, or send them to ' + SHANNON_ID_INBOX +
      ' with the defendant name in the subject.</p>' +
      '<p>Call (239) 332-2245 anytime.</p></div>';
    try {
      MailApp.sendEmail({
        to: email,
        cc: SHANNON_ID_INBOX,
        subject: subject,
        htmlBody: html,
        name: 'Shamrock Bail Bonds'
      });
      sentEmail = true;
    } catch (mailErr) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'I could not send that email. Confirm the address, or I can text an upload link instead.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (method === 'upload' || method === 'both' || (method === 'email' && phone)) {
    if (!phone && method === 'upload') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'I need a mobile number to text the ID upload link.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    if (phone) {
      var sms = 'Photograph the front and back of your ID here: ' + uploadUrl +
        '. Or email both photos to ' + SHANNON_ID_INBOX +
        (defName ? (' with ' + defName + ' in the subject') : '') + '.';
      var smsRes = (typeof sendShannonText_ === 'function') ? sendShannonText_(phone, sms) : { success: false };
      sentText = !!(smsRes && smsRes.success);
      if (method === 'upload' && !sentText) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          upload_url: uploadUrl,
          id_inbox: SHANNON_ID_INBOX,
          message: 'I could not text the link. You can open ' + uploadUrl +
            ' on your phone, or email photos of the front and back to ' + SHANNON_ID_INBOX + '.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  var spoken = '';
  if (sentText && sentEmail) {
    spoken = 'I texted you a link to photograph your ID, and I emailed the same instructions. Open the text, or reply to the email with the front and back.';
  } else if (sentText) {
    spoken = 'I just texted you a link. Open it and photograph the front and back of your ID. You can also email those photos to ' + SHANNON_ID_INBOX + '.';
  } else if (sentEmail) {
    spoken = 'I emailed you. Reply with a photo of the front and back of your ID, or send them to ' + SHANNON_ID_INBOX + '.';
  } else {
    spoken = 'You can photograph your ID at ' + uploadUrl + ', or email the front and back to ' + SHANNON_ID_INBOX + '.';
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'sent',
    method: method,
    sent_text: sentText,
    sent_email: sentEmail,
    upload_url: uploadUrl,
    id_inbox: SHANNON_ID_INBOX,
    case_reference: caseRef,
    message: spoken
  })).setMimeType(ContentService.MimeType.JSON);
}
