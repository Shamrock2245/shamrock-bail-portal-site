#!/usr/bin/env node
/**
 * Local checks for Shannon_Helpers.js plus getCountyDirectory_ from the webhook.
 * No live GAS / ElevenLabs / SMS calls.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const helpersSrc = fs.readFileSync(path.join(ROOT, 'backend-gas/Shannon_Helpers.js'), 'utf8');
const webhookSrc = fs.readFileSync(path.join(ROOT, 'backend-gas/ElevenLabs_WebhookHandler.js'), 'utf8');

function extractNamedFunction(src, name) {
    const start = src.indexOf('function ' + name + '(');
    if (start < 0) throw new Error('Missing function ' + name);
    let i = src.indexOf('{', start);
    let depth = 0;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') {
            depth--;
            if (depth === 0) return src.slice(start, i + 1);
        }
    }
    throw new Error('Unclosed function ' + name);
}

const ctx = {};
vm.createContext(ctx);
vm.runInContext(
    helpersSrc + '\n' + extractNamedFunction(webhookSrc, 'getCountyDirectory_'),
    ctx
);

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

const FL67 = [
    'alachua', 'baker', 'bay', 'bradford', 'brevard', 'broward', 'calhoun', 'charlotte',
    'citrus', 'clay', 'collier', 'columbia', 'desoto', 'dixie', 'duval', 'escambia',
    'flagler', 'franklin', 'gadsden', 'gilchrist', 'glades', 'gulf', 'hamilton', 'hardee',
    'hendry', 'hernando', 'highlands', 'hillsborough', 'holmes', 'indian river', 'jackson',
    'jefferson', 'lafayette', 'lake', 'lee', 'leon', 'levy', 'liberty', 'madison',
    'manatee', 'marion', 'martin', 'miami-dade', 'monroe', 'nassau', 'okaloosa',
    'okeechobee', 'orange', 'osceola', 'palm beach', 'pasco', 'pinellas', 'polk',
    'putnam', 'santa rosa', 'sarasota', 'seminole', 'st. johns', 'st. lucie', 'sumter',
    'suwannee', 'taylor', 'union', 'volusia', 'wakulla', 'walton', 'washington'
];

const dir = ctx.getCountyDirectory_();
assert(ctx.shannonCountyCount_(dir) === 67, 'directory must have 67 counties, got ' + ctx.shannonCountyCount_(dir));
FL67.forEach((key) => {
    assert(dir[key], 'missing county key: ' + key);
    const entry = ctx.resolveCountyDirectoryEntry_(key, dir);
    assert(entry && entry.name, 'resolver missed exact key ' + key);
    assert(entry.first_appearance, 'missing first_appearance for ' + key);
    assert(entry.first_appearance_url.indexOf('/first-appearance/') > -1, 'missing FA url for ' + key);
});

const aliasCases = {
    'Lee County': 'lee',
    'lee county jail': 'lee',
    'Fort Myers': 'lee',
    'Cape Coral': 'lee',
    'Ortiz': 'lee',
    'Naples': 'collier',
    'Punta Gorda': 'charlotte',
    'Miami': 'miami-dade',
    'Dade': 'miami-dade',
    'Saint Johns': 'st. johns',
    'St Johns County': 'st. johns',
    'Saint Lucie': 'st. lucie',
    'Palm Beach County': 'palm beach',
    'West Palm': 'palm beach',
    'Indian River': 'indian river',
    'Jacksonville': 'duval',
    'Tampa': 'hillsborough',
    'Orlando': 'orange'
};
Object.keys(aliasCases).forEach((spoken) => {
    const entry = ctx.resolveCountyDirectoryEntry_(spoken, dir);
    assert(entry && entry.key === aliasCases[spoken],
        'alias "' + spoken + '" expected ' + aliasCases[spoken] + ' got ' + (entry && entry.key));
});

assert(ctx.resolveCountyDirectoryEntry_('', dir) == null, 'empty county must be null');
assert(ctx.resolveCountyDirectoryEntry_('Narnia', dir) == null, 'unknown county must be null');

assert(ctx.shannonPersonNamesMatch_('Lauren Jo Fischer', 'Lauren Jo Fischer'), 'full name should match');
assert(ctx.shannonPersonNamesMatch_('Fischer, Lauren Jo', 'Lauren Fischer'), 'comma last-first should match');
assert(!ctx.shannonPersonNamesMatch_('John', 'John Smith'), 'single token must not match');
assert(!ctx.shannonPersonNamesMatch_('John', 'Johnson'), 'John must not match Johnson');
assert(!ctx.shannonPersonNamesMatch_('Mary Smith', 'Maria Smith'), 'Mary must not match Maria');
assert(ctx.shannonPersonNamesMatch_('Jon Smith', 'Jonathan Smith'), 'Jon prefix of Jonathan');

assert(!ctx.shannonCaseNumbersMatch_('1', '123456'), 'tiny case numbers must not match');
assert(ctx.shannonCaseNumbersMatch_('25-001234', '25001234'), 'normalized case numbers should match');

const spokenMissing = ctx.shannonBuildAccountSpoken_(false, {}, 'all', 'Jane Doe');
assert(spokenMissing.indexOf('could not find') > -1, 'not_found must say could not find');
assert(!/bond is currently active/i.test(spokenMissing), 'not_found must not claim active bond');

const spokenFound = ctx.shannonBuildAccountSpoken_(true, {
    defendant_name: 'Jane Doe',
    court_date: 'September 4',
    court_time: '9:00 AM',
    court_location: 'Lee County Justice Center',
    remaining_balance: '250'
}, 'all', 'Jane Doe');
assert(spokenFound.indexOf('September 4') > -1, 'found court date should be spoken');
assert(spokenFound.indexOf('250') > -1, 'found balance should be spoken');

const money = ctx.shannonParseMoney_('$5,000');
assert(money === 5000, 'money parse $5,000, got ' + money);
assert(ctx.shannonParseChargeCount_('2 charges') === 2, 'charge count parse');
assert(ctx.shannonNormalizePhone10_('+1 (239) 332-2245') === '2393322245', 'phone normalize');
assert(ctx.shannonE164_('(239) 332-2245') === '+12393322245', 'e164');
assert(ctx.shannonNormalizePhone10_('727-295-2245') === '', 'never keep Shannon public 727');
assert(ctx.shannonE164_('727-295-2245') === '', 'never e164 Shannon public 727');
assert(ctx.shannonNormalizePhone10_('555') === '', 'short phone rejected');

const now = new Date('2026-09-01T15:00:00');
const parsed = ctx.shannonParseOfficeVisitWhen_('tomorrow', '2:00 PM', now);
assert(parsed.parsed === true, 'tomorrow 2pm should parse');
assert(parsed.start && typeof parsed.start.getHours === 'function', 'parsed start is Date');
assert(parsed.start.getHours() === 14, '2pm -> hour 14, got ' + parsed.start.getHours());

const asap = ctx.shannonParseOfficeVisitWhen_('today', 'as soon as possible', now);
assert(asap.parsed === false, 'ASAP must not fake a locked time');
assert(asap.start == null, 'ASAP start must be null');

const unwrapped = ctx.shannonUnwrapToolPayload_({ parameters: { county: 'Lee' } });
assert(unwrapped.county === 'Lee', 'unwrap nested parameters');

const redacted = ctx.shannonRedactDefendantForVoice_({
    defendant_name: 'Jane Doe',
    indemnitor_name: 'Secret Person',
    indemnitor_phone: '2395550100',
    bond_amount: '5000'
}, '2393322245');
assert(redacted.defendant_name === 'Jane Doe', 'keep defendant name');
assert(!redacted.indemnitor_phone, 'do not leak indemnitor phone to unmatched caller');
assert(!redacted.indemnitor_name, 'do not leak indemnitor name to unmatched caller');

const matchedCaller = ctx.shannonRedactDefendantForVoice_({
    defendant_name: 'Jane Doe',
    indemnitor_name: 'Secret Person',
    indemnitor_phone: '2395550100'
}, '2395550100');
assert(matchedCaller.indemnitor_phone === '2395550100', 'same caller may see own phone');

const timeCol = ctx.shannonFindHeaderIndex_(['Timestamp', 'Court Time', 'Date'], ['court time', 'time']);
assert(timeCol === 1, 'court time header, not timestamp, got ' + timeCol);

assert(
    webhookSrc.indexOf('function resolveCountyDirectoryEntry_') === -1,
    'resolver must live only in Shannon_Helpers.js'
);
assert(
    webhookSrc.indexOf('I pulled up the file') === -1,
    'false-active spoken fallback must be gone'
);
assert(
    webhookSrc.indexOf('cal.createEvent(title, new Date(), new Date(Date.now() + 3600000)') === -1,
    'office visit must not create a now+1h calendar event'
);

console.log('ok');
