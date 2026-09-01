/**
 * Shannon_Helpers.js
 *
 * Pure helpers for Shannon voice tools. No SpreadsheetApp / UrlFetchApp.
 * GAS loads this globally; Node tests eval it in a sandbox.
 */

var SHANNON_OFFICE_ADDRESS = '1528 Broadway, Fort Myers, FL 33901';
var SHANNON_OFFICE_NAP = '239-332-2245';
var SHANNON_DEFAULT_PAYMENT_LINK =
    'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';
var SHANNON_SHEET_SCAN_CAP = 1500;
var SHANNON_MAX_SMS = 1500;
var SHANNON_MAX_NOTE = 300;

function shannonCountyAliasMap_() {
    return {
        dade: 'miami-dade',
        miami: 'miami-dade',
        miamidade: 'miami-dade',
        miamidadecounty: 'miami-dade',
        stjohns: 'st. johns',
        saintjohns: 'st. johns',
        stlucie: 'st. lucie',
        saintlucie: 'st. lucie',
        indianriver: 'indian river',
        santarosa: 'santa rosa',
        palmbeach: 'palm beach',
        westpalm: 'palm beach',
        westpalmbeach: 'palm beach',
        wpb: 'palm beach',
        ftmyers: 'lee',
        fortmyers: 'lee',
        capecoral: 'lee',
        lehigh: 'lee',
        lehighacres: 'lee',
        ortiz: 'lee',
        corefacility: 'lee',
        naples: 'collier',
        immokalee: 'collier',
        marco: 'collier',
        marcoisland: 'collier',
        puntagorda: 'charlotte',
        portcharlotte: 'charlotte',
        labelle: 'hendry',
        clewiston: 'hendry',
        jacksonville: 'duval',
        jax: 'duval',
        tampa: 'hillsborough',
        orlando: 'orange',
        clearwater: 'pinellas',
        stpete: 'pinellas',
        stpetersburg: 'pinellas',
        bradenton: 'manatee',
        venice: 'sarasota',
        gainesville: 'alachua',
        tallahassee: 'leon',
        pensacola: 'escambia',
        daytona: 'volusia',
        daytonabeach: 'volusia',
        keywest: 'monroe',
        keys: 'monroe',
        browardcounty: 'broward',
        ftl: 'broward',
        fortlauderdale: 'broward'
    };
}

function shannonFirstAppearanceFor_(key, entry) {
    var known = {
        lee: 'First Appearance is daily at 9 AM at the Lee County Justice Center, 1700 Monroe Street, Fort Myers.',
        charlotte: 'First Appearance is typically at 1:30 PM at the Charlotte County Justice Center in Punta Gorda.',
        collier: 'First Appearance is typically weekday mornings at the Collier County Courthouse, 3315 Tamiami Trail East, Naples.',
        hendry: 'First Appearance is typically weekday mornings at the Hendry County Courthouse in LaBelle. Confirm the time with the jail.',
        glades: 'First Appearance is typically at the Glades County Courthouse in Moore Haven. Detainees are often housed in Hendry or Okeechobee.',
        sarasota: 'First Appearance is typically weekday mornings at the Sarasota County Courthouse. Confirm the time with the jail.',
        broward: 'First Appearance is held twice daily in Broward County. Confirm the exact session with the jail.',
        hillsborough: 'First Appearance is typically weekday mornings at the Hillsborough County Courthouse in Tampa.',
        orange: 'First Appearance is typically weekday mornings at the Orange County Courthouse in Orlando.',
        pinellas: 'First Appearance is typically weekday mornings. Confirm the time with Pinellas County Jail.',
        'miami-dade': 'First Appearance is typically held daily in Miami-Dade. Confirm the session with the jail.',
        'palm beach': 'First Appearance is typically weekday mornings at the Palm Beach County Courthouse in West Palm Beach.'
    };
    if (known[key]) return known[key];
    if (entry && entry.tips && /first appearance/i.test(String(entry.tips))) {
        return String(entry.tips);
    }
    return 'Florida law requires First Appearance within 24 hours of arrest. Confirm the exact time with the jail or clerk. Our office is 239-332-2245.';
}

function shannonCountySlug_(key) {
    return String(key || '')
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

function shannonAlphaKey_(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function shannonNormalizeCountyQuery_(raw) {
    var s = String(raw || '').toLowerCase().trim();
    if (!s) return '';
    s = s.replace(/['']/g, '');
    s = s.replace(/\b(the|jail|courthouse|county jail|sheriff|office|facility|detention|center|core)\b/g, ' ');
    s = s.replace(/ county$/i, '');
    s = s.replace(/^county of /i, '');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
}

function shannonAttachCountyExtras_(key, entry) {
    if (!entry) return null;
    var copy = {};
    for (var k in entry) {
        if (Object.prototype.hasOwnProperty.call(entry, k)) copy[k] = entry[k];
    }
    copy.key = key;
    copy.first_appearance = shannonFirstAppearanceFor_(key, entry);
    copy.first_appearance_url = 'https://www.shamrockbailbonds.biz/first-appearance/' +
        shannonCountySlug_(key);
    return copy;
}

/**
 * Resolve a spoken county / city / jail nickname to a directory entry.
 * @param {string} rawCounty
 * @param {object=} dirOpt  optional directory (tests). Defaults to getCountyDirectory_().
 * @returns {object|null}
 */
function resolveCountyDirectoryEntry_(rawCounty, dirOpt) {
    if (!rawCounty) return null;
    var dir = dirOpt;
    if (!dir && typeof getCountyDirectory_ === 'function') dir = getCountyDirectory_();
    if (!dir) return null;

    var raw = String(rawCounty).toLowerCase().trim();
    if (dir[raw]) return shannonAttachCountyExtras_(raw, dir[raw]);

    var clean = shannonNormalizeCountyQuery_(raw);
    if (dir[clean]) return shannonAttachCountyExtras_(clean, dir[clean]);

    var aliases = shannonCountyAliasMap_();
    var alpha = shannonAlphaKey_(clean);
    if (aliases[alpha] && dir[aliases[alpha]]) {
        return shannonAttachCountyExtras_(aliases[alpha], dir[aliases[alpha]]);
    }

    var saintFlip = alpha.replace(/^saint/, 'st');
    if (aliases[saintFlip] && dir[aliases[saintFlip]]) {
        return shannonAttachCountyExtras_(aliases[saintFlip], dir[aliases[saintFlip]]);
    }

    var exactAlphaHits = [];
    for (var k in dir) {
        if (!Object.prototype.hasOwnProperty.call(dir, k)) continue;
        var kAlpha = shannonAlphaKey_(k);
        if (kAlpha === alpha || kAlpha === saintFlip || kAlpha.replace(/^saint/, 'st') === alpha) {
            exactAlphaHits.push(k);
        }
    }
    if (exactAlphaHits.length === 1) {
        return shannonAttachCountyExtras_(exactAlphaHits[0], dir[exactAlphaHits[0]]);
    }

    var keysByLength = [];
    for (var dk in dir) {
        if (Object.prototype.hasOwnProperty.call(dir, dk)) keysByLength.push(dk);
    }
    keysByLength.sort(function (a, b) {
        return shannonAlphaKey_(b).length - shannonAlphaKey_(a).length;
    });

    var contained = [];
    for (var i = 0; i < keysByLength.length; i++) {
        var key = keysByLength[i];
        var keyAlpha = shannonAlphaKey_(key);
        if (keyAlpha.length < 3) continue;
        // Query contains the full county key ("lee county jail" -> lee).
        if (alpha.indexOf(keyAlpha) > -1) contained.push(key);
    }
    // Prefer unique longest contained key (lee inside "leecountyjail").
    if (contained.length) {
        var longest = shannonAlphaKey_(contained[0]).length;
        var top = contained.filter(function (c) {
            return shannonAlphaKey_(c).length === longest;
        });
        var unique = [];
        top.forEach(function (c) {
            if (unique.indexOf(c) === -1) unique.push(c);
        });
        if (unique.length === 1) {
            return shannonAttachCountyExtras_(unique[0], dir[unique[0]]);
        }
    }

    var tokens = clean.split(/[\s,\/-]+/).filter(function (t) { return t.length >= 3; });
    var tokenHits = [];
    tokens.forEach(function (tok) {
        var tAlpha = shannonAlphaKey_(tok);
        if (aliases[tAlpha] && dir[aliases[tAlpha]]) {
            tokenHits.push(aliases[tAlpha]);
            return;
        }
        if (dir[tok]) tokenHits.push(tok);
    });
    var uniqTokens = [];
    tokenHits.forEach(function (h) {
        if (uniqTokens.indexOf(h) === -1) uniqTokens.push(h);
    });
    if (uniqTokens.length === 1) {
        return shannonAttachCountyExtras_(uniqTokens[0], dir[uniqTokens[0]]);
    }

    return null;
}

function shannonCanonicalCountyKey_(rawCounty, dirOpt) {
    var entry = resolveCountyDirectoryEntry_(rawCounty, dirOpt);
    return entry && entry.key ? entry.key : '';
}

function shannonNameTokens_(name) {
    var s = String(name || '').toLowerCase().trim();
    if (!s) return [];
    if (s.indexOf(',') > -1) {
        var parts = s.split(',');
        s = ((parts[1] || '') + ' ' + (parts[0] || '')).trim();
    }
    return s
        .replace(/[^a-z\s'-]/g, ' ')
        .replace(/['-]/g, '')
        .split(/\s+/)
        .filter(function (t) {
            return t.length >= 2 && ['jr', 'sr', 'ii', 'iii', 'iv', 'the'].indexOf(t) === -1;
        });
}

/**
 * First+last token match. Rejects single-token queries ("John") and
 * substring traps ("John" vs "Johnson" as a last name).
 */
function shannonPersonNamesMatch_(query, record) {
    var q = shannonNameTokens_(query);
    var r = shannonNameTokens_(record);
    if (q.length < 2 || r.length < 2) return false;
    var qLast = q[q.length - 1];
    var rLast = r[r.length - 1];
    if (qLast !== rLast) return false;
    var qFirst = q[0];
    var rFirst = r[0];
    if (qFirst === rFirst) return true;
    if (qFirst.length >= 3 && rFirst.indexOf(qFirst) === 0) return true;
    if (rFirst.length >= 3 && qFirst.indexOf(rFirst) === 0) return true;
    return false;
}

function shannonCaseNumbersMatch_(query, record) {
    var q = String(query || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    var r = String(record || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (q.length < 4 || r.length < 4) return false;
    return q === r || (q.length >= 6 && r.indexOf(q) > -1) || (r.length >= 6 && q.indexOf(r) > -1);
}

function shannonFindHeaderIndex_(headers, aliases) {
    var hdr = (headers || []).map(function (h) { return String(h).toLowerCase().trim(); });
    var list = aliases || [];
    var i;
    for (i = 0; i < list.length; i++) {
        var exact = hdr.indexOf(String(list[i]).toLowerCase().trim());
        if (exact > -1) return exact;
    }
    for (i = 0; i < hdr.length; i++) {
        for (var k = 0; k < list.length; k++) {
            var alias = String(list[k]).toLowerCase().trim();
            // Short aliases ("time", "date") must be exact — otherwise
            // "timestamp" matches "time".
            if (!alias || alias.length < 5) continue;
            if (hdr[i] && hdr[i].indexOf(alias) > -1) return i;
        }
    }
    return -1;
}

function shannonParseMoney_(value) {
    var n = parseFloat(String(value == null ? '' : value).replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : 0;
}

function shannonParseChargeCount_(value) {
    var n = parseInt(String(value == null ? '' : value).replace(/[^0-9]/g, ''), 10);
    if (!isFinite(n) || n < 1) return 1;
    if (n > 50) return 50;
    return n;
}

function shannonNormalizePhone10_(value) {
    var d = String(value || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    if (d.length !== 10) return '';
    if (d === '7272952245') return '';
    if (!/^[2-9]/.test(d)) return '';
    return d;
}

function shannonE164_(value) {
    var d = shannonNormalizePhone10_(value);
    return d ? '+1' + d : '';
}

function shannonTruncate_(value, maxLen) {
    var s = String(value || '').trim();
    var cap = maxLen || SHANNON_MAX_NOTE;
    if (s.length <= cap) return s;
    return s.substring(0, cap);
}

function shannonSheetScanStart_(rowCount) {
    var n = parseInt(rowCount, 10) || 0;
    if (n <= 1) return 1;
    return Math.max(1, n - SHANNON_SHEET_SCAN_CAP);
}

function shannonWeekdayOffset_(label, fromDay) {
    var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var idx = days.indexOf(String(label || '').toLowerCase());
    if (idx < 0) return null;
    var delta = (idx - fromDay + 7) % 7;
    if (delta === 0) delta = 7;
    return delta;
}

/**
 * Parse a spoken office-visit date/time in America/New_York wall time.
 * Returns { parsed, start, end, label } — start/end are Date or null.
 */
function shannonParseOfficeVisitWhen_(dateStr, timeStr, now) {
    now = now instanceof Date ? now : new Date();
    var rawDate = String(dateStr || '').toLowerCase().trim();
    var rawTime = String(timeStr || '').toLowerCase().trim();
    var labelDate = rawDate || 'today';
    var labelTime = rawTime || 'as soon as possible';
    var label = (labelDate + ' at ' + labelTime).replace(/\s+/g, ' ').trim();

    var start = new Date(now.getTime());
    start.setSeconds(0, 0);
    var parsedDate = false;
    var parsedTime = false;

    if (!rawDate || rawDate === 'today' || rawDate === 'asap' || rawDate === 'as soon as possible') {
        parsedDate = true;
    } else if (rawDate === 'tomorrow') {
        start.setDate(start.getDate() + 1);
        parsedDate = true;
    } else {
        var wd = shannonWeekdayOffset_(rawDate.replace(/next\s+/, ''), start.getDay());
        if (wd != null) {
            start.setDate(start.getDate() + wd);
            parsedDate = true;
        } else {
            var mdy = rawDate.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
            if (mdy) {
                var month = parseInt(mdy[1], 10) - 1;
                var day = parseInt(mdy[2], 10);
                var year = mdy[3] ? parseInt(mdy[3], 10) : start.getFullYear();
                if (year < 100) year += 2000;
                start.setFullYear(year, month, day);
                parsedDate = isFinite(start.getTime());
            }
        }
    }

    var hour = 10;
    var minute = 0;
    if (!rawTime || /asap|as soon as possible|whenever|soon/.test(rawTime)) {
        parsedTime = false;
    } else if (/morning/.test(rawTime)) {
        hour = 10; parsedTime = true;
    } else if (/afternoon/.test(rawTime)) {
        hour = 14; parsedTime = true;
    } else if (/evening|night/.test(rawTime)) {
        hour = 17; parsedTime = true;
    } else if (/noon/.test(rawTime)) {
        hour = 12; parsedTime = true;
    } else {
        var tm = rawTime.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/);
        if (tm) {
            hour = parseInt(tm[1], 10);
            minute = tm[2] ? parseInt(tm[2], 10) : 0;
            var mer = (tm[3] || '').replace(/\./g, '');
            if (mer === 'pm' && hour < 12) hour += 12;
            if (mer === 'am' && hour === 12) hour = 0;
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) parsedTime = true;
        }
    }

    if (parsedTime) {
        start.setHours(hour, minute, 0, 0);
    } else {
        start.setHours(10, 0, 0, 0);
    }

    if (start.getTime() < now.getTime() - 60000 && parsedDate && parsedTime) {
        // If they said "today at 2pm" and it is already 3pm, roll to tomorrow.
        if (!rawDate || rawDate === 'today') {
            start.setDate(start.getDate() + 1);
        }
    }

    var end = new Date(start.getTime() + 60 * 60 * 1000);
    var parsed = parsedDate && parsedTime;
    return {
        parsed: parsed,
        start: parsed ? start : null,
        end: parsed ? end : null,
        label: label
    };
}

function shannonBuildAccountSpoken_(found, account, queryType, requestedName) {
    account = account || {};
    queryType = String(queryType || 'all').toLowerCase();
    if (!found) {
        return 'I could not find a matching Shamrock file with that name or number. ' +
            'I can take the details and have a bondsman pull the clerk docket, ' +
            'or you can reach the office at 239-332-2245.';
    }

    var parts = [];
    var wantAll = queryType === 'all' || !queryType;
    var wantCourt = wantAll || queryType === 'court_date' || queryType === 'court';
    var wantBalance = wantAll || queryType === 'balance' || queryType === 'payment';
    var wantDischarge = wantAll || queryType === 'discharge_status' || queryType === 'discharge';

    if (wantDischarge && account.discharge_status === 'Discharged') {
        parts.push(
            'The bond file for ' + (account.defendant_name || requestedName || 'this case') +
            ' shows as officially discharged' +
            (account.discharge_date ? ' on ' + account.discharge_date : '') +
            '. There are no further court appearances needed for this bond.'
        );
    } else if (wantCourt && account.court_date) {
        parts.push(
            'I found the court appearance record for ' +
            (account.defendant_name || requestedName || 'the defendant') +
            '. The upcoming court date is ' + account.court_date +
            (account.court_time ? ' at ' + account.court_time : '') +
            ' at ' + (account.court_location || 'the courthouse') +
            (account.courtroom ? ', Courtroom ' + account.courtroom : '') +
            (account.judge ? ', before Judge ' + account.judge : '') + '.'
        );
    }

    if (wantBalance && account.remaining_balance) {
        var bal = shannonParseMoney_(account.remaining_balance);
        if (bal > 0) {
            parts.push(
                'The remaining balance on the premium is $' + account.remaining_balance +
                '. Would you like me to text a secure payment link to your phone?'
            );
        } else if (String(account.remaining_balance).replace(/[^0-9.]/g, '') !== '') {
            parts.push('The premium balance is paid in full.');
        }
    }

    if (!parts.length) {
        parts.push(
            'I found a Shamrock file for ' +
            (account.defendant_name || requestedName || 'that name') +
            ', but I do not have the specific detail you asked for on the sheet. ' +
            'A bondsman can pull the clerk docket at 239-332-2245.'
        );
    }
    return parts.join(' ');
}

function shannonRedactDefendantForVoice_(match, callerPhone) {
    if (!match) return null;
    var out = {
        defendant_name: match.defendant_name || '',
        charges: match.charges || '',
        bond_amount: match.bond_amount || '',
        facility: match.facility || '',
        status: match.status || '',
        case_number: match.case_number || '',
        court_date: match.court_date || '',
        county: match.county || '',
        is_prior_client: !!match.is_prior_client
    };
    var caller = shannonNormalizePhone10_(callerPhone);
    var indPhone = shannonNormalizePhone10_(match.indemnitor_phone);
    if (caller && indPhone && caller === indPhone) {
        out.indemnitor_name = match.indemnitor_name || '';
        out.indemnitor_phone = match.indemnitor_phone || '';
    }
    return out;
}

function shannonUnwrapToolPayload_(payload) {
    if (!payload || typeof payload !== 'object') return {};
    if (Array.isArray(payload)) return shannonUnwrapToolPayload_(payload[0] || {});
    if (payload.parameters && typeof payload.parameters === 'object' && !Array.isArray(payload.parameters)) {
        return payload.parameters;
    }
    if (payload.tool_parameters && typeof payload.tool_parameters === 'object') {
        return payload.tool_parameters;
    }
    if (payload.args && typeof payload.args === 'object') {
        return payload.args;
    }
    return payload;
}

function shannonSafeToolMessage_() {
    return 'I am having trouble accessing that right now. You can reach our office at 239-332-2245.';
}

function shannonPaymentLinkFromConfig_(config) {
    if (config && config.PAYMENT_LINK) return String(config.PAYMENT_LINK);
    return SHANNON_DEFAULT_PAYMENT_LINK;
}

function shannonCountyCount_(dir) {
    var n = 0;
    for (var k in dir) {
        if (Object.prototype.hasOwnProperty.call(dir, k)) n++;
    }
    return n;
}
