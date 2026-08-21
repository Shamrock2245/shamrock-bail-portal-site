/**
 * Defendant Multi-Step Wizard (Studio Native)
 * File: public/defendant-wizard-studio.js
 * 
 * Native Wix Studio multi-step form controller for Defendants.
 * Bound to the canonical paperwork schema.
 * 
 * Scope & Integrity Rules:
 * - Defendant-only fields: known charges, attorney, employer, vehicles, socials/aliases.
 * - NEVER asks the defendant for indemnitor's employer or financial co-signing details.
 * - Saves progress draft after every step to allow resumption on another device.
 * - Large touch targets (≥44px), numeric keyboards for phone/money, responsive 2-column tablet layout.
 * 
 * @module defendant-wizard-studio
 */

import { saveWizardDraft, getWizardDraft } from 'backend/wizard-draft-service';
import { getSessionToken } from 'public/session-manager';
import { createCanonicalPerson, createCanonicalCase } from 'public/canonical-paperwork-mapper';

/**
 * Initializes Defendant Multi-Step Studio Wizard
 * @param {Object} $w - Wix $w selector instance
 * @param {Object} options
 * @param {Object} [options.initialCase] - Optional initial canonical case
 * @param {Function} [options.onComplete] - Callback on wizard completion
 */
export async function initDefendantWizard($w, options = {}) {
    console.log("🛡️ [Defendant Wizard] Initializing Studio multi-step form...");

    const sessionToken = getSessionToken();
    let currentStep = 1;
    const totalSteps = 4;
    let canonicalCase = options.initialCase || createCanonicalCase();
    let def = canonicalCase.defendant || createCanonicalPerson('defendant');

    // 1. Check for saved draft to resume
    if (sessionToken) {
        try {
            const draftResult = await getWizardDraft({ sessionToken, role: 'defendant' });
            if (draftResult.found && draftResult.draft) {
                console.log("🔄 [Defendant Wizard] Resuming draft from Step", draftResult.draft.currentStep);
                currentStep = draftResult.draft.currentStep || 1;
                if (draftResult.draft.canonicalCase) {
                    canonicalCase = draftResult.draft.canonicalCase;
                    def = canonicalCase.defendant;
                }
            }
        } catch (e) {
            console.warn("Draft restore non-fatal:", e);
        }
    }

    renderStep(currentStep);
    populateFields();
    bindEvents();

    function renderStep(step) {
        currentStep = step;
        safeSetText('#stepProgressLabel', `Step ${step} of ${totalSteps}`);
        
        try {
            const progressBar = $w('#wizardProgressBar');
            if (progressBar) progressBar.targetValue = (step / totalSteps) * 100;
        } catch (e) {}

        // Hide all step boxes
        ['#boxDefStep1', '#boxDefStep2', '#boxDefStep3', '#boxDefStep4'].forEach((sel, idx) => {
            try {
                const el = $w(sel);
                if (el) {
                    if (idx + 1 === step) el.show();
                    else el.hide();
                }
            } catch (e) {}
        });

        // Navigation button states
        if (step === 1) {
            safeHide('#btnDefPrev');
        } else {
            safeShow('#btnDefPrev');
        }

        if (step === totalSteps) {
            safeSetText('#btnDefNext', 'Finish Defendant Packet');
        } else {
            safeSetText('#btnDefNext', 'Continue →');
        }
    }

    function populateFields() {
        // Step 1: Charges & Attorney
        safeSetValue('#inputAttorneyName', def.emergencyContact?.name || '');
        safeSetValue('#inputAttorneyPhone', def.emergencyContact?.phone || '');

        // Step 2: Employment
        safeSetValue('#inputDefEmployer', def.employment?.employer || '');
        safeSetValue('#inputDefOccupation', def.employment?.occupation || '');
        safeSetValue('#inputDefMonthlyIncome', def.employment?.monthlyIncome || '');
        safeSetValue('#inputDefWorkPhone', def.employment?.phone || '');

        // Step 3: Vehicles
        safeSetValue('#inputVehicleMake', def.addresses?.[0]?.vehicleMake || '');
        safeSetValue('#inputVehicleModel', def.addresses?.[0]?.vehicleModel || '');
        safeSetValue('#inputVehicleYear', def.addresses?.[0]?.vehicleYear || '');

        // Step 4: Socials & Aliases
        safeSetValue('#inputAliases', def.defendantExtras?.aliases?.join(', ') || '');
        safeSetValue('#inputSocialHandles', def.defendantExtras?.socialHandles?.join(', ') || '');
    }

    function harvestCurrentStepData() {
        if (currentStep === 1) {
            def.emergencyContact = {
                name: safeGetValue('#inputAttorneyName'),
                relationship: 'Attorney / Legal Counsel',
                phone: safeGetValue('#inputAttorneyPhone')
            };
        } else if (currentStep === 2) {
            def.employment.employer = safeGetValue('#inputDefEmployer');
            def.employment.occupation = safeGetValue('#inputDefOccupation');
            def.employment.monthlyIncome = safeGetValue('#inputDefMonthlyIncome');
            def.employment.phone = safeGetValue('#inputDefWorkPhone');
        } else if (currentStep === 3) {
            if (!def.addresses[0]) def.addresses[0] = {};
            def.addresses[0].vehicleMake = safeGetValue('#inputVehicleMake');
            def.addresses[0].vehicleModel = safeGetValue('#inputVehicleModel');
            def.addresses[0].vehicleYear = safeGetValue('#inputVehicleYear');
        } else if (currentStep === 4) {
            const aliasStr = safeGetValue('#inputAliases');
            def.defendantExtras.aliases = aliasStr ? aliasStr.split(',').map(s => s.trim()) : [];
            const socialStr = safeGetValue('#inputSocialHandles');
            def.defendantExtras.socialHandles = socialStr ? socialStr.split(',').map(s => s.trim()) : [];
        }
        canonicalCase.defendant = def;
    }

    async function triggerDraftSave() {
        harvestCurrentStepData();
        if (sessionToken) {
            await saveWizardDraft({
                sessionToken,
                role: 'defendant',
                currentStep,
                canonicalCase
            });
        }
    }

    function bindEvents() {
        // Next Step Button
        safeOnClick('#btnDefNext', async () => {
            harvestCurrentStepData();
            await triggerDraftSave();

            if (currentStep < totalSteps) {
                renderStep(currentStep + 1);
            } else {
                // Completed Wizard
                console.log("✅ [Defendant Wizard] Completed all steps!");
                if (typeof options.onComplete === 'function') {
                    options.onComplete(canonicalCase);
                }
            }
        });

        // Previous Step Button
        safeOnClick('#btnDefPrev', async () => {
            if (currentStep > 1) {
                harvestCurrentStepData();
                await triggerDraftSave();
                renderStep(currentStep - 1);
            }
        });
    }

    // Helper functions
    function safeGetValue(sel) {
        try {
            const el = $w(sel);
            return el && el.value ? String(el.value).trim() : '';
        } catch (e) { return ''; }
    }

    function safeSetValue(sel, val) {
        try {
            const el = $w(sel);
            if (el && val !== undefined) el.value = String(val);
        } catch (e) {}
    }

    function safeSetText(sel, txt) {
        try {
            const el = $w(sel);
            if (el) el.text = txt;
        } catch (e) {}
    }

    function safeShow(sel) {
        try {
            const el = $w(sel);
            if (el) el.show();
        } catch (e) {}
    }

    function safeHide(sel) {
        try {
            const el = $w(sel);
            if (el) el.hide();
        } catch (e) {}
    }

    function safeOnClick(sel, handler) {
        try {
            const el = $w(sel);
            if (el && typeof el.onClick === 'function') el.onClick(handler);
        } catch (e) {}
    }

    return {
        getCanonicalCase: () => canonicalCase,
        saveDraft: triggerDraftSave
    };
}

export default {
    initDefendantWizard
};
