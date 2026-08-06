/**
 * First Appearance county catalog — all 67 Florida counties.
 * Used by first-appearance-api.jsw and sorted by user location when provided.
 */

import allCountyData from 'backend/data/allFloridaCounties.json';

/** County seat-ish centroids (same map as masterPage Find My Jail). */
export const COUNTY_COORDS = {
    alachua: { lat: 29.67, lon: -82.35 },
    baker: { lat: 30.33, lon: -82.29 },
    bay: { lat: 30.26, lon: -85.63 },
    bradford: { lat: 29.95, lon: -82.16 },
    brevard: { lat: 28.3, lon: -80.7 },
    broward: { lat: 26.15, lon: -80.45 },
    calhoun: { lat: 30.41, lon: -85.2 },
    charlotte: { lat: 26.9, lon: -81.92 },
    citrus: { lat: 28.85, lon: -82.47 },
    clay: { lat: 29.98, lon: -81.86 },
    collier: { lat: 26.1, lon: -81.39 },
    columbia: { lat: 30.22, lon: -82.63 },
    desoto: { lat: 27.2, lon: -81.81 },
    dixie: { lat: 29.6, lon: -83.15 },
    duval: { lat: 30.33, lon: -81.67 },
    escambia: { lat: 30.65, lon: -87.35 },
    flagler: { lat: 29.47, lon: -81.3 },
    franklin: { lat: 29.8, lon: -84.8 },
    gadsden: { lat: 30.56, lon: -84.63 },
    gilchrist: { lat: 29.72, lon: -82.78 },
    glades: { lat: 26.95, lon: -81.18 },
    gulf: { lat: 29.93, lon: -85.22 },
    hamilton: { lat: 30.51, lon: -82.95 },
    hardee: { lat: 27.49, lon: -81.79 },
    hendry: { lat: 26.54, lon: -81.14 },
    hernando: { lat: 28.56, lon: -82.46 },
    highlands: { lat: 27.35, lon: -81.35 },
    hillsborough: { lat: 27.91, lon: -82.35 },
    holmes: { lat: 30.86, lon: -85.81 },
    'indian-river': { lat: 27.67, lon: -80.49 },
    jackson: { lat: 30.79, lon: -85.22 },
    jefferson: { lat: 30.41, lon: -83.9 },
    lafayette: { lat: 30.07, lon: -83.18 },
    lake: { lat: 28.75, lon: -81.72 },
    lee: { lat: 26.58, lon: -81.85 },
    leon: { lat: 30.46, lon: -84.27 },
    levy: { lat: 29.27, lon: -82.61 },
    liberty: { lat: 30.25, lon: -84.86 },
    madison: { lat: 30.45, lon: -83.47 },
    manatee: { lat: 27.49, lon: -82.35 },
    marion: { lat: 29.19, lon: -82.13 },
    martin: { lat: 27.08, lon: -80.42 },
    'miami-dade': { lat: 25.61, lon: -80.56 },
    monroe: { lat: 25.1, lon: -81.1 },
    nassau: { lat: 30.61, lon: -81.76 },
    okaloosa: { lat: 30.66, lon: -86.58 },
    okeechobee: { lat: 27.25, lon: -80.89 },
    orange: { lat: 28.51, lon: -81.32 },
    osceola: { lat: 28.06, lon: -81.15 },
    'palm-beach': { lat: 26.63, lon: -80.44 },
    pasco: { lat: 28.3, lon: -82.46 },
    pinellas: { lat: 27.9, lon: -82.74 },
    polk: { lat: 27.96, lon: -81.87 },
    putnam: { lat: 29.62, lon: -81.73 },
    'santa-rosa': { lat: 30.69, lon: -87.01 },
    sarasota: { lat: 27.18, lon: -82.35 },
    seminole: { lat: 28.72, lon: -81.21 },
    'st-johns': { lat: 29.93, lon: -81.42 },
    'st-lucie': { lat: 27.38, lon: -80.43 },
    sumter: { lat: 28.71, lon: -82.08 },
    suwannee: { lat: 30.19, lon: -83.0 },
    taylor: { lat: 30.05, lon: -83.61 },
    union: { lat: 30.04, lon: -82.37 },
    volusia: { lat: 29.03, lon: -81.07 },
    wakulla: { lat: 30.15, lon: -84.37 },
    walton: { lat: 30.64, lon: -86.17 },
    washington: { lat: 30.61, lon: -85.66 }
};

/**
 * Known First Appearance access details (where we have verified streams / times).
 * Everything else falls back to FL Courts directory + "within 24 hours" guidance.
 */
const FA_OVERRIDES = {
    lee: {
        schedule: '10:00 AM — Daily (M–F)',
        location: 'Lee County Justice Center, Fort Myers',
        accessType: 'livestream',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Livestream available via FL Courts',
        phone: '239-533-2900',
        tier: 1
    },
    hendry: {
        schedule: 'Varies (check Zoom)',
        location: 'Hendry County Courthouse, LaBelle',
        accessType: 'zoom',
        liveUrl: 'https://zoom.us/j/94329649927?pwd=l5J4yPuaqHacJ1lQoe3GaJK9TTpA7a.1',
        notes: 'Zoom ID: 943 2964 9927 / Passcode: 550315',
        phone: '863-675-5229',
        tier: 1
    },
    charlotte: {
        schedule: 'Daily (M–F)',
        location: 'Charlotte County Justice Center, Punta Gorda',
        accessType: 'livestream',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Livestream available via FL Courts',
        phone: '941-637-2110',
        tier: 1
    },
    collier: {
        schedule: 'Daily (M–F)',
        location: 'Collier County Courthouse, Naples',
        accessType: 'livestream',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Livestream available via FL Courts',
        phone: '239-252-8800',
        tier: 1
    },
    desoto: {
        schedule: 'Varies',
        location: 'DeSoto County Courthouse, Arcadia',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '863-993-4876',
        tier: 1
    },
    glades: {
        schedule: 'Varies',
        location: 'Glades County Courthouse, Moore Haven',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '863-946-6010',
        tier: 2
    },
    hillsborough: {
        schedule: '1:30 PM — Daily (M–F)',
        location: 'Hillsborough County Courthouse, Tampa',
        accessType: 'inperson',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Primarily in-person; limited Zoom availability',
        phone: '813-276-8100',
        tier: 2
    },
    orange: {
        schedule: 'Varies',
        location: 'Orange County Courthouse, Orlando',
        accessType: 'livestream',
        liveUrl: 'https://ninthcircuit.org/communication-outreach/initial-appearances-live',
        notes: 'Livestream via 9th Circuit website',
        phone: '407-836-2000',
        tier: 2
    },
    sarasota: {
        schedule: 'Varies',
        location: 'Sarasota County Courthouse, Sarasota',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '941-861-7400',
        tier: 1
    },
    manatee: {
        schedule: 'Varies',
        location: 'Manatee County Courthouse, Bradenton',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '941-749-3600',
        tier: 1
    },
    'palm-beach': {
        schedule: 'Varies',
        location: 'Palm Beach County Courthouse, West Palm Beach',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '561-355-2431',
        tier: 2
    },
    seminole: {
        schedule: 'Varies',
        location: 'Seminole County Courthouse, Sanford',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '407-665-4200',
        tier: 2
    },
    polk: {
        schedule: 'Varies',
        location: 'Polk County Courthouse, Bartow',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '863-534-4000',
        tier: 2
    },
    pinellas: {
        schedule: 'Varies',
        location: 'Pinellas County Justice Center, Clearwater',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '727-464-3267',
        tier: 2
    },
    brevard: {
        schedule: 'Varies',
        location: 'Brevard County Courthouse, Titusville / Viera',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '321-637-5413',
        tier: 2
    },
    duval: {
        schedule: 'Varies',
        location: 'Duval County Courthouse, Jacksonville',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '904-255-1100',
        tier: 2
    },
    'miami-dade': {
        schedule: 'Daily',
        location: 'Richard E. Gerstein Justice Building, Miami',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '305-275-1155',
        tier: 2
    },
    broward: {
        schedule: 'Varies',
        location: 'Broward County Courthouse, Fort Lauderdale',
        accessType: 'directory',
        liveUrl: 'https://courtrooms.flcourts.gov/',
        notes: 'Check FL Courts Directory for schedule',
        phone: '954-831-7700',
        tier: 2
    }
};

function toSlug(raw) {
    return String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '')
        .replace(/\s+county$/i, '')
        .replace(/\s+/g, '-');
}

function haversineMiles(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Build full 67-county First Appearance list.
 * @param {{lat?: number, lon?: number}} [options]
 */
export function buildFirstAppearanceCatalog(options = {}) {
    try {
        const userLat = options.lat != null ? Number(options.lat) : null;
        const userLon = options.lon != null ? Number(options.lon) : null;
        const hasUser =
            userLat != null && userLon != null && isFinite(userLat) && isFinite(userLon);

        const source = (allCountyData && Array.isArray(allCountyData.counties) && allCountyData.counties) || [];
        if (!source.length) {
            console.warn('[FA Catalog] allFloridaCounties.json empty or missing — using override-only fallback');
        }

        // Prefer JSON list; if missing, still expose counties we have overrides for
        const slugSet = new Set();
        const rows = [];

        source.forEach((c) => {
            const slug = toSlug(c.slug || c.name);
            if (!slug || slugSet.has(slug)) return;
            slugSet.add(slug);
            rows.push(buildCountyRow(c, slug, hasUser, userLat, userLon));
        });

        Object.keys(FA_OVERRIDES).forEach((slug) => {
            if (slugSet.has(slug)) return;
            slugSet.add(slug);
            const name = slug
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            rows.push(
                buildCountyRow(
                    { name, slug, countySeat: 'FL', judicialCircuit: '', region: '' },
                    slug,
                    hasUser,
                    userLat,
                    userLon
                )
            );
        });

        if (hasUser) {
            rows.sort((a, b) => {
                if (a.distanceMiles == null && b.distanceMiles == null) return a.name.localeCompare(b.name);
                if (a.distanceMiles == null) return 1;
                if (b.distanceMiles == null) return -1;
                return a.distanceMiles - b.distanceMiles;
            });
        } else {
            // No geo: SWFL tier first, then live feeds, then A–Z
            rows.sort((a, b) => {
                if (a.tier !== b.tier) return a.tier - b.tier;
                if (a.hasLiveFeed !== b.hasLiveFeed) return a.hasLiveFeed ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
        }

        return {
            counties: rows,
            totalCounties: rows.length,
            sortedBy: hasUser ? 'distance' : 'tier',
            userLocation: hasUser ? { lat: userLat, lon: userLon } : null,
            lastUpdated: '2026-08-06'
        };
    } catch (err) {
        console.error('[FA Catalog] build failed:', err);
        return {
            counties: [],
            totalCounties: 0,
            sortedBy: 'tier',
            userLocation: null,
            lastUpdated: '2026-08-06',
            error: String(err && err.message ? err.message : err)
        };
    }
}

function buildCountyRow(c, slug, hasUser, userLat, userLon) {
    const coords = COUNTY_COORDS[slug] || {};
    const ov = FA_OVERRIDES[slug] || {};
    const accessType = ov.accessType || 'directory';
    const hasLiveFeed = accessType === 'zoom' || accessType === 'livestream';
    const baseName = c.name || slug;
    const row = {
        name: /county$/i.test(baseName) ? baseName : `${baseName} County`,
        slug,
        circuit: c.judicialCircuit || ov.circuit || '',
        schedule: ov.schedule || 'Within 24 hours of arrest (call for daily courtroom time)',
        location: ov.location || `${baseName} County Courthouse, ${c.countySeat || 'FL'}`,
        accessType,
        liveUrl: ov.liveUrl || 'https://courtrooms.flcourts.gov/',
        notes:
            ov.notes ||
            'First Appearance is required within 24 hours. Check FL Courts Directory or call us for today’s time/feed.',
        phone: String(ov.phone || c.clerkPhone || c.sheriffPhone || '(239) 332-2245').trim(),
        countySeat: c.countySeat || '',
        region: c.region || '',
        lat: coords.lat != null ? coords.lat : null,
        lon: coords.lon != null ? coords.lon : null,
        hasLiveFeed,
        tier: ov.tier != null ? ov.tier : hasLiveFeed ? 2 : 3
    };

    if (hasUser && row.lat != null && row.lon != null) {
        row.distanceMiles = Math.round(haversineMiles(userLat, userLon, row.lat, row.lon) * 10) / 10;
    } else {
        row.distanceMiles = null;
    }
    return row;
}

export function findCountySchedule(countyName) {
    const normalized = toSlug(countyName);
    if (!normalized) return null;
    const { counties } = buildFirstAppearanceCatalog();
    return (
        counties.find((c) => c.slug === normalized) ||
        counties.find((c) => c.slug.startsWith(normalized) || normalized.startsWith(c.slug)) ||
        counties.find((c) => c.name.toLowerCase().includes(normalized.replace(/-/g, ' '))) ||
        null
    );
}
