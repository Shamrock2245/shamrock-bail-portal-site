/**
 * Crawlable county directory. Anchor hrefs, not dropdown values.
 * The hub appends these onto #comp-mumy2zct. County pages append the
 * alphabetical list onto about copy. The homepage keeps the same 67 slugs
 * in #countyDropdown only, so SWFL stays the visual priority there.
 */

export const FLORIDA_COUNTY_DIRECTORY = [
    { name: 'Alachua', slug: 'alachua' },
    { name: 'Baker', slug: 'baker' },
    { name: 'Bay', slug: 'bay' },
    { name: 'Bradford', slug: 'bradford' },
    { name: 'Brevard', slug: 'brevard' },
    { name: 'Broward', slug: 'broward' },
    { name: 'Calhoun', slug: 'calhoun' },
    { name: 'Charlotte', slug: 'charlotte' },
    { name: 'Citrus', slug: 'citrus' },
    { name: 'Clay', slug: 'clay' },
    { name: 'Collier', slug: 'collier' },
    { name: 'Columbia', slug: 'columbia' },
    { name: 'DeSoto', slug: 'desoto' },
    { name: 'Dixie', slug: 'dixie' },
    { name: 'Duval', slug: 'duval' },
    { name: 'Escambia', slug: 'escambia' },
    { name: 'Flagler', slug: 'flagler' },
    { name: 'Franklin', slug: 'franklin' },
    { name: 'Gadsden', slug: 'gadsden' },
    { name: 'Gilchrist', slug: 'gilchrist' },
    { name: 'Glades', slug: 'glades' },
    { name: 'Gulf', slug: 'gulf' },
    { name: 'Hamilton', slug: 'hamilton' },
    { name: 'Hardee', slug: 'hardee' },
    { name: 'Hendry', slug: 'hendry' },
    { name: 'Hernando', slug: 'hernando' },
    { name: 'Highlands', slug: 'highlands' },
    { name: 'Hillsborough', slug: 'hillsborough' },
    { name: 'Holmes', slug: 'holmes' },
    { name: 'Indian River', slug: 'indian-river' },
    { name: 'Jackson', slug: 'jackson' },
    { name: 'Jefferson', slug: 'jefferson' },
    { name: 'Lafayette', slug: 'lafayette' },
    { name: 'Lake', slug: 'lake' },
    { name: 'Lee', slug: 'lee' },
    { name: 'Leon', slug: 'leon' },
    { name: 'Levy', slug: 'levy' },
    { name: 'Liberty', slug: 'liberty' },
    { name: 'Madison', slug: 'madison' },
    { name: 'Manatee', slug: 'manatee' },
    { name: 'Marion', slug: 'marion' },
    { name: 'Martin', slug: 'martin' },
    { name: 'Miami-Dade', slug: 'miami-dade' },
    { name: 'Monroe', slug: 'monroe' },
    { name: 'Nassau', slug: 'nassau' },
    { name: 'Okaloosa', slug: 'okaloosa' },
    { name: 'Okeechobee', slug: 'okeechobee' },
    { name: 'Orange', slug: 'orange' },
    { name: 'Osceola', slug: 'osceola' },
    { name: 'Palm Beach', slug: 'palm-beach' },
    { name: 'Pasco', slug: 'pasco' },
    { name: 'Pinellas', slug: 'pinellas' },
    { name: 'Polk', slug: 'polk' },
    { name: 'Putnam', slug: 'putnam' },
    { name: 'Santa Rosa', slug: 'santa-rosa' },
    { name: 'Sarasota', slug: 'sarasota' },
    { name: 'Seminole', slug: 'seminole' },
    { name: 'St. Johns', slug: 'st-johns' },
    { name: 'St. Lucie', slug: 'st-lucie' },
    { name: 'Sumter', slug: 'sumter' },
    { name: 'Suwannee', slug: 'suwannee' },
    { name: 'Taylor', slug: 'taylor' },
    { name: 'Union', slug: 'union' },
    { name: 'Volusia', slug: 'volusia' },
    { name: 'Wakulla', slug: 'wakulla' },
    { name: 'Walton', slug: 'walton' },
    { name: 'Washington', slug: 'washington' }
];

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Southwest Florida first on the hub. Matches the homepage county dropdown. */
export const SWFL_HUB_SLUGS = ['lee', 'collier', 'charlotte', 'hendry', 'glades'];

/**
 * Existing body rich text on the Florida Bail Bonds hub.
 * Live copy is "SWFL County & Jail Directory". Not the page H1.
 */
export const HUB_COUNTY_DIRECTORY_ELEMENT_ID = '#comp-mumy2zct';

function directoryHtml(counties) {
    // Wix Text .html accepts p, headings, a, span, lists, and br. A <nav>
    // wrapper is rejected and the assignment throws, so the anchors never paint.
    const items = counties.map(function (county) {
        const href = '/florida-bail-bonds/' + county.slug;
        const label = county.name + ' County bail bonds';
        return '<li><a href="' + href + '">' + escapeHtml(label) + '</a></li>';
    });
    return '<ul>' + items.join('') + '</ul>';
}

/** One anchor per county, alphabetical, for county pages. */
export function buildFloridaCountyDirectoryHtml() {
    return directoryHtml(FLORIDA_COUNTY_DIRECTORY);
}

/** Same 67 anchors, with Lee, Collier, Charlotte, Hendry, and Glades first. */
export function hubCountiesSwflFirst() {
    const bySlug = {};
    FLORIDA_COUNTY_DIRECTORY.forEach(function (county) {
        bySlug[county.slug] = county;
    });
    const swfl = [];
    SWFL_HUB_SLUGS.forEach(function (slug) {
        if (bySlug[slug]) swfl.push(bySlug[slug]);
    });
    const rest = FLORIDA_COUNTY_DIRECTORY.filter(function (county) {
        return SWFL_HUB_SLUGS.indexOf(county.slug) === -1;
    });
    return swfl.concat(rest);
}

export function buildHubCountyDirectoryHtml() {
    return directoryHtml(hubCountiesSwflFirst());
}

/**
 * Keep the Editor copy already in the hub rich text, then add the 67 anchors.
 * A second call leaves the string unchanged.
 */
export function appendHubCountyDirectory(currentHtml, directoryHtml) {
    const directory = directoryHtml || buildHubCountyDirectoryHtml();
    const body = typeof currentHtml === 'string' ? currentHtml : '';
    if (!directory) return body;
    if (body.indexOf('Lee County bail bonds') !== -1) return body;
    if (!body) return directory;
    return body + directory;
}

/**
 * City and jail landing pages under /florida-bail-bonds/{slug}.
 * county is the parent county slug. Used for crawlable parent/child links.
 */
export const FLORIDA_CITY_PAGES = [
    { slug: 'gainesville', name: "Gainesville", county: 'alachua', type: 'city' },
    { slug: 'fort-lauderdale', name: "Fort Lauderdale", county: 'broward', type: 'city' },
    { slug: 'charlotte-county-jail', name: "Charlotte County Jail", county: 'charlotte', type: 'jail' },
    { slug: 'englewood', name: "Englewood", county: 'charlotte', type: 'city' },
    { slug: 'port-charlotte', name: "Port Charlotte", county: 'charlotte', type: 'city' },
    { slug: 'punta-gorda', name: "Punta Gorda", county: 'charlotte', type: 'city' },
    { slug: 'collier-county-jail', name: "Collier County Jail", county: 'collier', type: 'jail' },
    { slug: 'immokalee', name: "Immokalee", county: 'collier', type: 'city' },
    { slug: 'marco-island', name: "Marco Island", county: 'collier', type: 'city' },
    { slug: 'naples', name: "Naples", county: 'collier', type: 'city' },
    { slug: 'jacksonville', name: "Jacksonville", county: 'duval', type: 'city' },
    { slug: 'pensacola', name: "Pensacola", county: 'escambia', type: 'city' },
    { slug: 'clewiston', name: "Clewiston", county: 'hendry', type: 'city' },
    { slug: 'labelle', name: "LaBelle", county: 'hendry', type: 'city' },
    { slug: 'tampa', name: "Tampa", county: 'hillsborough', type: 'city' },
    { slug: 'bonita-springs', name: "Bonita Springs", county: 'lee', type: 'city' },
    { slug: 'cape-coral', name: "Cape Coral", county: 'lee', type: 'city' },
    { slug: 'cape-coral-pd', name: "Cape Coral Police Department", county: 'lee', type: 'jail' },
    { slug: 'estero', name: "Estero", county: 'lee', type: 'city' },
    { slug: 'fort-myers', name: "Fort Myers", county: 'lee', type: 'city' },
    { slug: 'fort-myers-beach', name: "Fort Myers Beach", county: 'lee', type: 'city' },
    { slug: 'lee-county-jail', name: "Lee County Jail", county: 'lee', type: 'jail' },
    { slug: 'lehigh-acres', name: "Lehigh Acres", county: 'lee', type: 'city' },
    { slug: 'north-fort-myers', name: "North Fort Myers", county: 'lee', type: 'city' },
    { slug: 'sanibel', name: "Sanibel", county: 'lee', type: 'city' },
    { slug: 'tallahassee', name: "Tallahassee", county: 'leon', type: 'city' },
    { slug: 'bradenton', name: "Bradenton", county: 'manatee', type: 'city' },
    { slug: 'miami', name: "Miami", county: 'miami-dade', type: 'city' },
    { slug: 'orlando', name: "Orlando", county: 'orange', type: 'city' },
    { slug: 'west-palm-beach', name: "West Palm Beach", county: 'palm-beach', type: 'city' },
    { slug: 'clearwater', name: "Clearwater", county: 'pinellas', type: 'city' },
    { slug: 'st-petersburg', name: "St. Petersburg", county: 'pinellas', type: 'city' },
    { slug: 'lakeland', name: "Lakeland", county: 'polk', type: 'city' },
    { slug: 'north-port', name: "North Port", county: 'sarasota', type: 'city' },
    { slug: 'venice', name: "Venice", county: 'sarasota', type: 'city' },
    { slug: 'daytona-beach', name: "Daytona Beach", county: 'volusia', type: 'city' }
];

function countyNameForSlug(slug) {
    for (let i = 0; i < FLORIDA_COUNTY_DIRECTORY.length; i++) {
        if (FLORIDA_COUNTY_DIRECTORY[i].slug === slug) return FLORIDA_COUNTY_DIRECTORY[i].name;
    }
    return '';
}

function cityLinkLabel(page) {
    return page.name + ' bail bonds';
}

function cityListHtml(pages) {
    return '<ul>' + pages.map(function (page) {
        return '<li><a href="/florida-bail-bonds/' + page.slug + '">' + escapeHtml(cityLinkLabel(page)) + '</a></li>';
    }).join('') + '</ul>';
}

/**
 * Local links for a county, city or jail page.
 * County page: its city and jail pages. City or jail page: a link back to the
 * parent county plus the other pages in that county. Unknown slug: ''.
 */
export function buildLocalLinksHtml(slug) {
    const key = String(slug || '').trim().toLowerCase();
    if (!key) return '';
    const own = FLORIDA_CITY_PAGES.filter(function (page) { return page.slug === key; })[0];
    if (own) {
        const countyName = countyNameForSlug(own.county);
        if (!countyName) return '';
        const siblings = FLORIDA_CITY_PAGES.filter(function (page) {
            return page.county === own.county && page.slug !== own.slug;
        });
        let html = '<p>' + escapeHtml(own.name) + ' is in ' + escapeHtml(countyName) + ' County. See <a href="/florida-bail-bonds/' + own.county + '">' + escapeHtml(countyName) + ' County bail bonds</a> for county-wide jail, court and bond information.</p>';
        if (siblings.length) {
            html += '<p>Other ' + escapeHtml(countyName) + ' County pages:</p>' + cityListHtml(siblings);
        }
        return html;
    }
    const countyName = countyNameForSlug(key);
    if (!countyName) return '';
    const children = FLORIDA_CITY_PAGES.filter(function (page) { return page.county === key; });
    if (!children.length) return '';
    return '<p>Cities and jails in ' + escapeHtml(countyName) + ' County:</p>' + cityListHtml(children);
}

/** City and jail pages grouped under their county, for the hub. */
export function buildHubCityDirectoryHtml() {
    const order = [];
    FLORIDA_CITY_PAGES.forEach(function (page) {
        if (order.indexOf(page.county) === -1) order.push(page.county);
    });
    const ranked = SWFL_HUB_SLUGS.filter(function (slug) { return order.indexOf(slug) !== -1; })
        .concat(order.filter(function (slug) { return SWFL_HUB_SLUGS.indexOf(slug) === -1; }).sort());
    const items = [];
    ranked.forEach(function (countySlug) {
        FLORIDA_CITY_PAGES.forEach(function (page) {
            if (page.county === countySlug) {
                items.push('<li><a href="/florida-bail-bonds/' + page.slug + '">' + escapeHtml(cityLinkLabel(page)) + '</a> (' + escapeHtml(countyNameForSlug(countySlug)) + ' County)</li>');
            }
        });
    });
    return '<p>Cities and jails we cover:</p><ul>' + items.join('') + '</ul>';
}

export const COUNTY_DIRECTORY_ELEMENT_IDS = [
    '#countyLinkList',
    '#countyDirectory',
    '#countyList',
    '#textCountyLinks',
    '#seoCountyLinks',
    '#countyDropdownLinks'
];
