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

    const indemnitorHtml = `
        <div class="entity-card indemnitor" id="indemnitor-${indemnitorCount}">
          <div class="entity-header">
            <h4>
              <span class="entity-number" style="background: var(--success);">${indemnitorCount}</span>
              Indemnitor ${indemnitorCount}
            </h4>
            <button class="btn-remove" onclick="removeIndemnitor(${indemnitorCount})">×</button>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="required">First Name</label>
              <input type="text" id="indemnitor-${indemnitorCount}-first" placeholder="Jane" value="${data.firstName || ''}">
            </div>
            <div class="form-group">
              <label>Middle Name</label>
              <input type="text" id="indemnitor-${indemnitorCount}-middle" placeholder="Marie" value="${data.middleName || ''}">
            </div>
            <div class="form-group">
              <label class="required">Last Name</label>
              <input type="text" id="indemnitor-${indemnitorCount}-last" placeholder="Smith" value="${data.lastName || ''}">
            </div>
            <div class="form-group">
              <label>Relationship</label>
              <select id="indemnitor-${indemnitorCount}-relationship">
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="employer">Employer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Date of Birth</label>
              <input type="date" id="indemnitor-${indemnitorCount}-dob" value="${data.dob || ''}">
            </div>
            <div class="form-group">
              <label>SSN (Last 4)</label>
              <input type="text" id="indemnitor-${indemnitorCount}-ssn" placeholder="XXXX" maxlength="4" value="${data.ssn || ''}">
            </div>
            <div class="form-group">
              <label>Driver's License #</label>
              <input type="text" id="indemnitor-${indemnitorCount}-dl" placeholder="D123-456-78-901" value="${data.dl || ''}">
            </div>
            <div class="form-group">
              <label>DL State</label>
              <select id="indemnitor-${indemnitorCount}-dl-state">
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="AL">Alabama</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="grid-column: span 2;">
              <label>Street Address</label>
              <input type="text" id="indemnitor-${indemnitorCount}-address" placeholder="456 Oak Street" value="${data.address || ''}">
            </div>
            <div class="form-group">
              <label>City</label>
              <input type="text" id="indemnitor-${indemnitorCount}-city" placeholder="Fort Myers" value="${data.city || ''}">
            </div>
            <div class="form-group">
              <label>ZIP</label>
              <input type="text" id="indemnitor-${indemnitorCount}-zip" placeholder="33901" value="${data.zip || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" id="indemnitor-${indemnitorCount}-phone" placeholder="(239) 555-5678" value="${data.phone || ''}">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="indemnitor-${indemnitorCount}-email" placeholder="indemnitor@email.com" value="${data.email || ''}">
            </div>
            <div class="form-group">
              <label>Employer</label>
              <input type="text" id="indemnitor-${indemnitorCount}-employer" placeholder="ABC Company" value="${data.employer || ''}">
            </div>
            <div class="form-group">
              <label>Employer Phone</label>
              <input type="tel" id="indemnitor-${indemnitorCount}-employer-phone" placeholder="(239) 555-9999" value="${data.employerPhone || ''}">
            </div>
          </div>
        </div>
      `;

    container.insertAdjacentHTML('beforeend', indemnitorHtml);
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
            employerPhone: document.getElementById(`indemnitor-${num}-employer-phone`)?.value || ''
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
async function addSignatureFields(documentId, selectedDocs) {
    // Build combined fields array with adjusted page numbers for merged PDF
    const allFields = [];
    let pageOffset = 0;

    for (const doc of selectedDocs) {
        const docFields = CONFIG.signatureFields[doc.key] || [];

        // Add each field with adjusted page number for the merged PDF
        docFields.forEach((field, idx) => {
            allFields.push({
                type: field.type,
                required: true,
                role: field.role,
                name: `${doc.key}-${field.type}-${idx}`,
                page_number: pageOffset + field.page_number,
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height
            });
        });

        // Get page count for this document (we'll need to track this)
        // For now, use the page counts from our known documents
        const pageCounts = {
            'paperwork-header': 1,
            'faq-cosigners': 2,
            'faq-defendants': 2,
            'indemnity-agreement': 1,
            'defendant-application': 2,
            'promissory-note': 1,
            'disclosure-form': 1,
            'surety-terms': 1,
            'master-waiver': 4,
            'ssa-release': 1,
            'collateral-receipt': 1,
            'payment-plan': 4
        };
        pageOffset += pageCounts[doc.key] || 1;
    }

    if (allFields.length === 0) {
        console.log('No signature fields to add');
        return { success: true, fieldsAdded: 0 };
    }

    console.log(`Adding ${allFields.length} signature/initials fields to document ${documentId}`);
    console.log('Fields:', allFields);

    try {
        const result = await callGAS('addSignatureFields', {
            documentId: documentId,
            fields: allFields
        });

        if (result.success) {
            console.log('SignNow add fields result:', result);
            return {
                success: true,
                fieldsAdded: allFields.length,
                roles: result.roles || []
            };
        } else {
            throw new Error(result.error || 'Failed to add signature fields');
        }
    } catch (err) {
        console.error('Error adding signature fields:', err);
        throw err;
    }
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
