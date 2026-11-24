/**
 * WCAG AA button fills (#007A51 behind white labels).
 *
 * Wix rewrites #comp-... selectors in global.css so they match nothing; the
 * rules in global.css target these custom classes instead. Each page adds the
 * class to its own green buttons by Studio nickname. Missing ids are no-ops.
 *
 * .btn-green-aa        Studio button: sets the fill/hover CSS vars
 * .btn-green-aa-solid  Stylable button that paints its own background
 */
export const AA_FILL_CLASS = 'btn-green-aa';
export const AA_SOLID_CLASS = 'btn-green-aa-solid';

/** Studio nicknames per page (ids never change). */
export const AA_BUTTONS = {
    home: { fill: ['#button2'], solid: ['#startBondButton'] },
    contact: { fill: ['#button5', '#button4'], solid: [] },
    howBailWorks: { fill: ['#button1', '#button4'], solid: [] },
    bailSchool: { fill: ['#button1', '#button4'], solid: [] },
    countyItem: { fill: ['#startOnlineBtn'], solid: [] }
};

function addClass($wFn, selector, className) {
    let node = null;
    try { node = $wFn(selector); } catch (e) { return false; }
    if (!node || !node.customClassList || typeof node.customClassList.add !== 'function') return false;
    try { node.customClassList.add(className); return true; } catch (e) { return false; }
}

/**
 * @param {Function} $wFn page $w
 * @param {{fill?: string[], solid?: string[]}} spec
 * @returns {number} how many buttons got a class
 */
export function applyAaButtonFill($wFn, spec) {
    if (typeof $wFn !== 'function' || !spec) return 0;
    let n = 0;
    (spec.fill || []).forEach((sel) => { if (addClass($wFn, sel, AA_FILL_CLASS)) n++; });
    (spec.solid || []).forEach((sel) => { if (addClass($wFn, sel, AA_SOLID_CLASS)) n++; });
    return n;
}
