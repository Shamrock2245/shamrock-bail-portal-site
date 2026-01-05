import fetch from 'node-fetch';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxNfCimon-vIniv5efNJkE0EJf9t-SKjoDjW1GqPXgvRnJd9-Sfems4d50NFz3nAEQpew/exec';

// --- MOCK DATA ---
const MOCK_PDF_BASE64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCisgICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqCjw8IC9MZW5ndGggNDQgPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgwoSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjU1IDAwMDAwIG4gCjAwMDAwMDAzNDQgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDQxCiUlRU9GCQ==";

async function testHealth() {
    console.log("Testing Connectivity...");
    try {
        const response = await fetch(GAS_URL + '?action=health');
        if (response.ok) {
            const text = await response.text();
            console.log("Health Check Response:", text);
            return true;
        } else {
            console.error("Health Check Failed:", response.status, response.statusText);
            const text = await response.text();
            console.error("Response body:", text);
            return false;
        }
    } catch (e) {
        console.error("Connectivity Error:", e);
        return false;
    }
}

// 4. Robust Test (Split Steps) to handle raw PDF
async function testRobustFlow() {
    console.log("\n--- Testing Robust Split Flow (Upload -> Fields -> Invite) ---");

    // Step 1: Upload
    let docId = null;
    try {
        console.log("1. Uploading...");
        const res = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'uploadToSignNow',
                pdfBase64: MOCK_PDF_BASE64,
                fileName: 'Robust_Test_Doc.pdf'
            })
        });
        const json = await res.json();
        if (json.success) {
            docId = json.documentId;
            console.log("   Upload Success. ID:", docId);
        } else {
            console.error("   Upload Failed:", JSON.stringify(json));
            return;
        }
    } catch (e) { console.error("   Upload Error:", e); return; }

    // Step 2: Add Fields
    try {
        console.log("2. Adding Fields...");
        const fieldsPayload = {
            action: 'addSignatureFields',
            documentId: docId,
            fields: [
                {
                    type: 'signature', x: 100, y: 100, width: 200, height: 50, page_number: 0, role: 'Defendant', required: true, name: 'Sig1'
                }
            ]
        };
        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(fieldsPayload) });
        const json = await res.json();
        console.log("   Add Fields Result:", JSON.stringify(json));
    } catch (e) {
        console.error("   Add Fields Error:", e);
    }

    // Step 3: Invite
    try {
        console.log("3. Sending Invite...");
        const invitePayload = {
            action: 'createSigningRequest',
            documentId: docId,
            fromEmail: 'admin@shamrockbailbonds.biz',
            signers: [{ email: 'brendan@shamrockbailbonds.biz', role: 'Defendant' }],
            subject: 'Robust Flow Test',
            message: 'Testing split flow'
        };
        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(invitePayload) });
        const json = await res.json();
        console.log("   Invite Result:", JSON.stringify(json));
    } catch (e) {
        console.error("   Invite Error:", e);
    }

    // Step 4: Link (Kiosk)
    try {
        console.log("4. Creating Kiosk Link...");
        const linkPayload = {
            action: 'createEmbeddedLink',
            documentId: docId,
            signerEmail: 'brendan@shamrockbailbonds.biz',
            signerRole: 'Defendant'
        };
        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(linkPayload) });
        const json = await res.json();
        console.log("   Link Result:", JSON.stringify(json));
    } catch (e) {
        console.error("   Link Error:", e);
    }
}

async function run() {
    const health = await testHealth();
    if (!health) return;

    await testRobustFlow();
}

run();
