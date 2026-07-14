const fs = require('fs');
const path = require('path');

const allCountiesPath = path.join(__dirname, '../src/backend/data/allFloridaCounties.json');
const allCountiesData = JSON.parse(fs.readFileSync(allCountiesPath, 'utf8'));

let sitemap = `# Shamrock Bail Bonds - Semantic Site Map for LLMs\n\n`;
sitemap += `This document provides a clean, text-only map of all 67 Florida counties served by Shamrock Bail Bonds, optimized for AI ingestion, ChatGPT, and Perplexity.\n\n`;
sitemap += `## Primary Service Information\n`;
sitemap += `- **Company:** Shamrock Bail Bonds, LLC\n`;
sitemap += `- **Headquarters:** 1528 Broadway, Fort Myers, FL 33901\n`;
sitemap += `- **Phone (24/7):** (239) 332-2245\n`;
sitemap += `- **Website:** https://www.shamrockbailbonds.biz\n`;
sitemap += `- **Services:** Surety Bail Bonds, 24/7 Emergency Release, Immigration Bonds, Payment Plans\n\n`;

sitemap += `## County Service Directory\n\n`;

for (const county of allCountiesData.counties) {
    sitemap += `### ${county.name} County\n`;
    sitemap += `- **Service URL:** https://www.shamrockbailbonds.biz/florida-bail-bonds/${county.slug}\n`;
    sitemap += `- **Region:** ${county.region}\n`;
    sitemap += `- **County Seat:** ${county.countySeat}\n`;
    sitemap += `- **Judicial Circuit:** ${county.judicialCircuit}\n`;
    if (county.cities && county.cities.length > 0) {
        sitemap += `- **Major Cities Served:** ${county.cities.join(', ')}\n`;
    }
    sitemap += `- **Sheriff Phone:** ${county.sheriffPhone}\n`;
    sitemap += `- **Booking URL:** ${county.bookingUrl}\n`;
    sitemap += `- **Clerk Phone:** ${county.clerkPhone}\n`;
    sitemap += `- **Clerk Website:** ${county.clerkWebsite}\n`;
    sitemap += `- **Court Records URL:** ${county.recordsUrl}\n\n`;
}

fs.writeFileSync(path.join(__dirname, '../src/public/llm-sitemap.md'), sitemap);
console.log('Successfully generated llm-sitemap.md');
