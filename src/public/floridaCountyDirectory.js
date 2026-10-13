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
    const anchors = counties.map(function (county) {
        const href = '/florida-bail-bonds/' + county.slug;
        const label = county.name + ' County bail bonds';
        return '<a href="' + href + '">' + escapeHtml(label) + '</a>';
    });
    return '<nav aria-label="Florida county bail bonds">' + anchors.join(' ') + '</nav>';
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
    if (body.indexOf('aria-label="Florida county bail bonds"') !== -1) return body;
    if (!body) return directory;
    return body + directory;
}

export const COUNTY_DIRECTORY_ELEMENT_IDS = [
    '#countyLinkList',
    '#countyDirectory',
    '#countyList',
    '#textCountyLinks',
    '#seoCountyLinks',
    '#countyDropdownLinks'
];
