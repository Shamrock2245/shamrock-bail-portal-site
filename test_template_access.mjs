
import fetch from 'node-fetch';

import { GAS_URL } from './test_config.mjs';

async function testTemplateAccess() {
    console.log('Testing Drive Template Access...');

    try {
        // API Key MUST be in the body for GAS doPost validation
        const payload = {
            action: 'getPDFTemplates',
            templateIds: ['indemnity-agreement'],
            apiKey: 'shamrock_placeholder_redacted_for_git'
        };

        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'x-api-key': ... NOT used by GAS doPost
            },
            body: JSON.stringify(payload),
            follow: 'max'
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP Error ${response.status}: ${text.substring(0, 200)}`);
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON:", text.substring(0, 500));
            throw new Error("Invalid JSON response");
        }

        if (data.success && data.templates && data.templates['indemnity-agreement'].success) {
            console.log('✅ Template Access Confirmed!');
            console.log('PDF Base64 Length:', data.templates['indemnity-agreement'].pdfBase64.length);
        } else {
            console.error('❌ Template Fetch Failed:', data);
        }

    } catch (error) {
        console.error('❌ Test Endpoint Error:', error);
    }
}

testTemplateAccess();
