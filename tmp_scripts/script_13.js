
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
    