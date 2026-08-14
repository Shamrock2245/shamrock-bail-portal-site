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
  "lee": { lat: 26.58, lng: -81.85, jailProximity: "Lee County Jail, 2501 Ortiz Ave", jurisdiction: "20th Judicial Circuit" },
  "collier": { lat: 26.10, lng: -81.39, jailProximity: "Collier County Jail, Naples", jurisdiction: "20th Judicial Circuit" },
  "charlotte": { lat: 26.90, lng: -81.92, jailProximity: "Charlotte County Jail, Punta Gorda", jurisdiction: "20th Judicial Circuit" },
  "hendry": { lat: 26.54, lng: -81.14, jailProximity: "Hendry County Jail, LaBelle", jurisdiction: "20th Judicial Circuit" },
  "glades": { lat: 26.95, lng: -81.18, jailProximity: "Glades County Jail, Moore Haven", jurisdiction: "20th Judicial Circuit" },
  "desoto": { lat: 27.20, lng: -81.81, jailProximity: "DeSoto County Jail", jurisdiction: "12th Judicial Circuit" },
  "sarasota": { lat: 27.18, lng: -82.34, jailProximity: "Sarasota County Jail", jurisdiction: "12th Judicial Circuit" },
  "manatee": { lat: 27.49, lng: -82.35, jailProximity: "Manatee County Jail", jurisdiction: "12th Judicial Circuit" },
  "hillsborough": { lat: 27.91, lng: -82.35, jailProximity: "Hillsborough County Jail", jurisdiction: "13th Judicial Circuit" },
  "pinellas": { lat: 27.90, lng: -82.74, jailProximity: "Pinellas County Jail", jurisdiction: "6th Judicial Circuit" },
  "orange": { lat: 28.51, lng: -81.32, jailProximity: "Orange County Jail", jurisdiction: "9th Judicial Circuit" },
  "miami-dade": { lat: 25.61, lng: -80.56, jailProximity: "TGK, Miami", jurisdiction: "11th Judicial Circuit" },
  "broward": { lat: 26.15, lng: -80.45, jailProximity: "Broward Main Jail", jurisdiction: "17th Judicial Circuit" },
  "palm-beach": { lat: 26.63, lng: -80.44, jailProximity: "Palm Beach County Jail", jurisdiction: "15th Judicial Circuit" },
  "duval": { lat: 30.33, lng: -81.67, jailProximity: "Duval Pretrial Detention", jurisdiction: "4th Judicial Circuit" },
  "leon": { lat: 30.46, lng: -84.27, jailProximity: "Leon County Detention", jurisdiction: "2nd Judicial Circuit" },
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
