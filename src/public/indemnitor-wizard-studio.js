/**
 * Indemnitor & Co-Indemnitor Multi-Step Wizard (Studio Native)
 * File: public/indemnitor-wizard-studio.js
 * 
 * Native Wix Studio multi-step form controller for Cosigners and Co-Indemnitors.
 * Bound to the canonical paperwork schema.
 * 
 * Scope & Integrity Rules:
 * - Indemnitor-only fields: relationship to defendant, homeownership, income, collateral, references.
 * - Co-Indemnitor is labeled "Second Cosigner" and operates on coIndemnitor person slot (cannot overwrite first cosigner).
 * - NEVER asks the indemnitor to re-scan the defendant's ID card.
 * - Saves progress draft after every step to allow resumption across devices.
 * - Large touch targets (≥44px), numeric inputs for money/phone, address autocomplete support.
 * 
 * @module indemnitor-wizard-studio
 */

import { saveWizardDraft, getWizardDraft } from 'backend/wizard-draft-service';
import { getSessionToken } from 'public/session-manager';
import { createCanonicalPerson, createCanonicalCase, ROLES } from 'public/canonical-paperwork-mapper';

/**
 * Initializes Indemnitor / Co-Indemnitor Multi-Step Studio Wizard
 * @param {Object} $w - Wix $w selector instance
 * @param {Object} options
 * @param {'indemnitor'|'coindemnitor'} [options.role='indemnitor']
 * @param {Object} [options.initialCase] - Optional initial canonical case
 * @param {Function} [options.onComplete] - Callback on wizard completion
 */
export async function initIndemnitorWizard($w, options = {}) {
    const role = options.role === ROLES.COINDEMNITOR ? ROLES.COINDEMNITOR : ROLES.INDEMNITOR;
    const isCoSigner = role === ROLES.COINDEMNITOR;
    console.log(`🛡️ [Indemnitor Wizard] Initializing Studio multi-step form for ${role}...`);

    const sessionToken = getSessionToken();
    let currentStep = 1;
    const totalSteps = 4;
    let canonicalCase = options.initialCase || createCanonicalCase();
    let person = isCoSigner ? canonicalCase.coIndemnitor : canonicalCase.indemnitor;

    if (!person) {
        person = createCanonicalPerson(role);
        if (isCoSigner) canonicalCase.coIndemnitor = person;
        else canonicalCase.indemnitor = person;
    }

    // 1. Check for saved draft to resume
    if (sessionToken) {
        try {
            const draftResult = await getWizardDraft({ sessionToken, role });
            if (draftResult.found && draftResult.draft) {
                console.log(`🔄 [${role} Wizard] Resuming draft from Step`, draftResult.draft.currentStep);
                currentStep = draftResult.draft.currentStep || 1;
                if (draftResult.draft.canonicalCase) {
                    canonicalCase = draftResult.draft.canonicalCase;
                    person = isCoSigner ? canonicalCase.coIndemnitor : canonicalCase.indemnitor;
                }
            }
        } catch (e) {
            console.warn("Draft restore non-fatal:", e);
        }
    }

    // UI Titles & Branding
    const roleHeading = isCoSigner ? 'Second Cosigner (Co-Indemnitor) Verification' : 'Primary Cosigner (Indemnitor) Verification';
    safeSetText('#wizardRoleTitle', roleHeading);

    renderStep(currentStep);
    populateFields();
    bindEvents();

    function renderStep(step) {
        currentStep = step;
        safeSetText('#indStepProgressLabel', `Step ${step} of ${totalSteps}`);
        
        try {
            const progressBar = $w('#indWizardProgressBar');
            if (progressBar) progressBar.targetValue = (step / totalSteps) * 100;
        } catch (e) {}

        // Step Box Visibility
        ['#boxIndStep1', '#boxIndStep2', '#boxIndStep3', '#boxIndStep4'].forEach((sel, idx) => {
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
            safeHide('#btnIndPrev');
        } else {
            safeShow('#btnIndPrev');
        }

        if (step === totalSteps) {
            safeSetText('#btnIndNext', 'Finish Cosigner Packet');
        } else {
            safeSetText('#btnIndNext', 'Continue →');
        }
    }

    function populateFields() {
        // Step 1: Relationship to Defendant
        safeSetValue('#inputRelationship', person.household?.maritalStatus || 'Family/Friend');
        safeSetValue('#inputYearsKnown', person.addresses?.[0]?.howLong || '3+ years');

        // Step 2: Homeownership & Household
        safeSetValue('#dropdownHomeownership', person.household?.residentialStatus || 'Rent');
        safeSetValue('#inputSpouseName', person.household?.spouseName || '');

        // Step 3: Employment & Income
        safeSetValue('#inputIndEmployer', person.employment?.employer || '');
        safeSetValue('#inputIndMonthlyIncome', person.employment?.monthlyIncome || '');
        safeSetValue('#inputIndWorkPhone', person.employment?.phone || '');

        // Step 4: References
        safeSetValue('#inputRef1Name', person.references?.[0]?.name || '');
        safeSetValue('#inputRef1Phone', person.references?.[0]?.phone || '');
        safeSetValue('#inputRef1Relation', person.references?.[0]?.relationship || 'Family');
        safeSetValue('#inputRef2Name', person.references?.[1]?.name || '');
        safeSetValue('#inputRef2Phone', person.references?.[1]?.phone || '');
        safeSetValue('#inputRef2Relation', person.references?.[1]?.relationship || 'Friend');
    }

    function harvestCurrentStepData() {
        if (currentStep === 1) {
            person.household.maritalStatus = safeGetValue('#inputRelationship') || 'Family/Friend';
            if (person.addresses[0]) person.addresses[0].howLong = safeGetValue('#inputYearsKnown');
        } else if (currentStep === 2) {
            person.household.residentialStatus = safeGetValue('#dropdownHomeownership') || 'Rent';
            person.household.spouseName = safeGetValue('#inputSpouseName');
        } else if (currentStep === 3) {
            person.employment.employer = safeGetValue('#inputIndEmployer');
            person.employment.monthlyIncome = safeGetValue('#inputIndMonthlyIncome');
            person.employment.phone = safeGetValue('#inputIndWorkPhone');
        } else if (currentStep === 4) {
            person.references = [
                {
                    name: safeGetValue('#inputRef1Name'),
                    phone: safeGetValue('#inputRef1Phone'),
                    relationship: safeGetValue('#inputRef1Relation') || 'Family',
                    address: safeGetValue('#inputRef1Address') || ''
                },
                {
                    name: safeGetValue('#inputRef2Name'),
                    phone: safeGetValue('#inputRef2Phone'),
                    relationship: safeGetValue('#inputRef2Relation') || 'Friend',
                    address: safeGetValue('#inputRef2Address') || ''
                }
            ];
        }

        if (isCoSigner) canonicalCase.coIndemnitor = person;
        else canonicalCase.indemnitor = person;
    }

    async function triggerDraftSave() {
        harvestCurrentStepData();
        if (sessionToken) {
            await saveWizardDraft({
                sessionToken,
                role,
                currentStep,
                canonicalCase
            });
        }
    }

    function bindEvents() {
        // Next Step Button
        safeOnClick('#btnIndNext', async () => {
            harvestCurrentStepData();
            await triggerDraftSave();

            if (currentStep < totalSteps) {
                renderStep(currentStep + 1);
            } else {
                console.log(`✅ [${role} Wizard] Completed all steps!`);
                if (typeof options.onComplete === 'function') {
                    options.onComplete(canonicalCase);
                }
            }
        });

        // Previous Step Button
        safeOnClick('#btnIndPrev', async () => {
            if (currentStep > 1) {
                harvestCurrentStepData();
                await triggerDraftSave();
                renderStep(currentStep - 1);
            }
        });
    }

    // Helpers
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
    initIndemnitorWizard
};
