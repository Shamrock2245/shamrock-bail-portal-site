/**
 * Document Duplication Logic
 * 
 * ADD THESE FUNCTIONS TO Dashboard_FIXED.html
 * 
 * Handles:
 * 1. SSA Release duplication (one per person: defendant + each indemnitor)
 * 2. Appearance Bond duplication (one per charge)
 */

/**
 * Duplicate documents based on charges and indemnitors
 * Called AFTER fetchPDFsFromDrive and BEFORE fillPDFsWithData
 * 
 * @param {Array} pdfDocs - Array of PDF document objects from fetchPDFsFromDrive
 * @param {Object} formData - Form data with charges and indemnitors
 * @returns {Array} - Expanded array with duplicated documents
 */
async function duplicateDocuments(pdfDocs, formData) {
    const { PDFDocument } = PDFLib;
    const expandedDocs = [];

    console.log('Starting document duplication...');

    for (const doc of pdfDocs) {
        // SSA Release: Duplicate for each person (defendant + indemnitors)
        if (doc.key === 'ssa-release') {
            const personCount = 1 + (formData.indemnitors ? formData.indemnitors.length : 0);
            console.log(`Duplicating SSA Release for ${personCount} people...`);

            // Defendant SSA Release
            expandedDocs.push({
                ...doc,
                key: 'ssa-release-defendant',
                name: 'SSA Release - Defendant',
                personType: 'defendant',
                personIndex: -1
            });

            // Indemnitor SSA Releases
            if (formData.indemnitors && formData.indemnitors.length > 0) {
                for (let i = 0; i < formData.indemnitors.length; i++) {
                    const indemnitor = formData.indemnitors[i];
                    expandedDocs.push({
                        ...doc,
                        key: `ssa-release-indemnitor-${i + 1}`,
                        name: `SSA Release - ${indemnitor.firstName} ${indemnitor.lastName}`,
                        personType: 'indemnitor',
                        personIndex: i
                    });
                }
            }

            console.log(`✓ Created ${personCount} SSA Release documents`);
        }
        // Appearance Bond: Duplicate for each charge and each power number
        else if (doc.key === 'appearance-bond') {
            const charges = formData.charges || [null];
            let bondIndex = 1;
            console.log(`Duplicating Appearance Bond for ${charges.length} charges...`);

            for (let i = 0; i < charges.length; i++) {
                const charge = charges[i];

                // Split power numbers by comma, semicolon, space, or newline
                const powerNumbers = charge && charge.powerNumber
                    ? charge.powerNumber.split(/[,;\s]+/).filter(Boolean)
                    : [null];

                // Ensure at least one bond per charge
                if (powerNumbers.length === 0) powerNumbers.push(null);

                for (let j = 0; j < powerNumbers.length; j++) {
                    const powerNum = powerNumbers[j];
                    expandedDocs.push({
                        ...doc,
                        key: `appearance-bond-${bondIndex}`,
                        name: `Appearance Bond - Bond ${bondIndex}`,
                        chargeIndex: i,
                        powerIndex: j,
                        specificPowerNum: powerNum,
                        chargeData: charge
                    });
                    bondIndex++;
                }
            }

            console.log(`✓ Created ${bondIndex - 1} Appearance Bond documents`);
        }
        // All other documents: Keep as-is
        else {
            expandedDocs.push(doc);
        }
    }

    console.log(`Document duplication complete: ${pdfDocs.length} → ${expandedDocs.length} documents`);
    return expandedDocs;
}

/**
 * Enhanced fillPDFsWithData that handles duplicated documents
 * REPLACES the existing fillPDFsWithData function
 */
async function fillPDFsWithData_Enhanced(pdfDocs, formData) {
    const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } = PDFLib;
    const filledPdfs = [];

    console.log(`Starting to fill ${pdfDocs.length} documents...`);
    console.log('Form data structure:', {
        defendantName: formData['defendant-first-name'],
        indemnitorCount: formData.indemnitors ? formData.indemnitors.length : 0,
        chargesCount: formData.charges ? formData.charges.length : 0
    });

    for (const doc of pdfDocs) {
        try {
            console.log(`Filling ${doc.key}...`);
            const pdfDoc = await PDFDocument.load(doc.bytes);
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            let fieldCount = 0;
            let skippedFields = [];

            // Create modified formData for this specific document
            const docFormData = { ...formData };

            // SSA Release: Override with specific person's data
            if (doc.key.startsWith('ssa-release-')) {
                if (doc.personType === 'defendant') {
                    // Defendant SSA Release - use defendant data
                    console.log('  → SSA Release for Defendant');
                }
                else if (doc.personType === 'indemnitor' && doc.personIndex >= 0) {
                    // Indemnitor SSA Release - use specific indemnitor data
                    const ind = formData.indemnitors[doc.personIndex];
                    console.log(`  → SSA Release for Indemnitor ${doc.personIndex + 1}: ${ind.firstName} ${ind.lastName}`);

                    // Override primary fields with this indemnitor's data
                    // (SSA Release is signed by the person, so their name goes in the signature field)
                    docFormData['signer-name'] = `${ind.firstName} ${ind.lastName}`;
                    docFormData['signer-dob'] = ind.dob;
                    docFormData['signer-ssn'] = ind.ssn;
                }
            }

            // Appearance Bond: Override with specific charge and power data
            if (doc.key.startsWith('appearance-bond-') && doc.chargeIndex >= 0) {
                const charge = formData.charges[doc.chargeIndex];
                console.log(`  → Appearance Bond for Charge ${doc.chargeIndex + 1} (Power: ${doc.specificPowerNum || charge.powerNumber || 'N/A'}): ${charge.charge || charge.desc || 'Unknown'}`);

                // Override charge-specific fields
                docFormData['CaseNum'] = charge.caseNumber;
                docFormData['PowerNum'] = doc.specificPowerNum || charge.powerNumber;
                docFormData['charge-description'] = charge.charge || charge.desc; // Note: Dashboard.html uses 'charge', earlier logic used 'desc'
                docFormData['bond-amount'] = charge.bondAmount;
                docFormData['TotalBond'] = charge.bondAmount;
                docFormData['numericBondAmount'] = charge.bondAmount;
            }

            // Fill fields
            for (const field of fields) {
                const fieldName = field.getName();
                const fieldNameNormalized = normalizeFieldName(fieldName);

                // Try multiple lookup strategies
                let value = docFormData[fieldNameNormalized]
                    || docFormData[`defendant-${fieldNameNormalized}`]
                    || mapFieldToData(fieldNameNormalized, docFormData)
                    || mapFieldToData(fieldName, docFormData); // Try original name too

                if (value !== null && value !== undefined && value !== '') {
                    try {
                        if (field instanceof PDFTextField) {
                            field.setText(String(value));
                            fieldCount++;
                            console.log(`  ✓ Filled: ${fieldName} = ${String(value).substring(0, 50)}`);
                        } else if (field instanceof PDFCheckBox) {
                            if (value === true || value === 'true' || value === 'yes' || value === '1') {
                                field.check();
                                fieldCount++;
                                console.log(`  ✓ Checked: ${fieldName}`);
                            }
                        } else if (field instanceof PDFDropdown) {
                            field.select(String(value));
                            fieldCount++;
                            console.log(`  ✓ Selected: ${fieldName} = ${value}`);
                        }
                    } catch (fieldErr) {
                        console.warn(`  ⚠️ Could not set field ${fieldName}:`, fieldErr.message);
                    }
                } else {
                    skippedFields.push(fieldName);
                }
            }

            if (skippedFields.length > 0) {
                console.log(`  ⚠️ Skipped ${skippedFields.length} empty fields:`, skippedFields.slice(0, 10));
            }

            const filledBytes = await pdfDoc.save();
            filledPdfs.push({ key: doc.key, name: doc.name, bytes: filledBytes });
            console.log(`✓ Successfully filled ${doc.key} (${fieldCount} fields filled, ${skippedFields.length} skipped)`);
        } catch (err) {
            console.error(`❌ Error filling ${doc.key}:`, err);
            filledPdfs.push(doc); // Fall back to empty doc
        }
    }
    return filledPdfs;
}

/**
 * Updated generateAndSendWithWixPortal workflow
 * REPLACES the existing workflow to include document duplication
 */
async function generateAndSendWithWixPortal_WithDuplication() {
    console.log('Starting packet generation with document duplication...');

    try {
        // Step 1: Validate form data
        const formData = collectFormData();
        if (!validateFormData(formData)) {
            throw new Error('Form validation failed');
        }

        // Step 2: Fetch PDFs from Google Drive
        showStatus('Fetching PDF templates...');
        const pdfs = await fetchPDFsFromDrive(getSelectedDocuments(true)); // Include print-only

        // Step 3: DUPLICATE DOCUMENTS (SSA Release + Appearance Bonds)
        showStatus('Preparing documents...');
        const expandedPDFs = await duplicateDocuments(pdfs, formData);

        // Step 4: Fill PDFs with data
        showStatus('Filling PDF forms...');
        const filledPDFs = await fillPDFsWithData_Enhanced(expandedPDFs, formData);

        // Step 5: Separate SignNow docs from print-only docs
        const signNowDocs = filledPDFs.filter(doc => !doc.key.startsWith('appearance-bond'));
        const printOnlyDocs = filledPDFs.filter(doc => doc.key.startsWith('appearance-bond'));

        // Step 6: Merge SignNow PDFs into single packet
        showStatus('Merging documents for signing...');
        const mergedSignNowPDF = await mergePDFs(signNowDocs);

        // Step 7: Merge print-only PDFs separately
        const mergedPrintOnlyPDF = await mergePDFs(printOnlyDocs);

        // Step 8: Upload merged PDFs to temporary storage
        showStatus('Uploading packets...');
        const signNowPdfUrl = await uploadPDFToTempStorage(mergedSignNowPDF, formData, 'signing');
        const printOnlyPdfUrl = await uploadPDFToTempStorage(mergedPrintOnlyPDF, formData, 'print');

        // Step 9: Prepare signature fields from CONFIG
        const signatureFields = prepareSignatureFields(formData);

        // Step 10: Prepare signers list
        const signers = prepareSignersList(formData);

        // Step 11: Send to SignNow via Wix backend
        showStatus('Sending to SignNow...');
        const result = await sendToSignNow(signNowPdfUrl, signatureFields, signers, formData);

        // Step 12: Store signing links in Wix CMS
        showStatus('Storing signing links...');
        await storePendingDocument(result, formData);

        // Step 13: Store print-only PDF in Google Drive
        showStatus('Filing appearance bonds...');
        await storePrintOnlyPDF(printOnlyPdfUrl, formData);

        // Step 14: Send notifications
        showStatus('Sending notifications...');
        await sendSigningNotifications(result, formData);

        // Success!
        showSuccess(`Packet sent successfully! 
        - ${signNowDocs.length} documents sent for signing
        - ${printOnlyDocs.length} appearance bonds ready for print`);

        console.log('Complete workflow finished:', result);

        return result;

    } catch (error) {
        console.error('Failed to generate and send packet:', error);
        showError(`Failed to send packet: ${error.message}`);
        throw error;
    }
}

/**
 * Upload PDF to temporary storage with type suffix
 */
async function uploadPDFToTempStorage(pdfBlob, formData, type) {
    try {
        const filename = `Temp_${type}_${formData['defendant-last-name']}_${Date.now()}.pdf`;

        const file = DriveApp.getFolderById(CONFIG.tempFolderId)
            .createFile(pdfBlob)
            .setName(filename)
            .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const url = `https://drive.google.com/uc?export=download&id=${file.getId()}`;

        console.log(`PDF uploaded to temp storage: ${url}`);
        return url;
    } catch (error) {
        console.error('Failed to upload PDF to temp storage:', error);
        throw error;
    }
}

/**
 * Store print-only PDF (appearance bonds) in Google Drive
 */
async function storePrintOnlyPDF(pdfUrl, formData) {
    try {
        // Download from temp storage
        const response = await UrlFetchApp.fetch(pdfUrl);
        const pdfBlob = response.getBlob();

        // Create filename
        const defendantName = `${formData['defendant-last-name']}${formData['defendant-first-name'].substring(0, 3)}`;
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const folderName = `${defendantName}${date}`;
        const filename = `Appearance_Bonds_${folderName}.pdf`;

        // Get or create defendant folder
        const completedBondsFolder = DriveApp.getFolderById(CONFIG.completedBondsFolderId);
        let defendantFolder;

        const existingFolders = completedBondsFolder.getFoldersByName(folderName);
        if (existingFolders.hasNext()) {
            defendantFolder = existingFolders.next();
        } else {
            defendantFolder = completedBondsFolder.createFolder(folderName);
        }

        // Save PDF
        defendantFolder.createFile(pdfBlob).setName(filename);

        console.log(`Print-only PDF stored: ${folderName}/${filename}`);
    } catch (error) {
        console.error('Failed to store print-only PDF:', error);
        // Non-fatal - continue workflow
    }
}
