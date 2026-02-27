        window.onerror = function (msg, url, line, col, error) {
            const box = document.getElementById('debug-error-box');
            if (box) {
                box.style.display = 'block';
                box.innerHTML += '<div><strong>Error:</strong> ' + msg + '<br>Line: ' + line + '</div><hr>';
            }
            // Also force overlay hide just in case
            const overlay = document.getElementById('progress-overlay');
            if (overlay) overlay.style.display = 'none';
        };
        function onMapsApiLoaded() {
            // Signal global readiness
            window.isGoogleMapsLoaded = true;
            console.log("📍 Google Maps API Loaded via Callback");
            // If main app is already running, try to init maps
            if (window.ShamrockApp && window.ShamrockApp.Maps) {
                window.ShamrockApp.Maps.tryInit();
            }
        }
        (function () {
            try {
                // Auto-redirect to Mobile/Tablet if not already set
                var params = new URLSearchParams(window.location.search);
                if (!params.has('page')) {
                    var ua = navigator.userAgent.toLowerCase();
                    var width = window.innerWidth;
                    var targetPage = null;

                    // Priority 1: User Agent Detection (most reliable for device type)
                    if (/iphone|ipod|android.*mobile|windows phone|blackberry|bb10|mobile/i.test(ua)) {
                        targetPage = 'mobile';
                    } else if (/ipad|android(?!.*mobile)|tablet|kindle|silk|playbook/i.test(ua)) {
                        targetPage = 'tablet';
                    }
                    // Priority 2: Screen Width (fallback for unrecognized devices)
                    else if (width <= 600) {
                        targetPage = 'mobile';
                    } else if (width <= 1024) {
                        targetPage = 'tablet';
                    }
                    // Priority 3: Desktop (default)
                    else {
                        targetPage = null; // Stay on desktop
                    }

                    // Redirect if mobile or tablet detected
                    if (targetPage) {
                        console.log('📱 Auto-detected device:', targetPage, '| UA:', ua.substring(0, 50), '| Width:', width);
                        params.set('page', targetPage);
                        window.location.search = params.toString();
                    } else {
                        console.log('💻 Desktop version loaded | Width:', width);
                    }
                }
            } catch (e) {
                console.warn("Device detection failed:", e);
            }
        })();
        (function () {
            var dataDiv = document.getElementById('server-data-injection');
            window.INJECTED_DATA = JSON.parse(dataDiv.getAttribute('data-json') || 'null');
        })();
        /* =========================================================
           UI CONTROLLER (Loading, Toasts, Feedback)
           ========================================================= */
        const UI = {
            // Toast Notification System
            showToast: function (message, type = 'info') {
                const container = document.getElementById('toast-container');
                if (!container) return console.warn('Toast container missing');

                const toast = document.createElement('div');
                toast.className = `toast ${type}`;

                let icon = '&#8505;'; // Info i
                if (type === 'success') icon = '&#10004;'; // Check
                if (type === 'error') icon = '&#10008;'; // X
                if (type === 'warning') icon = '&#9888;'; // Warning

                toast.innerHTML = `<span style="font-size:18px;">${icon}</span> <span>${message}</span>`;

                container.appendChild(toast);

                // Animate in
                requestAnimationFrame(() => toast.classList.add('show'));

                // Auto remove
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 4000);
            },

            // Loading Overlay System
            showLoading: function (title = 'Processing...', message = 'Please wait') {
                const overlay = document.getElementById('progress-overlay');
                if (!overlay) return;

                document.getElementById('progress-title').textContent = title;
                document.getElementById('progress-message').textContent = message;
                document.getElementById('progress-fill').style.width = '0%';

                overlay.classList.add('active');

                // Indeterminate animation start
                this.loadingInterval = setInterval(() => {
                    const fill = document.getElementById('progress-fill');
                    let w = parseFloat(fill.style.width) || 0;
                    if (w < 90) fill.style.width = (w + (90 - w) * 0.05) + '%';
                }, 200);
            },

            updateLoading: function (percent, message) {
                if (this.loadingInterval) clearInterval(this.loadingInterval);

                const fill = document.getElementById('progress-fill');
                if (fill) fill.style.width = `${percent}%`;

                if (message) {
                    const msgEl = document.getElementById('progress-message');
                    if (msgEl) msgEl.textContent = message;
                }
            },

            hideLoading: function () {
                if (this.loadingInterval) clearInterval(this.loadingInterval);

                const fill = document.getElementById('progress-fill');
                if (fill) fill.style.width = '100%';

                setTimeout(() => {
                    const overlay = document.getElementById('progress-overlay');
                    if (overlay) overlay.classList.remove('active');
                    // Reset width for next time after transition
                    setTimeout(() => { if (fill) fill.style.width = '0%'; }, 300);
                }, 400); // Short delay to see 100%
            },

            switchTab: function (btn, tabId) {
                // Harmonize with global switchTab logic (append -tab)
                const targetId = tabId.endsWith('-tab') ? tabId : `${tabId}-tab`;

                document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => {
                    c.classList.remove('active');
                    c.style.display = 'none'; // Enforce hide
                });

                if (btn) btn.classList.add('active');
                else {
                    // Try to find matching button to activate it visually
                    const targetBtn = document.querySelector(`[onclick*="'${tabId}'"]`);
                    if (targetBtn) targetBtn.classList.add('active');
                }

                const content = document.getElementById(targetId);
                if (content) {
                    content.classList.add('active');
                    content.style.display = 'block';

                    // FIX: Correct ID check and Object Access
                    if (targetId === 'map-tab' && window.ShamrockApp && window.ShamrockApp.Maps) {
                        window.ShamrockApp.Maps.tryInit();
                        if (window.ShamrockApp.Maps.map) {
                            try { google.maps.event.trigger(window.ShamrockApp.Maps.map, "resize"); } catch (e) { }
                        }
                    }
                } else {
                    console.warn(`UI.switchTab: Target '${targetId}' not found.`);
                }
            },

            toggleAgentTab: function (btn, agentId) {
                // Update visuals
                const container = btn.closest('.nav-container') || btn.parentElement;
                if (container) {
                    container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    btn.classList.add('active');
                }

                // Switch views
                document.querySelectorAll('.agent-view').forEach(v => v.style.display = 'none');
                const target = document.getElementById(agentId);
                if (target) target.style.display = 'block';
            },

            setHTML: function (id, html) {
                const el = document.getElementById(id);
                if (el) el.innerHTML = html;
            },

            setValue: function (id, val) {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            }
        };

        // Global alias for compatibility
        window.showToast = UI.showToast;

        /* =========================================================
           UI NAVIGATION & CORE HELPERS (Defined first for reliability)
           ========================================================= */
        function switchTab(btn, tabId) {
            console.log(`🔘 switchTab called for: ${tabId}`);

            // Update tab buttons
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(t => t.classList.remove('active'));

            if (btn) {
                btn.classList.add('active');
            } else {
                const targetBtn = document.querySelector(`[onclick*="'${tabId}'"]`);
                if (targetBtn) {
                    targetBtn.classList.add('active');
                } else {
                    console.warn(`⚠️ Button for tab '${tabId}' not found.`);
                }
            }

            // Update tab content
            const contents = document.querySelectorAll('.tab-content');
            console.log(`Found ${contents.length} tab-content elements.`);

            contents.forEach(c => {
                c.classList.remove('active');
                // Check if we accidentally hid everything
                if (c.style.display === 'block') c.style.display = ''; // Reset inline styles
            });

            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
                // Force visibility in case of inline style interference
                targetTab.style.display = 'block';
                targetTab.style.opacity = '1';
                console.log(`✅ Activated tab: ${tabId}-tab`);

                // Lazy Load Map if switched to map tab
                if (tabId === 'map' && window.ShamrockApp && window.ShamrockApp.Maps) {
                    console.log("🗺️ Map Tab Activated - Triggering Init");
                    // Short delay to ensure DOM paint
                    setTimeout(() => window.ShamrockApp.Maps.tryInit(), 100);
                }

                window.scrollTo(0, 0);
            } else {
                console.error(`❌ CRITICAL: Target tab not found: ${tabId}-tab`);
                alert(`Error: Tab content for '${tabId}' is missing.`);
            }
        }

        function openCountyScraper(county) {
            if (CONFIG && CONFIG.countyUrls && CONFIG.countyUrls[county]) {
                const url = CONFIG.countyUrls[county];
                window.open(url, '_blank');
                showToast(`Opening ${county.charAt(0).toUpperCase() + county.slice(1)} County booking blotter`, 'info');
            } else {
                showToast(`Scraper for ${county} is coming soon!`, 'warning');
            }
        }

        /* =========================================================
           CONFIGURATION
           ========================================================= */
        const APP_VERSION = '<?= appVersion ?>' || 'vUNKNOWN';
        const CONFIG = {
            gasWebAppUrl: '<?= gasUrl ?>' || 'https://script.google.com/macros/s/AKfycby5N-lHvM2XzKnX38KSqekq0ENWMLYqYM2bYxuZcRRAQcBhP3RvBaF0CbQa9gKK73QI4w/exec', // AUTO-INJECTED v229
            signNowApiBase: 'https://api.signnow.com',
            // signNowToken moved to Script Properties for security

            // Google Drive Template IDs (from your Templates folder)
            // NOTE: appearance-bond is PRINT ONLY - does NOT go to SignNow
            templates: {
                'paperwork-header': '15sTaIIwhzHk96I8X3rxz7GtLMU-F5zo1',
                'faq-cosigners': '1bjmH2w-XS5Hhe828y_Jmv9DqaS_gSZM7',
                'faq-defendants': '16j9Z8eTii-J_p4o6A2LrzgzptGB8aOhR',
                'indemnity-agreement': '1p4bYIiZ__JnJHhlmVwLyPJZpsmSdGq12',
                'defendant-application': '1cokWm8qCDpiGxYD6suZEjm9i8MoABeVe',
                'promissory-note': '104-ArZiCm3cgfQcT5rIO0x_OWiaw6Ddt',
                'disclosure-form': '1qIIDudp7r3J7-6MHlL2US34RcrU9KZKY',
                'surety-terms': '1VfmyUTpchfwJTlENlR72JxmoE_NCF-uf',
                'master-waiver': '181mgKQN-VxvQOyzDquFs8cFHUN0tjrMs',
                'ssa-release': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu',
                'collateral-receipt': '1IAYq4H2b0N0vPnJN7b2vZPaHg_RNKCmP',
                'payment-plan': '1v-qkaegm6MDymiaPK45JqfXXX2_KOj8A',
                'appearance-bond': '15SDM1oBysTw76bIL7Xt0Uhti8uRZKABs'  // PRINT ONLY - does NOT go to SignNow
            },

            // Document order for SignNow packet (appearance-bond excluded - print only)
            // This is the order documents should be assembled and signed
            templateOrder: [
                'paperwork-header',      // 1. Header with names, case number, date
                'faq-cosigners',         // 2. FAQ for co-signers (initials)
                'faq-defendants',        // 3. FAQ for defendants (initials)
                'indemnity-agreement',   // 4. Indemnitor fills out and signs
                'defendant-application', // 5. Defendant fills out and signs
                'promissory-note',       // 6. Signatures by all parties
                'disclosure-form',       // 7. Signatures by all parties
                'surety-terms',          // 8. Signatures by all parties
                'master-waiver',         // 9. Signatures by all parties
                'ssa-release',           // 10. Signatures by all parties 
                'collateral-receipt',    // 11. Collateral and premium receipt
                'payment-plan'           // 12. Only if payment plan is used
            ],

            // Documents that require print only (not sent to SignNow)
            printOnlyDocs: ['appearance-bond'],

            // Signature/Initials field positions for each document type
            // These are added to SignNow after upload, before sending invites
            // Coordinates calibrated for exact placement on PDF forms
            signatureFields: {
                'paperwork-header': [],
                'faq-cosigners': [
                    { type: 'initials', role: 'Defendant', page_number: 0, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 0, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Defendant', page_number: 1, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 1, x: 502, y: 30, width: 50, height: 22 }
                ],
                'faq-defendants': [
                    { type: 'initials', role: 'Defendant', page_number: 0, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 0, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Defendant', page_number: 1, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 1, x: 502, y: 30, width: 50, height: 22 }
                ],
                'indemnity-agreement': [
                    { type: 'signature', role: 'Indemnitor', page_number: 0, x: 330, y: 95, width: 230, height: 34 }
                ],
                'defendant-application': [
                    { type: 'signature', role: 'Bail Agent', page_number: 0, x: 85, y: 95, width: 210, height: 34 },
                    { type: 'signature', role: 'Defendant', page_number: 0, x: 335, y: 95, width: 210, height: 34 },
                    { type: 'signature', role: 'Defendant', page_number: 1, x: 155, y: 110, width: 300, height: 34 }
                ],
                'promissory-note': [
                    { type: 'signature', role: 'Defendant', page_number: 0, x: 85, y: 95, width: 210, height: 34 },
                    { type: 'signature', role: 'Indemnitor', page_number: 0, x: 325, y: 95, width: 210, height: 34 }
                ],
                'disclosure-form': [
                    { type: 'signature', role: 'Defendant', page_number: 0, x: 85, y: 515, width: 180, height: 35 },
                    { type: 'signature', role: 'Indemnitor', page_number: 0, x: 315, y: 515, width: 180, height: 35 },
                    { type: 'signature', role: 'Bail Agent', page_number: 0, x: 315, y: 470, width: 180, height: 35 }
                ],
                'surety-terms': [
                    { type: 'signature', role: 'Defendant', page_number: 0, x: 85, y: 140, width: 200, height: 34 },
                    { type: 'signature', role: 'Indemnitor', page_number: 0, x: 325, y: 140, width: 200, height: 34 }
                ],
                'master-waiver': [
                    { type: 'initials', role: 'Defendant', page_number: 0, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 0, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Defendant', page_number: 1, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 1, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Defendant', page_number: 2, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 2, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Defendant', page_number: 3, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 3, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'signature', role: 'Bail Agent', page_number: 3, x: 195, y: 465, width: 145, height: 26 },
                    { type: 'signature', role: 'Defendant', page_number: 3, x: 155, y: 487, width: 185, height: 26 },
                    { type: 'signature', role: 'Indemnitor', page_number: 3, x: 165, y: 509, width: 175, height: 26 }
                ],
                'ssa-release': [
                    { type: 'signature', role: 'Defendant', page_number: 0, x: 140, y: 145, width: 330, height: 40 }
                ],
                'collateral-receipt': [
                    { type: 'signature', role: 'Bail Agent', page_number: 0, x: 95, y: 355, width: 200, height: 32 },
                    { type: 'signature', role: 'Indemnitor', page_number: 0, x: 350, y: 305, width: 210, height: 32 },
                    { type: 'signature', role: 'Bail Agent', page_number: 0, x: 90, y: 165, width: 210, height: 32 }
                ],
                'payment-plan': [
                    { type: 'initials', role: 'Defendant', page_number: 0, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 0, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Defendant', page_number: 1, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 1, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Defendant', page_number: 2, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 2, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Defendant', page_number: 3, x: 60, y: 30, width: 50, height: 22 },
                    { type: 'initials', role: 'Indemnitor', page_number: 3, x: 502, y: 30, width: 50, height: 22 },
                    { type: 'signature', role: 'Defendant', page_number: 3, x: 180, y: 658, width: 185, height: 28 },
                    { type: 'signature', role: 'Indemnitor', page_number: 3, x: 186, y: 630, width: 185, height: 28 }
                ]
            },

            // County scraper URLs
            countyUrls: {
                'lee': 'https://www.sheriffleefl.org/booking-search/',
                'collier': 'https://www2.colliersheriff.org/arrestsearch/',
                'charlotte': 'https://ccso.org/correctional_facility/local_arrest_database.php',
                'hendry': 'https://www.hendrysheriff.org/inmateSearch',
                'glades': 'https://smartweb.gladessheriff.org/smartwebclient/Jail.aspx',
                'sarasota': 'https://www.sarasotasheriff.org/arrest-reports/index.php',
                'desoto': 'https://www.sarasotasheriff.org/arrest-reports/index.php', // Click "View All Inmates"
                'manatee': 'https://www.manateesheriff.com/arrest_inquiries_app/',
                'palm-beach': 'https://www3.pbso.org/blotter/index.cfm', // Click "Submit"
                'seminole': 'https://www.seminolesheriff.org/reports/List.aspx?mediareporttypeid=2&year=2026', // Click today's date
                'orange': 'https://netapps.ocfl.net/BestJail/',
                'pinellas': 'https://www.pcsoweb.com/InmateBooking',
                'broward': 'https://www.sheriff.org/InmateSearch',
                'hillsborough': 'https://webapps.hcso.tampa.fl.us/arrestinquiry'
            }
        };

        /* =========================================================
           GLOBAL STATE
           ========================================================= */
        let chargeCount = 0;
        let indemnitorCount = 0;
        let currentReceiptNumber = 201204;
        let sentPackets = [];

        const LS_KEY_FORM = 'shamrock_form_v4';
        const LS_KEY_THEME = 'shamrock_theme';
        const LS_KEY_MODE = 'shamrock_mode';
        const LS_KEY_RECEIPT = 'shamrock_receipt';
        const LS_KEY_PACKETS = 'shamrock_packets';

        /* =========================================================
           PHONE NUMBER AUTO-FORMATTING
           ========================================================= */
        function formatPhoneNumber(value) {
            // Remove all non-digit characters
            const digits = value.replace(/\D/g, '');

            // Format based on length
            if (digits.length === 0) return '';
            if (digits.length <= 3) return `(${digits}`;
            if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
            if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            // If more than 10 digits, truncate
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        }

        function setupPhoneFormatting() {
            // Format all phone inputs on blur and input
            document.addEventListener('blur', function (e) {
                if (e.target.type === 'tel') {
                    e.target.value = formatPhoneNumber(e.target.value);
                }
            }, true);

            // Also format on input for live feedback
            document.addEventListener('input', function (e) {
                if (e.target.type === 'tel') {
                    const cursorPos = e.target.selectionStart;
                    const oldLength = e.target.value.length;
                    e.target.value = formatPhoneNumber(e.target.value);
                    const newLength = e.target.value.length;
                    // Adjust cursor position
                    const newPos = cursorPos + (newLength - oldLength);
                    e.target.setSelectionRange(newPos, newPos);
                }
            }, true);
        }

        /* =========================================================
           ADDRESS AUTOCOMPLETE (Google Places API)
           ========================================================= */
        function setupAddressAutocomplete() {
            // Check if Google Places API is loaded
            if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
                console.warn('Google Places API not loaded - address autocomplete disabled');
                return;
            }

            // Setup for defendant address
            setupAddressField('defendant-street-address', 'defendant-city', 'defendant-state', 'defendant-zipcode');

            // Setup for dynamically added indemnitor addresses using event delegation
            document.addEventListener('focus', function (e) {
                if (e.target.id && e.target.id.match(/indemnitor-\d+-street-address/) && !e.target.dataset.autocompleteInit) {
                    const match = e.target.id.match(/indemnitor-(\d+)-street-address/);
                    if (match) {
                        const num = match[1];
                        setupAddressField(
                            `indemnitor-${num}-street-address`,
                            `indemnitor-${num}-city`,
                            `indemnitor-${num}-state`,
                            `indemnitor-${num}-zipcode`
                        );
                        e.target.dataset.autocompleteInit = 'true';
                    }
                }
            }, true);
        }

        function setupAddressField(streetId, cityId, stateId, zipId) {
            const streetInput = document.getElementById(streetId);
            if (!streetInput) return;

            const autocomplete = new google.maps.places.Autocomplete(streetInput, {
                types: ['address'],
                componentRestrictions: { country: 'us' },
                fields: ['address_components', 'formatted_address']
            });

            autocomplete.addListener('place_changed', function () {
                const place = autocomplete.getPlace();
                if (!place.address_components) return;

                let streetNumber = '';
                let streetName = '';
                let city = '';
                let state = '';
                let zip = '';

                for (const component of place.address_components) {
                    const type = component.types[0];
                    switch (type) {
                        case 'street_number':
                            streetNumber = component.long_name;
                            break;
                        case 'route':
                            streetName = component.long_name;
                            break;
                        case 'locality':
                        case 'sublocality_level_1':
                            city = component.long_name;
                            break;
                        case 'administrative_area_level_1':
                            state = component.short_name;
                            break;
                        case 'postal_code':
                            zip = component.long_name;
                            break;
                    }
                }

                // Fill in the fields
                streetInput.value = `${streetNumber} ${streetName}`.trim();

                const cityInput = document.getElementById(cityId);
                if (cityInput) cityInput.value = city;

                const stateInput = document.getElementById(stateId);
                if (stateInput) stateInput.value = state;

                const zipInput = document.getElementById(zipId);
                if (zipInput) zipInput.value = zip;
                showToast('Address auto-filled!', 'success');
            });
        }

        /* =========================================================
           OUTREACH MODE
           ========================================================= */
        // --- Module: OutreachMode ---
        const OutreachMode = {
            parsePastedRow: function () {
                const pastedText = document.getElementById('outreach-paste-area').value.trim();
                if (!pastedText) return;

                // Support tab or comma separated parsing
                const delimiter = pastedText.includes('\t') ? '\t' : ',';
                const parts = pastedText.split(delimiter).map(p => p.trim());

                if (parts.length >= 3) {
                    // Assuming Format: Name, Phone, County
                    let name = parts[0];
                    // Get just first name
                    name = name.split(' ')[0];

                    document.getElementById('outreach-defendant-name').value = name;
                    document.getElementById('outreach-phone').value = parts[1];
                    document.getElementById('outreach-county').value = parts[2];

                    UI.showToast('Row parsed successfully!', 'success');
                    this.generatePreview();
                } else if (parts.length === 2 && pastedText.match(/\d{3}/)) {
                    // In case parsing missed a column, try to guess
                    document.getElementById('outreach-phone').value = parts.find(p => p.match(/\d{3}/)) || '';
                    document.getElementById('outreach-defendant-name').value = parts.find(p => !p.match(/\d/)) || '';
                    UI.showToast('Partial row parsed.', 'info');
                    this.generatePreview();
                } else {
                    UI.showToast('Could not parse row. Ensure Format: Name, Phone, County', 'warning');
                }
            },

            generatePreview: function () {
                const agentName = document.getElementById('outreach-agent-name').value || '[Agent First Name]';
                const defendantName = document.getElementById('outreach-defendant-name').value || '[Defendant\'s Name]';
                let countyName = document.getElementById('outreach-county').value || '[County Name]';
                const templateSelected = document.getElementById('outreach-template').value;

                // Cleanup county name
                if (countyName.toLowerCase().includes('county')) {
                    countyName = countyName.replace(/county/i, '').trim();
                }

                let messageText = '';

                if (templateSelected === 'arrest_outreach') {
                    messageText = `Hi, this is ${agentName}, with Shamrock Bail Bonds. I see that ${defendantName} is in custody in ${countyName} County, we were wondering if you would like our help in getting him out of jail?`;
                } else if (templateSelected === 'follow_up') {
                    messageText = `Hi, this is ${agentName} tracking up with Shamrock Bail Bonds. Have you been able to get ${defendantName} bonded out of ${countyName} County jail yet? Let us know if we can help.`;
                }

                document.getElementById('outreach-message-preview').value = messageText;
                return messageText;
            },

            sendMessage: function () {
                const phone = document.getElementById('outreach-phone').value.trim();
                const message = this.generatePreview();
                const provider = document.getElementById('outreach-provider').value;

                if (!phone) {
                    UI.showToast('Please provide a phone number to send the message to.', 'warning');
                    document.getElementById('outreach-phone').focus();
                    return;
                }
                if (!message || message.includes('[Agent First Name]') || message.includes('[Defendant\'s Name]')) {
                    if (!confirm('The message appears to have missing placeholder fields. Are you sure you want to send it?')) {
                        return;
                    }
                }

                UI.showLoading('Sending Message', `Sending via ${provider}...`);

                google.script.run
                    .withSuccessHandler(function (response) {
                        UI.hideLoading();
                        if (response && response.success) {
                            UI.showToast('🚀 Message sent successfully!', 'success');
                            document.getElementById('outreach-paste-area').value = '';
                            // Optional: clear fields after send
                            // document.getElementById('outreach-defendant-name').value = '';
                            // document.getElementById('outreach-phone').value = '';
                            // document.getElementById('outreach-county').value = '';
                        } else {
                            UI.showToast('⚠️ Failed to send: ' + (response.error || 'Unknown error'), 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        UI.hideLoading();
                        UI.showToast('❌ Backend Error: ' + error.message, 'error');
                    })
                    .sendOutreachMessage({
                        phone: phone,
                        message: message,
                        provider: provider
                    });
            }
        };

        // Expose globally so inline onclick works
        window.OutreachMode = OutreachMode;
        /* =========================================================
           INITIALIZATION
           ========================================================= */
        document.addEventListener('DOMContentLoaded', function () {
            // Restore theme and mode
            const savedTheme = localStorage.getItem(LS_KEY_THEME) || 'emerald';
            const savedMode = localStorage.getItem(LS_KEY_MODE) || 'dark';
            applyTheme(savedTheme);
            applyMode(savedMode);

            // Restore receipt number
            const savedReceipt = localStorage.getItem(LS_KEY_RECEIPT);
            if (savedReceipt) currentReceiptNumber = parseInt(savedReceipt);
            updateReceiptDisplay();

            // Restore sent packets
            const savedPackets = localStorage.getItem(LS_KEY_PACKETS);
            if (savedPackets) sentPackets = JSON.parse(savedPackets);

            // Restore form data
            loadFormFromLocalStorage();

            // Set up keyboard shortcuts
            setupKeyboardShortcuts();

            // Set up paste listener
            document.addEventListener('paste', handlePaste);

            // Set up phone number auto-formatting
            setupPhoneFormatting();

            // Set up address autocomplete
            setupAddressAutocomplete();

            // Update summary
            updateSummary();
            updateDocumentCount();

            // Initialize county statistics
            initCountyStats();

            // CHECK FOR INJECTED DATA (From Spreadsheet Menu)
            if (window.INJECTED_DATA) {
                console.log('Found injected data for auto-fill:', window.INJECTED_DATA);
                try {
                    // Populate Defendant fields
                    if (window.INJECTED_DATA.firstName) document.getElementById('defendant-first-name').value = window.INJECTED_DATA.firstName;
                    if (window.INJECTED_DATA.lastName) document.getElementById('defendant-last-name').value = window.INJECTED_DATA.lastName;
                    if (window.INJECTED_DATA.middleName) document.getElementById('defendant-middle-name').value = window.INJECTED_DATA.middleName;

                    // Populate Defendant Name from FullName if splits missing
                    if (!window.INJECTED_DATA.firstName && window.INJECTED_DATA.defendantFullName) {
                        const parts = window.INJECTED_DATA.defendantFullName.split(' ');
                        if (parts.length > 0) document.getElementById('defendant-first-name').value = parts[0];
                        if (parts.length > 1) document.getElementById('defendant-last-name').value = parts.slice(1).join(' ');
                    }

                    if (window.INJECTED_DATA.dob) {
                        // Format DOB safely for date input (YYYY-MM-DD)
                        try {
                            const d = new Date(window.INJECTED_DATA.dob);
                            if (!isNaN(d.getTime())) {
                                document.getElementById('defendant-dob').value = d.toISOString().split('T')[0];
                            }
                        } catch (e) {
                            console.warn('Could not parse DOB for auto-fill', e);
                        }
                    }
                    if (window.INJECTED_DATA.bookingNumber) document.getElementById('case-number').value = window.INJECTED_DATA.bookingNumber;

                    // Populate Indemnitor Fields (New Logic)
                    if (window.INJECTED_DATA.indemnitorEmail) {
                        document.getElementById('signer-indemnitor-email').value = window.INJECTED_DATA.indemnitorEmail;
                    }
                    if (window.INJECTED_DATA.indemnitorPhone) {
                        document.getElementById('signer-indemnitor-phone').value = window.INJECTED_DATA.indemnitorPhone;
                    }

                    // populate 1st Indemnitor Name fields if we have a name
                    if (window.INJECTED_DATA.indemnitorName) {
                        // We need to find or trigger the creation of the first indemnitor card if not present,
                        // but usually the default UI has one. Let's assume standard UI state or basic fields.
                        // Ideally we fill a "Main Indemnitor" section or the first repeated item.
                        // For now, we'll try to target common IDs if they exist or just the signer info
                        const parts = window.INJECTED_DATA.indemnitorName.split(' ');
                        const fName = parts[0] || '';
                        const lName = parts.slice(1).join(' ') || '';

                        // Try to find first indemnitor inputs (dynamic IDs often indemnitor-1-...)
                        const ind1First = document.getElementById('indemnitor-1-first-name');
                        const ind1Last = document.getElementById('indemnitor-1-last-name');

                        if (ind1First) ind1First.value = fName;
                        if (ind1Last) ind1Last.value = lName;
                    }

                    if (window.INJECTED_DATA.role) {
                        // potential to set relationship dropdown if exists
                    }

                    // Trigger update summary to refresh the UI
                    updateSummary();

                    if (window.INJECTED_DATA.indemnitorName || window.INJECTED_DATA.indemnitorEmail) {
                        showToast('Intake data (Defendant + Indemnitor) auto-filled!', 'success');
                    } else {
                        showToast('Defendant data auto-filled from spreadsheet!', 'success');
                    }

                } catch (err) {
                    console.error('Error auto-filling form:', err);
                    showToast('Error auto-filling data', 'error');
                }
            }

            console.log('&#9752; Shamrock Bail Bonds Control Center initialized');
        });

        /* =========================================================
           THEME & MODE MANAGEMENT
           ========================================================= */
        function applyTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem(LS_KEY_THEME, theme);
            const select = document.getElementById('theme-select');
            if (select) select.value = theme;
        }

        function applyMode(mode) {
            document.body.setAttribute('data-mode', mode);
            localStorage.setItem(LS_KEY_MODE, mode);
            const icon = document.getElementById('mode-icon');
            const text = document.getElementById('mode-text');
            if (icon) icon.textContent = mode === 'dark' ? 'Light' : 'Dark';
            if (text) text.textContent = mode === 'dark' ? 'Light' : 'Dark';
        }

        function toggleMode() {
            const current = document.body.getAttribute('data-mode');
            applyMode(current === 'dark' ? 'light' : 'dark');
        }

        /* =========================================================
           COUNTY SCRAPERS & STATISTICS
           ========================================================= */

        /**
         * Fetch and display arrest statistics for all active counties
         */
        function refreshAllCountyStatus() {
            showToast('Fetching arrest statistics...', 'info');

            // Call GAS backend to get today's arrest statistics
            google.script.run
                .withSuccessHandler(function (stats) {
                    if (stats && typeof stats === 'object') {
                        updateCountyStats(stats);
                        showToast('Statistics updated!', 'success');
                    } else {
                        showToast('No statistics available', 'warning');
                    }
                })
                .withFailureHandler(function (error) {
                    console.error('Failed to fetch county stats:', error);
                    showToast('Failed to fetch statistics', 'error');
                    // Load sample data for demonstration
                    loadSampleCountyStats();
                })
                .getCountyStatistics();
        }

        /**
         * Update the county cards with statistics data
         * @param {Object} stats - Statistics object keyed by county name
         */
        function updateCountyStats(stats) {
            const counties = ['lee', 'collier', 'charlotte', 'sarasota', 'hendry', 'desoto', 'manatee', 'palm-beach', 'seminole', 'orange', 'pinellas', 'broward', 'hillsborough'];

            counties.forEach(county => {
                const countyStats = stats[county] || {};

                // Update total arrests
                const totalEl = document.getElementById(`${county}-total`);
                if (totalEl) totalEl.textContent = countyStats.total || '0';

                // Update male/female breakdown
                const maleEl = document.getElementById(`${county}-male`);
                const femaleEl = document.getElementById(`${county}-female`);
                if (maleEl) maleEl.textContent = countyStats.male || '0';
                if (femaleEl) femaleEl.textContent = countyStats.female || '0';

                // Update average bond
                const avgBondEl = document.getElementById(`${county}-avg-bond`);
                if (avgBondEl) {
                    const avgBond = countyStats.avgBond || 0;
                    avgBondEl.textContent = avgBond > 0 ? formatCurrency(avgBond) : '--';
                }

                // Update crime breakdown tags
                const crimesEl = document.getElementById(`${county}-crimes`);
                if (crimesEl && countyStats.crimes) {
                    crimesEl.innerHTML = '';
                    const topCrimes = Object.entries(countyStats.crimes)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4);

                    topCrimes.forEach(([crime, count]) => {
                        const tag = document.createElement('span');
                        tag.className = 'crime-tag';
                        tag.textContent = `${crime}: ${count}`;
                        crimesEl.appendChild(tag);
                    });
                }
            });
        }

        /**
         * Load sample statistics for demonstration when GAS is unavailable
         */
        function loadSampleCountyStats() {
            const sampleStats = {
                lee: { total: 47, male: 38, female: 9, avgBond: 5250, crimes: { 'DUI': 8, 'Battery': 12, 'Theft': 6, 'Drug': 15 } },
                collier: { total: 23, male: 19, female: 4, avgBond: 7500, crimes: { 'DUI': 5, 'Battery': 7, 'Theft': 3, 'Drug': 6 } },
                charlotte: { total: 15, male: 12, female: 3, avgBond: 3500, crimes: { 'DUI': 3, 'Battery': 5, 'Theft': 2, 'Drug': 4 } },
                sarasota: { total: 10, male: 8, female: 2, avgBond: 4200, crimes: { 'DUI': 2, 'Theft': 4, 'Battery': 4 } },
                manatee: { total: 18, male: 14, female: 4, avgBond: 5800, crimes: { 'Theft': 6, 'Drug': 6, 'DUI': 6 } }
            };

            updateCountyStats(sampleStats);
            showToast('Loaded sample statistics (GAS unavailable)', 'info');
        }

        /**
         * Initialize county statistics on page load
         */
        function initCountyStats() {
            // Try to load stats on page load
            if (typeof google !== 'undefined' && google.script && google.script.run) {
                refreshAllCountyStatus();
            } else {
                // Running outside GAS environment, load sample data
                loadSampleCountyStats();
            }
        }

        /* =========================================================
           CHARGE MANAGEMENT
           ========================================================= */
        function addCharge(data = {}) {
            chargeCount++;
            const container = document.getElementById('charges-container');
            const noChargesMsg = document.getElementById('no-charges-message');
            const bondSummary = document.getElementById('bond-summary');

            if (noChargesMsg) noChargesMsg.style.display = 'none';
            if (bondSummary) bondSummary.style.display = 'block';

            const chargeHtml = `
        <div class="entity-card charge" id="charge-${chargeCount}">
          <div class="entity-header">
            <h4>
              <span class="entity-number">${chargeCount}</span>
              Charge ${chargeCount}
            </h4>
            <button class="btn-remove" onclick="removeCharge(${chargeCount})">×</button>
          </div>
          <div class="form-row">
            <div class="form-group" style="grid-column: span 2;">
              <label class="required">Charge Description</label>
              <input type="text" id="charge-${chargeCount}-desc" placeholder="e.g., Battery - Domestic Violence" 
                     value="${data.desc || ''}" oninput="updateSummary()">
            </div>
            <div class="form-group">
              <label>Statute</label>
              <input type="text" id="charge-${chargeCount}-statute" placeholder="784.03(1)(a)" value="${data.statute || ''}">
            </div>
            <div class="form-group">
              <label>Degree</label>
              <select id="charge-${chargeCount}-degree">
                <option value="M1" ${data.degree === 'M1' ? 'selected' : ''}>1st Degree Misdemeanor</option>
                <option value="M2" ${data.degree === 'M2' ? 'selected' : ''}>2nd Degree Misdemeanor</option>
                <option value="F3" ${data.degree === 'F3' ? 'selected' : ''}>3rd Degree Felony</option>
                <option value="F2" ${data.degree === 'F2' ? 'selected' : ''}>2nd Degree Felony</option>
                <option value="F1" ${data.degree === 'F1' ? 'selected' : ''}>1st Degree Felony</option>
                <option value="PBL" ${data.degree === 'PBL' ? 'selected' : ''}>Life Felony</option>
              </select>
            </div>
          </div>
          <div class="form-row">is there
            <div class="form-group">
              <label>Case Number</label>
              <input type="text" id="charge-${chargeCount}-case" placeholder="24-CF-001234" value="${data.caseNumber || ''}">
            </div>
            <div class="form-group">
              <label>Power Number</label>
              <input type="text" id="charge-${chargeCount}-power" placeholder="OSI3-4591234" value="${data.powerNumber || ''}">
            </div>
            <div class="form-group">
                <label>Court Date</label>
                <input type="date" id="charge-${chargeCount}-court-date" value="${data.courtDate || ''}">
            </div>
            <div class="form-group">
              <label class="required">Bond Amount</label>
              <input type="number" id="charge-${chargeCount}-bond" placeholder="5000.00" step="0.01" 
                     value="${data.bondAmount || ''}" oninput="updateSummary()">
            </div>
            <div class="form-group">
              <label>Bond Type</label>
              <select id="charge-${chargeCount}-bond-type">
                <option value="surety" ${data.bondType === 'surety' ? 'selected' : ''}>Surety Bond</option>
                <option value="cash" ${data.bondType === 'cash' ? 'selected' : ''}>Cash Bond</option>
                <option value="property" ${data.bondType === 'property' ? 'selected' : ''}>Property Bond</option>
              </select>
            </div>
          </div>
        </div>
      `;

            container.insertAdjacentHTML('beforeend', chargeHtml);
            updateBadges();
            updateSummary();
        }

        function removeCharge(num) {
            const el = document.getElementById(`charge-${num}`);
            if (el) {
                el.remove();
                updateBadges();
                updateSummary();

                // Show no charges message if empty
                const container = document.getElementById('charges-container');
                if (container.children.length === 0) {
                    document.getElementById('no-charges-message').style.display = 'block';
                    document.getElementById('bond-summary').style.display = 'none';
                }
            }
        }

        /* =========================================================
           INDEMNITOR MANAGEMENT
           ========================================================= */
        function addIndemnitor(data = {}) {
            indemnitorCount++;
            const container = document.getElementById('indemnitors-container');
            const noIndMsg = document.getElementById('no-indemnitors-message');

            if (noIndMsg) noIndMsg.style.display = 'none';

            const indHtml = `
        <div class="entity-card indemnitor" id="indemnitor-${indemnitorCount}">
          <div class="entity-header">
            <h4>
              <span class="entity-number">${indemnitorCount}</span>
              Indemnitor ${indemnitorCount}
            </h4>
            <button class="btn-remove" onclick="removeIndemnitor(${indemnitorCount})">×</button>
          </div>
          
          <h5>Personal Information</h5>
          <div class="form-row">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" id="indemnitor-${indemnitorCount}-first" value="${data.firstName || ''}">
            </div>
            <div class="form-group">
                <label>Middle Name</label>
                <input type="text" id="indemnitor-${indemnitorCount}-middle" value="${data.middleName || ''}">
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" id="indemnitor-${indemnitorCount}-last" value="${data.lastName || ''}">
            </div>
          </div>

          <div class="form-row">
             <div class="form-group">
                <label>Relationship</label>
                <input type="text" id="indemnitor-${indemnitorCount}-relationship" value="${data.relationship || ''}">
             </div>
             <div class="form-group">
                <label>DOB</label>
                <input type="date" id="indemnitor-${indemnitorCount}-dob" value="${data.dob || ''}">
             </div>
             <div class="form-group">
                <label>SSN</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ssn" value="${data.ssn || ''}">
             </div>
          </div>

          <div class="form-row">
             <div class="form-group">
                <label>DL Number</label>
                <input type="text" id="indemnitor-${indemnitorCount}-dl" value="${data.dl || ''}">
             </div>
             <div class="form-group">
                <label>DL State</label>
                <input type="text" id="indemnitor-${indemnitorCount}-dl-state" value="${data.dlState || 'FL'}">
             </div>
             <div class="form-group">
                <label>Phone</label>
                <input type="text" id="indemnitor-${indemnitorCount}-phone" value="${data.phone || ''}">
             </div>
          </div>
          
          <div class="form-row" style="grid-template-columns: 2fr 1fr 1fr;">
             <div class="form-group">
                <label>Address</label>
                <input type="text" id="indemnitor-${indemnitorCount}-address" value="${data.address || ''}">
             </div>
             <div class="form-group">
                <label>City</label>
                <input type="text" id="indemnitor-${indemnitorCount}-city" value="${data.city || ''}">
             </div>
             <div class="form-group">
                <label>Zip</label>
                <input type="text" id="indemnitor-${indemnitorCount}-zip" value="${data.zip || ''}">
             </div>
          </div>
           <div class="form-row">
             <div class="form-group full-width">
                <label>Email</label>
                <input type="email" id="indemnitor-${indemnitorCount}-email" value="${data.email || ''}">
             </div>
          </div>
          
          <hr>
          <h5>Employment</h5>
          <div class="form-row">
             <div class="form-group">
                <label>Employer</label>
                <input type="text" id="indemnitor-${indemnitorCount}-employer" value="${data.employer || ''}">
             </div>
             <div class="form-group">
                <label>Employer Phone</label>
                <input type="text" id="indemnitor-${indemnitorCount}-employer-phone" value="${data.employerPhone || ''}">
             </div>
          </div>
           <div class="form-row">
             <div class="form-group">
                <label>Employer City</label>
                <input type="text" id="indemnitor-${indemnitorCount}-employer-city" value="${data.employerCity || ''}">
             </div>
             <div class="form-group">
                <label>Employer State</label>
                <input type="text" id="indemnitor-${indemnitorCount}-employer-state" value="${data.employerState || ''}">
             </div>
          </div>
          <div class="form-row">
             <div class="form-group">
                <label>Supervisor</label>
                <input type="text" id="indemnitor-${indemnitorCount}-supervisor" value="${data.supervisor || ''}">
             </div>
             <div class="form-group">
                <label>Supervisor Phone</label>
                <input type="text" id="indemnitor-${indemnitorCount}-supervisor-phone" value="${data.supervisorPhone || ''}">
             </div>
          </div>

          <hr>
          <h5>References</h5>
          <!-- Reference 1 -->
          <div class="form-row">
              <div class="form-group">
                <label>Ref 1 Name</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ref1-name" value="${data.ref1Name || ''}">
              </div>
              <div class="form-group">
                <label>Relation</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ref1-relation" value="${data.ref1Relation || ''}">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ref1-phone" value="${data.ref1Phone || ''}">
              </div>
          </div>
          <div class="form-row">
             <div class="form-group full-width">
                <label>Ref 1 Address</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ref1-address" value="${data.ref1Address || ''}">
             </div>
          </div>
          
          <!-- Reference 2 -->
          <div class="form-row" style="margin-top: 10px;">
              <div class="form-group">
                <label>Ref 2 Name</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ref2-name" value="${data.ref2Name || ''}">
              </div>
              <div class="form-group">
                <label>Relation</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ref2-relation" value="${data.ref2Relation || ''}">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ref2-phone" value="${data.ref2Phone || ''}">
              </div>
          </div>
          <div class="form-row">
             <div class="form-group full-width">
                <label>Ref 2 Address</label>
                <input type="text" id="indemnitor-${indemnitorCount}-ref2-address" value="${data.ref2Address || ''}">
             </div>
          </div>
           
           <div id="indemnitor-${indemnitorCount}-documents" class="form-row" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
              <!-- Documents will be loaded here -->
           </div>

        </div>
            `;
            container.insertAdjacentHTML('beforeend', indHtml);
            updateBadges();
        }

        function removeIndemnitor(num) {
            const el = document.getElementById(`indemnitor-${num}`);
            if (el) {
                el.remove();
                updateBadges();

                const container = document.getElementById('indemnitors-container');
                if (container.children.length === 0) {
                    document.getElementById('no-indemnitors-message').style.display = 'block';
                }
            }
        }

        /**
         * Render ID Documents on the card
         */
        function renderIndemnitorDocuments(documents, indemnitorId) {
            const container = document.getElementById(`indemnitor-${indemnitorId}-documents`);
            if (!container) return;

            if (!documents || documents.length === 0) {
                container.innerHTML = '<small class="text-muted" style="color:#999;">No uploaded documents linked to this email.</small>';
                return;
            }

            let html = '<h6 style="margin:0 0 8px 0; font-size:12px; color:#666;">Uploaded Documents</h6><div class="doc-list" style="display:flex; gap:10px; flex-wrap:wrap;">';
            documents.forEach(doc => {
                const label = (doc.documentSide || doc.documentType || 'Document').toUpperCase();
                const url = doc.fileUrl; // Use public URL if possible
                html += `<a href="${url}" target="_blank" class="btn btn-sm btn-outline-secondary" style="font-size:11px; padding: 4px 8px; text-decoration:none; border:1px solid #ccc; border-radius:4px; color:#333; background:#f8f9fa; display:flex; align-items:center; gap:5px;">
                          <i class="fas fa-file-image"></i> ${label}
                        </a>`;
            });
            html += '</div>';
            container.innerHTML = html;
        }

        /* =========================================================
           DOCUMENT SELECTION
           ========================================================= */
        function toggleDocItem(checkbox) {
            const item = checkbox.closest('.doc-item');
            if (checkbox.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
            updateDocumentCount();
        }

        function selectAllDocs() {
            document.querySelectorAll('.doc-item input[type="checkbox"]').forEach(cb => {
                cb.checked = true;
                cb.closest('.doc-item').classList.add('checked');
            });
            updateDocumentCount();
        }

        function deselectAllDocs() {
            document.querySelectorAll('.doc-item input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                cb.closest('.doc-item').classList.remove('checked');
            });
            updateDocumentCount();
        }

        function selectDefaultDocs() {
            deselectAllDocs();
            const defaults = ['paperwork-header', 'faq-cosigners', 'faq-defendants', 'indemnity-agreement',
                'promissory-note', 'surety-terms', 'disclosure-form', 'master-waiver',
                'ssa-defendant', 'ssa-indemnitor', 'collateral-receipt', 'appearance-bonds'];
            defaults.forEach(id => {
                const cb = document.getElementById(`doc-${id}`);
                if (cb) {
                    cb.checked = true;
                    cb.closest('.doc-item').classList.add('checked');
                }
            });
            updateDocumentCount();
        }

        function updateDocumentCount() {
            const checked = document.querySelectorAll('.doc-item input[type="checkbox"]:checked').length;
            const chargeCards = document.querySelectorAll('.entity-card.charge').length;

            document.getElementById('selected-doc-count').textContent = checked;
            document.getElementById('appearance-bond-count').textContent = `${chargeCards} bonds`;
            document.getElementById('estimated-pages').textContent = `~${checked * 1.5 + chargeCards}`;
            document.getElementById('summary-docs').textContent = checked;
        }

        /* =========================================================
           CALCULATIONS
           ========================================================= */
        function calculateTotalBond() {
            let total = 0;
            document.querySelectorAll('[id^="charge-"][id$="-bond"]').forEach(input => {
                const val = parseFloat(input.value) || 0;
                total += val;
            });
            return total;
        }

        /**
         * Calculate premium for a single charge with $100 minimum rule
         * Florida law: Premium is 10% of bond amount, but minimum $100 per charge
         * If bond <= $1,000: Premium = $100 (flat)
         * If bond > $1,000: Premium = 10% of bond amount
         * @param {number} bondAmount - The bond amount for a single charge
         * @param {number} rate - Premium rate (default 10%)
         * @returns {number} - Premium amount (minimum $100 per charge)
         */
        function calculatePremium(bondAmount, rate = 10) {
            if (bondAmount <= 0) return 0;
            // If bond is $1,000 or less, minimum premium is $100
            if (bondAmount <= 1000) return 100;
            // If bond is over $1,000, premium is 10%
            return bondAmount * (rate / 100);
        }

        /**
         * Calculate total premium across all charges
         * Each charge has a $100 minimum premium (for bonds $1,000 or less)
         * @returns {number} - Total premium for all charges
         */
        function calculateTotalPremium() {
            let totalPremium = 0;
            const rate = parseFloat(document.getElementById('premium-rate')?.value || 10);

            document.querySelectorAll('[id^="charge-"][id$="-bond"]').forEach(input => {
                const bondAmount = parseFloat(input.value) || 0;
                if (bondAmount > 0) {
                    // Apply $100 minimum per charge (for bonds $1,000 or less)
                    const chargePremium = calculatePremium(bondAmount, rate);
                    totalPremium += chargePremium;
                }
            });

            return totalPremium;
        }

        function numberToWords(num) {
            // Handle edge cases that could cause erroneous output
            if (num === null || num === undefined || isNaN(num)) return 'Zero';
            if (num === 0) return 'Zero';
            if (num < 0) return 'Zero'; // Don't allow negative numbers

            num = Math.floor(num); // Ensure we're working with integers
            if (num === 0) return 'Zero';

            const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
            const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            const scales = ['', 'Thousand', 'Million', 'Billion'];

            function convertHundreds(n) {
                let result = '';
                if (n >= 100) {
                    result += ones[Math.floor(n / 100)] + ' Hundred ';
                    n %= 100;
                }
                if (n >= 20) {
                    result += tens[Math.floor(n / 10)] + ' ';
                    n %= 10;
                }
                if (n > 0) {
                    result += ones[n] + ' ';
                }
                return result;
            }

            let result = '';
            let scaleIndex = 0;

            while (num > 0) {
                const chunk = num % 1000;
                if (chunk > 0) {
                    result = convertHundreds(chunk) + scales[scaleIndex] + ' ' + result;
                }
                num = Math.floor(num / 1000);
                scaleIndex++;
            }

            return result.trim() || 'Zero';
        }

        function formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
        }

        function calculatePayment() {
            const totalBond = calculateTotalBond();
            const downPayment = parseFloat(document.getElementById('down-payment')?.value || 0);
            // Use calculateTotalPremium which applies $100 minimum per charge
            const premium = calculateTotalPremium();
            const balance = premium - downPayment;

            document.getElementById('payment-total-bond').textContent = formatCurrency(totalBond);
            document.getElementById('payment-premium-due').textContent = formatCurrency(premium);
            document.getElementById('payment-down').textContent = formatCurrency(downPayment);
            document.getElementById('payment-balance').textContent = formatCurrency(Math.max(0, balance));
            document.getElementById('payment-premium-words').textContent = numberToWords(Math.floor(premium)) + ' and ' +
                String(Math.round((premium % 1) * 100)).padStart(2, '0') + '/100 Dollars';

            // Auto-select payment plan if balance > 0
            const paymentPlanCb = document.getElementById('doc-payment-plan');
            if (paymentPlanCb) {
                if (balance > 0) {
                    paymentPlanCb.checked = true;
                    paymentPlanCb.closest('.doc-item').classList.add('checked');
                }
            }
        }

        /* =========================================================
           SUMMARY UPDATES
           ========================================================= */
        function updateSummary() {
            const firstName = document.getElementById('defendant-first-name')?.value || '';
            const lastName = document.getElementById('defendant-last-name')?.value || '';
            const totalBond = calculateTotalBond();
            const chargeCards = document.querySelectorAll('.entity-card.charge').length;
            // Use calculateTotalPremium which applies $100 minimum per charge
            const premium = calculateTotalPremium();

            // Update summary displays
            document.getElementById('summary-defendant').textContent =
                firstName && lastName ? `${firstName} ${lastName}` : '--';
            document.getElementById('summary-bond').textContent = formatCurrency(totalBond);
            document.getElementById('summary-charges').textContent = chargeCards;

            // Update bond summary panel
            document.getElementById('total-charges-count').textContent = chargeCards;
            document.getElementById('total-bond-amount').textContent = formatCurrency(totalBond);
            document.getElementById('premium-amount').textContent = formatCurrency(premium);
            document.getElementById('bond-written').textContent =
                numberToWords(Math.floor(totalBond)) + ' and 00/100 Dollars';

            calculatePayment();
            updateDocumentCount();
        }

        function updateBadges() {
            const chargeCards = document.querySelectorAll('.entity-card.charge').length;
            const indemnitorCards = document.querySelectorAll('.entity-card.indemnitor').length;

            const chargesBadge = document.getElementById('charges-badge');
            const indemnitorsBadge = document.getElementById('indemnitors-badge');

            if (chargesBadge) {
                chargesBadge.textContent = chargeCards;
                chargesBadge.style.display = chargeCards > 0 ? 'inline' : 'none';
            }

            if (indemnitorsBadge) {
                indemnitorsBadge.textContent = indemnitorCards;
                indemnitorsBadge.style.display = indemnitorCards > 0 ? 'inline' : 'none';
            }
        }

        function updateReceiptDisplay() {
            const display = document.getElementById('receipt-display');
            if (display) display.textContent = currentReceiptNumber;
        }

        /* =========================================================
           SWIPESIMPLE HELPER
           ========================================================= */
        /* =========================================================
           SWIPESIMPLE HELPER
           ========================================================= */
        function copyToClipboard(...ids) {
            let text = ids.map(id => {
                const el = document.getElementById(id);
                return el ? (el.value || el.textContent) : '';
            }).join(' ').trim();

            // Clean amount if it contains $
            if (ids[0] === 'payment-premium-due') {
                text = text.replace(/[^0-9.]/g, '');
            }

            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied to clipboard!', 'success');
            });
        }

        function generateAutoFillScript() {
            const firstName = document.getElementById('defendant-first-name')?.value || '';
            const lastName = document.getElementById('defendant-last-name')?.value || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const amountStr = document.getElementById('payment-premium-due')?.textContent || '0';
            const amount = amountStr.replace(/[^0-9.]/g, '');
            const phone = document.getElementById('defendant-phone')?.value || '';
            const email = document.getElementById('defendant-email')?.value || '';

            // This script is injected into the SwipeSimple console by the user
            const script = `
            (function() {
                console.log("🚀 Starting SwipeSimple Auto-Fill...");
                
                function setVal(selectors, value) {
                    if (!value) return;
                    for (let s of selectors) {
                        let el = document.querySelector(s) || document.getElementById(s) || document.getElementsByName(s)[0];
                        if (el) { 
                            el.value = value; 
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                            console.log("✅ Set " + s + " to " + value);
                            return;
                        }
                    }
                    console.warn("❌ Could not find field for " + value);
                }

                // Try multiple selector strategies based on standard Rails conventions
                setVal(['#payment_form_title', 'input[name="payment_form[title]"]', '#payment_link_title'], "Bail Premium - ${fullName}");
                setVal(['#payment_form_amount', 'input[name="payment_form[amount]"]', '#amount'], "${amount}");
                setVal(['textarea[name="payment_form[description]"]', '#payment_form_description', '#payment_form_note'], "Premium for ${fullName}. Phone: ${phone}");
                
                alert("Auto-Fill Complete! Please verify values.");
            })();
            `;

            navigator.clipboard.writeText(script).then(() => {
                showToast('⚠️ Script copied! Paste into SwipeSimple Console (F12).', 'success');
            }).catch(err => showToast('Failed to copy script', 'error'));
        }

        /* =========================================================
           PASTE HANDLING
           ========================================================= */
        function handlePaste(e) {
            const text = e.clipboardData?.getData('text');
            if (text && (text.includes('bookingData') || text.includes('defendant-'))) {
                e.preventDefault();
                importBookingData(text);
            }
        }

        async function pasteBookingInfo() {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    importBookingData(text);
                } else {
                    showToast('No data found in clipboard', 'warning');
                }
            } catch (err) {
                showToast('Please paste (Ctrl+V) the booking data anywhere on the form', 'info');
            }
        }

        function importBookingData(dataString) {
            try {
                let data;
                if (dataString.includes('bookingData')) {
                    const match = dataString.match(/bookingData\s*=\s*({[\s\S]*?});/);
                    if (match) data = JSON.parse(match[1]);
                } else {
                    data = JSON.parse(dataString);
                }

                if (!data) {
                    showToast('Invalid booking data format', 'error');
                    return;
                }

                console.log('Imported data:', data);

                // Helper function to get value from multiple possible keys
                function getValue(...keys) {
                    for (const key of keys) {
                        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                            return data[key];
                        }
                    }
                    return '';
                }

                // Parse name if it's in "LAST, FIRST MIDDLE" format
                let firstName = '', middleName = '', lastName = '';
                const fullName = getValue('defendantFullName', 'defendant-name', 'defendantName', 'name', 'Name');
                if (fullName && fullName.includes(',')) {
                    const parts = fullName.split(',').map(s => s.trim());
                    lastName = parts[0] || '';
                    if (parts[1]) {
                        const nameParts = parts[1].split(' ').filter(s => s);
                        firstName = nameParts[0] || '';
                        middleName = nameParts.slice(1).join(' ') || '';
                    }
                } else {
                    firstName = getValue('defendant-first-name', 'firstName', 'first_name', 'first-name');
                    middleName = getValue('defendant-middle-name', 'middleName', 'middle_name', 'middle-name');
                    lastName = getValue('defendant-last-name', 'lastName', 'last_name', 'last-name');
                }

                // Parse address if it's a full string
                let streetAddress = '', city = '', state = 'FL', zipcode = '';
                const fullAddress = getValue('defendant-address', 'address', 'Address');
                if (fullAddress) {
                    // Try to parse: "1759 Four Mile Cove Pkwy APT 411 Cape Coral FL 33990"
                    const addressMatch = fullAddress.match(/^(.+?)\s+([A-Za-z\s]+),?\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/);
                    if (addressMatch) {
                        streetAddress = addressMatch[1].trim();
                        city = addressMatch[2].trim();
                        state = addressMatch[3].trim();
                        zipcode = addressMatch[4].trim();
                    } else {
                        // Try simpler parsing
                        const parts = fullAddress.split(',').map(s => s.trim());
                        if (parts.length >= 2) {
                            streetAddress = parts[0];
                            // Last part might be "City ST ZIP" or "City, ST ZIP"
                            const lastPart = parts[parts.length - 1];
                            const stateZipMatch = lastPart.match(/([A-Za-z\s]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
                            if (stateZipMatch) {
                                city = stateZipMatch[1].trim();
                                state = stateZipMatch[2].trim();
                                zipcode = stateZipMatch[3].trim();
                            } else {
                                city = lastPart;
                            }
                        } else {
                            streetAddress = fullAddress;
                        }
                    }
                } else {
                    streetAddress = getValue('defendantStreetAddress', 'defendant-street-address', 'streetAddress', 'street_address', 'street-address');
                    city = getValue('defendantCity', 'defendant-city', 'city', 'City');
                    state = getValue('defendantState', 'defendant-state', 'state', 'State') || 'FL';
                    zipcode = getValue('defendantZip', 'defendant-zipcode', 'zipcode', 'zip', 'ZIP', 'zip_code');
                }

                // Parse DOB - handle various formats
                let dob = getValue('defendantDOB', 'defendant-dob', 'dob', 'DOB', 'dateOfBirth', 'date_of_birth');
                if (dob) {
                    // Convert MM/DD/YYYY to YYYY-MM-DD for date input
                    if (dob.includes('/')) {
                        const parts = dob.split('/');
                        if (parts.length === 3) {
                            const month = parts[0].padStart(2, '0');
                            const day = parts[1].padStart(2, '0');
                            let year = parts[2];
                            if (year.length === 2) year = (parseInt(year) > 50 ? '19' : '20') + year;
                            dob = `${year}-${month}-${day}`;
                        }
                    }
                    // Remove any extra text like "US" after the date
                    dob = dob.replace(/\s+[A-Z]+$/, '').trim();
                }

                // Set defendant fields with fallbacks
                const setField = (id, value) => {
                    if (value) {
                        const el = document.getElementById(id);
                        if (el) el.value = value;
                    }
                };

                setField('defendant-first-name', firstName);
                setField('defendant-middle-name', middleName);
                setField('defendant-last-name', lastName);
                setField('defendant-dob', dob);
                setField('defendant-street-address', streetAddress);
                setField('defendant-city', city);
                setField('defendant-state', state);
                setField('defendant-zipcode', zipcode);
                setField('defendant-booking-number', getValue('defendantArrestNumber', 'defendant-booking-number', 'bookingNumber', 'booking_number', 'booking-number', 'Number', 'arrestNumber', 'arrest_number'));
                setField('defendant-phone', getValue('defendant-phone', 'phone', 'Phone'));
                setField('defendant-email', getValue('defendant-email', 'email', 'Email'));
                setField('defendant-ssn', getValue('defendant-ssn', 'ssn', 'SSN', 'social_security'));
                setField('defendant-dl-number', getValue('defendant-dl-number', 'dlNumber', 'dl_number', 'driversLicense'));
                setField('defendant-arrest-date', getValue('defendant-arrest-date', 'arrestDate', 'arrest_date', 'bookedOn', 'booked_on'));
                setField('defendant-jail-facility', getValue('defendant-jail-facility', 'jailFacility', 'jail_facility', 'Housing', 'housing'));

                // Set race, sex, height, weight if available
                setField('defendant-race', getValue('defendantRace', 'race', 'Race'));
                setField('defendant-sex', getValue('defendantSex', 'sex', 'Sex'));
                setField('defendant-height', getValue('defendantHeight', 'height', 'Height'));
                setField('defendant-weight', getValue('defendantWeight', 'weight', 'Weight'));

                // Fill charges
                if (data.charges && Array.isArray(data.charges)) {
                    document.getElementById('charges-container').innerHTML = '';
                    chargeCount = 0;
                    data.charges.forEach(charge => {
                        addCharge({
                            desc: charge.description || charge.desc || charge.charge || '',
                            statute: charge.statute || charge.Statute || '',
                            degree: charge.degree || charge.Degree || '',
                            caseNumber: charge['case-number'] || charge.caseNumber || charge.case_number || charge['Case#'] || charge.caseNum || '',
                            powerNumber: charge['power-number'] || charge.powerNumber || charge.power_number || '',
                            bondAmount: charge['bond-amount'] || charge.bondAmount || charge.bond_amount || charge.Amount || charge.amount || ''
                        });
                    });
                }

                updateSummary();
                showToast('Booking data imported successfully!', 'success');
                switchTab(null, 'defendant');

            } catch (err) {
                console.error('Import error:', err);
                showToast('Error importing booking data: ' + err.message, 'error');
            }
        }

        /* =========================================================
           LOCAL STORAGE
           ========================================================= */
        function saveFormToLocalStorage() {
            const formData = collectFormData();
            localStorage.setItem(LS_KEY_FORM, JSON.stringify(formData));
            localStorage.setItem(LS_KEY_RECEIPT, currentReceiptNumber.toString());
        }

        function loadFormFromLocalStorage() {
            const saved = localStorage.getItem(LS_KEY_FORM);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    // Restore defendant info
                    Object.keys(data).forEach(key => {
                        if (key.startsWith('defendant-')) {
                            const el = document.getElementById(key);
                            if (el) el.value = data[key] || '';
                        }
                    });

                    // Restore charges
                    if (data.charges && Array.isArray(data.charges)) {
                        data.charges.forEach(charge => addCharge(charge));
                    }

                    // Restore indemnitors
                    if (data.indemnitors && Array.isArray(data.indemnitors)) {
                        data.indemnitors.forEach(ind => addIndemnitor(ind));
                    }

                    updateSummary();
                } catch (err) {
                    console.error('Error loading saved form:', err);
                }
            }
        }

        function collectFormData() {
            const data = {};

            // Collect all input/select fields
            document.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.id) {
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        data[el.id] = el.checked;
                    } else {
                        data[el.id] = el.value;
                    }
                }
            });

            // Add calculated values
            data['payment-total-bond'] = calculateTotalBond();
            data['payment-premium-due'] = calculateTotalPremium();

            // Collect charges
            data.charges = [];
            document.querySelectorAll('.entity-card.charge').forEach(card => {
                const num = card.id.split('-')[1];
                data.charges.push({
                    charge: document.getElementById(`charge-${num}-desc`)?.value || '',
                    statute: document.getElementById(`charge-${num}-statute`)?.value || '',
                    degree: document.getElementById(`charge-${num}-degree`)?.value || '',
                    caseNumber: document.getElementById(`charge-${num}-case`)?.value || '',
                    powerNumber: document.getElementById(`charge-${num}-power`)?.value || '',
                    bondAmount: document.getElementById(`charge-${num}-bond`)?.value || '',
                    bondType: document.getElementById(`charge-${num}-bond-type`)?.value || 'surety'
                });
            });

            // Collect indemnitors
            data.indemnitors = [];
            document.querySelectorAll('.entity-card.indemnitor').forEach(card => {
                const num = card.id.split('-')[1];
                data.indemnitors.push({
                    firstName: document.getElementById(`indemnitor-${num}-first`)?.value || '',
                    middleName: document.getElementById(`indemnitor-${num}-middle`)?.value || '',
                    lastName: document.getElementById(`indemnitor-${num}-last`)?.value || '',
                    relationship: document.getElementById(`indemnitor-${num}-relationship`)?.value || '',
                    dob: document.getElementById(`indemnitor-${num}-dob`)?.value || '',
                    ssn: document.getElementById(`indemnitor-${num}-ssn`)?.value || '',
                    dl: document.getElementById(`indemnitor-${num}-dl`)?.value || '',
                    dlState: document.getElementById(`indemnitor-${num}-dl-state`)?.value || 'FL',
                    address: document.getElementById(`indemnitor-${num}-address`)?.value || '',
                    city: document.getElementById(`indemnitor-${num}-city`)?.value || '',
                    zip: document.getElementById(`indemnitor-${num}-zip`)?.value || '',
                    phone: document.getElementById(`indemnitor-${num}-phone`)?.value || '',
                    email: document.getElementById(`indemnitor-${num}-email`)?.value || '',
                    employer: document.getElementById(`indemnitor-${num}-employer`)?.value || '',
                    employerPhone: document.getElementById(`indemnitor-${num}-employer-phone`)?.value || '',
                    employerCity: document.getElementById(`indemnitor-${num}-employer-city`)?.value || '',
                    employerState: document.getElementById(`indemnitor-${num}-employer-state`)?.value || '',
                    supervisor: document.getElementById(`indemnitor-${num}-supervisor`)?.value || '',
                    supervisorPhone: document.getElementById(`indemnitor-${num}-supervisor-phone`)?.value || '',
                    // References
                    ref1Name: document.getElementById(`indemnitor-${num}-ref1-name`)?.value || '',
                    ref1Relation: document.getElementById(`indemnitor-${num}-ref1-relation`)?.value || '',
                    ref1Phone: document.getElementById(`indemnitor-${num}-ref1-phone`)?.value || '',
                    ref1Address: document.getElementById(`indemnitor-${num}-ref1-address`)?.value || '',
                    ref2Name: document.getElementById(`indemnitor-${num}-ref2-name`)?.value || '',
                    ref2Relation: document.getElementById(`indemnitor-${num}-ref2-relation`)?.value || '',
                    ref2Phone: document.getElementById(`indemnitor-${num}-ref2-phone`)?.value || '',
                    ref2Address: document.getElementById(`indemnitor-${num}-ref2-address`)?.value || ''
                });
            });

            return data;
        }

        function confirmClearAll() {
            if (confirm('Are you sure you want to clear all form data? This cannot be undone.')) {
                clearAllFields();
            }
        }

        function clearAllFields() {
            // Clear all inputs
            document.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.type === 'checkbox') {
                    // Keep default docs checked
                } else {
                    el.value = '';
                }
            });

            // Clear charges and indemnitors
            document.getElementById('charges-container').innerHTML = '';
            document.getElementById('indemnitors-container').innerHTML = '';
            chargeCount = 0;
            indemnitorCount = 0;

            // Show empty messages
            document.getElementById('no-charges-message').style.display = 'block';
            document.getElementById('no-indemnitors-message').style.display = 'block';
            document.getElementById('bond-summary').style.display = 'none';

            // Reset summary displays to clean defaults (prevents erroneous characters)
            const summaryDefendant = document.getElementById('summary-defendant');
            const summaryBond = document.getElementById('summary-bond');
            const summaryCharges = document.getElementById('summary-charges');
            const totalChargesCount = document.getElementById('total-charges-count');
            const totalBondAmount = document.getElementById('total-bond-amount');
            const premiumAmount = document.getElementById('premium-amount');
            const bondWritten = document.getElementById('bond-written');
            const paymentTotalBond = document.getElementById('payment-total-bond');
            const paymentPremiumDue = document.getElementById('payment-premium-due');
            const paymentDown = document.getElementById('payment-down');
            const paymentBalance = document.getElementById('payment-balance');
            const paymentPremiumWords = document.getElementById('payment-premium-words');

            if (summaryDefendant) summaryDefendant.textContent = '--';
            if (summaryBond) summaryBond.textContent = '$0.00';
            if (summaryCharges) summaryCharges.textContent = '0';
            if (totalChargesCount) totalChargesCount.textContent = '0';
            if (totalBondAmount) totalBondAmount.textContent = '$0.00';
            if (premiumAmount) premiumAmount.textContent = '$0.00';
            if (bondWritten) bondWritten.textContent = 'Zero and 00/100 Dollars';
            if (paymentTotalBond) paymentTotalBond.textContent = '$0.00';
            if (paymentPremiumDue) paymentPremiumDue.textContent = '$0.00';
            if (paymentDown) paymentDown.textContent = '$0.00';
            if (paymentBalance) paymentBalance.textContent = '$0.00';
            if (paymentPremiumWords) paymentPremiumWords.textContent = 'Zero and 00/100 Dollars';

            // Reset receipt number display
            updateReceiptDisplay();

            updateBadges();
            localStorage.removeItem(LS_KEY_FORM);
            showToast('All fields cleared', 'info');
        }

        /* =========================================================
           PDF GENERATION & SIGNNOW
           ========================================================= */
        /**
         * Call Google Apps Script backend via doPostFromClient
         * This acts as a bridge for all GAS actions
         */
        function callGAS(action, data) {
            return new Promise((resolve, reject) => {
                console.log(`Calling GAS action: ${action}`, data);

                // Ensure data object exists
                if (!data) data = {};

                // Inject action into data if not already present (for doPost compatibility)
                if (!data.action) data.action = action;

                google.script.run
                    .withSuccessHandler(function (response) {
                        // console.log(`GAS Response (${action}):`, response);

                        // Handle structured error responses
                        if (response && response.success === false) {
                            console.error(`GAS Error (${action}):`, response.error);
                            reject(new Error(response.error || `Server error during ${action}`));
                        } else {
                            resolve(response);
                        }
                    })
                    .withFailureHandler(function (error) {
                        console.error(`GAS Connection Failure (${action}):`, error);
                        reject(error);
                    })
                    .doPostFromClient(data);
            });
        }

        /**
         * Upload PDF to SignNow
         */
        async function uploadToSignNow(pdfBytes, formData) {
            const defendantName = `${formData['defendant-first-name'] || ''}_${formData['defendant-last-name'] || ''}`.trim();
            const filename = `Bail_Packet_${defendantName}_${Date.now()}.pdf`;

            try {
                // Convert PDF bytes to base64 for GAS transfer
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(new Blob([pdfBytes]));
                });

                const result = await callGAS('uploadToSignNow', {
                    pdfBase64: base64,
                    fileName: filename
                });

                if (result.success) {
                    console.log('SignNow upload result:', result);
                    return result.documentId;
                } else {
                    throw new Error(result.error || 'Upload failed');
                }
            } catch (err) {
                console.error('SignNow upload error:', err);
                throw err;
            }
        }

        /**
         * Add signature/initials fields to a SignNow document
         * This is called after upload to place the signing fields
         * @param {string} documentId - SignNow document ID
         * @param {Array} selectedDocs - Array of selected document objects with keys
         * @returns {Object} - Result with roles created
         */
        /**
         * Add signature/initials fields to a SignNow document
         */
        async function addSignatureFields(documentId, selectedDocs) {
            const allFields = [];
            let pageOffset = 0;

            for (let i = 0; i < selectedDocs.length; i++) {
                const doc = selectedDocs[i];
                const docKey = doc.key;

                // Get page count using PDF-Lib (loaded via CDN)
                let numPages = 1;
                try {
                    const pdf = await PDFLib.PDFDocument.load(doc.bytes);
                    numPages = pdf.getPageCount();
                } catch (e) {
                    console.warn(`Could not determine page count for ${docKey}, assuming 1.`, e);
                }

                // Handle template key mapping
                let templateKey = doc.templateKey || docKey;
                if (docKey.includes('ssa-release-indemnitor')) templateKey = 'ssa-release';

                const signatureFields = CONFIG.signatureFields[templateKey] || [];

                for (let idx = 0; idx < signatureFields.length; idx++) {
                    const field = signatureFields[idx];
                    let role = field.role;

                    // Skip fields if role is not one of our target roles
                    if (!['Defendant', 'Indemnitor', 'Bail Agent'].includes(role)) continue;

                    // Role swap for Indemnitor copy of SSA Release
                    if (docKey.includes('ssa-release-indemnitor') && role === 'Defendant') {
                        role = 'Indemnitor';
                    }

                    allFields.push({
                        x: field.x,
                        y: field.y,
                        width: field.width,
                        height: field.height,
                        page_number: pageOffset + field.page_number,
                        role: role,
                        required: true,
                        type: field.type === 'initials' ? 'initials' : 'signature',
                        name: `${docKey}_${i}_${role}_${field.type}_${idx}`
                    });
                }

                pageOffset += numPages;
            }

            if (allFields.length === 0) return { success: true };

            console.log(`Adding ${allFields.length} signature fields...`);
            return await callGAS('addSignatureFields', { documentId, fields: allFields });
        }

        /**
         * Send signing invite via SignNow
         */
        async function sendSignNowInvite(documentId, formData, method = 'email') {
            const defendantEmail = document.getElementById('signer-defendant-email').value;
            const indemnitorEmail = document.getElementById('signer-indemnitor-email').value;
            const defendantPhone = document.getElementById('signer-defendant-phone').value;
            const indemnitorPhone = document.getElementById('signer-indemnitor-phone').value;
            const emailSubject = document.getElementById('email-subject').value || 'Shamrock Bail Bonds - Documents for Signature';

            if (method === 'sms') {
                const signers = [];
                if (defendantPhone) {
                    signers.push({
                        phone: defendantPhone,
                        role: 'Defendant',
                        name: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
                        order: 1,
                        smsMessage: `Shamrock Bail Bonds: ${formData['defendant-first-name']}, please sign your bail bond documents: `
                    });
                }
                if (indemnitorPhone) {
                    signers.push({
                        phone: indemnitorPhone,
                        role: 'Indemnitor',
                        name: 'Indemnitor',
                        order: 2,
                        smsMessage: 'Shamrock Bail Bonds: Please sign the documents as the indemnitor.'
                    });
                }

                return await callGAS('sendSmsInvite', {
                    documentId: documentId,
                    signers: signers,
                    options: { fromEmail: 'admin@shamrockbailbonds.biz' }
                });
            }

            // Email Logic (existing)
            const invitePayload = {
                to: [],
                from: 'admin@shamrockbailbonds.biz',
                subject: emailSubject,
                message: `Please review and sign the bail bond documents for ${formData['defendant-first-name']} ${formData['defendant-last-name']}.`
            };

            let order = 1;

            if (defendantEmail) {
                invitePayload.to.push({
                    email: defendantEmail,
                    role: 'Defendant',
                    role_id: '',
                    order: order++,
                    reassign: '0',
                    decline_by_signature: '0',
                    reminder: 4,
                    expiration_days: 30,
                    subject: emailSubject,
                    message: `Dear ${formData['defendant-first-name']}, please sign the bail bond documents.`
                });
            }

            if (indemnitorEmail) {
                invitePayload.to.push({
                    email: indemnitorEmail,
                    role: 'Indemnitor',
                    role_id: '',
                    order: order++,
                    reassign: '0',
                    decline_by_signature: '0',
                    reminder: 4,
                    expiration_days: 30,
                    subject: emailSubject,
                    message: 'Please sign the bail bond documents as the indemnitor/co-signer.'
                });
            }

            const additionalEmails = document.querySelectorAll('#additional-signer-emails input[type="email"]');
            additionalEmails.forEach((input, index) => {
                if (input.value) {
                    invitePayload.to.push({
                        email: input.value,
                        role: `Additional Signer ${index + 1}`,
                        role_id: '',
                        order: order++,
                        reassign: '0',
                        decline_by_signature: '0',
                        reminder: 4,
                        expiration_days: 30
                    });
                }
            });

            const result = await callGAS('sendEmailInvite', {
                documentId: documentId,
                signers: invitePayload.to,
                options: {
                    subject: invitePayload.subject,
                    message: invitePayload.message
                }
            });

            if (result.success) {
                console.log('SignNow invite result:', result);
                return { success: true, inviteId: result.inviteId, mode: 'email' };
            } else {
                throw new Error(result.error || 'Invite failed');
            }
        }

        /**
         * Create a signing link for kiosk mode
         */
        async function createSigningLink(documentId) {
            const result = await callGAS('createEmbeddedLink', {
                documentId: documentId,
                signerEmail: document.getElementById('signer-defendant-email').value || 'defendant@example.com',
                signerRole: 'Defendant' // Added required role
            });

            if (result.success && result.links && result.links[0]) {
                return { success: true, link: result.links[0], mode: 'kiosk' };
            } else {
                throw new Error(result.error || 'Failed to generate signing link');
            }
        }

        /**
         * Submit manual booking data to Google Sheets
         */
        async function submitToSheet() {
            const formData = collectFormData();

            if (!formData['defendant-first-name'] || !formData['defendant-last-name']) {
                showToast('Please enter defendant name', 'error');
                return;
            }

            showProgress('Saving to Sheet', ['Validating data', 'Connecting to backend', 'Appending row']);

            try {
                updateProgress(1, 'Validating data...');
                await sleep(300);

                updateProgress(2, 'Connecting to Google Apps Script...');
                google.script.run
                    .withSuccessHandler(function (result) {
                        hideProgress();
                        if (result.success) {
                            showToast('Successfully saved to Manual_Bookings sheet!', 'success');
                            // Optional: clear form or notify user
                        } else {
                            showToast('Failed to save data: ' + result.message, 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        hideProgress();
                        showToast('Error: ' + error.message, 'error');
                    })
                    .saveBookingData(formData);

            } catch (err) {
                hideProgress();
                showToast('Submission error: ' + err.message, 'error');
            }
        }

        /**
         * Trigger the Lee County Scraper (Apps Script version)
         */
        function runLeeScraper() {
            if (!confirm('Are you sure you want to run the Lee County Scraper? This may take several minutes.')) {
                return;
            }

            showToast('🚀 Launching Lee County Scraper...', 'info');

            google.script.run
                .withSuccessHandler(function (result) {
                    showToast('✅ Scraper completed successfully. Check the Lee tab.', 'success');
                })
                .withFailureHandler(function (error) {
                    showToast('❌ Scraper failed: ' + error.message, 'error');
                    console.error('Scraper error:', error);
                })
                .runLeeCountyScraper();
        }
        /**
         * Download filled PDF directly
         */
        function downloadFilledPdf(pdfBytes, formData) {
            const defendantName = `${formData['defendant-first-name'] || 'Unknown'}_${formData['defendant-last-name'] || 'Defendant'}`;
            const filename = `Bail_Packet_${defendantName}_${new Date().toISOString().split('T')[0]}.pdf`;

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        /**
         * Show success result after sending
         */
        function showSuccessResult(result, formData, signingMethod) {
            const resultDiv = document.getElementById('generate-result');
            const defendantName = `${formData['defendant-first-name']} ${formData['defendant-last-name']}`;

            let content = '';

            if (signingMethod === 'email') {
                content = `
          <div style="background: var(--success-bg); border: 2px solid var(--success); border-radius: var(--radius); padding: 24px; text-align: center;">
            <p style="font-size: 48px; margin-bottom: 16px;">✅</p>
            <h4 style="color: var(--success); margin-bottom: 8px;">Packet Sent Successfully!</h4>
            <p style="color: var(--text-secondary);">Receipt #${currentReceiptNumber - 1} • ${defendantName}</p>
            <p style="margin-top: 12px; color: var(--muted);">Signing invites have been sent to the specified email addresses.</p>
            <p style="margin-top: 16px;"><button class="btn btn-secondary" onclick="switchTab(null, 'status')">View Status</button></p>
          </div>
        `;
                showToast('Bail packet sent to SignNow successfully!', 'success');
            } else if (signingMethod === 'kiosk' && result.signingLink) {
                content = `
          <div style="background: var(--success-bg); border: 2px solid var(--success); border-radius: var(--radius); padding: 24px; text-align: center;">
            <p style="font-size: 48px; margin-bottom: 16px;">🖥️</p>
            <h4 style="color: var(--success); margin-bottom: 8px;">Kiosk Signing Ready!</h4>
            <p style="color: var(--text-secondary);">Receipt #${currentReceiptNumber - 1} • ${defendantName}</p>
            <p style="margin-top: 16px;"><a href="${result.signingLink}" target="_blank" class="btn btn-success btn-lg">Open Signing Page</a></p>
            <p style="margin-top: 12px;"><input type="text" value="${result.signingLink}" readonly style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border);" onclick="this.select()"></p>
          </div>
        `;
                showToast('Kiosk signing link created!', 'success');
            } else {
                content = `
          <div style="background: var(--success-bg); border: 2px solid var(--success); border-radius: var(--radius); padding: 24px; text-align: center;">
            <p style="font-size: 48px; margin-bottom: 16px;">⬇️</p>
            <h4 style="color: var(--success); margin-bottom: 8px;">Packet Downloaded!</h4>
            <p style="color: var(--text-secondary);">Receipt #${currentReceiptNumber - 1} • ${defendantName}</p>
            <p style="margin-top: 12px; color: var(--muted);">The filled bail packet has been downloaded to your device.</p>
          </div>
        `;
                showToast('Bail packet downloaded!', 'success');
            }

            resultDiv.innerHTML = content;
        }

        /**
         * Generate bail packet and send to SignNow
         */
        async function generateAndSend() {
            // Updated to use the new Orchestrator
            await generateAndSendWithWixPortal();
            return;

            /* LEGACY LOGIC BELOW (Unreachable) */
            const formData = collectFormData();

            if (!formData['defendant-first-name'] || !formData['defendant-last-name']) {
                showToast('Please enter defendant name', 'error');
                return;
            }

            if (formData.charges.length === 0) {
                showToast('Please add at least one charge', 'error');
                return;
            }

            const signingMethod = document.getElementById('signing-method').value;

            if (signingMethod === 'email') {
                const defendantEmail = document.getElementById('signer-defendant-email').value;
                const indemnitorEmail = document.getElementById('signer-indemnitor-email').value;
                if (!defendantEmail && !indemnitorEmail) {
                    showToast('Please enter at least one email address for signing', 'error');
                    return;
                }
            } else if (signingMethod === 'sms') {
                const defendantPhone = document.getElementById('signer-defendant-phone').value;
                const indemnitorPhone = document.getElementById('signer-indemnitor-phone').value;
                if (!defendantPhone && !indemnitorPhone) {
                    showToast('Please enter at least one phone number for SMS signing', 'error');
                    return;
                }
            }

            // showProgress('Generating Bail Packet', [...]);
            UI.showLoading('Generating Bail Packet', 'Initializing process...');

            try {
                // updateProgress(1, 'Collecting form data...');
                UI.updateLoading(10, 'Collecting form data...');
                await sleep(300);

                // updateProgress(2, 'Fetching PDF templates from Google Drive...');
                UI.updateLoading(20, 'Fetching PDF templates from Google Drive...');
                const selectedDocs = getSelectedDocuments();
                if (selectedDocs.length === 0) throw new Error('No documents selected');

                const pdfBytes = await fetchPDFsFromDrive(selectedDocs);

                // updateProgress(3, 'Filling documents with defendant data...');
                UI.updateLoading(40, 'Filling documents with defendant data...');
                const filledPdfs = await fillPDFsWithData(pdfBytes, formData);

                // updateProgress(4, 'Merging all documents into packet...');
                UI.updateLoading(60, 'Merging all documents into packet...');
                const mergedPdf = await mergePDFs(filledPdfs);

                // updateProgress(5, 'Uploading to SignNow...');
                UI.updateLoading(70, 'Uploading to SignNow system...');
                const documentId = await uploadToSignNow(mergedPdf, formData);

                if (!documentId) throw new Error('Failed to upload document to SignNow');

                // Add signature/initials fields to the uploaded document
                UI.updateLoading(80, 'Adding signature fields...');
                await addSignatureFields(documentId, selectedDocs);

                UI.updateLoading(90, 'Sending for signatures...');

                let result;
                let signingLinks = [];

                if (signingMethod === 'email' || signingMethod === 'sms') {
                    result = await sendSignNowInvite(documentId, formData, signingMethod);
                } else if (signingMethod === 'kiosk') {
                    // For kiosk, generate link
                    const request = await createSigningLink(documentId);
                    if (request.success && request.signingLink) {
                        result = request;
                        signingLinks.push({
                            email: 'kiosk_signer@shamrock.local', // Placeholder
                            name: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
                            role: 'defendant',
                            url: request.signingLink
                        });
                    } else {
                        throw new Error('Failed to create kiosk link: ' + (request.error || 'Unknown error'));
                    }
                } else {
                    result = { success: true, mode: 'download' };
                    downloadFilledPdf(mergedPdf, formData);
                }

                // OPTIONAL: Save signing links to Wix portal
                if (typeof WIX_PORTAL_CONFIG !== 'undefined' && WIX_PORTAL_CONFIG.enabled && signingLinks.length > 0) {
                    UI.updateLoading(95, 'Saving to client portal...');
                    const defendantName = `${formData['defendant-first-name']} ${formData['defendant-last-name']}`;
                    const caseNumber = formData.charges[0]?.['case-number'] || '';

                    const portalDocuments = signingLinks.map(link => ({
                        signerEmail: link.email,
                        signerName: link.name,
                        signerPhone: link.phone || '', // Ensure optional phone is handled
                        signerRole: link.role,
                        signingLink: link.url,
                        documentId: documentId,
                        defendantName: defendantName,
                        caseNumber: caseNumber,
                        documentName: 'Bail Bond Packet'
                    }));

                    await batchSaveToWixPortal(portalDocuments);
                }

                currentReceiptNumber++;
                updateReceiptDisplay();
                saveFormToLocalStorage();

                sentPackets.push({
                    id: Date.now(),
                    documentId: documentId,
                    defendant: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
                    date: new Date().toISOString(),
                    status: signingMethod === 'download' ? 'downloaded' : 'sent',
                    receiptNumber: currentReceiptNumber - 1,
                    signingMethod: signingMethod
                });
                localStorage.setItem(LS_KEY_PACKETS, JSON.stringify(sentPackets));

                UI.hideLoading();
                showSuccessResult(result, formData, signingMethod);

            } catch (err) {
                UI.hideLoading();
                showToast('Error generating packet: ' + err.message, 'error');
                console.error('Generation error:', err);
            }
        }

        /* =========================================================
           PDF PREVIEW FUNCTIONALITY
           ========================================================= */

        /**
         * Get selected documents in the correct order for SignNow
         * Excludes print-only documents (like appearance-bond)
         * @returns {Array} Array of document objects sorted by templateOrder
         */
        /* DEPRECATED - Replaced by getSelectedDocuments at bottom
        function getSelectedDocuments(includePrintOnly = false) {
             // ...
        }
        */

        /**
         * Get print-only documents (like appearance bonds)
         * These are generated but not sent to SignNow
         * @returns {Array} Array of print-only document objects
         */
        function getPrintOnlyDocuments() {
            const printOnly = [];

            CONFIG.printOnlyDocs.forEach(templateKey => {
                const cb = document.querySelector(`input[data-template="${templateKey}"]:checked`);
                if (cb && CONFIG.templates[templateKey]) {
                    printOnly.push({
                        key: templateKey,
                        id: CONFIG.templates[templateKey],
                        name: cb.closest('.doc-item')?.querySelector('.doc-name')?.textContent || templateKey
                    });
                }
            });

            return printOnly;
        }


        /**
         * IndexedDB Wrapper for PDF Template Caching
         * Replaces sessionStorage to avoid quota exceeded errors
         */
        class PDFCacheDB {
            constructor() {
                this.dbName = 'shamrock-pdf-cache';
                this.storeName = 'templates';
                this.version = 1;
                this.db = null;
                this.isSupported = typeof indexedDB !== 'undefined';
                this.useFallback = false;
            }

            async init() {
                if (!this.isSupported) {
                    console.warn('⚠️ IndexedDB not supported, using sessionStorage fallback');
                    this.useFallback = true;
                    return;
                }

                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.dbName, this.version);

                    request.onerror = () => {
                        console.error('❌ IndexedDB open failed, using sessionStorage fallback');
                        this.useFallback = true;
                        resolve();
                    };

                    request.onsuccess = (event) => {
                        this.db = event.target.result;
                        console.log('✅ IndexedDB initialized for PDF caching');
                        resolve();
                    };

                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains(this.storeName)) {
                            db.createObjectStore(this.storeName);
                            console.log('📦 Created IndexedDB object store:', this.storeName);
                        }
                    };
                });
            }

            async get(key) {
                // Fallback to sessionStorage
                if (this.useFallback) {
                    return sessionStorage.getItem('PDF_CACHE_v1_' + key);
                }

                return new Promise((resolve, reject) => {
                    try {
                        const transaction = this.db.transaction([this.storeName], 'readonly');
                        const store = transaction.objectStore(this.storeName);
                        const request = store.get(key);

                        request.onsuccess = () => resolve(request.result || null);
                        request.onerror = () => {
                            console.warn('IndexedDB read error, trying sessionStorage');
                            resolve(sessionStorage.getItem('PDF_CACHE_v1_' + key));
                        };
                    } catch (e) {
                        console.warn('IndexedDB get error:', e);
                        resolve(sessionStorage.getItem('PDF_CACHE_v1_' + key));
                    }
                });
            }

            async set(key, value) {
                // If IndexedDB is not available, skip caching entirely
                // (sessionStorage is too small for PDF templates)
                if (this.useFallback) {
                    console.warn('⚠️ IndexedDB unavailable, skipping cache for:', key);
                    return;
                }

                return new Promise((resolve, reject) => {
                    try {
                        const transaction = this.db.transaction([this.storeName], 'readwrite');
                        const store = transaction.objectStore(this.storeName);
                        const request = store.put(value, key);

                        request.onsuccess = () => {
                            console.log(`✅ Cached ${key} to IndexedDB`);
                            resolve();
                        };
                        request.onerror = (e) => {
                            console.error(`❌ IndexedDB write failed for ${key}:`, e.target.error);
                            reject(new Error(`Failed to cache ${key}: ${e.target.error}`));
                        };
                    } catch (e) {
                        console.error('❌ IndexedDB set error:', e);
                        reject(e);
                    }
                });
            }

            async clear() {
                if (this.useFallback) {
                    // Clear sessionStorage items with our prefix
                    const keys = Object.keys(sessionStorage);
                    keys.forEach(key => {
                        if (key.startsWith('PDF_CACHE_v1_')) {
                            sessionStorage.removeItem(key);
                        }
                    });
                    return;
                }

                return new Promise((resolve) => {
                    try {
                        const transaction = this.db.transaction([this.storeName], 'readwrite');
                        const store = transaction.objectStore(this.storeName);
                        const request = store.clear();
                        request.onsuccess = () => {
                            console.log('🗑️ PDF cache cleared');
                            resolve();
                        };
                        request.onerror = () => resolve();
                    } catch (e) {
                        console.warn('Clear cache error:', e);
                        resolve();
                    }
                });
            }
        }

        // Initialize PDF cache globally
        const pdfCache = new PDFCacheDB();
        pdfCache.init().catch(err => console.error('PDF cache init error:', err));

        /**
         * Send document packet to Wix Client Portal
         * This mirrors generateAndSend but directs the output to the portal
         */
        async function sendToPortal() {
            const formData = collectFormData();

            if (!formData['defendant-first-name'] || !formData['defendant-last-name']) {
                showToast('Please enter defendant name', 'error');
                return;
            }

            if (formData.charges.length === 0) {
                showToast('Please add at least one charge', 'error');
                return;
            }

            // Ensure we have at least one signer email or phone
            const defendantEmail = document.getElementById('signer-defendant-email').value;
            const indemnitorEmail = document.getElementById('signer-indemnitor-email').value;
            const defendantPhone = document.getElementById('signer-defendant-phone').value;
            const indemnitorPhone = document.getElementById('signer-indemnitor-phone').value;

            if (!defendantEmail && !indemnitorEmail && !defendantPhone && !indemnitorPhone) {
                showToast('Please enter at least one email or phone for the client portal', 'error');
                return;
            }

            // Override signing method for the logic
            formData.signingMethod = document.getElementById('signing-method').value;

            showProgress('Sending to Client Portal', [
                'Collecting form data',
                'Fetching PDF templates',
                'Filling documents',
                'Merging packet',
                'Uploading to SignNow',
                'Sending to Wix Portal'
            ]);

            try {
                updateProgress(1, 'Collecting form data...');
                await sleep(300);

                updateProgress(2, 'Fetching PDF templates from Google Drive...');
                const selectedDocs = getSelectedDocuments();
                if (selectedDocs.length === 0) throw new Error('No documents selected');

                const pdfBytes = await fetchPDFsFromDrive(selectedDocs);

                updateProgress(3, 'Filling documents with defendant data...');
                const filledPdfs = await fillPDFsWithData(pdfBytes, formData);

                updateProgress(4, 'Merging all documents into packet...');
                const mergedPdf = await mergePDFs(filledPdfs);

                // We need to convert the PDF to base64 to send to backend
                // The backend will then upload to SignNow and register with Wix
                const reader = new FileReader();
                reader.readAsDataURL(new Blob([mergedPdf], { type: 'application/pdf' }));

                reader.onloadend = async function () {
                    const base64data = reader.result.split(',')[1];

                    updateProgress(5, 'Processing with SignNow & Wix...');

                    // Add the PDF content to formData for the backend
                    formData.pdfBase64 = base64data;
                    formData.fileName = `Bail_Packet_${formData['defendant-first-name']}_${formData['defendant-last-name']}.pdf`;

                    // Call the new backend action
                    try {
                        const result = await callGAS('sendToWixPortal', formData);

                        hideProgress();

                        if (result.success) {
                            // Update local state to match generateAndSend behavior
                            currentReceiptNumber++;
                            updateReceiptDisplay();
                            saveFormToLocalStorage();

                            sentPackets.push({
                                id: Date.now(),
                                documentId: result.documentId || 'wix-portal', // Fallback ID
                                defendant: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
                                date: new Date().toISOString(),
                                status: 'sent_to_portal',
                                receiptNumber: currentReceiptNumber - 1,
                                signingMethod: 'portal'
                            });
                            localStorage.setItem(LS_KEY_PACKETS, JSON.stringify(sentPackets));

                            showToast('Successfully sent to Client Portal!', 'success');

                            // Show success UI
                            const resultDiv = document.getElementById('generate-result');
                            resultDiv.innerHTML = `
                              <div style="background: var(--surface-2); border: 2px solid var(--accent); border-radius: var(--radius); padding: 24px; text-align: center;">
                                <p style="font-size: 48px; margin-bottom: 16px;">🚀</p>
                                <h4 style="color: var(--text); margin-bottom: 8px;">Sent to Client Portal!</h4>
                                <p style="color: var(--text-secondary);">The documents have been generated and pushed to the Wix Portal.</p>
                                <p style="margin-top: 12px; color: var(--muted);">Client can now log in to view and sign.</p>
                              </div>
                            `;
                        } else {
                            showToast('Failed to send to portal: ' + result.message, 'error');
                            console.error('Portal send failed:', result);
                        }
                    } catch (e) {
                        hideProgress();
                        showToast('Backend error: ' + e.message, 'error');
                    }
                };

            } catch (err) {
                hideProgress();
                showToast('Error sending to portal: ' + err.message, 'error');
                console.error('Portal generation error:', err);
            }
        }

        /**
         * Fetch PDFs from Google Drive with Batching & Caching
         * Optimized to prevent "Exceeded Maximum Execution Time" and "Java Runtime" errors
         */
        async function fetchPDFsFromDrive(documents) {
            console.log('Fetching PDFs for:', documents);
            const results = [];
            const CACHE_PREFIX = 'PDF_CACHE_v1_';

            // 1. Check IndexedDB Cache (with sessionStorage fallback)
            console.log('🔍 Checking PDF Cache...');
            const missingDocs = [];
            for (const doc of documents) {
                try {
                    const templateKey = doc.templateKey || doc.key; // Use templateKey for caching
                    const cached = await pdfCache.get(templateKey);
                    if (cached) {
                        const binaryString = atob(cached);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        results.push({ key: doc.key, name: doc.name, bytes: bytes, templateKey: templateKey, indices: doc.indices });
                        console.log(`✅ Loaded ${templateKey} from cache`);
                    } else {
                        missingDocs.push(doc);
                    }
                } catch (e) {
                    console.warn('Cache access error:', e);
                    missingDocs.push(doc);
                }
            }

            // 2. Batch Fetch Missing Documents
            if (missingDocs.length > 0) {
                console.log(`📥 Fetching ${missingDocs.length} documents from server (Batch Mode)...`);

                // Identify unique template keys needed from missingDocs
                const uniqueMissingKeys = [...new Set(missingDocs.map(d => d.templateKey || d.key))];

                // BATCH REQUEST TO GAS
                // We fetch all needed templates in one go to minimize execution time
                const BATCH_SIZE = 1; // Fetch 1 at a time to prevent payload limits with large PDFs
                for (let i = 0; i < uniqueMissingKeys.length; i += BATCH_SIZE) {
                    const batch = uniqueMissingKeys.slice(i, i + BATCH_SIZE);
                    try {
                        const response = await callGAS('getPDFTemplates', { templateIds: batch });

                        if (!response || !response.success || !response.templates) {
                            throw new Error(response?.error || 'Failed to fetch templates');
                        }

                        // Process batch results
                        for (const key of batch) {
                            const templateData = response.templates[key];
                            if (templateData && templateData.success && templateData.pdfBase64) {
                                // Decode
                                const binaryString = atob(templateData.pdfBase64);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let j = 0; j < binaryString.length; j++) {
                                    bytes[j] = binaryString.charCodeAt(j);
                                }

                                // Save to IndexedDB for caching
                                try {
                                    await pdfCache.set(key, templateData.pdfBase64);
                                } catch (cacheErr) {
                                    console.warn(`⚠️ Failed to cache ${key}, will re-fetch if needed:`, cacheErr.message);
                                    // Continue processing - caching is optional
                                }

                            } else {
                                console.error(`❌ Failed to fetch ${key}:`, templateData?.error);
                            }
                        }


                    } catch (err) {
                        console.error('Batch Fetch Error:', err);
                        throw err;
                    }
                }

                // Now that all unique missing templates are fetched and cached,
                // add the actual requested documents (which might be duplicates of templates) to results
                for (const doc of missingDocs) {
                    const templateKey = doc.templateKey || doc.key;
                    const cachedBase64 = await pdfCache.get(templateKey);

                    if (cachedBase64) {
                        const binaryString = atob(cachedBase64);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        results.push({ key: doc.key, name: doc.name, bytes: bytes, templateKey: templateKey, indices: doc.indices });
                    } else {
                        console.error(`Missing template data for ${doc.key} (template: ${templateKey})`);
                        throw new Error(`Failed to load template: ${doc.name}`);
                    }
                }
            }

            return results;
        }

        function calculateTotalBondAmount(formData) {
            if (!formData.charges || formData.charges.length === 0) return '0.00';
            const total = formData.charges.reduce((sum, charge) => {
                const amount = parseFloat(charge.bondAmount?.replace(/[,$]/g, '') || 0);
                return sum + amount;
            }, 0);
            return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        /**
         * Calculate premium amount for PDF filling
         * Applies $100 minimum per charge rule:
         * - If charge bond <= $1,000: Premium = $100
         * - If charge bond > $1,000: Premium = 10%
         */
        function calculatePremiumAmount(formData) {
            if (!formData.charges || formData.charges.length === 0) return '0.00';

            let totalPremium = 0;
            formData.charges.forEach(charge => {
                const bondAmount = parseFloat(charge.bondAmount?.replace(/[,$]/g, '') || 0);
                if (bondAmount > 0) {
                    // Apply $100 minimum per charge (for bonds $1,000 or less)
                    if (bondAmount <= 1000) {
                        totalPremium += 100;
                    } else {
                        totalPremium += bondAmount * 0.10;
                    }
                }
            });

            return totalPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        /**
 * Helper: Get indemnitor field value by index and field name
 */
        function getIndemnitorField(formData, index, field) {
            if (!formData.indemnitors || !formData.indemnitors[index]) return null;
            const ind = formData.indemnitors[index];

            if (field === 'fullName' || field === 'full-name') {
                return `${ind.firstName || ''} ${ind.middleName || ''} ${ind.lastName || ''}`.trim().replace(/\s+/g, ' ');
            }
            if (field === 'name') {
                return `${ind.firstName || ''} ${ind.lastName || ''}`.trim();
            }

            const fieldMap = {
                'firstName': ind.firstName,
                'first-name': ind.firstName,
                'lastName': ind.lastName,
                'last-name': ind.lastName,
                'middleName': ind.middleName,
                'middle-name': ind.middleName,
                'dob': ind.dob,
                'ssn': ind.ssn,
                'dl': ind.dl,
                'dlState': ind.dlState,
                'dl-state': ind.dlState,
                'address': ind.address,
                'street-address': ind.address,
                'city': ind.city,
                'state': 'FL', // Default to FL
                'zip': ind.zip,
                'zipcode': ind.zip,
                'phone': ind.phone,
                'email': ind.email,
                'employer': ind.employer,
                'employerPhone': ind.employerPhone,
                'employer-phone': ind.employerPhone,
                'employerCity': ind.employerCity,
                'employer-city': ind.employerCity,
                'employerState': ind.employerState,
                'employer-state': ind.employerState,
                // Composite Employer Address
                'employerAddress': `${ind.employerCity || ''}, ${ind.employerState || ''}`.trim().replace(/^,/, '').replace(/,$/, ''),
                'employer-address': `${ind.employerCity || ''}, ${ind.employerState || ''}`.trim().replace(/^,/, '').replace(/,$/, ''),
                'supervisor': ind.supervisor,
                'supervisorPhone': ind.supervisorPhone,
                'supervisor-phone': ind.supervisorPhone,
                // Reference 1
                'ref1Name': ind.ref1Name,
                'ref1-name': ind.ref1Name,
                'ref-1-name': ind.ref1Name,
                'ref1Relation': ind.ref1Relation,
                'ref1-relation': ind.ref1Relation,
                'ref-1-relation': ind.ref1Relation,
                'ref1Phone': ind.ref1Phone,
                'ref1-phone': ind.ref1Phone,
                'ref-1-phone': ind.ref1Phone,
                'ref1Address': ind.ref1Address,
                'ref1-address': ind.ref1Address,
                'ref-1-address': ind.ref1Address,
                // Reference 2
                'ref2Name': ind.ref2Name,
                'ref2-name': ind.ref2Name,
                'ref-2-name': ind.ref2Name,
                'ref2Relation': ind.ref2Relation,
                'ref2-relation': ind.ref2Relation,
                'ref-2-relation': ind.ref2Relation,
                'ref2Phone': ind.ref2Phone,
                'ref2-phone': ind.ref2Phone,
                'ref-2-phone': ind.ref2Phone,
                'ref2Address': ind.ref2Address,
                'ref2-address': ind.ref2Address,
                'ref-2-address': ind.ref2Address,
                'relationship': ind.relationship
            };

            return fieldMap[field] || null;
        }

        /**
         * Map field names to form data values - FIXED VERSION
         */
        function mapFieldToData(fieldName, formData) {
            // Basic mappings for defendant and system fields
            const mappings = {
                'defendant-name': `${formData['defendant-first-name'] || ''} ${formData['defendant-middle-name'] || ''} ${formData['defendant-last-name'] || ''}`.trim().replace(/\s+/g, ' '),
                'defendant-full-name': `${formData['defendant-first-name'] || ''} ${formData['defendant-middle-name'] || ''} ${formData['defendant-last-name'] || ''}`.trim().replace(/\s+/g, ' '),
                'name': `${formData['defendant-first-name'] || ''} ${formData['defendant-last-name'] || ''}`.trim(),
                'first-name': formData['defendant-first-name'],
                'last-name': formData['defendant-last-name'],
                'middle-name': formData['defendant-middle-name'],
                'dob': formData['defendant-dob'],
                'ssn': formData['defendant-ssn'],
                'dl': formData['defendant-dl'],
                'address': formData['defendant-address'],
                'street-address': formData['defendant-address'],
                'city': formData['defendant-city'],
                'state': formData['defendant-state'] || 'FL',
                'zip': formData['defendant-zip'],
                'zipcode': formData['defendant-zip'],
                'phone': formData['defendant-phone'],
                'email': formData['defendant-email'],
                'bond-amount': calculateTotalBondAmount(formData),
                'total-bond': calculateTotalBondAmount(formData),
                'premium-amount': calculatePremiumAmount(formData),
                'premium': calculatePremiumAmount(formData),
                'receipt-number': currentReceiptNumber.toString(),
                'collateral-receipt-number': `C-${currentReceiptNumber}`,
                'date': new Date().toLocaleDateString('en-US'),
                'today': new Date().toLocaleDateString('en-US'),
                'current-date': new Date().toISOString().split('T')[0],
                // Case number mappings
                'case-number': formData.charges && formData.charges[0] ? formData.charges[0].caseNumber : '',
                'case-num': formData.charges && formData.charges[0] ? formData.charges[0].caseNumber : '',
                'casenumber': formData.charges && formData.charges[0] ? formData.charges[0].caseNumber : ''
            };

            // PRIMARY INDEMNITOR MAPPINGS (indemnitor-1 or just "indemnitor")
            const indemnitorMappings = {
                'indemnitor-name': getIndemnitorField(formData, 0, 'fullName'),
                'indemnitor-full-name': getIndemnitorField(formData, 0, 'fullName'),
                'indemnitor-first-name': getIndemnitorField(formData, 0, 'firstName'),
                'indemnitor-last-name': getIndemnitorField(formData, 0, 'lastName'),
                'indemnitor-middle-name': getIndemnitorField(formData, 0, 'middleName'),
                'indemnitor-dob': getIndemnitorField(formData, 0, 'dob'),
                'indemnitor-ssn': getIndemnitorField(formData, 0, 'ssn'),
                'indemnitor-dl': getIndemnitorField(formData, 0, 'dl'),
                'indemnitor-dl-state': getIndemnitorField(formData, 0, 'dlState'),
                'indemnitor-address': getIndemnitorField(formData, 0, 'address'),
                'indemnitor-street-address': getIndemnitorField(formData, 0, 'address'),
                'indemnitor-city': getIndemnitorField(formData, 0, 'city'),
                'indemnitor-state': 'FL',
                'indemnitor-zip': getIndemnitorField(formData, 0, 'zip'),
                'indemnitor-zipcode': getIndemnitorField(formData, 0, 'zip'),
                'indemnitor-phone': getIndemnitorField(formData, 0, 'phone'),
                'indemnitor-email': getIndemnitorField(formData, 0, 'email'),
                'indemnitor-employer': getIndemnitorField(formData, 0, 'employer'),
                'indemnitor-employer-phone': getIndemnitorField(formData, 0, 'employerPhone'),
                'indemnitor-relationship': getIndemnitorField(formData, 0, 'relationship'),
                // Also support "indemnitors" plural
                'indemnitors': formData.indemnitors && formData.indemnitors.length > 0
                    ? formData.indemnitors.map(ind => `${ind.firstName || ''} ${ind.lastName || ''}`).join(', ').trim()
                    : ''
            };

            // Merge all mappings
            const allMappings = { ...mappings, ...indemnitorMappings };

            // Check direct mappings first
            if (allMappings[fieldName] !== undefined) {
                return allMappings[fieldName];
            }

            // Handle numbered indemnitors (indemnitor-1-first-name, indemnitor-2-last-name, etc.)
            if (fieldName.match(/^indemnitor-\d+-/)) {
                const match = fieldName.match(/^indemnitor-(\d+)-(.*)/);
                if (match) {
                    const index = parseInt(match[1]) - 1; // Convert 1-based to 0-based
                    const field = match[2];
                    return getIndemnitorField(formData, index, field);
                }
            }

            // Handle charge fields
            if (fieldName.includes('charge') && formData.charges && formData.charges.length > 0) {
                const chargeMatch = fieldName.match(/charge-?(\d+)?-?(.*)?/);
                if (chargeMatch) {
                    const chargeIndex = parseInt(chargeMatch[1] || '1') - 1;
                    const chargeField = chargeMatch[2] || 'desc';
                    if (formData.charges[chargeIndex]) {
                        const charge = formData.charges[chargeIndex];
                        if (chargeField === 'desc' || chargeField === 'description') return charge.desc;
                        if (chargeField === 'case' || chargeField === 'case-number' || chargeField === 'casenumber') return charge.caseNumber;
                        if (chargeField === 'power' || chargeField === 'power-number') return charge.powerNumber;
                        if (chargeField === 'bond' || chargeField === 'bond-amount') return charge.bondAmount;
                    }
                }
            }

            // NEW: Handle Indemnity Agreement specific prefix "indemnityAgreement"
            if (fieldName.startsWith('indemnityAgreement')) {
                const subField = fieldName.replace('indemnityAgreement', '');

                // General fallback: strip prefix and try standard mapping
                const normalized = normalizeFieldName(subField);
                if (mappings[normalized]) return mappings[normalized];

                // Recursive attempt
                const val = mapFieldToData(normalized, formData);
                if (val !== null) return val;
            }

            // NEW: Handle Defendant Application specific prefix "defendantApplication"
            // Example: defendantApplicationFirstName -> first-name
            if (fieldName.startsWith('defendantApplication')) {
                const subField = fieldName.replace('defendantApplication', '');

                // Specific Overrides for Defendant Application
                if (subField === 'BondPremiumWritten') {
                    // Calculate text representation of premium
                    const premium = calculateTotalPremium(formData);
                    return numberToWords(Math.floor(premium)) + ' and ' + String(Math.round((premium % 1) * 100)).padStart(2, '0') + '/100 Dollars';
                }
                if (subField === 'Children1NameAge') return formData['children1'] || ''; // Future proofing
                if (subField === 'Children2NameAge') return formData['children2'] || '';

                // General fallback: strip prefix and try standard mapping
                // e.g. defendantApplicationFirstName -> FirstName -> first-name
                const normalized = normalizeFieldName(subField);
                if (mappings[normalized]) return mappings[normalized];

                // Recursive attempt with normalized lookup
                const val = mapFieldToData(normalized, formData);
                if (val !== null) return val;
            }

            // Handle PowerNo / BondNo aliases (User req: "able to be the same")
            if (fieldName === 'powerNo' || fieldName === 'bondNo') {
                // Try to get from first charge
                if (formData.charges && formData.charges[0]) {
                    return formData.charges[0].powerNumber || '';
                }
            }

            return null;
        }

        /**
         * Improved field name normalization - handles camelCase
         */
        function normalizeFieldName(fieldName) {
            return fieldName
                .replace(/([A-Z])/g, '-$1') // Convert camelCase to dash-case
                .toLowerCase()
                .replace(/[_\s]/g, '-')
                .replace(/^-/, '') // Remove leading dash
                .replace(/-+/g, '-'); // Remove duplicate dashes
        }

        /**
         * Helper: Get indemnitor field value by index and field name
         */
        function getIndemnitorField(formData, index, field) {
            if (!formData.indemnitors || !formData.indemnitors[index]) return null;
            const ind = formData.indemnitors[index];

            if (field === 'fullName' || field === 'full-name') {
                return `${ind.firstName || ''} ${ind.middleName || ''} ${ind.lastName || ''}`.trim().replace(/\s+/g, ' ');
            }
            if (field === 'name') {
                return `${ind.firstName || ''} ${ind.lastName || ''}`.trim();
            }

            const fieldMap = {
                'firstName': ind.firstName,
                'first-name': ind.firstName,
                'lastName': ind.lastName,
                'last-name': ind.lastName,
                'middleName': ind.middleName,
                'middle-name': ind.middleName,
                'dob': ind.dob,
                'ssn': ind.ssn,
                'dl': ind.dl,
                'dlState': ind.dlState,
                'dl-state': ind.dlState,
                'address': ind.address,
                'street-address': ind.address,
                'city': ind.city,
                'state': 'FL', // Default to FL
                'zip': ind.zip,
                'zipcode': ind.zip,
                'phone': ind.phone,
                'email': ind.email,
                'employer': ind.employer,
                'employerPhone': ind.employerPhone,
                'employer-phone': ind.employerPhone,
                'relationship': ind.relationship
            };

            return fieldMap[field] || null;
        }



        /**
         * Get list of selected documents with robust expansion for copies (e.g. SSA Release)
         */
        function getSelectedDocuments(includeCopies = true) {
            const selected = [];
            document.querySelectorAll('.doc-item input[type="checkbox"]:checked').forEach(cb => {
                const templateKey = cb.dataset.template;
                if (!templateKey) return;

                const docName = cb.closest('.doc-item').querySelector('.doc-name').textContent;

                // Add main document
                selected.push({ key: templateKey, name: docName });

                // Expansion Logic for SSA Release
                // If SSA Release is selected, we want one for Defendant (added above) 
                // AND one for each Indemnitor.
                if (includeCopies && templateKey === 'ssa-release') {
                    const indemnitors = document.querySelectorAll('.entity-card.indemnitor');
                    if (indemnitors.length > 0) {
                        console.log(`Adding SSA Release copies for ${indemnitors.length} indemnitors`);
                        indemnitors.forEach((ind, index) => {
                            // Use a unique key for the file, but alias it to the same template
                            selected.push({
                                key: templateKey,
                                name: `${docName} (Indemnitor ${index + 1})`,
                                isCopy: true,
                                indemnitorIndex: index
                            });
                        });
                    }
                }
            });
            return selected;
        }

        /**
         * Improved field name normalization - handles camelCase
         */
        function normalizeFieldName(fieldName) {
            return fieldName
                .replace(/([A-Z])/g, '-$1') // Convert camelCase to dash-case
                .toLowerCase()
                .replace(/[_\s]/g, '-')
                .replace(/^-/, '') // Remove leading dash
                .replace(/-+/g, '-'); // Remove duplicate dashes
        }

        /**
         * Fill PDFs with form data using pdf-lib - IMPROVED VERSION
         */
        async function fillPDFsWithData(pdfDocs, formData) {
            const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, rgb } = PDFLib;
            const filledPdfs = [];
            let fieldCount = 0;
            let skippedFields = [];

            console.log(`Starting to fill ${pdfDocs.length} documents...`);
            console.log('Form data structure:', {
                defendantName: formData['defendant-first-name'],
                indemnitorCount: formData.indemnitors ? formData.indemnitors.length : 0,
                chargesCount: formData.charges ? formData.charges.length : 0
            });

            for (const doc of pdfDocs) {
                // Reset counters
                fieldCount = 0;

                try {
                    console.log(`Filling ${doc.key}...`);
                    const pdfDoc = await PDFDocument.load(doc.bytes);
                    const form = pdfDoc.getForm();

                    // --- DEBUG: LOG ALL FIELDS ---
                    const fields = form.getFields();
                    const page1 = pdfDoc.getPages()[0];
                    const { width, height } = page1.getSize();
                    console.log(`[DEBUG] ${doc.key}: ${fields.length} fields. Page 1 Size: ${width}x${height} (pts) [${width / 72}x${height / 72} in]`, fields.map(f => f.getName()));

                    // --- NEW FAQ INITIAL LOGIC ---
                    if (doc.key === 'faq-defendants' || doc.key === 'faq-cosigners') {
                        const pages = pdfDoc.getPages();
                        const role = doc.key === 'faq-defendants' ? 'Defendant' : 'Indemnitor';
                        const tag = `{{t:i;r:y;o:"${role}"}}`;
                        console.log(`Injecting initial tags for ${role} on ${pages.length} pages...`);

                        pages.forEach(page => {
                            const { width, height } = page.getSize();
                            // Bottom right corner, small white text (invisible to user, visible to SignNow parser)
                            page.drawText(tag, {
                                x: width - 150,
                                y: 30,
                                size: 8,
                                color: rgb(1, 1, 1)
                            });
                        });
                    }

                    // --- NEW MANUS MAPPING LOGIC ---
                    // 1. Get the list of fields to fill for this specific template
                    const mappedFields = PDF_mapDataToTags(formData, doc.key);
                    console.log(`  Retrieving ${mappedFields.length} mapped fields for ${doc.key}`);

                    // 2. Iterate and Fill
                    for (const item of mappedFields) {
                        try {
                            const field = form.getField(item.name);
                            if (!field) {
                                console.warn(`  [MISSING] Mapping expects '${item.name}' but PDF does not have it.`);
                                continue;
                            }

                            if (field instanceof PDFTextField) {
                                field.setText(String(item.value));
                                fieldCount++;
                                console.log(`  ✓ Filled: ${item.name}`);
                            } else if (field instanceof PDFCheckBox) {
                                if (item.value === true || item.value === 'true' || item.value === 'yes' || item.value === '1') {
                                    field.check();
                                    fieldCount++;
                                }
                            }
                        } catch (err) {
                            console.warn(`  Error filling field ${item.name}:`, err.message);
                        }
                    }

                    // Flatten form to save data
                    form.flatten();

                    const pdfBytes = await pdfDoc.save();
                    const pdfBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result.split(',')[1]);
                        reader.readAsDataURL(new Blob([pdfBytes]));
                    });

                    filledPdfs.push({
                        key: doc.key,
                        name: doc.name,
                        data: pdfBase64,
                        pageCount: pdfDoc.getPageCount(), // Added for signature offset calculation
                        // Preserve copy metadata
                        isCopy: doc.isCopy,
                        indemnitorIndex: doc.indemnitorIndex
                    });
                    console.log(`  Completed ${doc.key} with ${fieldCount} fields filled. Pages: ${pdfDoc.getPageCount()}`);

                } catch (err) {
                    console.error(`Error filling PDF ${doc.name}:`, err);
                    filledPdfs.push(doc); // Return original if failure
                }
            }
            return filledPdfs;
        }

        /**
         * Merge multiple PDFs into one
         */
        async function mergePDFs(pdfDocs) {
            const { PDFDocument } = PDFLib;
            console.log(`Starting to merge ${pdfDocs.length} documents...`);
            const mergedPdf = await PDFDocument.create();

            for (const doc of pdfDocs) {
                try {
                    console.log(`Merging ${doc.key}...`);
                    const pdf = await PDFDocument.load(doc.bytes);
                    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                    console.log(`✓ Merged ${doc.key}`);
                } catch (err) {
                    console.error(`Error merging ${doc.key}:`, err);
                }
            }

            console.log('Finalizing merged PDF...');
            const bytes = await mergedPdf.save();
            console.log(`✓ Finalized PDF (${bytes.length} bytes)`);
            return bytes;
        }

        /**
         * Show preview modal with PDF viewer
         */
        function showPreviewModal(pdfUrl, formData) {
            const existingModal = document.getElementById('preview-modal');
            if (existingModal) existingModal.remove();

            const defendantName = `${formData['defendant-first-name'] || ''} ${formData['defendant-last-name'] || ''}`.trim();

            const modal = document.createElement('div');
            modal.id = 'preview-modal';
            modal.innerHTML = `
        <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;">
          <div style="background:var(--surface);border-radius:var(--radius-lg);width:100%;max-width:1200px;height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:var(--shadow);">
            <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
              <h3 style="margin:0;font-size:18px;">📄 Bail Packet Preview - ${defendantName}</h3>
              <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button class="btn btn-secondary" onclick="downloadPreviewPdf()">⬇️ Download PDF</button>
                <button class="btn btn-success" onclick="closePreviewAndSend()">✅ Looks Good - Send to SignNow</button>
                <button class="btn btn-danger" onclick="closePreviewModal()">✕ Close</button>
              </div>
            </div>
            <div style="flex:1;overflow:hidden;background:#525659;display:flex;align-items:center;justify-content:center;">
              <object id="preview-frame" data="${pdfUrl}" type="application/pdf" style="width:100%;height:100%;">
                <div style="color:white;text-align:center;padding:40px;display:flex;flex-direction:column;align-items:center;gap:16px;">
                  <div style="font-size:48px;">🚫</div>
                  <p style="font-size:18px;">Chrome is blocking the embedded PDF preview.</p>
                  <p style="font-size:14px;opacity:0.8;">This usually happens due to browser security settings or a large document size.</p>
                  <button class="btn btn-primary" onclick="window.open(window.currentPreviewPdfUrl, '_blank')">🔓 Open PDF in New Window</button>
                  <p style="font-size:12px;">(You can still download or send the document using the buttons above)</p>
                </div>
              </object>
            </div>
          </div>
        </div>
      `;
            document.body.appendChild(modal);
            window.currentPreviewPdfUrl = pdfUrl;
        }

        function closePreviewModal() {
            const modal = document.getElementById('preview-modal');
            if (modal) {
                if (window.currentPreviewPdfUrl && window.currentPreviewPdfUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(window.currentPreviewPdfUrl);
                }
                modal.remove();
            }
        }

        function downloadPreviewPdf() {
            if (window.currentPreviewPdfUrl) {
                const formData = collectFormData();
                const defendantName = `${formData['defendant-first-name'] || 'Unknown'}_${formData['defendant-last-name'] || 'Defendant'}`;
                const filename = `Bail_Packet_${defendantName}_${new Date().toISOString().split('T')[0]}.pdf`;
                const link = document.createElement('a');
                link.href = window.currentPreviewPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        function closePreviewAndSend() {
            closePreviewModal();
            generateAndSend();
        }

        /**
         * Preview the bail packet
         */
        /**
         * Preview the bail packet
         */
        async function previewPacket() {
            const formData = collectFormData();

            if (!formData['defendant-first-name'] || !formData['defendant-last-name']) {
                showToast('Please enter defendant name', 'error');
                return;
            }

            UI.showLoading('Generating Preview', 'Preparing your document packet...');

            try {
                UI.updateLoading(20, 'Fetching templates from Drive...');
                const selectedDocs = getSelectedDocuments();
                if (selectedDocs.length === 0) throw new Error('No documents selected');

                const pdfBytes = await fetchPDFsFromDrive(selectedDocs);

                UI.updateLoading(50, 'Filling forms with data...');
                const filledPdfs = await fillPDFsWithData(pdfBytes, formData);

                UI.updateLoading(80, 'Merging documents...');
                const mergedPdf = await mergePDFs(filledPdfs);

                UI.updateLoading(95, 'Finalizing preview...');
                const blob = new Blob([mergedPdf], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                UI.hideLoading();
                showPreviewModal(url, formData);

            } catch (err) {
                UI.hideLoading();
                console.error('Preview error:', err);
                showToast('Error generating preview: ' + err.message, 'error');
            }
        }

        function toggleSigningOptions() {
            const method = document.getElementById('signing-method').value;
            const infoSection = document.getElementById('signer-info-section');
            const emailRow = document.getElementById('email-recipients-row');
            const phoneRow = document.getElementById('phone-recipients-row');
            const generateBtn = document.getElementById('generate-btn');
            const title = document.getElementById('signer-info-title');

            if (method === 'email') {
                infoSection.style.display = 'block';
                emailRow.style.display = 'flex';
                phoneRow.style.display = 'none';
                title.textContent = 'Email Recipients';
                generateBtn.innerHTML = '&#9654; Generate & Send via Email';
            } else if (method === 'sms') {
                infoSection.style.display = 'block';
                emailRow.style.display = 'none';
                phoneRow.style.display = 'flex';
                title.textContent = 'SMS Recipients';
                generateBtn.innerHTML = '&#128241; Generate & Send via Text';
            } else if (method === 'kiosk') {
                infoSection.style.display = 'none';
                generateBtn.innerHTML = '&#128421; Generate for Kiosk Signing';
            } else {
                infoSection.style.display = 'none';
                generateBtn.innerHTML = '&#8595; Download Packet';
            }
        }

        function addSignerEmail() {
            const method = document.getElementById('signing-method').value;
            const container = document.getElementById('additional-signer-info');
            const count = container.children.length + 1;
            const inputType = method === 'sms' ? 'tel' : 'email';
            const placeholder = method === 'sms' ? '941-555-0000' : 'signer@email.com';
            const labelPrefix = method === 'sms' ? 'Additional Phone' : 'Additional Email';

            container.insertAdjacentHTML('beforeend', `
        <div class="form-row" style="margin-top: 12px;">
          <div class="form-group">
            <label>${labelPrefix} ${count}</label>
            <input type="${inputType}" placeholder="${placeholder}" class="additional-signer-input">
          </div>
          <div class="form-group" style="align-self: flex-end;">
            <button class="btn btn-danger btn-sm" onclick="this.closest('.form-row').remove()">Remove</button>
          </div>
        </div>
      `);
        }
        /* =========================================================
           SERVER PROXY FUNCTIONS & ORCHESTRATION
           ========================================================= */

        /**
         * Wrapper for server-side PDF fetching
         */
        function fetchPDFsFromDrive(selectedDocs) {
            return new Promise((resolve, reject) => {
                const fileIds = selectedDocs.map(doc => doc.key);
                google.script.run
                    .withSuccessHandler(response => {
                        // Map back to expected format for fillPDFsWithData
                        const results = response.map((data, index) => ({
                            key: selectedDocs[index].key,
                            name: selectedDocs[index].name,
                            bytes: Uint8Array.from(atob(data), c => c.charCodeAt(0)),
                            isCopy: selectedDocs[index].isCopy || false,
                            indemnitorIndex: selectedDocs[index].indemnitorIndex
                        }));
                        resolve(results);
                    })
                    .withFailureHandler(reject)
                    .server_getPDFTemplatesBatch(fileIds);
            });
        }

        /**
         * Upload merged PDF to Drive via server
         */
        async function uploadPDFToTempStorage(pdfBytes, formData) {
            return new Promise((resolve, reject) => {
                const base64 = btoa(String.fromCharCode(...pdfBytes));
                const defendantName = `${formData['defendant-first-name'] || 'Unknown'}_${formData['defendant-last-name'] || 'Defendant'}`;
                const filename = `Bail_Packet_${defendantName}_${Date.now()}.pdf`;

                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    .server_saveCompositePDF(base64, filename);
            });
        }

        /**
        * Send to SignNow via Wix Backend Proxy
        */
        async function sendToSignNow(fileUrl, signatureFields, signers, formData) {
            return new Promise((resolve, reject) => {
                const payload = {
                    fileUrl: fileUrl,
                    signers: signers,
                    signatureFields: signatureFields,
                    folderName: `${formData['defendant-last-name']}, ${formData['defendant-first-name']}`
                };

                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    .server_uploadAndSendForSigning(payload);
            });
        }

        /**
         * Store Pending Document via Wix Backend Proxy
         */
        async function storePendingDocument(result, formData) {
            return new Promise((resolve, reject) => {
                const payload = {
                    documentId: result.id,
                    status: 'Sent',
                    defendantName: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
                    indemnitorName: formData['indemnitor-full-name'] || 'N/A',
                    email: formData['indemnitor-email'] || '',
                    timestamp: new Date().toISOString()
                };

                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    .server_storePendingDocument(payload);
            });
        }

        /**
         * Send Notifications via Wix Backend Proxy
         */
        async function sendSigningNotifications(result, formData) {
            return new Promise((resolve, reject) => {
                const payload = {
                    documentId: result.id,
                    email: formData['indemnitor-email'],
                    phone: formData['indemnitor-phone'],
                    defendantName: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
                    link: result.signingLine
                };

                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    .server_sendSigningNotification(payload);
            });
        }

        /**
         * Prepare Signature Fields with Page Offsets
         */
        function prepareSignatureFields(filledPdfs, formData) {
            const fields = [];
            let pageOffset = 0;

            filledPdfs.forEach(doc => {
                const templateKey = doc.key;
                const docPageCount = doc.pageCount || 1;

                // Get config for this template
                const templateConfig = CONFIG.signatureFields[templateKey] || [];

                templateConfig.forEach(field => {
                    const newField = { ...field };
                    newField.page_number += pageOffset;

                    // Handle duplicate Indemnitors (e.g. SSA Release copies)
                    if (doc.isCopy && doc.indemnitorIndex !== undefined && newField.role === 'Indemnitor') {
                        // Assign to specific indemnitor role if needed
                        // For now, checking if we need strict role separation.
                        // If we have multiple indemnitors, we need multiple signer objects in the request.
                        newField.role = `Indemnitor ${doc.indemnitorIndex + 1}`;
                    } else if (newField.role === 'Indemnitor') {
                        // Default to Indemnitor 1
                        newField.role = 'Indemnitor 1';
                    }

                    fields.push(newField);
                });

                pageOffset += docPageCount;
            });

            return fields;
        }

        /**
         * Main Orchestrator
         */
        async function generateAndSendWithWixPortal() {
            const method = document.getElementById('signing-method').value;
            if (method === 'download') {
                previewPacket(); // Reuse preview for download
                return;
            }
            if (method === 'kiosk') {
                showToast('Kiosk mode not yet implemented on V2 Dashboard', 'warning');
                return;
            }

            const formData = collectFormData();
            if (!formData['defendant-first-name']) {
                showToast('Defendant name required', 'error');
                return;
            }

            UI.showLoading('Starting Workflow', 'Validating data...');

            try {
                // 1. Fetch
                UI.updateLoading(10, 'Fetching templates...');
                const selectedDocs = getSelectedDocuments();
                if (selectedDocs.length === 0) throw new Error('No documents selected');
                const pdfs = await fetchPDFsFromDrive(selectedDocs);

                // 2. Fill
                UI.updateLoading(30, 'Filling forms...');
                const filledPdfs = await fillPDFsWithData(pdfs, formData);

                // 3. Merge
                UI.updateLoading(50, 'Merging packet...');
                const mergedPdf = await mergePDFs(filledPdfs);

                // 4. Upload
                UI.updateLoading(70, 'Uploading to secure storage...');
                const fileUrl = await uploadPDFToTempStorage(mergedPdf, formData);

                // 5. Send to SignNow
                UI.updateLoading(85, 'Sending to SignNow...');

                // Prepare Signers
                const signers = [];

                // Indemnitors
                if (formData.indemnitors && formData.indemnitors.length > 0) {
                    formData.indemnitors.forEach((ind, index) => {
                        signers.push({
                            email: ind.email,
                            role: `Indemnitor ${index + 1}`
                        });
                    });
                } else {
                    // Fallback for single indemnitor form data
                    signers.push({
                        email: formData['indemnitor-email'],
                        role: 'Indemnitor 1'
                    });
                }

                // Bail Agent (Always included)
                signers.push({ email: 'admin@shamrockbailbonds.biz', role: 'Bail Agent' });
                // Defendant (if email exists)
                if (formData['defendant-email']) {
                    signers.push({ email: formData['defendant-email'], role: 'Defendant' });
                }

                // Prepare Fields
                const signatureFields = prepareSignatureFields(filledPdfs, formData);

                const result = await sendToSignNow(fileUrl, signatureFields, signers, formData);

                // 6. Finalize
                UI.updateLoading(95, 'Finalizing...');
                await storePendingDocument(result, formData);
                await sendSigningNotifications(result, formData);

                UI.hideLoading();
                showSuccess('Packet sent successfully! Check Slack for status.');

            } catch (err) {
                UI.hideLoading();
                console.error(err);
                showToast(err.message, 'error');
            }
        }


        /* =========================================================
           PROGRESS OVERLAY
           ========================================================= */
        function showProgress(title, steps) {
            document.getElementById('progress-title').textContent = title;
            document.getElementById('progress-fill').style.width = '0%';
            document.getElementById('progress-message').textContent = 'Initializing...';

            const stepsHtml = steps.map((step, i) => `
        <div class="progress-step" id="progress-step-${i + 1}">
          <span class="step-icon">${i + 1}</span>
          <span>${step}</span>
        </div>
      `).join('');
            document.getElementById('progress-steps').innerHTML = stepsHtml;

            document.getElementById('progress-overlay').classList.add('active');
        }

        function updateProgress(step, message) {
            const totalSteps = document.querySelectorAll('.progress-step').length;
            const percent = (step / totalSteps) * 100;

            document.getElementById('progress-fill').style.width = `${percent}%`;
            document.getElementById('progress-message').textContent = message;

            // Update step indicators
            document.querySelectorAll('.progress-step').forEach((el, i) => {
                el.classList.remove('active', 'complete');
                if (i + 1 < step) el.classList.add('complete');
                else if (i + 1 === step) el.classList.add('active');
            });
        }

        function hideProgress() {
            document.getElementById('progress-overlay').classList.remove('active');
        }

        /* =========================================================
           TOAST NOTIFICATIONS
           ========================================================= */
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
      `;

            container.appendChild(toast);

            // Auto-remove after 5 seconds
            setTimeout(() => toast.remove(), 5000);
        }

        /* =========================================================
           KEYBOARD SHORTCUTS
           ========================================================= */
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', function (e) {
                // Ctrl+S - Save
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    saveFormToLocalStorage();
                    showToast('Form saved!', 'success');
                }

                // Ctrl+Shift+X - Clear all
                if (e.ctrlKey && e.shiftKey && e.key === 'X') {
                    e.preventDefault();
                    confirmClearAll();
                }

                // ? - Show shortcuts
                if (e.key === '?' && !e.ctrlKey && !e.altKey) {
                    showKeyboardShortcuts();
                }

                // Alt+1-8 - Switch tabs
                if (e.altKey && e.key >= '1' && e.key <= '8') {
                    e.preventDefault();
                    const tabs = ['scrapers', 'charges', 'defendant', 'indemnitors', 'payment', 'documents', 'generate', 'status'];
                    const tabId = tabs[parseInt(e.key) - 1];
                    if (tabId) switchTab(null, tabId);
                }

                // Ctrl+D - Toggle dark mode
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    toggleMode();
                }
            });
        }

        function showKeyboardShortcuts() {
            showToast('Keyboard shortcuts: Ctrl+S (Save), Ctrl+Shift+X (Clear), Alt+1-8 (Tabs), Ctrl+D (Dark mode)', 'info');
        }

        /* =========================================================
           UTILITIES
           ========================================================= */
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * Get status badge HTML
         */
        function getStatusBadge(status) {
            const badges = {
                'sent': '<span style="background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Sent</span>',
                'viewed': '<span style="background: #fff3e0; color: #f57c00; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Viewed</span>',
                'signed': '<span style="background: #e8f5e9; color: #388e3c; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Signed</span>',
                'downloaded': '<span style="background: #9e9e9e; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Downloaded</span>',
                'expired': '<span style="background: #ffebee; color: #d32f2f; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Expired</span>'
            };
            return badges[status] || badges['sent'];
        }

        /**
         * Check document status from SignNow
         */
        async function checkDocumentStatus(documentId) {
            try {
                google.script.run
                    .withSuccessHandler(function (result) {
                        if (result.success) {
                            console.log('Document status:', result);
                            const packet = sentPackets.find(p => p.documentId === documentId);
                            if (packet) {
                                if (result.status === 'signed' || result.status === 'completed') {
                                    packet.status = 'signed';
                                } else if (result.signers && result.signers.some(s => s.status === 'viewed')) {
                                    packet.status = 'viewed';
                                }
                                localStorage.setItem(LS_KEY_PACKETS, JSON.stringify(sentPackets));
                                refreshStatus();
                            }
                            showToast('Status updated', 'success');
                        } else {
                            showToast('Failed to check status: ' + result.error, 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        showToast('Error: ' + error.message, 'error');
                    })
                    .getDocumentStatus(documentId);
            } catch (err) {
                console.error('Status check error:', err);
                showToast('Error checking status: ' + err.message, 'error');
            }
        }

        /**
         * Refresh status from SignNow
         */
        async function refreshStatus() {
            showToast('Refreshing status...', 'info');

            const statusContainer = document.getElementById('status-container');

            if (sentPackets.length === 0) {
                statusContainer.innerHTML = `
          <div style="text-align: center; padding: 48px; color: var(--muted);">
            <p style="font-size: 48px; margin-bottom: 16px;">📊</p>
            <p style="font-size: 16px; font-weight: 600;">No packets sent yet</p>
            <p style="font-size: 14px; margin-top: 8px;">Generate and send a packet to see status here</p>
          </div>
        `;
                return;
            }

            let html = `
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border);">
              <th style="text-align: left; padding: 12px;">Receipt #</th>
              <th style="text-align: left; padding: 12px;">Defendant</th>
              <th style="text-align: left; padding: 12px;">Date</th>
              <th style="text-align: left; padding: 12px;">Method</th>
              <th style="text-align: left; padding: 12px;">Status</th>
              <th style="text-align: left; padding: 12px;">Actions</th>
            </tr>
          </thead>
          <tbody>
      `;

            for (const packet of sentPackets.slice().reverse()) {
                const statusBadge = getStatusBadge(packet.status);
                const date = new Date(packet.date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                html += `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 12px; font-family: monospace;">${packet.receiptNumber}</td>
            <td style="padding: 12px; font-weight: 600;">${packet.defendant}</td>
            <td style="padding: 12px; color: var(--muted);">${date}</td>
            <td style="padding: 12px;">${packet.signingMethod || 'email'}</td>
            <td style="padding: 12px;">${statusBadge}</td>
            <td style="padding: 12px;">
              ${packet.documentId ? `<button class="btn btn-secondary btn-sm" onclick="checkDocumentStatus('${packet.documentId}')">Check</button>` : '-'}
            </td>
          </tr>
        `;
            }

            html += '</tbody></table>';
            statusContainer.innerHTML = html;
        }

        // Auto-save every 30 seconds
        setInterval(saveFormToLocalStorage, 30000);
        /**
         * Dashboard.html - Wix Portal Integration Module
         * 
         * This code should be added to Dashboard.html to enable:
         * 1. Saving signing links to Wix PendingDocuments collection
         * 2. Clients can view and sign from their Wix member portal
         * 3. Automatic status updates when documents are signed
         * 
         * Add this script block before the closing </body> tag in Dashboard.html
         */

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
         * @returns {Promise<Object>} Result of the save operation
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
                                if (p.address.city && document.getElementById('indemnitor-city')) document.getElementById('indemnitor-city').value = p.address.city;
                                if (p.address.state && document.getElementById('indemnitor-state')) document.getElementById('indemnitor-state').value = p.address.state;
                                if (p.address.postalCode && document.getElementById('indemnitor-zip')) document.getElementById('indemnitor-zip').value = p.address.postalCode;
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
        /**
         * ShamrockApp - Enterprise Dashboard Core
         * Refactored for modularity, readability, and performance.
         */
        const ShamrockApp = (function () {
            // --- Shared State ---
            const state = {
                filePayload: null,
                investigatorFiles: { def: null, ind: null }
            };



            // --- Module: Agents (Clerk, Analyst, Investigator, Monitor) ---
            const Agents = {
                Clerk: {
                    handleFile: function (input) {
                        const file = input.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            state.filePayload = {
                                mimeType: file.type || 'application/pdf',
                                data: e.target.result.split(',')[1], // base64
                                filename: file.name
                            };
                            const dropZone = document.getElementById('drop-zone');
                            if (dropZone) {
                                dropZone.innerHTML = `
                                    <div style="font-size: 42px; margin-bottom: 12px;">📄</div>
                                    <strong style="display:block; font-size:16px;">${file.name}</strong>
                                    <small style="color:var(--success);">Ready</small>`;
                                dropZone.style.borderColor = 'var(--success)';
                            }
                        };
                        reader.readAsDataURL(file);
                    },

                    clear: function () {
                        UI.setValue('clerk-input', '');
                        state.filePayload = null;
                        UI.setHTML('clerk-output', '<div class="placeholder-text">Waiting for input...</div>');
                        const dropZone = document.getElementById('drop-zone');
                        if (dropZone) {
                            dropZone.innerHTML = `
                                <div style="font-size: 42px; margin-bottom: 12px; opacity: 0.8;">📸</div>
                                <strong style="display:block;">Upload Booking</strong>
                                <input type="file" id="clerk-file" style="display:none" onchange="ShamrockApp.Agents.Clerk.handleFile(this)">`;
                            dropZone.style.borderColor = 'var(--border-strong)';
                        }
                    },

                    run: function () {
                        const inputEl = document.getElementById('clerk-input');
                        const textInput = inputEl ? inputEl.value : '';
                        const payload = state.filePayload || textInput;

                        if (!payload) return UI.showToast('⚠️ Provide file or text.', 'warning');

                        const output = document.getElementById('clerk-output');

                        // Hide output initially
                        output.style.display = 'none';

                        UI.showLoading('The Clerk', 'Extracting data from booking sheet...');

                        google.script.run
                            .withSuccessHandler(res => {
                                UI.hideLoading();
                                output.style.display = 'block';
                                if (res.error) {
                                    output.innerHTML = `<div class="error-box">❌ ${res.error}</div>`;
                                } else {
                                    output.innerHTML = `<pre class="json-box">${JSON.stringify(res, null, 2)}</pre>`;
                                    document.getElementById('copy-clerk-btn').style.display = 'inline-block';
                                    Agents.Clerk.populate(res);
                                }
                            })
                            .withFailureHandler(err => {
                                UI.hideLoading();
                                output.style.display = 'block';
                                output.innerHTML = `<div class="error-box">❌ Error: ${err.message}</div>`;
                            })
                            .client_parseBooking(payload);
                    },

                    populate: function (res) {
                        try {
                            console.log("🤖 AI Populating Data:", res);
                            UI.setValue('defendant-first-name', res.firstName);
                            UI.setValue('defendant-last-name', res.lastName);
                            UI.setValue('defendant-middle-name', res.middleName);
                            UI.setValue('defendant-dob', res.dob);

                            // Handle Address (Object or String)
                            if (res.address && typeof res.address === 'object') {
                                UI.setValue('defendant-street-address', res.address.street);
                                UI.setValue('defendant-city', res.address.city);
                                UI.setValue('defendant-state', res.address.state);
                                UI.setValue('defendant-zipcode', res.address.zip);
                            } else if (typeof res.address === 'string') {
                                UI.setValue('defendant-street-address', res.address); // Fallback
                            }

                            if (res.bookingNumber) UI.setValue('defendant-booking-number', res.bookingNumber);

                            // Handle Charges
                            if (res.charges && Array.isArray(res.charges)) {
                                const container = document.getElementById('charges-container');
                                if (container) container.innerHTML = ''; // Clear existing

                                res.charges.forEach(c => {
                                    // Map AI keys to UI keys expected by addCharge
                                    addCharge({
                                        desc: c.description,
                                        statute: c.statute,
                                        degree: c.degree,
                                        bondAmount: c.bond,
                                        bondType: c.bondType,
                                        courtDate: c.courtDate
                                    });
                                });
                                // Optional: Switch to Charges tab or just notify
                                UI.showToast(`✅ Loaded ${res.charges.length} charges & defendant info!`, 'success');
                            } else {
                                UI.showToast('✅ Auto-populated!', 'success');
                            }

                            if (typeof updateSummary === 'function') updateSummary();
                        } catch (e) { console.warn('Populate error', e); }
                    }
                },

                Analyst: {
                    run: function () {
                        const el = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
                        const lead = {
                            name: el('analyst-name'),
                            charges: el('analyst-charges'),
                            bond: el('analyst-bond'),
                            residency: el('analyst-residency'),
                            employment: el('analyst-employment'),
                            history: el('analyst-history'),
                            ties: el('analyst-ties')
                        };

                        UI.showLoading('The Analyst', 'Evaluating flight risk and bond conditions...');

                        google.script.run
                            .withSuccessHandler(res => {
                                UI.hideLoading();
                                const color = res.riskLevel.includes('High') ? 'var(--error)' : (res.riskLevel === 'Medium' ? 'var(--warning)' : 'var(--success)');
                                UI.setHTML('analyst-output', `
                                    <div class="result-card" style="border-color:${color}">
                                        <h2 style="color:${color}">${res.riskLevel} Risk</h2>
                                        <div class="score" style="color:${color}">${res.score}/100</div>
                                        <p>${res.rationale || res.summary}</p>
                                    </div>`);
                            })
                            .withFailureHandler(err => {
                                UI.hideLoading();
                                UI.setHTML('analyst-output', `<div class="error-box">❌ Analyst Error: ${err.message}</div>`);
                            })
                            .client_analyzeLead(JSON.stringify(lead));
                    }
                },

                Investigator: {
                    handleFile: function (input, type) {
                        const file = input.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = e => {
                            state.investigatorFiles[type] = e.target.result.split(',')[1];
                            UI.showToast(`✅ ${type} File Loaded`);
                        };
                        reader.readAsDataURL(file);
                    },

                    run: function () {
                        const defTextEl = document.getElementById('investigator-def-text');
                        const indTextEl = document.getElementById('investigator-ind-text');
                        const defText = defTextEl ? defTextEl.value : '';
                        const indText = indTextEl ? indTextEl.value : '';
                        const payload = {
                            defendantReport: defText || (state.investigatorFiles.def ? "FILE_UPLOADED_DEF" : ""),
                            indemnitorReport: indText || (state.investigatorFiles.ind ? "FILE_UPLOADED_IND" : "")
                        };

                        if (!payload.defendantReport && !payload.indemnitorReport) {
                            return UI.showToast('⚠️ Provide at least one report.', 'warning');
                        }

                        UI.showLoading('The Investigator', 'Cross-referencing background reports...');

                        google.script.run
                            .withSuccessHandler(res => {
                                UI.hideLoading();
                                if (res.error) return UI.setHTML('investigator-output', `<div class="error-box">❌ ${res.error}</div>`);
                                UI.setHTML('investigator-output', Agents.Investigator.renderReport(res));
                            })
                            .withFailureHandler(err => {
                                UI.hideLoading();
                                UI.setHTML('investigator-output', `<div class="error-box">❌ Investigator Error: ${err.message}</div>`);
                            })
                            .client_runInvestigator(payload);
                    },

                    renderReport: function (res) {
                        const safeScore = (s) => (s >= 80 ? `<span class="text-success">${s} (Safe)</span>` : (s >= 50 ? `<span class="text-warning">${s} (Caution)</span>` : `<span class="text-error">${s} (Risk)</span>`));
                        return `
                            <div class="card">
                                <h3>Results</h3>
                                <div class="grid-2">
                                    <div class="box"><strong>Flight Risk</strong>: ${safeScore(res.flightRiskScore)}</div>
                                    <div class="box"><strong>Stability</strong>: ${safeScore(res.indemnitorStabilityScore)}</div>
                                </div>
                                <div class="rec-box">
                                    <div class="rec-val">${res.recommendation}</div>
                                </div>
                            </div>`;
                    }
                },

                Monitor: {
                    run: function () {
                        const notesEl = document.getElementById('monitor-input');
                        const notes = notesEl ? notesEl.value : '';

                        UI.showLoading('The Monitor', 'Analyzing sentiment and risk...');

                        google.script.run
                            .withSuccessHandler(res => {
                                UI.hideLoading();
                                UI.setHTML('monitor-output', !res ? "<span class='text-success'>✅ No Risk</span>" : `<strong class='text-error'>🚨 ${res.status} ALERT</strong>`);
                            })
                            .withFailureHandler(err => {
                                UI.hideLoading();
                                UI.setHTML('monitor-output', `<div class="error-box">❌ Monitor Error: ${err.message}</div>`);
                            })
                            .client_checkSentiment(notes);
                    }
                }
            };

            // --- Module: Queue Management ---
            const Queue = {
                fetch: function () {
                    const loadingHTML = '<tr><td colspan="7" class="text-center" style="padding:20px;">⌛ Fetching pending intakes...</td></tr>';
                    UI.setHTML('queue-list', loadingHTML);
                    UI.setHTML('intake-queue-body', loadingHTML);

                    UI.showLoading('Refreshing Queue', 'Fetching latest intakes from system...');

                    google.script.run
                        .withSuccessHandler(res => {
                            UI.hideLoading();
                            Queue.render(res);
                        })
                        .withFailureHandler(err => {
                            UI.hideLoading();
                            const errHTML = `<tr><td colspan="7" class="text-error" style="padding:20px; text-align:center;">Error: ${err.message}</td></tr>`;
                            UI.setHTML('queue-list', errHTML);
                            UI.setHTML('intake-queue-body', errHTML);
                            UI.showToast('Failed to refresh queue', 'error');
                        })
                        .getWixIntakeQueue();
                },

                render: function (intakes) {
                    const list = document.getElementById('queue-list'); // AI Console Queue
                    const listMain = document.getElementById('intake-queue-body'); // Main Dashboard Queue
                    const badge = document.getElementById('queue-badge');

                    // Handle "No Intakes"
                    if (!intakes || !Array.isArray(intakes) || intakes.length === 0) {
                        if (badge) badge.style.display = 'none';
                        const emptyHTML = '<tr><td colspan="7" class="text-center" style="padding:20px; color:var(--muted);">No pending intakes found.</td></tr>';
                        if (list) UI.setHTML('queue-list', emptyHTML);
                        if (listMain) UI.setHTML('intake-queue-body', emptyHTML);
                        return;
                    }

                    if (badge) { badge.innerText = intakes.length; badge.style.display = 'inline-block'; }

                    try {
                        let html = '';
                        intakes.forEach(item => {
                            try {
                                const id = item.IntakeID;
                                // Cache the item for safe retrieval
                                if (window.ShamrockApp && window.ShamrockApp.IntakeCache) {
                                    window.ShamrockApp.IntakeCache.set(id, item);
                                }

                                const dateStr = item.Timestamp ? new Date(item.Timestamp).toLocaleString() : 'N/A';
                                const defendant = item.DefendantName || 'Unknown';
                                const indemnitor = item.FullName || 'Unknown';

                                // AI Risk Badge Logic
                                let riskBadge = '';
                                if (item.AI_Risk) {
                                    const riskColor = item.AI_Risk === 'High' ? 'var(--error)' : (item.AI_Risk === 'Medium' ? 'var(--warning)' : 'var(--success)');
                                    riskBadge = `<span class="badge" style="background:${riskColor}; color:#fff; margin-left:8px; font-size:10px;" title="${item.AI_Rationale}">🤖 ${item.AI_Risk}</span>`;
                                }

                                html += `
                                    <tr>
                                        <td style="padding: 12px; font-family:monospace;">${id ? id.substring(0, 8) : 'N/A'}...</td>
                                        <td style="padding: 12px;">
                                            <strong>${defendant}</strong>
                                            <span id="badge-${id}">${riskBadge}</span>
                                        </td>
                                        <td style="padding: 12px;">${indemnitor}</td>
                                        <td style="padding: 12px;">${item.Role || 'Indemnitor'}${id && id.startsWith('TG-') ? ' <span style="background:#0088cc;color:#fff;font-size:10px;padding:2px 6px;border-radius:8px;margin-left:4px;">📱 Telegram</span>' : ''}</td>
                                        <td style="padding: 12px;"><span class="badge badge-warning">${item.Status || 'Pending'}</span></td>
                                        <td style="padding: 12px;">${dateStr}</td>
                                        <td style="padding: 12px; text-align: right;">
                                            <button class="btn btn-sm btn-primary" onclick="loadIntake('${id}')" title="Load & Process">
                                                ⬇️ Process
                                            </button>
                                            <button class="btn btn-sm btn-secondary" style="margin-left:4px;" onclick="Queue.archive('${id}', this)" title="Mark as Done (Remove from Queue)">
                                                ✅ Done
                                            </button>
                                        </td>
                                    </tr>`;
                            } catch (itemErr) {
                                console.error('Error rendering item:', itemErr, item);
                            }
                        });

                        // Update BOTH tables
                        if (list) list.innerHTML = html;
                        if (listMain) listMain.innerHTML = html;

                        // Trigger AI Scan
                        setTimeout(() => Queue.scanRisks(intakes), 500);

                    } catch (err) {
                        console.error('CRITICAL RENDER ERROR:', err);
                        const errHTML = `<tr><td colspan="5" class="text-error" style="text-align:center;">Render Error: ${err.message}</td></tr>`;
                        if (list) list.innerHTML = errHTML;
                        if (listMain) listMain.innerHTML = errHTML;
                    }
                },



                scanRisks: function (intakes) {
                    // Limit to top 5 to prevent rate limits
                    const scanList = intakes.slice(0, 5);
                    console.log(`🤖 Auto-Scan: Analyzing ${scanList.length} leads...`);

                    scanList.forEach(item => {
                        if (item.AI_Risk) return; // Already has score

                        const leadPayload = {
                            name: item.DefendantName || "Unknown",
                            charges: item.Charges || "Pending",
                            bond: item.BondAmount || "0",
                            agency: item.County || "Unknown",
                            county: item.County || "Lee"
                        };

                        google.script.run
                            .withSuccessHandler(result => {
                                if (result && result.riskLevel) {
                                    // 1. Update Cache
                                    item.AI_Risk = result.riskLevel;
                                    item.AI_Rationale = result.rationale || "AI Analysis";
                                    if (window.ShamrockApp && window.ShamrockApp.IntakeCache) {
                                        window.ShamrockApp.IntakeCache.set(item.IntakeID, item);
                                    }

                                    // 2. Update DOM
                                    const badgeEl = document.getElementById(`badge-${item.IntakeID}`);
                                    if (badgeEl) {
                                        const riskColor = result.riskLevel === 'High' ? 'var(--error)' : (result.riskLevel === 'Medium' ? 'var(--warning)' : 'var(--success)');
                                        badgeEl.innerHTML = `<span class="badge" style="background:${riskColor}; color:#fff; margin-left:8px; font-size:10px;" title="${result.rationale}">🤖 ${result.riskLevel}</span>`;
                                    }
                                }
                            })
                            .withFailureHandler(err => console.warn("AI Scan Failed:", err))
                            .client_analyzeLead(JSON.stringify(leadPayload));
                    });
                },

                process: function (intakeId) {
                    // --- TELEGRAM INTAKE: Fetch full data from backend if TG- prefixed ---
                    if (intakeId && intakeId.startsWith('TG-')) {
                        const cached = window.ShamrockApp.IntakeCache.get(intakeId);
                        if (!cached) {
                            // Not yet in cache — fetch from backend TelegramIntakeData sheet
                            UI.showLoading('Loading Telegram Intake', 'Fetching full intake data from Telegram bot...');
                            google.script.run
                                .withSuccessHandler(function (fullData) {
                                    UI.hideLoading();
                                    if (!fullData) {
                                        UI.showToast('Telegram intake data not found in system', 'error');
                                        return;
                                    }
                                    // Store in cache then re-call process
                                    window.ShamrockApp.IntakeCache.set(intakeId, fullData);
                                    Queue.process(intakeId);
                                })
                                .withFailureHandler(function (err) {
                                    UI.hideLoading();
                                    UI.showToast('Failed to load Telegram intake: ' + (err.message || err), 'error');
                                })
                                .handleAction({ action: 'getTelegramIntakeData', intakeId: intakeId });
                            return; // Exit — will re-enter once data is fetched
                        }
                    }
                    // --- STANDARD INTAKE: Retrieve from Cache ---
                    const item = window.ShamrockApp.IntakeCache.get(intakeId);
                    if (!item) {
                        console.error('Intake not found in cache:', intakeId);
                        UI.showToast('Error: Could not load intake data (Cache Miss)', 'error');
                        return;
                    }
                    const sourceLabel = (item.source === 'telegram') ? '📱 Telegram Bot' : '🌐 Wix Portal';
                    if (!confirm(`Process data for ${item.DefendantName || item.defendantName}?\n\n⚠️ This will CLEAR and OVERWRITE the current form.\n\nSource: ${sourceLabel}`)) return;

                    try {
                        // 1. Clear existing form to prevent ghost data
                        clearAllFields();

                        // 2. Hydrate Defendant Info
                        const defendantNameParts = (item.DefendantName || '').split(' ');
                        UI.setValue('defendant-first-name', defendantNameParts[0]);
                        UI.setValue('defendant-last-name', defendantNameParts.slice(1).join(' '));
                        // Note: Wix Intake usually just has Name, Phone, Email for Indemnitor.
                        // If Defendant info is available in raw data, map it here.

                        // 3. Hydrate Indemnitor Info
                        // Map IntakeQueue item to Indemnitor Form Structure
                        const raw = item._original || {}; // Access full Wix Data

                        const indemnitorData = {
                            firstName: item.FirstName || raw.indemnitorFirstName || '',
                            lastName: item.LastName || raw.indemnitorLastName || '',
                            email: item.Email || raw.indemnitorEmail || '',
                            phone: item.Phone || raw.indemnitorPhone || '',
                            relationship: item.Relationship || 'Self',

                            // Expanded Fields (from raw)
                            middleName: raw.indemnitorMiddleName || '',
                            dob: raw.indemnitorDOB || raw.dob || '',
                            ssn: raw.indemnitorSSN || raw.ssn || '',
                            dl: raw.indemnitorDL || raw.dlNumber || '',
                            dlState: raw.indemnitorDLState || raw.dlState || 'FL',

                            address: raw.indemnitorStreetAddress || raw.indemnitorAddress || '',
                            city: raw.indemnitorCity || '',
                            state: raw.indemnitorState || 'FL',
                            zip: raw.indemnitorZipCode || raw.indemnitorZip || '',

                            // Employment
                            employer: raw.indemnitorEmployerName || '',
                            employerPhone: raw.indemnitorEmployerPhone || '',
                            employerCity: raw.indemnitorEmployerCity || '',
                            employerState: raw.indemnitorEmployerState || '',
                            supervisor: raw.indemnitorSupervisorName || '',
                            supervisorPhone: raw.indemnitorSupervisorPhone || '',

                            // References
                            ref1Name: raw.reference1Name || raw.ref1Name || '',
                            ref1Relation: raw.reference1Relation || raw.ref1Relation || '',
                            ref1Phone: raw.reference1Phone || raw.ref1Phone || '',
                            ref1Address: raw.reference1Address || raw.ref1Address || '',

                            ref2Name: raw.reference2Name || raw.ref2Name || '',
                            ref2Relation: raw.reference2Relation || raw.ref2Relation || '',
                            ref2Phone: raw.reference2Phone || raw.ref2Phone || '',
                            ref2Address: raw.reference2Address || raw.ref2Address || ''
                        };
                        console.log("Hydrating Indemnitor:", indemnitorData);
                        addIndemnitor(indemnitorData);

                        // 4. Hydrate Charges (if available in AI analysis or raw data)
                        if (item.Charges && Array.isArray(item.Charges)) {
                            item.Charges.forEach(c => addCharge(c));
                        }

                        // 5. Switch to Defendant Tab to start work
                        // Use switchTab global if available, or click the button
                        // Try programmatic switch first
                        const defendantTabBtn = document.querySelector('button[onclick*="defendant"]');
                        if (defendantTabBtn) defendantTabBtn.click();
                        else if (typeof switchTab === 'function') switchTab(null, 'defendant');

                        // 6. Async: Fetch & Render Documents
                        if (indemnitorData.email) {
                            const currentId = indemnitorCount; // Capture current ID 
                            google.script.run
                                .withSuccessHandler(function (result) {
                                    if (result && result.documents) {
                                        console.log('📄 Documents Fetched:', result.documents.length);
                                        renderIndemnitorDocuments(result.documents, currentId);
                                    }
                                })
                                .withFailureHandler(function (err) {
                                    console.warn('Document fetch failed', err);
                                })
                                .client_getIndemnitorProfile(indemnitorData.email);
                        }

                        // 7. Render Attachments Tab
                        Queue.renderAttachments(raw);

                        UI.showToast(`Loaded data for ${item.DefendantName}`, 'success');

                    } catch (e) {
                        console.error("Hydration Error:", e);
                        UI.showToast("Error loading data: " + e.message, 'error');
                    }
                },

                renderAttachments: function (data) {
                    const list = document.getElementById('attachments-list');
                    if (!list) return;

                    let attachmentsHTML = '';
                    let hasAttachments = false;

                    // 1. Check for Telegram Documents
                    if (data.Documents && Array.isArray(data.Documents)) {
                        data.Documents.forEach(doc => {
                            hasAttachments = true;
                            const url = doc.file_url || '#';
                            const title = doc.doc_type || 'Telegram Upload';
                            const name = doc.file_name || 'Document';
                            attachmentsHTML += `
                                <div class="card" style="padding: 16px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid var(--accent);">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="font-size: 24px;">📄</span>
                                        <div>
                                            <div style="font-weight: 600; color: var(--text);">${title}</div>
                                            <div style="font-size: 12px; color: var(--muted);">${name}</div>
                                        </div>
                                    </div>
                                    <a href="${url}" target="_blank" class="btn btn-sm btn-primary">View</a>
                                </div>
                            `;
                        });
                    }

                    // 2. Check for Wix Indemnitor Form Uploads
                    const wixFields = [
                        { key: 'idFront', label: 'ID Front' },
                        { key: 'idBack', label: 'ID Back' },
                        { key: 'utilityBill', label: 'Utility Bill' },
                        { key: 'paystub', label: 'Pay Stub' },
                        { key: 'selfie', label: 'Selfie / Verification' }
                    ];

                    wixFields.forEach(field => {
                        if (data[field.key]) {
                            hasAttachments = true;
                            let url = data[field.key];
                            // Clean up Wix URLs if they use the wix:image:// format to make them playable/viewable if possible.
                            // For now, we'll try to present the raw URL.
                            let isImage = url.match(/\.(jpeg|jpg|gif|png)$/) != null || url.includes('wix:image');
                            let icon = isImage ? '🖼️' : '📄';

                            attachmentsHTML += `
                                <div class="card" style="padding: 16px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid var(--accent);">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="font-size: 24px;">${icon}</span>
                                        <div>
                                            <div style="font-weight: 600; color: var(--text);">${field.label}</div>
                                            <div style="font-size: 12px; color: var(--muted);">Wix Upload</div>
                                        </div>
                                    </div>
                                    <a href="${url}" target="_blank" class="btn btn-sm btn-primary" onclick="if(this.href.includes('wix:image')) { alert('Direct access to Wix internal image URIs requires Dashboard resolution.\\n\\nURI: ' + this.href); return false; }">View</a>
                                </div>
                            `;
                        }
                    });

                    if (!hasAttachments) {
                        attachmentsHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--muted); background: var(--surface-2); border-radius: var(--radius);">
                                <p style="font-size: 48px; margin-bottom: 16px;">📁</p>
                                <p style="font-size: 16px; font-weight: 600;">No Attachments Found</p>
                                <p style="font-size: 14px; margin-top: 8px;">This intake does not contain any uploaded documents.</p>
                            </div>
                        `;
                    }

                    list.innerHTML = attachmentsHTML;

                    // Update Tab Badge
                    const navTabs = document.querySelector('.nav-tabs');
                    if (navTabs) {
                        const attachBtn = Array.from(navTabs.querySelectorAll('button')).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes("'attachments'"));
                        if (attachBtn) {
                            if (hasAttachments) {
                                attachBtn.style.position = 'relative';
                                if (!attachBtn.querySelector('.tab-badge')) {
                                    attachBtn.innerHTML += '<span class="tab-badge" style="display:inline-block; background:var(--warning); color:#000;">!</span>';
                                }
                            } else {
                                const badge = attachBtn.querySelector('.tab-badge');
                                if (badge) badge.remove();
                            }
                        }
                    }
                },

                archive: function (intakeId, buttonEl) {
                    if (!confirm('Clear this intake from the queue?\n\nThis marks it as processed and removes it from the list.')) return;

                    if (buttonEl) {
                        buttonEl.innerText = '⏳';
                        buttonEl.disabled = true;
                    }

                    google.script.run
                        .withSuccessHandler(res => {
                            if (res) {
                                UI.showToast('Intake cleared', 'success');
                                const row = buttonEl ? buttonEl.closest('tr') : null;
                                if (row) {
                                    row.style.transition = 'opacity 0.5s';
                                    row.style.opacity = '0';
                                    setTimeout(() => row.remove(), 500);
                                } else {
                                    Queue.fetch();
                                }

                                // Update badge count
                                const badge = document.getElementById('queue-badge');
                                if (badge) {
                                    const count = parseInt(badge.innerText);
                                    if (!isNaN(count)) badge.innerText = Math.max(0, count - 1);
                                }
                            } else {
                                UI.showToast('Failed to clear intake', 'error');
                                if (buttonEl) { buttonEl.innerText = '✅ Done'; buttonEl.disabled = false; }
                            }
                        })
                        .withFailureHandler(err => {
                            console.error(err);
                            UI.showToast('Error: ' + err.message, 'error');
                            if (buttonEl) { buttonEl.innerText = '✅ Done'; buttonEl.disabled = false; }
                        })
                        .handleAction({ action: 'markIntakeProcessed', intakeId: intakeId });
                }
            };

            // Backward Compatibility Alias
            const fetchQueue = Queue.fetch;

            // --- Module: Maps ---
            const Maps = {
                map: null,
                isInitialized: false,
                markers: [],

                // Safe Init: Can be called multiple times
                tryInit: function () {
                    if (this.isInitialized) return;

                    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
                        console.warn("⏳ Google Maps API not ready yet (will retry)");
                        return; // Will be called again by callback
                    }

                    const container = document.getElementById("ops-map-container");
                    if (!container) {
                        console.warn("❌ Map Container missing from DOM");
                        return;
                    }

                    // Check visibility: Map cannot init properly if display:none
                    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
                        console.log("💤 Map container hidden, deferring init until tab switch");
                        return;
                    }

                    try {
                        console.log("🗺️ Initializing Google Map...");
                        this.map = new google.maps.Map(container, {
                            center: { lat: 26.6406, lng: -81.8723 }, // Fort Myers
                            zoom: 10,
                            styles: [{
                                "elementType": "geometry",
                                "stylers": [{ "color": "#242f3e" }]
                            },
                            {
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#746855" }]
                            },
                            {
                                "elementType": "labels.text.stroke",
                                "stylers": [{ "color": "#242f3e" }]
                            },
                            {
                                "featureType": "administrative.locality",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#d59563" }]
                            },
                            {
                                "featureType": "poi",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#d59563" }]
                            },
                            {
                                "featureType": "poi.park",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#263c3f" }]
                            },
                            {
                                "featureType": "poi.park",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#6b9a76" }]
                            },
                            {
                                "featureType": "road",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#38414e" }]
                            },
                            {
                                "featureType": "road",
                                "elementType": "geometry.stroke",
                                "stylers": [{ "color": "#212a37" }]
                            },
                            {
                                "featureType": "road",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#9ca5b3" }]
                            },
                            {
                                "featureType": "road.highway",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#746855" }]
                            },
                            {
                                "featureType": "road.highway",
                                "elementType": "geometry.stroke",
                                "stylers": [{ "color": "#1f2835" }]
                            },
                            {
                                "featureType": "road.highway",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#f3d19c" }]
                            },
                            {
                                "featureType": "transit",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#2f3948" }]
                            },
                            {
                                "featureType": "transit.station",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#d59563" }]
                            },
                            {
                                "featureType": "water",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#17263c" }]
                            },
                            {
                                "featureType": "water",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#515c6d" }]
                            },
                            {
                                "featureType": "water",
                                "elementType": "labels.text.stroke",
                                "stylers": [{ "color": "#17263c" }]
                            }
                            ]
                        });
                        this.isInitialized = true;

                        // Force resize event to render tiles
                        google.maps.event.trigger(this.map, "resize");

                    } catch (e) {
                        console.error("Map Init Failed:", e);
                        UI.showToast("Map Init Failed: " + e.message, 'error');
                    }
                },

                plotCurrentCase: function () {
                    const defAddrEl = document.getElementById('defendant-home-address');
                    const defAddr = defAddrEl ? defAddrEl.value : '';

                    const jail = "2115 Dr Martin Luther King Jr Blvd, Fort Myers, FL 33901"; // Lee Jail

                    if (!this.isInitialized) {
                        alert("Map not ready yet. Please try switching tabs again.");
                        return;
                    }
                    alert(`Simulating Plot to ${jail} (from ${defAddr || 'Unknown'})`);
                }
            };

            // --- Module: Stats ---
            const Stats = {
                refreshAll: function () {
                    const counties = ['Lee', 'Collier', 'Charlotte', 'Sarasota', 'Hendry', 'DeSoto', 'Manatee', 'Palm Beach', 'Seminole', 'Orange', 'Pinellas', 'Broward', 'Hillsborough'];
                    counties.forEach(c => {
                        const id = c.toLowerCase().replace(/\s+/g, '-');
                        UI.setHTML(`${id}-total`, '...');
                    });

                    google.script.run
                        .withSuccessHandler(allStats => {
                            if (!allStats) return;
                            Object.keys(allStats).forEach(key => {
                                Stats.updateCard(key, allStats[key]);
                            });
                            UI.showToast("Stats Refreshed", "success");
                        })
                        .withFailureHandler(err => UI.showToast("Stats Failed: " + err.message, "error"))
                        .getCountyStatistics();
                },

                updateCard: function (key, stats) {
                    const id = key; // Key is already normalized from backend
                    if (!stats.exists) return UI.setHTML(`${id}-total`, 'N/A');

                    // Safe set helper
                    const setIfExists = (suffix, val) => {
                        const el = document.getElementById(`${id}-${suffix}`);
                        if (el) el.innerHTML = val;
                    };

                    setIfExists('total', `${stats.today} / ${stats.total}`);
                    setIfExists('male', stats.male);
                    setIfExists('female', stats.female);
                    setIfExists('avg-bond', stats.avgBond);
                }
            };

            // --- Module: Router (Universal Bookmarklet) ---
            const Router = {
                handleParams: function () {
                    const params = new URLSearchParams(window.location.search);
                    const url = params.get('url');
                    const agent = params.get('agent') || 'clerk';

                    if (url && agent === 'clerk') {
                        console.log(`🚀 Bookmarklet: ${url}`);
                        UI.toggleAgentTab(document.querySelector(`[onclick*="agent-${agent}"]`), `agent-${agent}`);
                        UI.setValue('clerk-input', url);
                        setTimeout(Agents.Clerk.run, 500);
                    }
                }
            };

            // --- Module: Smart Import (Vision) ---
            // --- Module: Smart Import (Vision) ---
            const SmartImport = {
                pendingImages: [], // Array of base64 strings

                init: function () {
                    // Global Paste Listener for Defendant Tab
                    document.addEventListener('paste', (e) => {
                        const activeTab = document.querySelector('.tab-content.active');
                        if (activeTab && activeTab.id === 'defendant-tab') {
                            // Helper: Only capture if not pasting into a text input, OR if specific url input is focused
                            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
                            const isSmartInput = e.target.id === 'smart-import-url';

                            if (!isInput || isSmartInput) {
                                SmartImport.handlePaste(e);
                            }
                        }
                    });
                },

                handlePaste: function (e) {
                    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
                    let foundImage = false;

                    for (let index in items) {
                        const item = items[index];
                        if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                            const blob = item.getAsFile();
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                SmartImport.addImage(event.target.result);
                            };
                            reader.readAsDataURL(blob);
                            foundImage = true;
                        }
                    }

                    if (foundImage) e.preventDefault();
                },

                handleFile: function (input) {
                    if (input.files && input.files.length > 0) {
                        Array.from(input.files).forEach(file => {
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                SmartImport.addImage(e.target.result);
                            };
                            reader.readAsDataURL(file);
                        });
                        // Reset input so same file can be selected again
                        input.value = '';
                    }
                },

                addImage: function (base64) {
                    this.pendingImages.push(base64);
                    this.updatePreview();
                    UI.showToast("Image added to queue.", "success");
                },

                reset: function () {
                    this.pendingImages = [];
                    this.updatePreview();
                    UI.showToast("Queue cleared.", "info");
                },

                updatePreview: function () {
                    const container = document.getElementById('smart-import-preview');
                    const btn = document.getElementById('btn-smart-extract');

                    if (container) {
                        container.innerHTML = this.pendingImages.map((img, idx) => `
                            <div style="position: relative; width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 4px; overflow: hidden;">
                                <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
                                <div onclick="ShamrockApp.SmartImport.removeImage(${idx})" 
                                     style="position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.5); color: white; width: 20px; height: 20px; text-align: center; line-height: 20px; cursor: pointer; font-size: 12px;">×</div>
                            </div>
                        `).join('');
                    }

                    if (btn) {
                        const count = this.pendingImages.length;
                        btn.innerText = count > 0 ? `Extract (${count})` : "Extract";
                        btn.disabled = count === 0;
                    }
                },

                removeImage: function (index) {
                    this.pendingImages.splice(index, 1);
                    this.updatePreview();
                },

                run: function () {
                    if (this.pendingImages.length === 0) {
                        // Check if URL field has text, if so warn
                        const urlInput = document.getElementById('smart-import-url');
                        if (urlInput && urlInput.value.trim()) {
                            return UI.showToast("URL extraction is disabled. Please Paste a Screenshot (Cmd+V) or Upload Image.", "warning");
                        }
                        return UI.showToast("Please Paste or Upload an Image first.", "warning");
                    }

                    UI.showToast(`🔮 Analyzing ${this.pendingImages.length} images...`, "info");
                    const btn = document.getElementById('btn-smart-extract');
                    if (btn) btn.disabled = true;

                    // Send Array of images
                    google.script.run
                        .withSuccessHandler((data) => {
                            SmartImport.applyData(data);
                            SmartImport.reset(); // Clear queue on success
                            if (btn) btn.disabled = false;
                        })
                        .withFailureHandler(err => {
                            UI.showToast("Import Failed: " + err.message, "error");
                            if (btn) btn.disabled = false;
                        })
                        .client_parseBooking(this.pendingImages); // Sending Array!
                },

                // Deprecated single image processor, but kept if needed for legacy calls? 
                // No, we handle array in backend now.
                processImage: function (base64) {
                    this.addImage(base64); // Redirect to queue
                },

                applyData: function (data) {
                    if (data.error) return UI.showToast(data.error, "error");

                    // Map AI fields
                    if (data.firstName) UI.setValue('defendant-first-name', data.firstName);
                    if (data.lastName) UI.setValue('defendant-last-name', data.lastName);
                    if (data.middleName) UI.setValue('defendant-middle-name', data.middleName);
                    if (data.dob) UI.setValue('defendant-dob', data.dob);
                    if (data.bookingNumber) UI.setValue('defendant-booking-number', data.bookingNumber); // Fixed ID

                    if (data.arrestDate) UI.setValue('defendant-arrest-date', data.arrestDate);
                    if (data.jailFacility) UI.setValue('defendant-jail-facility', data.jailFacility);
                    if (data.county) UI.setSelect('defendant-county', data.county);
                    if (data.notes) UI.setValue('defendant-notes', data.notes);

                    // Charges
                    if (data.charges && Array.isArray(data.charges)) {
                        // Clear existing? Maybe ask user? For now append.
                        data.charges.forEach(c => {
                            addCharge({
                                desc: c.description,
                                statute: c.statute,
                                degree: c.degree,
                                bondAmount: c.bond,
                                bondType: c.bondType,
                                courtDate: c.courtDate,
                                caseNumber: c.caseNumber
                            });
                        });

                        // Calculate total bond if available
                        const totalBond = data.charges.reduce((acc, c) => acc + (c.bond || 0), 0);
                        if (totalBond > 0) UI.setValue('defendant-bond-amount', totalBond);

                        UI.showToast(`Added ${data.charges.length} charges.`, "success");
                    }

                    // Address
                    if (data.address) {
                        // Handle object or string
                        if (typeof data.address === 'object') {
                            if (data.address.street) UI.setValue('defendant-street-address', data.address.street); // Fixed ID
                            if (data.address.city) UI.setValue('defendant-city', data.address.city);
                            if (data.address.state) UI.setSelect('defendant-state', data.address.state);
                            if (data.address.zip) UI.setValue('defendant-zipcode', data.address.zip); // Fixed ID
                        } else {
                            UI.setValue('defendant-street-address', data.address);
                        }
                    }

                    UI.showToast("✅ Data Extracted & Applied", "success");
                }
            };

            const api = {
                Maps: Maps,
                SmartImport: SmartImport,
                IntakeCache: new Map(),
                showToast: UI.showToast, // Expose for diagnostic script
                init: function () {
                    // Hide Overlay IMMEDIATELY
                    const overlay = document.getElementById('progress-overlay');
                    if (overlay) overlay.style.display = 'none';

                    try { Router.handleParams(); } catch (e) { console.error('Router init failed', e); }
                    try { SmartImport.init(); } catch (e) { console.error('SmartImport init failed', e); }

                    // Initialize Queue (Data)
                    setTimeout(Queue.fetch, 500);

                    // Maps is now handled by callback or lazy-load on tab switch

                    // --- Module: Blog Audio ---
                    window.generateBlogAudio = function (btn) {
                        const text = document.getElementById('blog-text').value;
                        const voiceId = document.getElementById('voice-select').value;
                        const title = document.getElementById('blog-filename').value;

                        if (!text) {
                            UI.showToast('Please enter blog text', 'error');
                            return;
                        }

                        // UI Loading State
                        const originalText = btn.innerText;
                        btn.innerText = '⏳ Generating... (This may take 30s)';
                        btn.disabled = true;

                        google.script.run
                            .withSuccessHandler(res => {
                                btn.innerText = originalText;
                                btn.disabled = false;

                                if (res.success) {
                                    UI.showToast('Audio Generated Successfully!', 'success');
                                    const resultBox = document.getElementById('audio-result');
                                    const link = document.getElementById('audio-download-link');

                                    if (resultBox && link) {
                                        link.href = res.url; // Drive URL
                                        resultBox.style.display = 'block';
                                    }
                                } else {
                                    UI.showToast('Generation Failed: ' + res.error, 'error');
                                }
                            })
                            .withFailureHandler(err => {
                                btn.innerText = originalText;
                                btn.disabled = false;
                                console.error(err);
                                UI.showToast('System Error: ' + err.message, 'error');
                            })
                            .client_generateBlogAudio(text, title, voiceId);
                    };

                    // Global Error Handler
                    // Global exports for onClick compatibility
                    window.runClerk = Agents.Clerk.run;
                    window.limitSearch = Agents.Clerk.limitSearch;
                    window.toggleAgentTab = UI.toggleAgentTab;
                    window.runAnalyst = Agents.Analyst.run;
                    window.runInvestigator = Agents.Investigator.run;
                    window.runMonitor = Agents.Monitor.run;
                    window.fetchQueue = Queue.fetch;
                    window.loadIntake = Queue.process;
                    window.refreshAllCountyStatus = Stats.refreshAll;
                    window.toggleAgentTab = UI.toggleAgentTab;
                    window.switchTab = UI.switchTab; // CRITICAL FIX: Expose switchTab globally

                    window.forceQualifiedCleanup = function () {
                        if (!confirm('⚠️ ARE YOU SURE?\n\nThis will CLEAR ALL DATA in the "Shamrock_Arrests_Master" and "Qualified_exceptions" tabs and re-sync from source counties.\n\nThis process cannot be undone.')) return;

                        UI.showToast('🧹 Starting cleanup... this may take a minute.', 'info');
                        google.script.run
                            .withSuccessHandler(() => {
                                UI.showToast('✅ Cleanup Complete!', 'success');
                                alert('Cleanup Complete. Please reload the page.');
                            })
                            .withFailureHandler(err => {
                                UI.showToast('❌ Cleanup Failed: ' + err.message, 'error');
                            })
                            .client_forceCleanup();
                    };

                    console.log("✅ ShamrockApp Initialized");
                    UI.showToast(`System Ready ${APP_VERSION}`, "success");
                }
            };

            // Expose globally for onclick handlers
            window.ShamrockApp = api;
            console.log("✅ ShamrockApp IIFE Loaded Successfully");
            return api;
        })();

        // Bootstrap with Safety Check
        window.addEventListener('load', function () {
            console.log("🚀 Window Load Event Fired");
            try {
                if (typeof ShamrockApp !== 'undefined' && ShamrockApp.init) {
                    ShamrockApp.init();
                } else {
                    console.error("❌ ShamrockApp is undefined on load");
                    alert("CRITICAL ERROR: ShamrockApp failed to load. Check console.");
                    // Emergency Overlay Removal
                    const ov = document.getElementById('progress-overlay');
                    if (ov) ov.style.display = 'none';
                }
            } catch (err) {
                console.error("❌ Bootstrap Error:", err);
                alert("Bootstrap Error: " + err.message);
            }
        });
        setTimeout(function () {
            const ov = document.getElementById('progress-overlay');
            if (ov) {
                console.warn("⚠️ Fail-Safe: Hiding Overlay");
                ov.style.display = 'none';
            }

            // Force Tab Visibility
            const activeTab = document.querySelector('.tab-content.active');
            if (!activeTab || activeTab.style.display === 'none') {
                console.warn("⚠️ Fail-Safe: No active tab visible, forcing Scrapers tab.");
                const scrapers = document.getElementById('scrapers-tab');
                if (scrapers) {
                    scrapers.style.display = 'block';
                    scrapers.classList.add('active');
                    // Add debug border to see if it's rendering but empty
                    scrapers.style.border = "4px solid red";
                } else {
                    console.error("❌ CRITCAL: #scrapers-tab element NOT FOUND in DOM");
                    alert("CRITICAL ERROR: Dashboard HTML is corrupt. Missing #scrapers-tab");
                }
            } else {
                console.log("✅ Tab is visible:", activeTab.id);
            }

            // Debug Node Count
            const cards = document.querySelectorAll('.county-card');
            console.log("Found " + cards.length + " county cards.");
            if (cards.length === 0) alert("Diagnostic: 0 County Cards found. HTML is truncated?");

        }, 3000);
        // =========================================================================
        // TEST AUTOMATION - "The One-Click Test"
        // =========================================================================
        function fillTestLeadData() {
            console.log("🤖 Filling form with comprehensive test data...");

            // --- Helper to verify IDs ---
            const setValue = (id, val) => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = val;
                    // Trigger input event for any listeners (e.g. formatting)
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    console.warn(`[Test Data] Missing ID: ${id}`);
                }
            };

            const setSelect = (id, val) => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = val;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            // 1. Defendant Info
            setValue('defendant-first-name', "John");
            setValue('defendant-last-name', "Doe-Test");
            setValue('defendant-middle-name', "Quincy");
            setValue('defendant-alias', "Johnny D");
            setValue('defendant-dob', "1990-01-01");
            setValue('defendant-ssn', "000-00-1234");
            setValue('defendant-dl-number', "D123-456-78-901-0");
            setValue('defendant-dl-state', "FL");

            setValue('defendant-email', "admin@shamrockbailbonds.biz");
            setValue('defendant-phone', "555-555-0001");

            // Address
            setValue('defendant-street-address', "123 Test St");
            setValue('defendant-city', "Fort Myers");
            setSelect('defendant-state', "FL");
            setValue('defendant-zipcode', "33901");

            // Demographics
            setValue('height', "6'0\"");
            setValue('weight', "185");
            setValue('eyes', "Blue");
            setValue('hair', "Brown");
            setValue('race', "White/Caucasian");
            setValue('scars-tattoos', "Tattoo on left arm: 'Mom'");

            // Vehicle
            setValue('car-make', "Toyota");
            setValue('car-model', "Camry");
            setValue('plate-number', "XYZ-123");

            // Case Info
            setValue('case-number', "2024-CF-" + Math.floor(Math.random() * 10000));
            setValue('booking-number', "BK-" + Math.floor(Math.random() * 10000));
            setValue('jailFacility', "Lee County Jail");
            setSelect('defendant-county', "Lee");
            setValue('defendant-arrest-date', new Date().toISOString().split('T')[0]);

            // 2. Charges (Clear and Add One via API)
            const chargesContainer = document.getElementById('charges-container');
            if (chargesContainer) {
                chargesContainer.innerHTML = ''; // Clear existing
                if (typeof addCharge === 'function') {
                    addCharge({
                        desc: "Grand Theft",
                        statute: "812.014",
                        degree: "F3",
                        caseNumber: "24-CF-TEST",
                        powerNumber: "PWR-12345",
                        courtDate: new Date().toISOString().split('T')[0],
                        bondAmount: 5000,
                        bondType: "surety"
                    });
                }
            }

            // Financials
            setValue('totalBond', "5000");
            setValue('totalPremium', "500");
            setValue('downPayment', "100");
            setValue('balanceDue', "400");

            // 3. Indemnitor Info (Clear and Add One via API)
            const indContainer = document.getElementById('indemnitors-container');
            if (indContainer) {
                indContainer.innerHTML = ''; // Clear existing
                if (typeof addIndemnitor === 'function') {
                    addIndemnitor({
                        firstName: "Jane",
                        middleName: "Marie",
                        lastName: "Smith-Test",
                        relationship: "Spouse",
                        dob: "1992-05-15",
                        ssn: "000-00-5678",
                        dl: "S567-890-12-345-0",
                        dlState: "FL",
                        phone: "555-555-0002",
                        address: "456 Main St",
                        city: "Naples",
                        zip: "34102",
                        email: "admin@shamrockbailbonds.biz",
                        employer: "Acme Corp",
                        employerPhone: "555-555-9999",
                        employerCity: "Fort Myers",
                        employerState: "FL",
                        supervisor: "Mr. Boss",
                        ref1Name: "Ref One",
                        ref1Relation: "Friend",
                        ref1Phone: "555-111-1111",
                        ref2Name: "Ref Two",
                        ref2Relation: "Brother",
                        ref2Phone: "555-222-2222"
                    });
                }
            }

            // 4. Select Documents
            const checkboxes = document.querySelectorAll('input[name="selectedDocs"]');
            checkboxes.forEach(cb => cb.checked = false);

            const targets = ['defendant-application', 'indemnity-agreement', 'promissory-note', 'faq-defendants', 'faq-cosigners'];
            checkboxes.forEach(cb => {
                if (targets.includes(cb.value)) {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            // 5. Select Signing Method
            const emailRadio = document.querySelector('input[name="signingMethod"][value="email"]');
            if (emailRadio) emailRadio.checked = true;

            const toastMsg = "✅ Comprehensive Test Data Loaded!";
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast(toastMsg, "success");
            } else {
                console.log(toastMsg);
                alert(toastMsg);
            }
        }
