/**
 * Unique local copy for county pages Google crawled and left unindexed.
 * Facts live in backend/data JSON, not the CMS.
 */

import localFacts from 'backend/data/gsc-county-local.json';

const INDEXED = (localFacts && localFacts.counties) || {};

function normalizeSlug(raw) {
    return String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '');
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function getIndexedCountyLocal(slug) {
    return INDEXED[normalizeSlug(slug)] || null;
}

export function listIndexedCountySlugs() {
    return Object.keys(INDEXED);
}

function formatCityList(cities) {
    const list = (cities || []).filter(Boolean);
    if (list.length === 0) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + ' and ' + list[1];
    return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
}

/**
 * Overlay verified jail, courthouse, cities, and a unique paragraph onto a
 * county page payload. City and jail landings are left alone.
 * @param {Object} page
 * @returns {Object}
 */
export function applyIndexedCountyLocal(page) {
    if (!page || page.landing_type !== 'county') return page;
    const local = getIndexedCountyLocal(page.county_slug || page.parent_county_name);
    if (!local) return page;

    page.jail = page.jail || {};
    page.jail.name = local.jailName;
    page.jail.address = local.jailAddress;

    page.facts = page.facts || {};
    page.facts.jail_name = local.jailName;
    page.facts.jail_address = local.jailAddress;
    page.facts.courthouse_name = local.courthouseName;
    page.facts.courthouse_address = local.courthouseAddress;
    page.facts.major_cities = local.cities.slice();

    page.cities = local.cities.slice();

    page.clerk = page.clerk || {};
    page.clerk.name = local.clerkName;
    page.clerk.display_name = local.clerkName;

    page.content = page.content || {};
    const paragraph = String(local.paragraph || '').trim();
    const about = String(page.content.about_county || '');
    if (paragraph && about.indexOf(paragraph) === -1) {
        page.content.about_county = paragraph + (about ? ' ' + about : '');
    }
    const aboutHtml = String(page.content.about_html || '');
    const paragraphHtml = '<p>' + escapeHtml(paragraph) + '</p>';
    if (paragraph && aboutHtml.indexOf(paragraphHtml) === -1) {
        page.content.about_html = paragraphHtml + aboutHtml;
    }

    const cityList = formatCityList(local.cities);
    const countyName = page.parent_county_name || page.county_name || '';
    if (cityList && countyName) {
        page.content.service_areas = 'We serve all of ' + countyName + ' County, including ' + cityList + ', and surrounding communities.';
    }
    page.content.hero_subheadline = 'Licensed bail help for families dealing with ' + local.jailName + '. Call (239) 332-2245 or text (239) 955-0178.';

    page.seo = page.seo || {};
    const streetHint = String(local.jailAddress || '').split(',')[0];
    const currentDesc = String(page.seo.meta_description || '');
    if (streetHint && currentDesc.indexOf(streetHint) === -1) {
        const localDesc = countyName + ' County bail bonds. ' + local.jailName + ', ' + local.jailAddress + '. Call (239) 332-2245.';
        page.seo.meta_description = localDesc.length <= 160 ? localDesc : localDesc.slice(0, 157) + '...';
    }

    return page;
}
