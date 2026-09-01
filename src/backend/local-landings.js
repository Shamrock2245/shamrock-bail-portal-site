/**
 * Local / GEO landing resolver for Shamrock Bail Bonds.
 * City + jail URLs share the county page template but must never say
 * "Cape Coral County". HQ address stays Fort Myers; geo on LocalBusiness
 * is the physical office, not a fake branch at each jail.
 */

import cityLandings from 'backend/data/florida-city-landings.json';
import localGeo from 'backend/data/florida-local-geo.json';
import { PHONE_PRIMARY, ADDRESS, SITE_URL } from 'backend/seoConfig';

export function normalizeLandingSlug(raw) {
    return String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/^\/+/, '')
        .replace(/-county$/i, '');
}

function landingIndex() {
    const map = {};
    const list = (cityLandings && cityLandings.landings) || [];
    for (const item of list) {
        if (item && item.slug) map[item.slug] = item;
    }
    return map;
}

const LANDINGS = landingIndex();

export function getAllLocalLandings() {
    return (cityLandings && cityLandings.landings) || [];
}

export function getCityLandingSlugs() {
    return getAllLocalLandings().map((l) => l.slug);
}

export function resolveLocalLanding(slug) {
    const key = normalizeLandingSlug(slug);
    return LANDINGS[key] || null;
}

export function getCountyGeo(slug) {
    const key = normalizeLandingSlug(slug);
    const counties = (localGeo && localGeo.counties) || {};
    return counties[key] || null;
}

export function getHqGeo() {
    return (localGeo && localGeo.hq) || {
        lat: 26.6406,
        lng: -81.8723,
        address: ADDRESS.formatted
    };
}

/**
 * Unique on-page copy for a city or jail landing.
 */
export function buildLandingCopy(landing, parent = {}) {
    const phone = PHONE_PRIMARY.display;
    const county = landing.countyName;
    const name = landing.name;
    const jail = landing.transferJail || parent.jailAddress || `${county} County Jail`;
    const holding = landing.holdingName || `${county} County Jail`;
    const holdingAddr = landing.holdingAddress || jail;
    const office = ADDRESS.formatted;
    const isJail = landing.type === 'jail';
    const placeLabel = isJail ? name : `${name}, ${county} County`;

    const heroHeadline = isJail
        ? `${name} Bail Bonds — 24/7 Fast Release`
        : `${name} Bail Bonds — 24/7 Fast Release`;

    const heroSub = isJail
        ? `Licensed Florida agents post bond at ${name}. Call ${phone} any time.`
        : `Arrested in ${name}? Shamrock posts bond at ${jail}. Call ${phone} 24/7.`;

    const about = isJail
        ? `Shamrock Bail Bonds posts surety bonds at ${name} (${holdingAddr}) 24 hours a day. `
          + `Booking, first appearance, and release all run through ${county} County. `
          + `Our licensed agents work the ${county} County Jail roster, confirm the bond, and send paperwork to your phone. `
          + `You do not need to drive to ${office} unless you want to. Call ${phone} with the defendant's name.`
        : `Shamrock Bail Bonds serves ${name} and the rest of ${county} County, Florida. `
          + `If the arrest happened in ${name}, the defendant is typically held at ${holding} (${holdingAddr}) and then booked at ${jail}. `
          + `First appearance is set in the ${county} County court system, usually within 24 hours. `
          + `Our downtown Fort Myers office is at ${office}, near the Lee County Justice Center. `
          + `For ${name} arrests we start remotely: confirm booking, quote the Florida 10% premium ($100 minimum per charge), and send the indemnitor packet by text. `
          + `Payment plans are available on qualifying bonds. Call ${phone} now.`;

    const why = `Families in ${placeLabel} use Shamrock because we answer 24/7, we already know the ${county} County booking desk, and we do not require an office visit. `
        + `Florida premium is 10% of the face amount (minimum $100 per charge). A $125 transfer fee applies outside Lee and Charlotte County and is waived on bonds over $25,000. `
        + `We write under licensed Florida limited surety authority (Ch. 648 / 903 F.S.).`;

    const how = `1. Call ${phone} and say the person is in ${name}. `
        + `2. We look up the ${county} County booking record and bond. `
        + `3. You sign the indemnitor paperwork on your phone and pay the premium. `
        + `4. We post the bond at ${jail}. Release is typically a few hours after the jail processes the paperwork.`;

    const faqs = [
        {
            question: `Who does bail bonds in ${name}, Florida?`,
            answer: `Shamrock Bail Bonds posts ${county} County bonds for ${name} arrests 24/7. Call ${phone}. Office: ${office}.`
        },
        {
            question: `Where is someone taken after an arrest in ${name}?`,
            answer: `Most ${name} arrests go to ${holding} at ${holdingAddr}, then to ${jail} for booking and bond posting.`
        },
        {
            question: `How much is a bail bond in ${name}?`,
            answer: `Florida law sets the surety premium at 10% of the bond, $100 minimum per charge. Call ${phone} with the booking name and we will confirm the exact amount.`
        },
        {
            question: `Do I have to come to Fort Myers for a ${name} bond?`,
            answer: `No. Paperwork is signed on your phone. Walk-ins are welcome at ${office} if that is easier.`
        },
        {
            question: `How fast can Shamrock get someone out of ${jail}?`,
            answer: `We start the file on the call. After the bond is accepted, ${county} County release is commonly a few hours, longer if First Appearance or a hold is pending.`
        }
    ];

    const cities = parent.cities || [];
    const cityKw = cities.slice(0, 4).map((c) => `${c} bail bonds`);

    return {
        heroHeadline,
        heroSub,
        about,
        why,
        how,
        faqs,
        metaTitle: isJail
            ? `${name} Bail Bonds | 24/7 ${county} County | Shamrock`
            : `${name} Bail Bonds | 24/7 ${county} County Jail | Shamrock`,
        metaDescription: isJail
            ? `24/7 bail bonds at ${name}. Fast ${county} County release, payment plans, licensed Florida agents. Call ${phone}.`
            : `24/7 ${name} bail bonds. We post at ${jail}. Payment plans. Licensed since 2012. Call ${phone}.`,
        keywords: [
            `${name} bail bonds`,
            `${name} bondsman`,
            `${name} jail release`,
            `${county} County bail bonds`,
            landing.intent,
            ...cityKw
        ].filter(Boolean),
        canonicalPath: `/florida-bail-bonds/${landing.slug}`
    };
}

/**
 * City H2 blocks appended to every parent county page so Google can
 * rank “Cape Coral bail bonds” even before city URLs are crawled.
 */
export function buildCountyCitySections(countyName, cities, jailName, jailAddress) {
    if (!Array.isArray(cities) || cities.length === 0) return '';
    const listed = cities.slice(0, 8).join(', ');
    return `We cover ${countyName} County communities including ${listed}.`;
}

export function buildCountyJailBlock(countyName, geo) {
    if (!geo) return '';
    const phone = PHONE_PRIMARY.display;
    const name = geo.jailName || `${countyName} County Jail`;
    const addr = geo.jailAddress ? ` at ${geo.jailAddress}` : '';
    return `${name}${addr} is the booking facility for ${countyName} County. Shamrock posts surety bonds here 24/7. Call ${phone} with the inmate name.`;
}

export function buildCmsLandingRecord(landing, parent = {}, brandName = 'Shamrock Bail Bonds', phone) {
    const copy = buildLandingCopy(landing, parent);
    const displayPhone = phone || PHONE_PRIMARY.display;
    return {
        countySlug: landing.slug,
        countyName: landing.name,
        active: true,
        title: copy.heroHeadline,
        primaryPhone: String(displayPhone).replace(/\D/g, '').slice(-10),
        jailName: landing.holdingName || parent.jailName || `${landing.countyName} County Jail`,
        jailPhone: parent.jailPhone || '',
        jailBookingUrl: parent.jailBookingUrl || parent.bookingUrl || '',
        sheriffName: `${landing.countyName} County Sheriff's Office`,
        sheriffWebsite: parent.sheriffWebsite || parent.bookingUrl || '',
        clerkName: `${landing.countyName} County Clerk of Court`,
        clerkPhone: parent.clerkPhone || '',
        clerkWebsite: parent.clerkWebsite || '',
        recordsSearchLink: parent.recordsSearchLink || parent.recordsUrl || '',
        seoTitle: copy.metaTitle,
        seoDescription: copy.metaDescription,
        h1Headline: copy.heroHeadline,
        serviceAreaCopy: copy.about,
        region: parent.region || '',
        lastSynced: new Date()
    };
}
