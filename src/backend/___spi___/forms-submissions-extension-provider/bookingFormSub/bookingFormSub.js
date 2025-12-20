/* global console */
// bookingFormSub.js
import { fetch } from 'wix-fetch';

const GAS_WEB_APP_URL = 'https://script.google.com/a/macros/shamrockbailbonds.biz/s/AKfycbzU7hz5OCAZkkdjOZdKK6t7K0whw65iMH-EOzxtSf7KkVCuLvy1X-Las8CgGdTMw8pOpg/exec';

/**
 * Custom form submission handler for Velo SPI
 * Sends form data to the centralized GAS backend for lead ingestion
 * 
 * @param {import('interfaces-forms-v4-submission-extension').FormSubmissionSpiExtensionSubmissionData} submissionData 
 */
export async function customFormHandler(submissionData) {
    const { formData, formId } = submissionData;

    try {
        console.log(`Processing form submission for Form ID: ${formId}`);

        // Call the GAS Backend to ingest the form data as a lead
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'ingestLead',
                source: 'WixPortal',
                formId: formId,
                data: formData,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`GAS Backend Error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Lead ingestion result:', result);

        // We return the formData as is to Nix; the GAS backend handles the Sheets/Slack logic
        return formData;
    } catch (error) {
        console.error('Failed to process form submission:', error);
        // We still allow the form to save locally in Wix even if GAS fails, 
        // but it's logged for manual reconciliation.
        return formData;
    }
}
