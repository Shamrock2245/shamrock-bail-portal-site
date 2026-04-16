# Premium Twilio Opt-In Assets

Here are the code snippets tailored for the premium Shamrock brand, mobile optimization, and linking the new `Persons` consent record to a `Cases` record.

## 1. The HTML Code (Custom Element / Embed)

Paste this into the HTML Settings box on the Wix editor:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Communication Preferences</title>
    <!-- Premium Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #1a365d; /* Sophisticated Trust Blue */
            --accent-color: #10b981; /* Emerald Green */
            --bg-glass: rgba(255, 255, 255, 0.85);
            --text-main: #1f2937;
            --text-muted: #6b7280;
            --border-color: rgba(209, 213, 219, 0.6);
            --focus-ring: rgba(16, 185, 129, 0.3);
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: transparent;
            margin: 0;
            padding: 8px; /* Slightly reduced for better mobile fit */
            color: var(--text-main);
            box-sizing: border-box;
        }

        .container {
            max-width: 500px;
            margin: 0 auto;
            background: var(--bg-glass);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 24px;
            box-sizing: border-box;
            border: 1px solid rgba(255,255,255,0.4);
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        h2 {
            margin-top: 0;
            font-size: 24px;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }

        p.subtitle {
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 24px;
            line-height: 1.5;
        }

        .form-row {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }
        
        .form-group {
            flex: 1;
            margin-bottom: 16px;
        }

        .form-row .form-group {
            margin-bottom: 0; /* Reset for flex row */
        }

        @media (max-width: 480px) {
            .form-row {
                flex-direction: column;
                gap: 16px;
            }
            .form-row .form-group {
                margin-bottom: 0; /* Let gap handle spacing */
            }
        }

        label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input[type="text"],
        input[type="tel"],
        input[type="email"] {
            width: 100%;
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            font-family: 'Outfit', sans-serif;
            font-size: 16px; /* Best size to prevent iOS auto-zoom */
            color: var(--text-main);
            box-sizing: border-box;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        input::placeholder {
            color: #9ca3af;
        }

        input:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 4px var(--focus-ring);
            background: #ffffff;
            transform: translateY(-1px);
        }

        .checkbox-container {
            background: linear-gradient(145deg, #f8fafc, #f1f5f9);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            transition: all 0.3s ease;
        }

        .checkbox-container:hover {
            border-color: #cbd5e1;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .checkbox-wrapper {
            display: flex;
            align-items: flex-start;
            position: relative;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
        }

        .checkbox-wrapper input[type="checkbox"] {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
        }

        .checkmark {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 24px;
            width: 24px;
            background-color: #fff;
            border: 2px solid #cbd5e1;
            border-radius: 6px;
            margin-right: 14px;
            margin-top: 2px;
            flex-shrink: 0;
            transition: all 0.2s ease;
        }

        .checkbox-wrapper:hover input ~ .checkmark {
            border-color: #94a3b8;
        }

        .checkbox-wrapper input:checked ~ .checkmark {
            background-color: var(--accent-color);
            border-color: var(--accent-color);
        }

        .checkmark:after {
            content: "";
            position: absolute;
            display: none;
            width: 6px;
            height: 12px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
            margin-top: -2px;
        }

        .checkbox-wrapper input:checked ~ .checkmark:after {
            display: block;
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes popIn {
            0% { transform: rotate(45deg) scale(0); }
            100% { transform: rotate(45deg) scale(1); }
        }

        .checkbox-text {
            flex: 1;
        }

        .checkbox-label {
            font-size: 15px;
            font-weight: 600;
            color: var(--primary-color);
            display: block;
            margin-bottom: 4px;
        }

        .checkbox-subtext {
            font-size: 13px;
            color: var(--text-muted);
            line-height: 1.4;
            display: block;
        }

        .disclaimer {
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.6;
            margin-bottom: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--border-color);
        }

        button {
            width: 100%;
            background: linear-gradient(135deg, var(--accent-color), #059669);
            color: white;
            border: none;
            padding: 16px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: 'Outfit', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1);
            position: relative;
            overflow: hidden;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.1);
        }

        button:active {
            transform: translateY(1px);
        }

        button.loading {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        /* Spinner for loading state */
        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin: 0 auto;
            position: absolute;
            left: 50%;
            top: 50%;
            margin-left: -10px;
            margin-top: -10px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        button.loading .btn-text {
            opacity: 0;
        }
        button.loading .spinner {
            display: block;
        }

        .success-message {
            display: none;
            text-align: center;
            padding: 40px 20px;
        }

        .success-icon-wrapper {
            width: 64px;
            height: 64px;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .success-icon {
            color: var(--accent-color);
            font-size: 32px;
        }

        @keyframes scaleIn {
            0% { transform: scale(0); }
            100% { transform: scale(1); }
        }

        .error-message {
            display: none;
            color: #ef4444;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            margin-top: 12px;
            padding: 8px;
            background: #fef2f2;
            border-radius: 6px;
            border: 1px solid #fecaca;
        }

        /* Twilio Required "Required" mark */
        .required-mark {
            color: #ef4444;
            margin-left: 2px;
        }
    </style>
</head>
<body>

    <div class="container" id="formContainer">
        <h2>Communication Preferences</h2>
        <p class="subtitle">Securely link your contact info to your case to receive urgent updates and paperwork.</p>

        <form id="preferencesForm">
            
            <div class="form-row">
                <div class="form-group">
                    <label for="firstName">First Name <span class="required-mark">*</span></label>
                    <input type="text" id="firstName" required placeholder="John">
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name <span class="required-mark">*</span></label>
                    <input type="text" id="lastName" required placeholder="Doe">
                </div>
            </div>

            <div class="form-group">
                <label for="phone">Mobile Phone Number <span class="required-mark">*</span></label>
                <input type="tel" id=" phone" required placeholder="(555) 555-5555">
            </div>

            <div class="form-group">
                <label for="email">Email Address <span style="font-weight: normal; color: #9ca3af; text-transform: none;">(Optional)</span></label>
                <input type="email" id="email" placeholder="john@example.com">
            </div>

            <!-- New Field to Link to "Cases" Collection -->
            <div class="form-group">
                <label for="caseNumber">Case / Booking Number <span style="font-weight: normal; color: #9ca3af; text-transform: none;">(Optional)</span></label>
                <input type="text" id="caseNumber" placeholder="E.g. 240001234">
            </div>

            <label style="margin-top: 24px;">SMS Consent <span class="required-mark">*</span></label>
            <div class="checkbox-container">
                <label class="checkbox-wrapper">
                    <input type="checkbox" id="smsConsent" required>
                    <div class="checkmark"></div>
                    <div class="checkbox-text">
                        <span class="checkbox-label">Yes, send me SMS alerts</span>
                        <span class="checkbox-subtext">I consent to receive urgent court date updates and secure paperwork links via text message.</span>
                    </div>
                </label>
            </div>

            <div class="disclaimer">
                By checking the box and submitting this form, you explicitly consent to receive transactional and informational text messages from Shamrock Bail Bonds. Message frequency varies based on your case status. Message and data rates may apply. Reply STOP at any time to opt out, or HELP for assistance. Your phone number is never shared with third parties for marketing purposes.
            </div>

            <button type="submit" id="submitBtn">
                <span class="btn-text">Save Preferences</span>
                <div class="spinner"></div>
            </button>
            <div id="errorMsg" class="error-message">Connection error. Please try again.</div>
        </form>
    </div>

    <!-- Hidden Success State -->
    <div class="container success-message" id="successContainer">
        <div class="success-icon-wrapper">
            <div class="success-icon">✓</div>
        </div>
        <h2>Preferences Saved</h2>
        <p class="subtitle">Thank you. Your communication preferences have been securely updated and linked to your file.</p>
    </div>

    <script>
        document.getElementById('preferencesForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // UI Loading State
            const submitBtn = document.getElementById('submitBtn');
            const errorMsg = document.getElementById('errorMsg');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            errorMsg.style.display = 'none';

            // Gather Data
            const payload = {
                type: 'save_consent',
                data: {
                    firstName: document.getElementById('firstName').value.trim(),
                    lastName: document.getElementById('lastName').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    caseNumber: document.getElementById('caseNumber').value.trim(),
                    optIn: document.getElementById('smsConsent').checked
                }
            };

            // Post to Wix
            window.parent.postMessage(payload, '*');
        });

        // Listen for response from Wix Velo
        window.addEventListener('message', function(event) {
            if (event.data === 'success') {
                document.getElementById('formContainer').style.display = 'none';
                document.getElementById('successContainer').style.display = 'block';
            } else if (event.data === 'error') {
                const submitBtn = document.getElementById('submitBtn');
                const errorMsg = document.getElementById('errorMsg');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                errorMsg.style.display = 'block';
            }
        });
    </script>
</body>
</html>
```

## 2. Wix Velo Code (Backend Hook-Up)

Paste this into the code panel for the page containing the HTML element. Update `#html1` if your HTML element has a different ID.

```javascript
import wixData from 'wix-data';

$w.onReady(function () {
    // Listen for the postMessage payload from inside the HTML Embed
    $w("#html1").onMessage((event) => {
        let message = event.data;
        
        if (message.type === 'save_consent') {
            const formData = message.data;
            processConsentData(formData);
        }
    });
});

async function processConsentData(data) {
    try {
        let personRecord;
        let isNewPerson = false;
        
        // Clean the phone number for matching
        const cleanPhone = data.phone.replace(/\D/g, ''); 
        
        // 1. Find Existing Person or Prepare New One
        const existingPersonsResponse = await wixData.query("Persons")
            .contains("phone", cleanPhone) 
            .find();
            
        if (existingPersonsResponse.items.length > 0) {
            personRecord = existingPersonsResponse.items[0];
            personRecord.firstName = data.firstName;
            personRecord.lastName = data.lastName;
            if (data.email) personRecord.email = data.email;
            personRecord.smsConsent = data.optIn; 
        } else {
            isNewPerson = true;
            personRecord = {
                "title": `${data.firstName} ${data.lastName}`,
                "firstName": data.firstName,
                "lastName": data.lastName,
                "phone": data.phone,
                "email": data.email,
                "smsConsent": data.optIn
            };
        }

        // 2. Link to Cases Collection (If caseNumber provided)
        let linkedCase = null;
        if (data.caseNumber && data.caseNumber.trim() !== '') {
            const caseQuery = await wixData.query("Import2") // Change "Import2" to "Cases" if that is your Collection ID!
                .eq("bookingNumber", data.caseNumber)
                .or(wixData.query("Import2").eq("caseId", data.caseNumber))
                .find();
                
            if (caseQuery.items.length > 0) {
                linkedCase = caseQuery.items[0];
                // Update the Reference field pointing to the Case
                personRecord.caseReference = linkedCase._id; 
                console.log("Found matching case to link.");
            } else {
                 console.log("Case Number provided, but not found in the database. Saved Person regardless.");
            }
        }

        // 3. Save the Person (Now with the reference attached if applicable)
        let savedPerson;
        if (isNewPerson) {
            savedPerson = await wixData.insert("Persons", personRecord);
            console.log("New person created successfully.");
        } else {
            savedPerson = await wixData.update("Persons", personRecord);
            console.log("Person updated successfully.");
        }

        // 4. Update the Case to include this Person as an Indemnitor (Two-way link)
        if (linkedCase) {
             if (!linkedCase.indemnitorPersonIds) {
                 linkedCase.indemnitorPersonIds = [];
             }
             if (linkedCase.defendantPersonId !== savedPerson._id && 
                 !linkedCase.indemnitorPersonIds.includes(savedPerson._id)) {
                     
                 linkedCase.indemnitorPersonIds.push(savedPerson._id);
                 await wixData.update("Import2", linkedCase); // Change "Import2" to "Cases" if that is your Collection ID!
                 console.log("Added person to Case indemnitors.");
             }
        }

        // Send success back to the HTML UI
        $w("#html1").postMessage("success");
        
    } catch (error) {
        console.error("Consent processing failed:", error);
        $w("#html1").postMessage("error");
    }
}
```

## 3. CSV Template for Persons Collection

You can use this to quickly initialize the schema in Wix CMS if you don't have it set up. This introduces the `smsConsent` and `caseReference` fields.

```csv
title,firstName,lastName,phone,email,smsConsent,caseReference
"John Doe","John","Doe","(555) 555-5555","john@example.com",TRUE,"240001234"
```
