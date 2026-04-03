const fs = require('fs');
const html = fs.readFileSync('backend-gas/Dashboard.html', 'utf8');

// 1. Basic HTML Tag balance check (very naive, just counts)
const scriptOpen = (html.match(/<script>/gi) || []).length;
const scriptClose = (html.match(/<\/script>/gi) || []).length;
const divOpen = (html.match(/<div/gi) || []).length;
const divClose = (html.match(/<\/div>/gi) || []).length;
console.log(`HTML Checks:\n<script>: ${scriptOpen} open, ${scriptClose} close`);
console.log(`<div>: ${divOpen} open, ${divClose} close\n`);

// 2. Extract scripts and check JS syntax using node -c
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
let extractDir = 'tmp_scripts';
if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir);

while ((match = scriptRegex.exec(html)) !== null) {
    scriptIdx++;
    const jsContent = match[1];
    const filename = `${extractDir}/script_${scriptIdx}.js`;
    fs.writeFileSync(filename, jsContent);
}
console.log(`Extracted ${scriptIdx} script tags.`);
