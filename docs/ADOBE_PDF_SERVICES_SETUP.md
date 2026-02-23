# Adobe PDF Services Integration Setup

## Overview

Adobe PDF Services API is integrated into the Shamrock Bail Bonds Portal to enable automated PDF form filling with perfect field alignment. This replaces manual coordinate-based PDF generation with a robust, API-driven approach.

## Credentials

The following Adobe PDF Services credentials are configured:

- **Client ID (API Key):** `481ba3ec053f43c1a163c2cbe31d4104`
- **Client Secret:** `p8e-S7lWomVgmh9aAe3fNyw-aYN9UJGEUAG_`
- **Organization ID:** `90F92718699C7D0D0A495C63@AdobeOrg`

## Configuration in Google Apps Script

### Script Properties

The credentials must be stored in Script Properties for secure access:

1. Open the Google Apps Script project: https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit
2. Go to **Project Settings** (gear icon)
3. Scroll to **Script Properties**
4. Add the following properties:

| Property Name | Value |
|--------------|-------|
| `ADOBE_CLIENT_ID` | `481ba3ec053f43c1a163c2cbe31d4104` |
| `ADOBE_CLIENT_SECRET` | `p8e-S7lWomVgmh9aAe3fNyw-aYN9UJGEUAG_` |

## How It Works

### Workflow

1. **Template PDF:** The OSI Defendant Application PDF (or other forms) is stored in Google Drive with properly named form fields
2. **Data Mapping:** Intake data from Dashboard.html is mapped to PDF field names using the Master Data Dictionary
3. **Adobe API Call:** The `AdobePDFService.fillPdfForm()` function:
   - Gets an Adobe access token
   - Uploads the template PDF to Adobe
   - Submits form data via the "Import PDF Form Data" API
   - Polls for job completion
   - Downloads the filled PDF
4. **SignNow Integration:** The filled PDF is sent to SignNow for signature collection
5. **Google Drive Storage:** Completed documents are filed in Google Drive

### API Endpoints

- **Token:** `POST https://pdf-services.adobe.io/token`
- **Upload Asset:** `POST https://pdf-services.adobe.io/assets`
- **Import Form Data:** `POST https://pdf-services.adobe.io/operation/setformdata`
- **Poll Job Status:** `GET {job_location_url}`
- **Download Asset:** `GET https://pdf-services.adobe.io/assets/{assetID}`

## Usage Example

```javascript
// In Dashboard.html or Code.gs

// 1. Get template PDF from Drive
const templateFile = DriveApp.getFileById('1eFwOUAf4Wtlkux4DZkI9d3IJVVC-JLV9Zv5wLzG86o8');
const templatePdfBlob = templateFile.getBlob();

// 2. Map intake data to form fields
const formData = AdobePDFService.mapIntakeDataToDefendantApplication(intakeData);

// 3. Fill the form
const filledPdfBlob = AdobePDFService.fillPdfForm(templatePdfBlob, formData);

// 4. Send to SignNow or save to Drive
const savedFile = DriveApp.createFile(filledPdfBlob);
```

## Benefits

✅ **Perfect Field Alignment:** Adobe API understands PDF form structure natively - no manual coordinate guessing  
✅ **Robust & Reliable:** Enterprise-grade API with proper error handling  
✅ **Consistent Formatting:** Fields fill uniformly with proper font, size, and fit  
✅ **SignNow Compatible:** Filled PDFs work seamlessly with SignNow signature placement  
✅ **Master Data Dictionary Compliance:** Field names match the project standard exactly  

## Testing

Run the test function in `AdobePDFService.gs`:

```javascript
testAdobePdfFilling()
```

This will:
1. Load the OSI Defendant Application template
2. Fill it with test data
3. Save the filled PDF to Google Drive
4. Log the Drive URL for inspection

## Troubleshooting

### Error: "Adobe credentials not configured"
- Verify Script Properties are set correctly in the GAS project
- Check that property names match exactly: `ADOBE_CLIENT_ID` and `ADOBE_CLIENT_SECRET`

### Error: "Failed to get Adobe access token"
- Verify credentials are correct
- Check that the Adobe API credentials are still active (they don't expire)

### Error: "Job failed" or "Job timed out"
- Check that the template PDF has properly named form fields
- Verify form data keys match the field names in the PDF exactly (case-sensitive)
- Check Adobe API status: https://status.adobe.com/

## PDF Template Requirements

For Adobe PDF Services to work correctly, template PDFs must have:

1. **AcroForm fields:** Standard PDF form fields (not XFA or other formats)
2. **Unique field names:** No duplicate or stacked fields
3. **Master Data Dictionary compliance:** Field names must match the project standard (DefName, DefDOB, etc.)
4. **Zero overlaps:** Fields must not overlap visually or in coordinates
5. **Proper field types:** Text fields for text, checkboxes for checkboxes, signature fields for signatures

## Next Steps

1. ✅ Configure Script Properties with Adobe credentials
2. ✅ Test `AdobePDFService.fillPdfForm()` with OSI Defendant Application
3. ⬜ Integrate into Dashboard.html workflow
4. ⬜ Add mapping functions for other forms (Indemnity Agreement, Promissory Note, etc.)
5. ⬜ Connect filled PDFs to SignNow API for signature collection

## Resources

- Adobe PDF Services API Documentation: https://developer.adobe.com/document-services/docs/overview/pdf-services-api/
- Import PDF Form Data API: https://developer.adobe.com/document-services/docs/overview/pdf-services-api/howtos/import-pdf-form-data/
- Adobe API Reference: https://developer.adobe.com/document-services/docs/apis/
