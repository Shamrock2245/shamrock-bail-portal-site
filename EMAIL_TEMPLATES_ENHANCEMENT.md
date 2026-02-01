# Email Templates - Payment Link Integration

## Overview
This document outlines the required updates to Wix Triggered Email templates to include the SwipeSimple payment link.

**Payment Link:** `https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd`

---

## Templates Requiring Updates

### 1. `paperworkReadyToSign` (Paperwork Ready)

**Subject:** Your Bail Bond Paperwork is Ready to Sign

**Body Enhancement:**
```html
<p>Hi {{memberName}},</p>

<p>Your bail bond paperwork for <strong>{{defendantName}}</strong> is now ready for your signature.</p>

<p style="margin: 20px 0;">
  <a href="{{signingLink}}" style="background-color: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
    Sign Documents Now
  </a>
</p>

<p><strong>Next Steps:</strong></p>
<ol>
  <li>Click the button above to review and sign the documents</li>
  <li>Complete payment to finalize the bond</li>
  <li>We'll process your bond immediately upon completion</li>
</ol>

<p style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #2ecc71;">
  <strong>💳 Make Payment:</strong><br>
  <a href="https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd" style="color: #2ecc71; font-weight: bold;">
    Click here to pay your bail bond premium securely
  </a><br>
  <small style="color: #666;">Secure payment powered by SwipeSimple</small>
</p>

<p>Questions? Contact us at (239) 332-2245 or reply to this email.</p>

<p>Thank you for choosing Shamrock Bail Bonds.</p>
```

---

### 2. `paperworkSentForSignature` (Paperwork Sent)

**Subject:** Documents Sent for Signature - {{caseNumber}}

**Body Enhancement:**
```html
<p>Hi {{memberName}},</p>

<p>We've sent your bail bond documents for <strong>{{defendantName}}</strong> for electronic signature.</p>

<p style="margin: 20px 0;">
  <a href="{{signingLink}}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
    Review & Sign Documents
  </a>
</p>

<p><strong>Document Details:</strong></p>
<ul>
  <li>Case Number: {{caseNumber}}</li>
  <li>Defendant: {{defendantName}}</li>
  <li>Bond Amount: ${{bondAmount}}</li>
  <li>Premium: ${{premium}}</li>
</ul>

<p style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid: #ffc107;">
  <strong>⚡ Complete Payment:</strong><br>
  <a href="https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd" style="color: #856404; font-weight: bold;">
    Pay your premium now to expedite processing
  </a><br>
  <small style="color: #856404;">Payment can be made before, during, or after signing</small>
</p>

<p>Need assistance? Call us at (239) 332-2245.</p>
```

---

### 3. `bailPaperworkComplete` (Paperwork Complete)

**Subject:** ✅ Paperwork Signed - Final Payment Required

**Body Enhancement:**
```html
<p>Hi {{memberName}},</p>

<p>Thank you for signing the bail bond documents for <strong>{{defendantName}}</strong>!</p>

<p style="margin: 20px 0; padding: 15px; background-color: #d4edda; border-left: 4px solid #28a745; color: #155724;">
  <strong>✅ Documents Signed Successfully</strong><br>
  Your signature has been received and verified.
</p>

<p><strong>Final Step - Complete Payment:</strong></p>

<p style="margin: 30px 0; padding: 25px; background-color: #f8f9fa; border: 2px solid #28a745; border-radius: 8px; text-align: center;">
  <strong style="font-size: 18px; color: #28a745;">💳 Premium Due: ${{premium}}</strong><br><br>
  <a href="https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">
    Pay Now - Secure Payment
  </a><br>
  <small style="color: #666; margin-top: 10px; display: block;">We'll process your bond immediately upon payment</small>
</p>

<p><strong>Payment Options:</strong></p>
<ul>
  <li>Credit/Debit Card (online - instant)</li>
  <li>Cash or Check (in-office)</li>
  <li>Payment Plan (call to arrange)</li>
</ul>

<p>Questions about payment? Call us at (239) 332-2245.</p>

<p>Thank you for trusting Shamrock Bail Bonds!</p>
```

---

## Implementation Steps

### Step 1: Access Wix Dashboard
1. Go to `https://www.wix.com/my-account/site-selector`
2. Select "Shamrock Bail Bonds" site
3. Navigate to **Marketing & SEO** → **Triggered Emails**

### Step 2: Update Each Template
For each template listed above:
1. Click **Edit** on the template
2. Update the HTML body with the enhanced version above
3. Add the payment link section
4. **Test** the template with sample data
5. **Publish** the changes

### Step 3: Verify Variables
Ensure these variables are available in each template:
- `{{memberName}}`
- `{{defendantName}}`
- `{{caseNumber}}`
- `{{bondAmount}}`
- `{{premium}}`
- `{{signingLink}}`

### Step 4: Test End-to-End
1. Create a test case in the system
2. Trigger each email notification
3. Verify payment link appears and works
4. Confirm link opens SwipeSimple payment page

---

## Additional Enhancements

### Mobile Optimization
All payment buttons use responsive design:
- Large touch targets (15px+ padding)
- High contrast colors
- Clear call-to-action text

### Security Notes
- Payment link is HTTPS encrypted
- SwipeSimple is PCI-DSS compliant
- No sensitive data in email body

### Tracking (Optional)
Consider adding UTM parameters to track email conversions:
```
https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd?utm_source=email&utm_medium=triggered&utm_campaign=paperwork_complete
```

---

## Status

- ✅ SMS Templates - Payment link already integrated
- ⏳ Email Templates - Requires manual update in Wix Dashboard
- ⏳ Wix Portal Button - Requires verification

**Next:** Verify "Make Payment" button in Wix portal is wired correctly.
