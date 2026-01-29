/**
 * health-check.js
 * 
 * Purpose: A manual pinger to test if the GAS Endpoint is alive and receiving requests.
 * Usage: Run this in a Velo Backend function (e.g., jobs.config) or manually.
 * 
 * Note: This requires the 'node-fetch' equivalent in Velo (wix-fetch).
 */

import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

export async function runHealthCheck() {
    console.log("🏥 Health Check: Starting...");

    try {
        const url = await getSecret('GAS_WEB_APP_URL');
        const apiKey = await getSecret('GAS_API_KEY');

        if (!url || !apiKey) {
            throw new Error("Missing Secrets: GAS_WEB_APP_URL or GAS_API_KEY");
        }

        const payload = {
            action: "healthCheck",
            apiKey: apiKey,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`GAS Endpoint Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log("✅ Health Check PASSED: GAS is online.");
            return { status: 'healthy', latency: 'OK' };
        } else {
            console.error("❌ Health Check FAILED: GAS returned error.", data);
            return { status: 'unhealthy', error: data.error };
        }

    } catch (error) {
        console.error("🚨 Health Check CRITICAL FAILURE:", error.message);
        return { status: 'critical', error: error.message };
    }
}
