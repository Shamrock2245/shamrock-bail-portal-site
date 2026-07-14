// LocationMetadataService.js
// Updated to map exact lat/lng coordinates and precise legal operational jurisdictions

const FLORIDA_BOUNDS = {
  north: 31.0,
  south: 24.5,
  east: -80.0,
  west: -87.6
};

// Extracted from allFloridaCounties.json and geo datasets
const COUNTY_GEO_DATA = {
  "lee": { lat: 26.6406, lng: -81.8723, jailProximity: "1.2 miles", jurisdiction: "20th Judicial Circuit" },
  "collier": { lat: 26.1420, lng: -81.7948, jailProximity: "3.5 miles", jurisdiction: "20th Judicial Circuit" },
  "charlotte": { lat: 26.9295, lng: -82.0454, jailProximity: "0.8 miles", jurisdiction: "20th Judicial Circuit" },
  "hendry": { lat: 26.7523, lng: -81.4415, jailProximity: "2.1 miles", jurisdiction: "20th Judicial Circuit" },
  "glades": { lat: 26.9481, lng: -81.1856, jailProximity: "1.5 miles", jurisdiction: "20th Judicial Circuit" },
  // Default for others
  "default": { lat: 27.9944, lng: -81.7603, jailProximity: "Varies", jurisdiction: "State of Florida" }
};

function getCountyGeoData(countySlug) {
  const normalizedSlug = countySlug ? countySlug.toLowerCase().replace('-county', '') : 'default';
  return COUNTY_GEO_DATA[normalizedSlug] || COUNTY_GEO_DATA['default'];
}

function generateProgrammaticMetaHeaders(countyName, countySlug) {
  const geo = getCountyGeoData(countySlug);
  return {
    title: `Bail Bonds in ${countyName}, FL | Fast 24/7 Release | Shamrock Bail Bonds`,
    description: `Need a bail bondsman in ${countyName}? Shamrock Bail Bonds offers 24/7 service, fast jail release, and flexible payment plans. Located in the ${geo.jurisdiction}. Call now.`,
    canonicalUrl: `https://www.shamrockbailbonds.biz/florida-bail-bonds/${countySlug}`,
    geoRegion: "US-FL",
    geoPlacename: `${countyName}, Florida`,
    geoPosition: `${geo.lat};${geo.lng}`
  };
}

function getLocationMetadata(countySlug) {
  const geo = getCountyGeoData(countySlug);
  return {
    coordinates: {
      latitude: geo.lat,
      longitude: geo.lng
    },
    jailProximity: geo.jailProximity,
    jurisdiction: geo.jurisdiction,
    schema: generateGeoSpatialSchema(countySlug, geo)
  };
}

function generateGeoSpatialSchema(countySlug, geo) {
  return {
    "@context": "https://schema.org",
    "@type": "BailBondService",
    "name": `Shamrock Bail Bonds - ${countySlug.toUpperCase()} Coverage`,
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": `${countySlug} County, Florida`
    },
    "location": {
      "@type": "Place",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": geo.lat,
        "longitude": geo.lng
      }
    },
    "knowsAbout": ["Florida Bail Law", "Surety Bonds", `${geo.jurisdiction}`]
  };
}

// Export for GAS
if (typeof module !== 'undefined') {
  module.exports = {
    getCountyGeoData,
    generateProgrammaticMetaHeaders,
    getLocationMetadata
  };
}
