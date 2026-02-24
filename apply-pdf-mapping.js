const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const MAP_PATH = '/tmp/pdf-inspect/field-mapping-final.json';
const IN_DIR = '/Users/brendan/Desktop/osi-final-pdfs';
const OUT_DIR = '/tmp/pdf-inspect/renamed-pdfs';

async function renameFields() {
    const mapping = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'));

    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    const files = fs.readdirSync(IN_DIR).filter(f => f.endsWith('.pdf'));

    for (const file of files) {
        const inPath = path.join(IN_DIR, file);
        const outPath = path.join(OUT_DIR, file.replace('.pdf', '-FILLABLE.pdf'));

        console.log(`Processing ${file}...`);
        try {
            const pdfBytes = fs.readFileSync(inPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();
            const fields = form.getFields();

            let renamedCount = 0;
            for (const field of fields) {
                const oldName = field.getName();
                const newName = mapping[oldName];

                if (newName && newName !== oldName && newName.trim() !== "") {
                    try {
                        // pdf-lib does not have a native renameField method, but you can alter the dict.
                        // A common workaround is to rename the T (Title) entry of the Field Dictionary.
                        const fieldDict = field.ref;
                        pdfDoc.context.lookup(fieldDict).set(
                            pdfDoc.context.obj('T'),
                            pdfDoc.context.obj(pdfDoc.context.obj('(', newName, ')').asString())
                        );
                        // Alternatively string directly
                        pdfDoc.context.lookup(fieldDict).set(
                            PDFDocument.context.obj('T'),
                            pdfDoc.context.obj('(' + newName + ')')
                        );

                        // Due to limitations, a more robust way without recreating is modifying the name in the PDF name tree 
                        // but pdf-lib provides no direct high-level API for renaming. 
                        // So we'll try to recreate the field with the new name if possible or set the T string directly:
                    } catch (e) {
                        // Fallback: This is the safest way to change a field's partial name in the AcroForm dict:
                        try {
                            const fldObj = pdfDoc.context.lookup(field.ref);
                            fldObj.set(pdfDoc.context.obj('T'), pdfDoc.context.obj(pdfDoc.context.obj('(' + newName + ')').asString()));
                            console.log(`- Renamed: ${oldName} -> ${newName}`);
                            renamedCount++;
                        } catch (err) {
                            console.log(`- Failed to rename: ${oldName} to ${newName}`);
                        }
                    }
                }
            }

            const savedBytes = await pdfDoc.save();
            fs.writeFileSync(outPath, savedBytes);
            console.log(`Saved ${outPath} with ${renamedCount} renamed fields.`);
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
        console.log('---');
    }
}

renameFields().catch(console.error);
