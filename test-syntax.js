const fs = require('fs');
const html = fs.readFileSync('backend-gas/Dashboard.html', 'utf8');
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
const acorn = require('acorn');
scripts.forEach((s, i) => {
  const code = s.replace(/<[\/]?script[^>]*>/g, '');
  if (!code.trim()) return;
  try {
    acorn.parse(code, {ecmaVersion: 2020});
  } catch(e) {
    console.log(`Script ${i} Error: ${e.message} at line ${e.loc?.line}, col ${e.loc?.column}`);
    const lines = code.split('\n');
    console.log('>>>', lines[e.loc?.line - 1]);
  }
});
