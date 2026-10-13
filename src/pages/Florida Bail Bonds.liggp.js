/**
 * Statewide county hub (/florida-bail-bonds).
 * Renders a crawlable anchor for every Florida county. The router prefix
 * /florida-bail-bonds/{county} is a different page (Florida Counties).
 */
import { buildFloridaCountyDirectoryHtml, COUNTY_DIRECTORY_ELEMENT_IDS } from 'public/floridaCountyDirectory';

$w.onReady(function () {
    let html = '';
    try {
        html = buildFloridaCountyDirectoryHtml();
    } catch (e) {
        console.warn('[County Hub] directory html failed', e);
        return;
    }
    COUNTY_DIRECTORY_ELEMENT_IDS.forEach(function (id) {
        try {
            const el = $w(id);
            if (!el || typeof el.html !== 'string') return;
            el.html = html;
            if (typeof el.expand === 'function') el.expand();
        } catch (e) { /* element not on this canvas */ }
    });
});
