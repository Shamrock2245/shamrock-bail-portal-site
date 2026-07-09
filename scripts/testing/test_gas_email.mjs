
import fetch from 'node-fetch';

// 1. GAS_URL + GAS_API_KEY from env (see test_config.mjs / .env.example)
import { GAS_URL, getGasApiKey } from './test_config.mjs';

async function testEmail() {
    console.log("Testing GAS Email Endpoint...");
    console.log("Target URL:", GAS_URL);

    let apiKey;
    try {
        apiKey = getGasApiKey();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
                apiKey,
                action: 'sendEmail',
                to: 'shamrockbailoffice@gmail.com', // Sending to yourself
                subject: 'TEST EMAIL from Node Script',
                htmlBody: '<h1>It Works!</h1><p>The GAS backend is reachable.</p>'
            })
        });

        const text = await response.text();
        console.log("Response Status:", response.status);
        console.log("Response Body:", text);

        if (response.ok && text.includes("success")) {
            console.log("\n✅ SUCCESS! The GAS URL is correct and the code works.");
            console.log("👉 If this works, but Wix fails, check for WHITESPACE in Wix Secrets Manager.");
        } else {
            console.log("\n❌ FAILURE. The script is unreachable or returning an error.");
            console.log("👉 Check 'Who has access' is set to 'Anyone' in GAS Deployment.");
        }

    } catch (e) {
        console.error("Connectivity Error:", e);
    }
}

testEmail();
