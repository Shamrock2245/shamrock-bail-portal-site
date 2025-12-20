/**
 * Privacy Policy Page
 * Filename: pages/PrivacyPolicy.js
 * 
 * Privacy policy page for Shamrock Bail Bonds.
 * 
 * Page Elements:
 * - #policyTitle: Page title
 * - #lastUpdated: Last updated date
 * - #policyContent: Main content container
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
    wixSeo.setTitle('Privacy Policy | Shamrock Bail Bonds');
    wixSeo.setMetaDescription('Read the privacy policy for Shamrock Bail Bonds. Learn how we collect, use, and protect your personal information.');
}

/**
 * Render privacy policy content
 */
function renderContent() {
    $w('#policyTitle').text = 'Privacy Policy';
    $w('#lastUpdated').text = 'Last Updated: December 19, 2024';
    
    const content = `
## Introduction

Shamrock Bail Bonds ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website shamrockbailbonds.biz or use our services.

## Information We Collect

### Personal Information
We may collect personal information that you voluntarily provide, including:
- Full name
- Contact information (email address, phone number, mailing address)
- Date of birth
- Government-issued identification
- Financial information for payment processing
- Information about the defendant (for bail bond services)

### Automatically Collected Information
When you visit our website, we automatically collect:
- IP address
- Browser type and version
- Device information
- Pages visited and time spent
- Referring website
- Geographic location (with your consent)

### Location Information
With your explicit consent, we collect precise location data when you use our online bail services. This is required for identity verification and compliance with Florida bail bond regulations.

## How We Use Your Information

We use the information we collect to:
- Process bail bond applications and services
- Verify your identity
- Communicate with you about your case
- Process payments
- Comply with legal obligations
- Improve our website and services
- Send important updates about your bail bond
- Respond to your inquiries

## Information Sharing

We may share your information with:
- **Courts and Law Enforcement**: As required for bail bond processing
- **Insurance Companies**: Our surety providers
- **Service Providers**: Third parties who assist in our operations (payment processors, document signing services)
- **Legal Requirements**: When required by law or to protect our rights

We do NOT sell your personal information to third parties.

## Data Security

We implement appropriate security measures to protect your personal information, including:
- SSL encryption for data transmission
- Secure storage systems
- Access controls and authentication
- Regular security assessments

## Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Request deletion of your information (subject to legal retention requirements)
- Opt out of marketing communications
- Withdraw consent for location tracking

## Cookies and Tracking

Our website uses cookies and similar technologies to:
- Remember your preferences
- Analyze website traffic
- Improve user experience

You can control cookies through your browser settings.

## Third-Party Services

Our website may contain links to third-party websites. We are not responsible for their privacy practices. We use the following third-party services:
- SignNow (document signing)
- Google Analytics (website analytics)
- Payment processors

## Children's Privacy

Our services are not intended for individuals under 18 years of age. We do not knowingly collect information from minors.

## Changes to This Policy

We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy on our website with an updated effective date.

## Contact Us

If you have questions about this Privacy Policy or our privacy practices, please contact us:

**Shamrock Bail Bonds**
Phone: 239-332-2245
Email: admin@shamrockbailbonds.biz
Website: shamrockbailbonds.biz

## California Privacy Rights

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect and the right to request deletion.

## Florida-Specific Disclosures

As a Florida-licensed bail bond agency, we are required to maintain certain records and may be subject to audits by the Florida Department of Financial Services. Your information may be retained as required by Florida law.
    `;
    
    $w('#policyContent').text = content;
}
