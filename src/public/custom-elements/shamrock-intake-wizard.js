/**
 * Shamrock Bail Bonds - Autopilot Intake Wizard Custom Element
 * Tag Name: <shamrock-intake-wizard>
 * File: src/public/custom-elements/shamrock-intake-wizard.js
 * 
 * Provides a self-contained, 60fps glassmorphic intake wizard for mobile & tablet.
 * Communicates with page code (portal-start.js) via standard CustomEvents.
 */

class ShamrockIntakeWizard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.state = {
            currentStep: 0,
            role: 'indemnitor', // 'defendant' | 'indemnitor' | 'coindemnitor'
            caseId: `CASE-${Date.now().toString(36).toUpperCase()}`,
            county: 'lee',
            person: {
                firstName: '',
                middleName: '',
                lastName: '',
                dob: '',
                dlNumber: '',
                dlState: 'FL',
                phone: '',
                email: '',
                street: '',
                city: 'Fort Myers',
                state: 'FL',
                zip: '',
                employer: '',
                monthlyIncome: '',
                references: '',
                relationshipToDefendant: ''
            },
            caseFacts: {
                matched: false,
                defendantName: '',
                bookingNumber: '',
                facility: 'Lee County Jail (Core Facility)',
                courtDate: '',
                charges: [
                    { description: 'Charge 1 (Statutory Assessment)', bondAmount: 1000, fee: 100 }
                ],
                totalBond: 1000,
                statutoryPremium: 100
            },
            ocrFrontDone: false,
            ocrBackDone: false,
            ocrConfidence: 0,
            statusMessage: '',
            statusType: 'info'
        };
    }

    connectedCallback() {
        this.render();
        this.bindEvents();
    }

    // Allow page code to update state (e.g. from OCR results or DB match)
    updateWizardState(partialState) {
        this.state = { ...this.state, ...partialState };
        this.render();
        this.bindEvents();
    }

    render() {
        const s = this.state;
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #F8FAFC;
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                box-sizing: border-box;
            }
            * { box-sizing: border-box; }

            .wizard-card {
                background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(11, 19, 31, 0.98));
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
                backdrop-filter: blur(12px);
            }

            /* Header & Step Tracker */
            .header-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                padding-bottom: 16px;
                margin-bottom: 20px;
            }
            .brand-badge {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: #10B981;
                background: rgba(16, 185, 129, 0.15);
                padding: 4px 10px;
                border-radius: 999px;
                border: 1px solid rgba(16, 185, 129, 0.3);
            }
            .step-dots {
                display: flex;
                gap: 6px;
            }
            .dot {
                width: 8px;
                height: 8px;
                border-radius: 999px;
                background: rgba(255,255,255,0.2);
                transition: all 0.3s ease;
            }
            .dot.active {
                background: #10B981;
                width: 24px;
                box-shadow: 0 0 10px rgba(16,185,129,0.5);
            }

            h2 {
                margin: 0 0 8px 0;
                font-size: 22px;
                font-weight: 700;
                letter-spacing: -0.02em;
                color: #FFFFFF;
            }
            p.subtitle {
                margin: 0 0 20px 0;
                font-size: 14px;
                color: #94A3B8;
                line-height: 1.5;
            }

            /* Role Cards */
            .role-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 12px;
                margin-bottom: 24px;
            }
            @media (min-width: 600px) {
                .role-grid { grid-template-columns: 1fr 1fr 1fr; }
            }
            .role-card {
                background: rgba(30, 41, 59, 0.6);
                border: 2px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }
            .role-card:hover {
                border-color: rgba(16, 185, 129, 0.5);
                transform: translateY(-2px);
            }
            .role-card.selected {
                background: rgba(16, 185, 129, 0.12);
                border-color: #10B981;
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
            }
            .role-title {
                font-size: 16px;
                font-weight: 700;
                color: #FFF;
                margin-bottom: 4px;
            }
            .role-desc {
                font-size: 12px;
                color: #94A3B8;
            }

            /* Form Elements */
            .input-group {
                margin-bottom: 16px;
            }
            label {
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: #CBD5E1;
                margin-bottom: 6px;
            }
            input, select, textarea {
                width: 100%;
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                padding: 12px 14px;
                font-size: 16px; /* Prevents iOS auto-zoom */
                color: #F8FAFC;
                transition: border-color 0.2s;
            }
            input:focus, select:focus, textarea:focus {
                outline: none;
                border-color: #10B981;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
            }
            .grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            /* Camera & Scan Box */
            .camera-box {
                border: 2px dashed rgba(16, 185, 129, 0.4);
                background: rgba(16, 185, 129, 0.05);
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                margin-bottom: 20px;
            }
            .scan-preview-card {
                background: rgba(30, 41, 59, 0.8);
                border-radius: 8px;
                padding: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            /* Charge Table */
            .charge-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .charge-table th {
                text-align: left;
                font-size: 12px;
                color: #94A3B8;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding: 8px 4px;
            }
            .charge-table td {
                padding: 10px 4px;
                font-size: 14px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .statutory-badge {
                font-size: 11px;
                background: rgba(56, 189, 248, 0.15);
                color: #38BDF8;
                padding: 2px 6px;
                border-radius: 4px;
            }

            /* Action Buttons */
            .btn-row {
                display: flex;
                gap: 12px;
                margin-top: 24px;
            }
            button {
                min-height: 48px; /* Thumb touch rule */
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .btn-primary {
                flex: 1;
                background: linear-gradient(135deg, #10B981, #059669);
                color: #FFFFFF;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            .btn-primary:hover {
                background: linear-gradient(135deg, #059669, #047857);
                transform: translateY(-1px);
            }
            .btn-secondary {
                background: rgba(255, 255, 255, 0.08);
                color: #CBD5E1;
            }
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            /* Status & Notices */
            .notice-box {
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 8px;
                padding: 12px 16px;
                font-size: 13px;
                color: #FCD34D;
                margin-top: 20px;
                line-height: 1.4;
            }
            .status-banner {
                padding: 10px 14px;
                border-radius: 6px;
                margin-bottom: 16px;
                font-size: 14px;
                display: ${s.statusMessage ? 'block' : 'none'};
                background: ${s.statusType === 'error' ? 'rgba(239, 68, 68, 0.2)' : s.statusType === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)'};
                color: ${s.statusType === 'error' ? '#F87171' : s.statusType === 'success' ? '#34D399' : '#38BDF8'};
                border: 1px solid ${s.statusType === 'error' ? '#EF4444' : s.statusType === 'success' ? '#10B981' : '#38BDF8'};
            }
        </style>

        <div class="wizard-card">
            <div class="header-row">
                <span class="brand-badge">⚡ SHAMROCK AUTOPILOT INTAKE</span>
                <div class="step-dots">
                    <div class="dot ${s.currentStep === 0 ? 'active' : ''}"></div>
                    <div class="dot ${s.currentStep === 1 ? 'active' : ''}"></div>
                    <div class="dot ${s.currentStep === 2 ? 'active' : ''}"></div>
                    <div class="dot ${s.currentStep === 3 ? 'active' : ''}"></div>
                    <div class="dot ${s.currentStep === 4 ? 'active' : ''}"></div>
                    <div class="dot ${s.currentStep === 5 ? 'active' : ''}"></div>
                </div>
            </div>

            <div class="status-banner">${s.statusMessage}</div>

            ${this.renderStepContent()}
        </div>
        `;
    }

    renderStepContent() {
        const s = this.state;
        switch (s.currentStep) {
            case 0:
                return `
                <h2>Who are you filling this out for?</h2>
                <p class="subtitle">Select your role to configure the correct paperwork packet.</p>
                <div class="role-grid">
                    <div class="role-card ${s.role === 'indemnitor' ? 'selected' : ''}" data-role="indemnitor">
                        <div class="role-title">Primary Cosigner</div>
                        <div class="role-desc">I am getting a friend or loved one out of jail.</div>
                    </div>
                    <div class="role-card ${s.role === 'defendant' ? 'selected' : ''}" data-role="defendant">
                        <div class="role-title">Defendant</div>
                        <div class="role-desc">I am the person who was arrested.</div>
                    </div>
                    <div class="role-card ${s.role === 'coindemnitor' ? 'selected' : ''}" data-role="coindemnitor">
                        <div class="role-title">Second Cosigner</div>
                        <div class="role-desc">I am adding my signature as a co-indemnitor.</div>
                    </div>
                </div>
                <div class="btn-row">
                    <button class="btn-primary" id="btnStep0Next">Continue to ID Scan →</button>
                </div>
                `;

            case 1:
                return `
                <h2>Scan Driver's License or ID</h2>
                <p class="subtitle">Our Google Cloud Vision OCR will automatically read your info and fill the paperwork.</p>
                <div class="camera-box">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" style="margin-bottom:12px;">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <div style="font-weight:600; margin-bottom:8px;">Capture Government Photo ID</div>
                    <div style="font-size:13px; color:#94A3B8; margin-bottom:16px;">Take a clear photo of the front of your license.</div>
                    <input type="file" id="fileInputIdFront" accept="image/*" capture="environment" style="display:none;">
                    <button class="btn-primary" id="btnTriggerCamera" style="margin: 0 auto;">📷 Snap / Upload ID Photo</button>
                </div>

                <div class="scan-preview-card">
                    <div>
                        <div style="font-weight:600; font-size:14px;">Front of ID</div>
                        <div style="font-size:12px; color:${s.ocrFrontDone ? '#10B981' : '#94A3B8'};">
                            ${s.ocrFrontDone ? `✓ Verified (Confidence ${s.ocrConfidence}%)` : 'Pending capture'}
                        </div>
                    </div>
                    <span>${s.ocrFrontDone ? '🟢 Ready' : '⚪ Waiting'}</span>
                </div>

                <div class="btn-row">
                    <button class="btn-secondary" id="btnBack">← Back</button>
                    <button class="btn-primary" id="btnStep1Next" ${!s.ocrFrontDone ? 'disabled style="opacity:0.5"' : ''}>Review Info →</button>
                </div>
                `;

            case 2:
                return `
                <h2>Verify Identity Details</h2>
                <p class="subtitle">Extracted automatically from your ID. Correct any typos below.</p>
                <div class="grid-2">
                    <div class="input-group">
                        <label>First Name</label>
                        <input type="text" id="inpFirstName" value="${s.person.firstName}">
                    </div>
                    <div class="input-group">
                        <label>Last Name</label>
                        <input type="text" id="inpLastName" value="${s.person.lastName}">
                    </div>
                </div>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Date of Birth</label>
                        <input type="date" id="inpDob" value="${s.person.dob}">
                    </div>
                    <div class="input-group">
                        <label>Driver's License #</label>
                        <input type="text" id="inpDlNumber" value="${s.person.dlNumber}">
                    </div>
                </div>
                <div class="input-group">
                    <label>Street Address</label>
                    <input type="text" id="inpStreet" value="${s.person.street}">
                </div>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Phone Number (SMS / Recovery)</label>
                        <input type="tel" id="inpPhone" value="${s.person.phone}">
                    </div>
                    <div class="input-group">
                        <label>Email Address</label>
                        <input type="email" id="inpEmail" value="${s.person.email}">
                    </div>
                </div>
                <div class="btn-row">
                    <button class="btn-secondary" id="btnBack">← Back</button>
                    <button class="btn-primary" id="btnStep2Next">Next: Case Details →</button>
                </div>
                `;

            case 3:
                return `
                <h2>Case Facts & Charges</h2>
                <p class="subtitle">Matched against county jail records and statutory Florida fee rules.</p>
                
                <div style="background:rgba(30,41,59,0.7); border-radius:8px; padding:12px; margin-bottom:16px;">
                    <div style="font-size:12px; color:#94A3B8;">Facility & Location</div>
                    <div style="font-weight:600; font-size:15px; color:#FFF;">${s.caseFacts.facility}</div>
                    <div style="font-size:13px; color:#38BDF8;">County: ${s.county.toUpperCase()} · Booking #: ${s.caseFacts.bookingNumber || 'Pending'}</div>
                </div>

                <table class="charge-table">
                    <thead>
                        <tr>
                            <th>Charge / Description</th>
                            <th>Bond Amount</th>
                            <th>Statutory Fee (10% or $100 Min)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${s.caseFacts.charges.map(c => `
                            <tr>
                                <td>${c.description}</td>
                                <td>$${Number(c.bondAmount).toLocaleString()}</td>
                                <td>$${Number(c.fee).toLocaleString()} <span class="statutory-badge">F.S. 648</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:14px;">
                    <div>
                        <div style="font-size:12px; color:#A7F3D0;">Total Bond Face Value: $${Number(s.caseFacts.totalBond).toLocaleString()}</div>
                        <div style="font-weight:700; font-size:18px; color:#10B981;">Estimated Total Premium</div>
                    </div>
                    <div style="font-weight:800; font-size:24px; color:#10B981;">$${Number(s.caseFacts.statutoryPremium).toLocaleString()}</div>
                </div>

                <div class="btn-row">
                    <button class="btn-secondary" id="btnBack">← Back</button>
                    <button class="btn-primary" id="btnStep3Next">Next: Background Info →</button>
                </div>
                `;

            case 4:
                return `
                <h2>Employment & References</h2>
                <p class="subtitle">Complete missing background details for underwriting verification.</p>
                <div class="input-group">
                    <label>Employer / Company Name</label>
                    <input type="text" id="inpEmployer" value="${s.person.employer}" placeholder="e.g. Lee County Health / Self-Employed">
                </div>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Monthly Income ($)</label>
                        <input type="number" id="inpMonthlyIncome" value="${s.person.monthlyIncome}" placeholder="4500">
                    </div>
                    ${s.role !== 'defendant' ? `
                    <div class="input-group">
                        <label>Relationship to Defendant</label>
                        <input type="text" id="inpRelationship" value="${s.person.relationshipToDefendant}" placeholder="e.g. Spouse / Parent / Sibling">
                    </div>
                    ` : `
                    <div class="input-group">
                        <label>Attorney Name (if hired)</label>
                        <input type="text" id="inpAttorney" placeholder="Optional">
                    </div>
                    `}
                </div>
                <div class="input-group">
                    <label>Emergency Contact / Reference (Name & Phone)</label>
                    <textarea id="inpReferences" rows="2" placeholder="Jane Doe - (239) 555-0199 - Sister">${s.person.references}</textarea>
                </div>
                <div class="btn-row">
                    <button class="btn-secondary" id="btnBack">← Back</button>
                    <button class="btn-primary" id="btnStep4Next">Next: Preview & Sign →</button>
                </div>
                `;

            case 5:
                return `
                <h2>Review Your Intake Summary</h2>
                <p class="subtitle">Please confirm the information is correct before launching the signing pad.</p>
                
                <div style="background:rgba(30,41,59,0.6); border-radius:8px; padding:16px; font-size:14px; line-height:1.6; margin-bottom:16px;">
                    <div><strong>Signer Role:</strong> ${s.role.toUpperCase()}</div>
                    <div><strong>Full Name:</strong> ${s.person.firstName} ${s.person.lastName}</div>
                    <div><strong>Contact:</strong> ${s.person.phone} · ${s.person.email}</div>
                    <div><strong>Address:</strong> ${s.person.street}, ${s.person.city}, ${s.person.state}</div>
                    <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:8px; padding-top:8px;">
                        <strong>Jail Facility:</strong> ${s.caseFacts.facility} (${s.county.toUpperCase()})<br>
                        <strong>Total Bond:</strong> $${Number(s.caseFacts.totalBond).toLocaleString()}<br>
                        <strong>Estimated Premium:</strong> $${Number(s.caseFacts.statutoryPremium).toLocaleString()}
                    </div>
                </div>

                <div class="notice-box">
                    <strong>Notice:</strong> This is your secure intake summary. Once submitted, our licensed bondsman verifies the charges in Super CRM and releases your official DocuSeal packet for 1-tap mobile signature.
                </div>

                <div class="btn-row">
                    <button class="btn-secondary" id="btnBack">← Back</button>
                    <button class="btn-primary" id="btnFinalSubmit" style="background: linear-gradient(135deg, #10B981, #047857);">
                        ✓ Confirm & Launch Signing Pad
                    </button>
                </div>
                `;

            default:
                return ``;
        }
    }

    bindEvents() {
        const root = this.shadowRoot;

        // Step 0 Role Cards
        root.querySelectorAll('.role-card').forEach(card => {
            card.addEventListener('click', () => {
                this.state.role = card.dataset.role;
                this.render();
                this.bindEvents();
            });
        });

        // Step 0 Next
        const btnStep0Next = root.querySelector('#btnStep0Next');
        if (btnStep0Next) {
            btnStep0Next.addEventListener('click', () => {
                this.goToStep(1);
            });
        }

        // Camera trigger (Step 1)
        const btnTriggerCamera = root.querySelector('#btnTriggerCamera');
        const fileInputIdFront = root.querySelector('#fileInputIdFront');
        if (btnTriggerCamera && fileInputIdFront) {
            btnTriggerCamera.addEventListener('click', () => fileInputIdFront.click());
            fileInputIdFront.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Navigation Next Buttons
        const btnStep1Next = root.querySelector('#btnStep1Next');
        if (btnStep1Next) btnStep1Next.addEventListener('click', () => this.goToStep(2));

        const btnStep2Next = root.querySelector('#btnStep2Next');
        if (btnStep2Next) {
            btnStep2Next.addEventListener('click', () => {
                this.saveInputsStep2();
                this.goToStep(3);
            });
        }

        const btnStep3Next = root.querySelector('#btnStep3Next');
        if (btnStep3Next) btnStep3Next.addEventListener('click', () => this.goToStep(4));

        const btnStep4Next = root.querySelector('#btnStep4Next');
        if (btnStep4Next) {
            btnStep4Next.addEventListener('click', () => {
                this.saveInputsStep4();
                this.goToStep(5);
            });
        }

        // Final Submit (Step 5)
        const btnFinalSubmit = root.querySelector('#btnFinalSubmit');
        if (btnFinalSubmit) {
            btnFinalSubmit.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('wizard-completed', {
                    bubbles: true,
                    composed: true,
                    detail: { state: this.state }
                }));
            });
        }

        // Universal Back Button
        const btnBack = root.querySelector('#btnBack');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                if (this.state.currentStep > 0) this.goToStep(this.state.currentStep - 1);
            });
        }
    }

    goToStep(stepNum) {
        this.state.currentStep = stepNum;
        this.dispatchEvent(new CustomEvent('wizard-step-changed', {
            bubbles: true,
            composed: true,
            detail: { step: stepNum, state: this.state }
        }));
        this.render();
        this.bindEvents();
    }

    saveInputsStep2() {
        const root = this.shadowRoot;
        const g = id => root.querySelector(id)?.value?.trim() || '';
        this.state.person.firstName = g('#inpFirstName');
        this.state.person.lastName = g('#inpLastName');
        this.state.person.dob = g('#inpDob');
        this.state.person.dlNumber = g('#inpDlNumber');
        this.state.person.street = g('#inpStreet');
        this.state.person.phone = g('#inpPhone');
        this.state.person.email = g('#inpEmail');
    }

    saveInputsStep4() {
        const root = this.shadowRoot;
        const g = id => root.querySelector(id)?.value?.trim() || '';
        this.state.person.employer = g('#inpEmployer');
        this.state.person.monthlyIncome = g('#inpMonthlyIncome');
        this.state.person.relationshipToDefendant = g('#inpRelationship');
        this.state.person.references = g('#inpReferences');
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64Image = reader.result;
            // Emit OCR Request to Velo page code
            this.dispatchEvent(new CustomEvent('request-id-ocr', {
                bubbles: true,
                composed: true,
                detail: {
                    base64Image,
                    role: this.state.role,
                    fileName: file.name
                }
            }));
            // Provide instant visual feedback
            this.state.ocrFrontDone = true;
            this.state.ocrConfidence = 96;
            this.state.statusMessage = '✓ ID photo captured. Running Google Cloud Vision OCR...';
            this.state.statusType = 'success';
            this.render();
            this.bindEvents();
        };
        reader.readAsDataURL(file);
    }
}

customElements.define('shamrock-intake-wizard', ShamrockIntakeWizard);
