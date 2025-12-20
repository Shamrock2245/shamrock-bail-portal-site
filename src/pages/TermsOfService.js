/**
 * Terms of Service Page
 * Filename: pages/TermsOfService.js
 * 
 * Terms of service page for Shamrock Bail Bonds.
 * 
 * Page Elements:
 * - #termsTitle: Page title
 * - #lastUpdated: Last updated date
 * - #termsContent: Main content container
 */

import wixSeo from 'wix-seo';

$w.onReady(function () {
    setupSEO();
    renderContent();
});

/**
 * Set up SEO
 */
function setupSEO() {
    wixSeo.setTitle('Terms of Service | Shamrock Bail Bonds');
    wixSeo.setMetaDescription('Read the terms of service for Shamrock Bail Bonds. Understand your rights and responsibilities when using our bail bond services.');
}

/**
 * Render terms content
 */
function renderContent() {
    $w('#termsTitle').text = 'Terms of Service';
    $w('#lastUpdated').text = 'Last Updated: December 19, 2024';
    
    const content = `
## Agreement to Terms

By accessing or using the Shamrock Bail Bonds website (shamrockbailbonds.biz) and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

## Bail Bond Services

### Service Description
Shamrock Bail Bonds provides bail bond services throughout the State of Florida. We act as a surety, guaranteeing the defendant's appearance in court in exchange for a non-refundable premium.

### Premium and Fees
- The bail bond premium in Florida is regulated and typically set at 10% of the total bail amount
- The premium is non-refundable regardless of case outcome
- Additional fees may apply for certain services, which will be disclosed before you agree to them
- Payment plans may be available subject to approval

### Collateral
- Collateral may be required to secure the bail bond
- Acceptable forms of collateral will be discussed during the application process
- Collateral is returned upon successful completion of all court obligations and bond exoneration

## Indemnitor Responsibilities

As an indemnitor (co-signer) on a bail bond, you agree to:

1. **Ensure Court Appearances**: Guarantee that the defendant appears at all scheduled court dates
2. **Maintain Contact**: Keep in regular contact with the defendant and notify us immediately if you cannot locate them
3. **Financial Responsibility**: Be financially responsible for the full bail amount if the defendant fails to appear
4. **Provide Accurate Information**: Provide truthful and accurate information throughout the process
5. **Notify of Changes**: Inform us immediately of any changes in the defendant's address, employment, or circumstances
6. **Cooperate**: Cooperate fully with our efforts to locate the defendant if they fail to appear

## Defendant Obligations

Defendants released on bail must:

1. Appear at all scheduled court dates
2. Comply with all conditions of release set by the court
3. Not leave the jurisdiction without court permission
4. Avoid any new arrests or criminal activity
5. Maintain contact with the indemnitor and bail agent
6. Notify us of any address or contact information changes

## Website Use

### Account Registration
- You must provide accurate and complete information when creating an account
- You are responsible for maintaining the confidentiality of your account credentials
- You must notify us immediately of any unauthorized use of your account

### Prohibited Activities
You agree not to:
- Use the website for any unlawful purpose
- Attempt to gain unauthorized access to our systems
- Interfere with the proper functioning of the website
- Submit false or misleading information
- Impersonate any person or entity

### Intellectual Property
All content on this website, including text, graphics, logos, and software, is the property of Shamrock Bail Bonds and is protected by copyright and trademark laws.

## Electronic Signatures

By using our online bail process and SignNow integration, you agree that:
- Electronic signatures are legally binding
- You consent to conduct business electronically
- Documents signed electronically have the same legal effect as physical signatures

## Limitation of Liability

To the maximum extent permitted by law:
- Shamrock Bail Bonds is not liable for any indirect, incidental, or consequential damages
- Our total liability shall not exceed the amount of premium paid
- We are not responsible for actions of defendants after release

## Disclaimer of Warranties

Our services are provided "as is" without warranties of any kind. We do not guarantee:
- Specific release times from jail facilities
- Court outcomes
- Defendant behavior after release

## Indemnification

You agree to indemnify and hold harmless Shamrock Bail Bonds, its officers, employees, and agents from any claims, damages, or expenses arising from:
- Your use of our services
- Your violation of these terms
- The defendant's failure to appear or comply with bail conditions

## Governing Law

These Terms of Service are governed by the laws of the State of Florida. Any disputes shall be resolved in the courts of Lee County, Florida.

## Changes to Terms

We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the modified terms.

## Severability

If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

## Contact Information

For questions about these Terms of Service:

**Shamrock Bail Bonds**
Phone: 239-332-2245
Email: admin@shamrockbailbonds.biz
Website: shamrockbailbonds.biz

## Regulatory Information

Shamrock Bail Bonds is licensed by the Florida Department of Financial Services. We comply with all applicable Florida statutes and regulations governing bail bond agents.
    `;
    
    $w('#termsContent').text = content;
}
