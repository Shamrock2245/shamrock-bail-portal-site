const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.git')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.js') || dirFile.endsWith('.html') || dirFile.endsWith('.md')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync(path.join(__dirname, '../src'));
let issuesFound = 0;
let report = '# Image ALT Tag Audit Report\n\n';
report += 'This report identifies images that lack descriptive, highly contextual alt tags for Visual Search (Google Lens) optimization.\n\n';

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Look for image tags in HTML
  if (file.endsWith('.html')) {
    const imgRegex = /<img[^>]+>/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const imgTag = match[0];
      if (!imgTag.includes('alt=') || imgTag.includes('alt=""') || imgTag.includes("alt=''")) {
        report += `- **File:** ${path.relative(path.join(__dirname, '..'), file)}\n`;
        report += `  - **Issue:** Missing or empty ALT tag\n`;
        report += `  - **Element:** \`${imgTag}\`\n\n`;
        issuesFound++;
      }
    }
  }
  
  // Look for Wix image assignments in JS
  if (file.endsWith('.js')) {
    const wixImgRegex = /\$w\(['"][^'"]+['"]\)\.alt\s*=\s*['"](.*?)['"]/g;
    let match;
    while ((match = wixImgRegex.exec(content)) !== null) {
      const altText = match[1];
      if (altText.length < 5) {
        report += `- **File:** ${path.relative(path.join(__dirname, '..'), file)}\n`;
        report += `  - **Issue:** Weak ALT tag (too short)\n`;
        report += `  - **Text:** "${altText}"\n\n`;
        issuesFound++;
      }
    }
  }
}

if (issuesFound === 0) {
  report += '✅ All images found have descriptive ALT tags.\n';
}

fs.writeFileSync(path.join(__dirname, '../docs/IMAGE_ALT_AUDIT.md'), report);
console.log(`Audit complete. Found ${issuesFound} issues. Report saved to docs/IMAGE_ALT_AUDIT.md`);
