#!/usr/bin/env node
/**
 * Studio pages must not call $w('#id') unless that call is inside a try
 * in the same function. $w throws when the id is not on the canvas, and a
 * try around an outer caller does not catch a throw inside a callback.
 *
 * Also locks the indemnitor embed casing: Studio's id is #IndemnitorDashEmbed,
 * with #indemnitorDashEmbed only as a fallback.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(full, out);
        else if (ent.name.endsWith('.js')) out.push(full);
    }
    return out;
}

export function scanUnguarded(src) {
    const hits = [];
    let i = 0;
    let line = 1;
    let brace = 0;
    let func = 0;
    const funcStack = [];
    const tryStack = [];
    let pendingFn = false;

    function skipSpace(from) {
        let k = from;
        while (k < src.length && /\s/.test(src[k])) k++;
        return k;
    }

    while (i < src.length) {
        const c = src[i];
        const n = src[i + 1];
        if (c === '\n') { line++; i++; continue; }
        if (c === '/' && n === '/') {
            while (i < src.length && src[i] !== '\n') i++;
            continue;
        }
        if (c === '/' && n === '*') {
            i += 2;
            while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
                if (src[i] === '\n') line++;
                i++;
            }
            i += 2;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            const q = c;
            i++;
            while (i < src.length) {
                if (src[i] === '\\') { i += 2; continue; }
                if (src[i] === '\n') line++;
                if (src[i] === q) { i++; break; }
                if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
                    i += 2;
                    let d = 1;
                    while (i < src.length && d > 0) {
                        if (src[i] === '\n') line++;
                        if (src[i] === '{') d++;
                        else if (src[i] === '}') d--;
                        i++;
                    }
                    continue;
                }
                i++;
            }
            continue;
        }
        if (c === '{') {
            brace++;
            if (pendingFn) {
                func++;
                funcStack.push(brace);
                pendingFn = false;
            }
            i++;
            continue;
        }
        if (c === '}') {
            if (funcStack.length && brace === funcStack[funcStack.length - 1]) {
                funcStack.pop();
                func--;
            }
            brace--;
            while (tryStack.length && brace < tryStack[tryStack.length - 1].brace) tryStack.pop();
            i++;
            continue;
        }
        if (src.startsWith('function', i) && (i === 0 || !/[\w$]/.test(src[i - 1])) && !/[\w$]/.test(src[i + 8] || '')) {
            pendingFn = true;
            i += 8;
            continue;
        }
        if (c === '=' && n === '>') {
            i += 2;
            const k = skipSpace(i);
            if (src[k] === '{') pendingFn = true;
            continue;
        }
        if (src.startsWith('try', i) && (i === 0 || !/[\w$]/.test(src[i - 1])) && !/[\w$]/.test(src[i + 3] || '')) {
            const k = skipSpace(i + 3);
            if (src[k] === '{') tryStack.push({ brace: brace + 1, func });
            i += 3;
            continue;
        }
        const calls = ['$w(', '$item(', 'this._$w('];
        let matched = null;
        for (const name of calls) {
            if (src.startsWith(name, i) && (i === 0 || !/[\w$]/.test(src[i - 1]))) {
                matched = name;
                break;
            }
        }
        if (matched) {
            const startLine = line;
            let j = i + matched.length;
            let arg = '';
            let depth = 1;
            let inStr = null;
            while (j < src.length && depth > 0) {
                const ch = src[j];
                if (inStr) {
                    if (ch === '\\') { arg += src.slice(j, j + 2); j += 2; continue; }
                    if (ch === inStr) inStr = null;
                    if (ch === '\n') line++;
                    arg += ch;
                    j++;
                    continue;
                }
                if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; arg += ch; j++; continue; }
                if (ch === '(') depth++;
                else if (ch === ')') { depth--; if (depth === 0) break; }
                if (ch === '\n') line++;
                arg += ch;
                j++;
            }
            const trimmed = arg.trim().split(',')[0].trim();
            const literal = trimmed.match(/^(['"])([^'"]*)\1$/);
            const typeSelector = literal && literal[2] && !literal[2].startsWith('#');
            const sameFnTry = tryStack.some((t) => t.func === func);
            if (!sameFnTry && !typeSelector) {
                hits.push({ line: startLine, call: matched + trimmed.slice(0, 80) + ')' });
            }
            i = j;
            continue;
        }
        i++;
    }
    return hits;
}

const files = walk(path.join(root, 'src/pages')).concat(walk(path.join(root, 'src/public')));

test('page and public code guard every $w / $item id lookup', () => {
    const failures = [];
    for (const file of files) {
        const src = fs.readFileSync(file, 'utf8');
        if (!src.includes('$w(') && !src.includes('$item(') && !src.includes('this._$w(')) continue;
        const hits = scanUnguarded(src);
        if (hits.length) {
            failures.push(path.relative(root, file) + '\n  ' + hits.map((h) => h.line + ' ' + h.call).join('\n  '));
        }
    }
    assert.equal(failures.join('\n\n'), '', 'unguarded element lookups');
});

test('indemnitor dashboard targets Studio #IndemnitorDashEmbed before the lowercase id', () => {
    const src = fs.readFileSync(path.join(root, 'src/pages/portal-indemnitor.k53on.js'), 'utf8');
    const capital = src.indexOf('#IndemnitorDashEmbed');
    const lower = src.indexOf('#indemnitorDashEmbed');
    assert.ok(capital > -1, 'missing #IndemnitorDashEmbed');
    assert.ok(lower > capital, 'lowercase id must be the fallback, after the Studio id');
});

test('defendant and indemnitor pages still reference every native dashboard id', () => {
    const defendant = fs.readFileSync(path.join(root, 'src/pages/portal-defendant.skg9y.js'), 'utf8');
    const indemnitor = fs.readFileSync(path.join(root, 'src/pages/portal-indemnitor.k53on.js'), 'utf8');
    const defendantIds = [
        '#defendantDashEmbed', '#defendantWizard', '#textUserWelcome', '#textCaseNumber',
        '#textBondAmount', '#textCaseStatus', '#textNextCourtDate', '#textCourtLocation',
        '#textCourtroom', '#textLastCheckIn', '#textBalanceDue', '#textPaymentStatus',
        '#bannerIncompletePaperwork', '#boxIntakeWizardFallback', '#boxAfterCareModules',
        '#textPaperworkBanner', '#btnContinuePaperwork', '#btnCheckIn', '#btnAddAnotherBond',
        '#btnMakePayment', '#btnViewDocuments', '#btnLogout', '#textDocumentsList'
    ];
    const indemnitorIds = [
        '#IndemnitorDashEmbed', '#indemnitorDashEmbed', '#indemnitorWizard', '#textUserWelcome',
        '#welcomeText', '#textDefendantName', '#defendantNameText', '#textCaseNumber',
        '#textTotalLiability', '#textDefendantStatus', '#defendantStatusText', '#textBalanceDue',
        '#balanceDueText', '#ppRemainingBalanceText', '#textMonthlyPayment', '#ppPaymentTermsText',
        '#textNextDueDate', '#ppNextDueDateText', '#lastCheckInText', '#nextCourtDateText',
        '#textTotalPremium', '#textDownPayment', '#textChargesCount', '#textPaymentStatus',
        '#bannerIncompletePaperwork', '#boxIntakeWizardFallback', '#boxAfterCareModules',
        '#textPaperworkBanner', '#btnContinuePaperwork', '#btnAddCoIndemnitor', '#btnUploadCollateral',
        '#btnPayInstallment', '#makePaymentBtn', '#callBtn', '#btnStartNewBond', '#btnViewDocuments',
        '#btnResumeBond', '#btnLogout', '#indemnitorLogoutBtn', '#textDocumentsList'
    ];
    for (const id of defendantIds) assert.ok(defendant.includes(id), 'defendant missing ' + id);
    for (const id of indemnitorIds) assert.ok(indemnitor.includes(id), 'indemnitor missing ' + id);
});
