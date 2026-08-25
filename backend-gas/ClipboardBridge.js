/**
 * ClipboardBridge.js
 *
 * Wix clipboard → GAS factory handlers. Persist and notify only.
 * Never create a DocuSeal or SignNow packet, signing link, or payment request.
 */

function handleClipboardSyncCanonicalIntake(data) {
  try {
    var caseId = data.caseId || (data.canonical && data.canonical.caseId);
    var payload = data.legacyMap || data.canonical || data.data || data;
    if (typeof MongoLogger !== 'undefined' && MongoLogger.logIntake) {
      MongoLogger.logIntake(payload, 'canonical_sync');
    }
    if (typeof handleNewIntake === 'function' && caseId) {
      return handleNewIntake(caseId, payload);
    }
    return { success: true, queued: true, caseId: caseId || null, packetIssued: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleClipboardLookupDefendant(data) {
  var query = data.query || data.bookingNumber || data.name || '';
  if (data.county && query) query = String(query) + ' ' + data.county;
  if (typeof staffLookupBooking_ === 'function') {
    var result = staffLookupBooking_(query);
    return {
      success: !!result.success,
      data: (result.results && result.results[0]) || null,
      results: result.results || [],
      count: result.count || 0,
      error: result.error
    };
  }
  return { success: false, error: 'Booking lookup unavailable' };
}

function handleClipboardProcessIdOcr(data) {
  try {
    if (!data || !data.imageBase64) {
      return { success: false, error: 'No image payload provided' };
    }
    var raw = String(data.imageBase64).replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
    var bytes = Utilities.base64Decode(raw);
    var blob = Utilities.newBlob(bytes, 'image/jpeg', 'id-scan.jpg');
    var ocrText = (typeof _callCloudVisionOCR === 'function') ? _callCloudVisionOCR(blob) : '';
    if (!ocrText) {
      return { success: false, error: 'OCR returned no text' };
    }
    var parsed = (typeof _parseFloridaDL === 'function') ? _parseFloridaDL(ocrText) : {};
    var fields = {
      firstName: parsed.firstName || '',
      lastName: parsed.lastName || '',
      fullName: [parsed.firstName, parsed.lastName].filter(Boolean).join(' '),
      dob: parsed.dob || '',
      dlNumber: parsed.dlNumber || '',
      street: parsed.address || '',
      city: '',
      state: 'FL',
      zip: '',
      sex: '',
      expiration: ''
    };
    var filled = Object.keys(fields).filter(function (k) { return !!fields[k]; }).length;
    return {
      success: true,
      data: {
        fields: fields,
        confidence: { overall: filled >= 3 ? 'high' : 'medium', fields: {} },
        rawText: ocrText
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleClipboardStartWalkInCase(data) {
  try {
    var caseId = data.caseId;
    var payload = data.canonicalCase || data;
    if (typeof handleNewIntake === 'function' && caseId) {
      handleNewIntake(caseId, payload);
    }
    _clipboardSlack_('#leads', '☘️ Walk-in intake ' + (caseId || 'unknown') +
      ' is ready for Super CRM match (role: ' + (data.role || 'unknown') + '). No packet issued.');
    return { success: true, caseId: caseId, packetIssued: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleClipboardMarkCaseReadyForIssuance(data) {
  try {
    _clipboardSlack_('#leads', '🚀 Case ' + (data.caseId || 'unknown') +
      ' marked ready for Super CRM DocuSeal issuance by ' + (data.staffEmail || 'staff') + '.');
    if (typeof MongoLogger !== 'undefined' && MongoLogger.logActivity) {
      MongoLogger.logActivity('ready_for_issuance', data.caseId || 'unknown');
    }
    return { success: true, caseId: data.caseId, packetIssued: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleClipboardSearchArrestLeads(data) {
  var lookup = handleClipboardLookupDefendant({ query: data.query || data.name || '' });
  return {
    success: lookup.success,
    leads: lookup.results || [],
    count: lookup.count || 0,
    error: lookup.error
  };
}

function handleClipboardSendBlueBubblesRelay(data) {
  try {
    _clipboardSlack_('#ops', 'BlueBubbles relay requested for ' + (data.to || 'unknown') +
      ' — GAS does not send signing links. Staff follow-up required if the office tunnel is down.');
    return { success: false, error: 'BlueBubbles tunnel unavailable from factory', queued: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleClipboardNotifySigningCompleted(data) {
  try {
    _clipboardSlack_('#intake-alerts', '✅ DocuSeal completion reported for case ' +
      (data.caseId || 'unknown') + ' role ' + (data.role || '') + '. Verify in Super CRM.');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleClipboardUpdateCaseFactsFromStaff(data) {
  try {
    if (typeof MongoLogger !== 'undefined' && MongoLogger.logActivity) {
      MongoLogger.logActivity('staff_case_facts_update', data.caseId || 'unknown');
    }
    return { success: true, caseId: data.caseId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleClipboardNotifyStaffPacketPending(data) {
  try {
    _clipboardSlack_('#leads', '📋 Client intake ' + (data.caseId || 'unknown') +
      ' is waiting for Super CRM DocuSeal issuance. Wix did not create a packet.');
    return { success: true, packetIssued: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function _clipboardSlack_(channel, text) {
  try {
    if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
      NotificationService.sendSlack(channel, text);
      return;
    }
    if (typeof sendSlackMessage === 'function') {
      sendSlackMessage(channel, text);
    }
  } catch (e) {
    console.warn('Clipboard Slack notify failed: ' + e.message);
  }
}
