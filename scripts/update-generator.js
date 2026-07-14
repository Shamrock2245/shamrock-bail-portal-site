const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/backend/county-generator.jsw');
let content = fs.readFileSync(filePath, 'utf8');

// Inject semantic relational attributes into the output object
const semanticInjection = `
    // Semantic Relational Attributes for LLMs
    semanticAttributes: {
      author: "Shamrock Bail Bonds",
      expertise: "Licensed Florida Surety Agents",
      knowsAbout: ["Florida Bail Law", "Surety Bonds", \`\${enrichedData.judicialCircuit || 'Florida Courts'}\`],
      areaServed: \`\${county.name} County, Florida\`,
      founder: "Shamrock Bail Bonds LLC"
    },
`;

if (!content.includes('semanticAttributes:')) {
    content = content.replace('seoTags: generateCountySEOTags(county)', semanticInjection + '    seoTags: generateCountySEOTags(county)');
    fs.writeFileSync(filePath, content);
    console.log('Successfully injected semantic attributes into county-generator.jsw');
} else {
    console.log('Semantic attributes already exist in county-generator.jsw');
}
