const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function inspectPdf(filename) {
    const filePath = path.join('/Users/brendan/Desktop/osi-final-pdfs', filename);
    console.log(`Inspecting ${filename}...`);
    try {
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        console.log(`Found ${fields.length} fields in ${filename}`);
        fields.forEach(field => {
            const type = field.constructor.name;
            const name = field.getName();
            let isReadOnly = false;
            try {
                isReadOnly = field.isReadOnly();
            } catch (e) { }
            console.log(`- ${name} (${type}) [ReadOnly: ${isReadOnly}]`);
        });
    } catch (err) {
        console.error(`Error inspecting ${filename}:`, err);
    }
}

async function run() {
    const dir = '/Users/brendan/Desktop/osi-final-pdfs';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    for (const file of files) {
        await inspectPdf(file);
        console.log('---');
    }
}

run();
