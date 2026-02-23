
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

                    // --- Module: Social Hub ---
                    window.generateSocialPosts = function () {
                        const basePost = document.getElementById('social-base-post').value;
                        if (!basePost) {
                            UI.showToast('Please enter a base post/idea', 'error');
                            return;
                        }

                        const checkboxes = document.querySelectorAll('.social-platform:checked');
                        const platforms = Array.from(checkboxes).map(cb => cb.value);

                        if (platforms.length === 0) {
                            UI.showToast('Please select at least one target platform', 'error');
                            return;
                        }

                        const btn = document.getElementById('btn-generate-social');
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '⏳ Generating with Grok...';
                        btn.disabled = true;

                        const container = document.getElementById('social-variants-container');
                        container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:var(--text-secondary);"><div style="font-size:32px; animation:spin 1s linear infinite; display:inline-block;">⚙️</div><p style="margin-top:16px;">Grok is crafting optimal posts for ' + platforms.length + ' platforms...</p></div>';

                        google.script.run
                            .withSuccessHandler(res => {
                                btn.innerHTML = originalText;
                                btn.disabled = false;

                                if (res.success) {
                                    UI.showToast('Variants Generated Successfully!', 'success');
                                    renderSocialVariants(res.variants);
                                    document.getElementById('btn-broadcast-social').disabled = false;
                                } else {
                                    UI.showToast('Generation Failed: ' + res.error, 'error');
                                    container.innerHTML = '<div style="color:var(--error); padding:20px;">Error: ' + res.error + '</div>';
                                }
                            })
                            .withFailureHandler(err => {
                                btn.innerHTML = originalText;
                                btn.disabled = false;
                                console.error(err);
                                UI.showToast('System Error: ' + err.message, 'error');
                                container.innerHTML = '<div style="color:var(--error); padding:20px;">System Error: ' + err.message + '</div>';
                            })
                            .client_generateSocialPosts(basePost, platforms);
                    };

                    window.renderSocialVariants = function (variants) {
                        const container = document.getElementById('social-variants-container');
                        container.innerHTML = '';

                        Object.keys(variants).forEach(platform => {
                            const text = variants[platform];

                            const div = document.createElement('div');
                            div.style.cssText = 'background: var(--surface); border: 1px dashed var(--border-strong); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px;';

                            const header = document.createElement('div');
                            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';
                            header.innerHTML = '<strong style="text-transform: capitalize; color: var(--accent); font-size: 15px;">' + platform + '</strong><span style="font-size: 11px; color: var(--muted); font-weight: bold;">' + text.length + ' chars</span>';

                            const textarea = document.createElement('textarea');
                            textarea.className = 'social-variant-edit';
                            textarea.dataset.platform = platform;
                            textarea.rows = 4;
                            textarea.style.cssText = 'width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-2); color: var(--text); font-family: inherit; resize: vertical; margin-bottom: 8px; font-size: 14px;';
                            textarea.value = text;

                            const utils = document.createElement('div');
                            utils.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px;';
                            utils.innerHTML = '<button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.value); UI.showToast(\'Copied!\',\'success\')">Copy</button>';

                            div.appendChild(header);
                            div.appendChild(textarea);
                            div.appendChild(utils);
                            container.appendChild(div);
                        });
                    };

                    window.broadcastSocialPosts = function () {
                        UI.showToast('API Broadcasting is scheduled for Phase 8.', 'info');
                    };

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
                    window.Queue = Queue; // CRITICAL FIX: Expose Queue globally for inline handlers
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
    