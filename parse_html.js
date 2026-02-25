const fs = require('fs');
const html = fs.readFileSync('backend-gas/Dashboard.html', 'utf8');

// Simple regex to extract script blocks (ignores external src scripts)
const scriptRegex = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptCount = 0;
let totalContent = '';

while ((match = scriptRegex.exec(html)) !== null) {
    if (match[1].trim() !== '') {
        scriptCount++;
        totalContent += `\n\n// --- Script Block ${scriptCount} ---\n` + match[1];
    }
}

fs.writeFileSync('backend-gas/extracted_scripts.js', totalContent);
console.log(`Extracted ${scriptCount} script blocks to backend-gas/extracted_scripts.js`);
