/**
 * Statewide county hub (/florida-bail-bonds).
 * Appends one crawlable /florida-bail-bonds/{county} anchor for all 67
 * counties onto the body rich text already on this page. SWFL leads that
 * list. The Editor H1 is left as authored.
 */
import {
    appendHubCountyDirectory,
    buildHubCountyDirectoryHtml,
    HUB_COUNTY_DIRECTORY_ELEMENT_ID
} from 'public/floridaCountyDirectory';

$w.onReady(function () {
    let directory = '';
    try {
        directory = buildHubCountyDirectoryHtml();
    } catch (e) {
        console.warn('[County Hub] directory html failed', e);
        return;
    }
    if (!paintHubDirectory(directory)) {
        console.warn('[County Hub] ' + HUB_COUNTY_DIRECTORY_ELEMENT_ID + ' has no html');
    }
});

/**
 * #comp-mumy2zct is the existing WRichText. $w('#comp-…') is often a
 * Thunderbolt stub without .html, so the Text collection is matched by id
 * first. The direct selector is only used when .html is already a string.
 */
function paintHubDirectory(directory) {
    const targetId = HUB_COUNTY_DIRECTORY_ELEMENT_ID.replace(/^#/, '');
    let painted = false;
    const apply = function (el) {
        if (!el || el.id !== targetId || typeof el.html !== 'string') return;
        el.html = appendHubCountyDirectory(el.html, directory);
        if (typeof el.expand === 'function') el.expand();
        painted = true;
    };
    try {
        const texts = $w('Text');
        const list = texts && typeof texts.forEach === 'function'
            ? texts
            : (texts && typeof texts.html === 'string' ? [texts] : []);
        if (typeof list.forEach === 'function') {
            list.forEach(function (el) {
                try { apply(el); } catch (e) { /* skip */ }
            });
        }
    } catch (e) { /* Text selector unavailable */ }
    if (painted) return true;
    try {
        apply($w(HUB_COUNTY_DIRECTORY_ELEMENT_ID));
    } catch (e) { /* direct comp id is a stub on Thunderbolt */ }
    return painted;
}
