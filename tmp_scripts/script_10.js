

        // =========================================================
        // WIX PORTAL INTEGRATION
        // =========================================================

        /**
        * Configuration for Wix Portal Integration
        */
        const WIX_PORTAL_CONFIG = {
            // Your Wix site URL
            siteUrl: 'https://www.shamrockbailbonds.biz',

            // HTTP function endpoints (these are created by http-functions.js in Wix)
            endpoints: {
                addDocument: '/_functions/documentsAdd',
                batchAdd: '/_functions/documentsBatch',
                updateStatus: '/_functions/documentsStatus'
            },

            // Enable/disable portal integration
            enabled: true,

            // Redirect URL after signing
            redirectUrl: 'https://www.shamrockbailbonds.biz'
        };

        /**
        * Save a signing link to the Wix portal for a specific signer
        *
        * @param {Object} params
                    * @param {string} params.signerEmail - Email of the signer
                    * @param {string} params.signerName - Name of the signer
                    * @param {string} params.signerPhone - Phone of the signer
                    * @param {string} params.signerRole - 'defendant', 'indemnitor', or 'agent'
                    * @param {string} params.signingLink - The SignNow signing link
                    * @param {string} params.documentId - The SignNow document ID
                    * @param {string} params.defendantName - Full defendant name
                    * @param {string} params.caseNumber - Case number
                    * @param {string} params.documentName - Name of the document packet
                    * @returns {Promise < Object >} Result of the save operation
                    */
        async function saveSigningLinkToWixPortal(params) {
            if (!WIX_PORTAL_CONFIG.enabled) return { success: false, reason: 'disabled' };
            // Wrap single item as batch
            const doc = {
                signerEmail: params.signerEmail,
                signerName: params.signerName,
                signerPhone: params.signerPhone,
                signerRole: params.signerRole,
                signingLink: params.signingLink,
                documentId: params.documentId,
                defendantName: params.defendantName,
                caseNumber: params.caseNumber || '',
                documentName: params.documentName || 'Bail Bond Packet',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
            return batchSaveToWixPortal([doc]);
        }

        async function batchSaveToWixPortal(documents) {
            if (!WIX_PORTAL_CONFIG.enabled) return { success: false, reason: 'disabled' };

            // Call Server-Side Logic (Secure)
            try {
                const result = await callGAS('batchSaveToWixPortal', { documents: documents });
                console.log('Batch save to Wix portal (via GAS):', result);
                return result;
            } catch (error) {
                console.error('Error batch saving to Wix portal:', error);
                return { success: false, error: error.message };
            }
        }



        // --- Indemnitor Profile Fetch ---
        function fetchIndemnitorProfile() {
            const email = document.getElementById('signer-indemnitor-email').value;
            if (!email || !email.includes('@')) {
                alert('Please enter a valid Indemnitor Email first.');
                return;
            }

            UI.showLoading('Fetching Profile', 'Searching Shamrock database...');

            google.script.run
                .withSuccessHandler(function (response) {
                    UI.hideLoading();

                    if (response && response.success && response.profile) {
                        const p = response.profile;
                        // Auto-fill fields if they obtain data
                        if (p.firstName || p.lastName) {
                            const fullName = (p.firstName + ' ' + p.lastName).trim();
                            if (document.getElementById('indemnitor-full-name')) {
                                document.getElementById('indemnitor-full-name').value = fullName;
                            }
                        }
                        if (p.phone && document.getElementById('signer-indemnitor-phone')) {
                            document.getElementById('signer-indemnitor-phone').value = p.phone;
                        }
                        if (p.address && document.getElementById('indemnitor-street')) {
                            // Try to parse address object or string
                            if (typeof p.address === 'object') {
                                if (p.address.formatted) document.getElementById('indemnitor-street').value = p.address.formatted;
                                if (p.address.city && document.getElementById('indemnitor-city')) document.getElementById('indemnitor-city').value =
                                    p.address.city;
                                if (p.address.state && document.getElementById('indemnitor-state'))
                                    document.getElementById('indemnitor-state').value = p.address.state;
                                if (p.address.postalCode && document.getElementById('indemnitor-zip'))
                                    document.getElementById('indemnitor-zip').value = p.address.postalCode;
                            } else {
                                document.getElementById('indemnitor-street').value = p.address;
                            }
                        }
                        // Also fill email if empty (redundant but safe)
                        if (p.email && document.getElementById('signer-indemnitor-email')) {
                            document.getElementById('signer-indemnitor-email').value = p.email;
                        }

                        // Also fill Phone in the main form if it exists
                        if (p.phone && document.getElementById('indemnitor-phone')) {
                            document.getElementById('indemnitor-phone').value = p.phone;
                        }

                        UI.showToast('✅ Profile data found and applied!', 'success');
                    } else {
                        UI.showToast('⚠️ Profile not found for this email.', 'warning');
                    }
                })
                .withFailureHandler(function (err) {
                    UI.hideLoading();
                    UI.showToast('Error fetching profile: ' + err.message, 'error');
                })
                .doPostFromClient({
                    action: 'fetchIndemnitorProfile',
                    email: email
                });
        }


        console.log('Wix Portal Integration module loaded');
    