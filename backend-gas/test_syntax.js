const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('Dashboard.html', 'utf-8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    const code = match[1];
    if (!code.trim()) {
        i++;
        continue;
    }

    try {
        new vm.Script(code);
        console.log(`Script ${i} OK`);
    } catch (e) {
        console.log(`Script ${i} ERROR: ${e.message}`);

        // Find approximate line by parsing line-by-line
        const lines = code.split('\n');
        let errorLine = -1;
        for (let l = 1; l <= lines.length; l++) {
            try {
                new vm.Script(lines.slice(0, l).join('\n'));
            } catch (err) {
                if (err.message === e.message) {
                    errorLine = l;
                    console.log(`Approx error line in script: ${l}`);
                    console.log(`Line content: ${lines[l - 1]}`);

                    // Calculate absolute line in Dashboard.html
                    // The starting line of the `<script>` tag
                    const textBefore = html.substring(0, match.index);
                    const absoluteStartLine = textBefore.split('\n').length;
                    console.log(`Absolute error line in Dashboard.html: ${absoluteStartLine + l}`);
                    break;
                }
            }
        }
    }
    i++;
}
