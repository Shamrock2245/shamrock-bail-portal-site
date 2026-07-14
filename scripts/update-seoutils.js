const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/public/seoUtils.js');
let content = fs.readFileSync(filePath, 'utf8');

// The speakable schema is already in seoUtils.js but let's make sure it targets conversational headers
const speakableUpdate = `
            // Speakable: enables voice search / AI assistants to read this
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", ".hero-subtitle", ".faq-question", ".voice-trigger"]
            }
`;

// Replace existing speakable
content = content.replace(
    /"speakable": \{\s*"@type": "SpeakableSpecification",\s*"cssSelector": \["h1", ".hero-subtitle", ".faq-question"\]\s*\}/g,
    speakableUpdate.trim()
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated Speakable schema in seoUtils.js');
