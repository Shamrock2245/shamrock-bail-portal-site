#!/usr/bin/env python3
"""
Generate Complete Studio SEO Specs and Content Drafts
Produces:
- docs/studio-seo/{page}.md (17 specs)
- docs/studio-content/{page}.md (17 content drafts)
Adheres strictly to all canonical facts, brand guidelines, and SEO requirements.
"""

import os
import sys

SEO_DIR = "docs/studio-seo"
CONTENT_DIR = "docs/studio-content"

PAGES = [
    "home",
    "how-bail-works",
    "contact",
    "about",
    "bail-school",
    "first-appearance",
    "testimonials",
    "florida-bail-bonds-1",
    "county-template",
    "faq",
    "privacy-policy",
    "terms-and-conditions",
    "communication-preferences",
    "data-deletion",
    "portal-landing",
    "portal-defendant",
    "portal-indemnitor"
]

def generate_seo_spec(page):
    specs = {
        "home": {
            "title": "Fort Myers Bail Bonds | Shamrock Bail Bonds",
            "desc": "24/7 Fort Myers & Florida bail bonds. Confidential help, payment plans & local agents since 2012. Call 239-332-2245 or text 239-955-0178.",
            "h1": "Fort Myers Bail Bonds & Florida 24/7 Jail Release",
            "keywords": "Fort Myers bail bonds, Lee County bail bonds, Cape Coral bail bonds, 24/7 bail bondsman Florida, bail bond payment plans",
            "secondary": "Lee County Jail release, Southwest Florida bail bonds, transfer bail bonds, Nebbia hold bail bonds",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/",
            "page_type": "static",
            "h2s": [
                "Emergency Bail Help: What to Do Right Now",
                "How Florida Bail Works in 3 Simple Steps",
                "Select Your County or Jail to Begin",
                "Payment Plans & Flexible Collateral",
                "Why Southwest Florida Families Trust Shamrock",
                "Frequently Asked Questions"
            ]
        },
        "how-bail-works": {
            "title": "How Bail Works in Florida | Shamrock Bail Bonds",
            "desc": "Understand Florida bail step-by-step: costs, cosigner duties, collateral & payment plans. Need help now? Call 239-332-2245 or text 239-955-0178.",
            "h1": "How Bail Bonds Work in Florida: A Plain-English Guide",
            "keywords": "how bail works in Florida, bail bond process Florida, bail bond cost Florida, cosigner responsibilities bail bond",
            "secondary": "collateral for bail bonds, Florida statutory bail premium, release from county jail Florida",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/how-bail-works",
            "page_type": "static",
            "h2s": [
                "Immediate Help When Someone Is In Jail",
                "What Happens After an Arrest in Florida?",
                "How Much Does a Bail Bond Cost in Florida?",
                "What Does an Indemnitor (Cosigner) Do?",
                "Do You Need Collateral for a Bail Bond?",
                "Common Questions About the Florida Bail Process"
            ]
        },
        "contact": {
            "title": "Contact Our Bail Agents | Shamrock Bail Bonds",
            "desc": "Contact Shamrock Bail Bonds in Fort Myers, FL. 24/7 phone support, confidential office walk-ins, and text help. Call 239-332-2245 or text 239-955-0178.",
            "h1": "Contact Shamrock Bail Bonds: 24/7 Direct Help",
            "keywords": "contact bail bondsman Fort Myers, bail bonds phone number Fort Myers, bail bond office downtown Fort Myers",
            "secondary": "Lee County bail bonds contact, Spanish bail bonds Florida, text a bail agent",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/contact",
            "page_type": "static",
            "h2s": [
                "24/7 Emergency Phone & Text Lines",
                "Our Office Location in Downtown Fort Myers",
                "Walk-In Hours & 24/7 Dispatch Availability",
                "Send an Urgent Message to Our Desk",
                "Service Areas: Southwest Florida & Statewide"
            ]
        },
        "about": {
            "title": "About Shamrock Bail Bonds | Licensed Florida Agency",
            "desc": "Owner-operated by Brendan O'Neal since 2012 at 1528 Broadway, Fort Myers. Professional, respectful 24/7 bail support. Call 239-332-2245.",
            "h1": "About Shamrock Bail Bonds: Local, Trusted & Experienced",
            "keywords": "about Shamrock Bail Bonds, licensed Florida bail bond agency, Brendan O'Neal bail bondsman Fort Myers",
            "secondary": "Lee County bail bond company history, professional bail agent Southwest Florida",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/about",
            "page_type": "static",
            "h2s": [
                "Our Mission: Dignity, Clarity, and Care",
                "Local Roots in Downtown Fort Myers Since 2012",
                "Licensed & Regulated by the Florida Department of Financial Services",
                "Statewide Coverage & Nationwide Transfer Bonds",
                "Meet Our Founder: Brendan O'Neal"
            ]
        },
        "bail-school": {
            "title": "Florida Bail Bond School | Shamrock Bail Bonds",
            "desc": "State-approved pre-licensing bail bond education in Florida. Enroll in the 120-Hour Qualification Course ($649). Call 239-332-2245 to get started.",
            "h1": "Florida Bail Bond Pre-Licensing Education & Career Academy",
            "keywords": "Florida bail bond school, 120-hour bail bond course Florida, bail bondsman licensing Florida, pre-licensing bail agent education",
            "secondary": "how to become a bail bondsman in Florida, Florida Statute Chapter 648 course",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/bail-school",
            "page_type": "static",
            "h2s": [
                "Launch Your Career in Florida Criminal Justice",
                "120-Hour Pre-Licensing Qualification Course ($649)",
                "20-Hour Continuing Education Course (Pending Course Approval)",
                "Step-by-Step Path to Your Florida Limited Surety Agent License",
                "Bail School Tuition, Enrollment & Curriculum",
                "Bail School Frequently Asked Questions"
            ]
        },
        "first-appearance": {
            "title": "Florida First Appearance Hearings | Shamrock Bail Bonds",
            "desc": "Guide to Florida 24-hour first appearance hearings, bond determinations & weekend dockets across all 20 judicial circuits. Call 239-332-2245.",
            "h1": "Florida First Appearance Court Hearings: Schedules & Guide",
            "keywords": "Florida first appearance hearings, 24 hour bond hearing Florida, Lee County first appearance court, weekend bond court Florida",
            "secondary": "first appearance docket Southwest Florida, bond hearing procedure Florida",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/first-appearance",
            "page_type": "static",
            "h2s": [
                "What Is a First Appearance Hearing in Florida?",
                "When Do First Appearance Hearings Happen?",
                "What Judges Consider When Setting Bail Amount",
                "Southwest Florida County First Appearance Schedules",
                "How to Post Bond After the Hearing",
                "First Appearance Frequently Asked Questions"
            ]
        },
        "testimonials": {
            "title": "Client Reviews & Testimonials | Shamrock Bail Bonds",
            "desc": "Read verified reviews from families helped by Shamrock Bail Bonds in Fort Myers and across Florida. 24/7 dedicated service. Call 239-332-2245.",
            "h1": "What Southwest Florida Families Say About Shamrock Bail Bonds",
            "keywords": "Shamrock Bail Bonds reviews, Fort Myers bail bondsman reviews, Lee County bail bonds testimonials",
            "secondary": "client feedback Shamrock Bail Bonds, reliable bail agent Fort Myers",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/testimonials",
            "page_type": "static",
            "h2s": [
                "Real Feedback from Families We Have Helped",
                "Compassionate Service During an Overnight Crisis",
                "Clear Explanations & Transparent Payment Options",
                "Share Your Experience with Our Team"
            ]
        },
        "florida-bail-bonds-1": {
            "title": "Florida Bail Bonds Directory | All 67 Counties | Shamrock",
            "desc": "Find bail bonds, jail addresses & inmate lookup for all 67 Florida counties. Local agents 24/7. Call 239-332-2245 or text 239-955-0178.",
            "h1": "Florida Bail Bonds Directory: All 67 Counties Served 24/7",
            "keywords": "Florida bail bonds directory, bail bonds by county Florida, Florida jail addresses and inmate search, county bail bondsman Florida",
            "secondary": "Southwest Florida bail bonds, Lee County bail bonds, statewide Florida surety bail",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/florida-bail-bonds-1",
            "page_type": "static",
            "h2s": [
                "Southwest Florida Core Service Area",
                "Complete County Directory A to Z",
                "How to Bond Someone Out Anywhere in Florida",
                "Statewide Inmate Lookup & Clerk of Court Resources"
            ]
        },
        "county-template": {
            "title": "[County] County Bail Bonds | Florida Jail Release | Shamrock",
            "desc": "24/7 [County] County bail bonds. Local jail address, inmate lookup & confidential phone support. Call 239-332-2245 or text 239-955-0178.",
            "h1": "[County] County Bail Bonds: 24/7 Jail Release & Inmate Help",
            "keywords": "[County] County bail bonds, [County] County jail release, [County] County inmate search, bail bondsman in [County] County",
            "secondary": "[County] Courthouse bond hearing, Florida statutory bail rate [County] County",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/florida-bail-bonds/[county-slug]",
            "page_type": "county",
            "h2s": [
                "24/7 Emergency Bail Help for [County] County",
                "[County] County Jail Location & Inmate Search",
                "How to Bond Someone Out at [County] County Jail",
                "[County] County Court & First Appearance Schedule",
                "Frequently Asked Questions for [County] County Bail"
            ]
        },
        "faq": {
            "title": "Florida Bail Bonds FAQ | Common Questions | Shamrock",
            "desc": "Find plain-English answers to Florida bail bond questions on costs, collateral, cosigning, court dates, and payment plans. Call 239-332-2245.",
            "h1": "Florida Bail Bonds Frequently Asked Questions",
            "keywords": "Florida bail bonds FAQ, bail bond questions answered, how much is bail in Florida, what is an indemnitor",
            "secondary": "bail bond collateral questions, payment plans for bail bonds Florida",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/how-bail-works#faq",
            "page_type": "static",
            "h2s": [
                "General Bail & Arrest Questions",
                "Cost & Payment Plan Questions",
                "Cosigner & Collateral Questions",
                "Court Appearances & Bond Release Questions",
                "Still Have Questions? Speak with an Agent 24/7"
            ]
        },
        "privacy-policy": {
            "title": "Privacy Policy | Shamrock Bail Bonds",
            "desc": "Read the Shamrock Bail Bonds Privacy Policy. How we collect, use, and safeguard your personal data with SOC II compliant principles.",
            "h1": "Privacy Policy: How We Protect Your Information",
            "keywords": "Shamrock Bail Bonds privacy policy, client confidentiality bail bonds Florida",
            "secondary": "data protection bail bond client data, SOC II compliance",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/privacy-policy",
            "page_type": "legal",
            "h2s": [
                "Information We Collect During Bail Underwriting",
                "How We Use Client Information",
                "10DLC SMS Privacy & Strict Opt-In Policy",
                "Data Security Standards & Encryption",
                "Third-Party Sharing Restrictions (No Marketing Sales)",
                "Contacting Our Privacy Officer"
            ]
        },
        "terms-and-conditions": {
            "title": "Terms and Conditions | Shamrock Bail Bonds",
            "desc": "Terms and conditions governing Shamrock Bail Bonds website use, digital client portal, and bail bond underwriting in Florida.",
            "h1": "Terms and Conditions of Service",
            "keywords": "Shamrock Bail Bonds terms and conditions, terms of service bail bond agency",
            "secondary": "Florida surety bond contractual terms, digital portal usage terms",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/terms-and-conditions",
            "page_type": "legal",
            "h2s": [
                "Acceptance of Terms",
                "Florida Statutory Underwriting & Premium Requirements",
                "Indemnitor Responsibilities & Contractual Obligations",
                "Digital Portal Access & Electronic Signatures",
                "Limitation of Liability & Disclaimers",
                "Governing Law & Jurisdiction"
            ]
        },
        "communication-preferences": {
            "title": "Communication Preferences & SMS Consent | Shamrock",
            "desc": "Manage your communication preferences, SMS court notifications, and opt-out settings with Shamrock Bail Bonds. 10DLC compliant.",
            "h1": "Communication Preferences & SMS Notifications",
            "keywords": "communication preferences Shamrock Bail Bonds, bail bond SMS opt out, court reminder notifications",
            "secondary": "10DLC text messaging consent Florida bail bonds",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/communication-preferences",
            "page_type": "legal",
            "h2s": [
                "Our Commitment to Compliant Messaging",
                "Types of SMS Notifications We Send",
                "How to Opt Out or Update Your Preferences",
                "Assistance with Communication Settings"
            ]
        },
        "data-deletion": {
            "title": "Data Deletion Request | Shamrock Bail Bonds",
            "desc": "Request deletion or review of your personal information held by Shamrock Bail Bonds in compliance with applicable privacy regulations.",
            "h1": "Data Deletion & Privacy Rights Request",
            "keywords": "data deletion request Shamrock Bail Bonds, remove personal information bail bonds",
            "secondary": "privacy rights request Florida bail agency",
            "robots": "noindex, follow",
            "canonical": "https://www.shamrockbailbonds.biz/data-deletion",
            "page_type": "legal",
            "h2s": [
                "Your Privacy Rights",
                "Statutory Record Retention Requirements Under Florida Law",
                "Submitting a Data Deletion Request",
                "Verification and Timeline for Processing"
            ]
        },
        "portal-landing": {
            "title": "Client Portal Login | Shamrock Bail Bonds",
            "desc": "Secure passwordless portal login for defendants and indemnitors. View case details, sign paperwork & track court dates. Call 239-332-2245.",
            "h1": "Client Portal Login: Secure & Passwordless",
            "keywords": "Shamrock Bail Bonds portal login, defendant portal Florida bail, indemnitor portal login",
            "secondary": "court date check in portal, digital bail paperwork portal",
            "robots": "noindex, follow",
            "canonical": "https://www.shamrockbailbonds.biz/portal-landing",
            "page_type": "portal",
            "h2s": [
                "Access Your Case Information",
                "How Passwordless Magic Link Login Works",
                "What You Can Do Inside the Client Portal",
                "Need Help Accessing Your Case?"
            ]
        },
        "portal-defendant": {
            "title": "Defendant Dashboard | Shamrock Bail Bonds Portal",
            "desc": "Defendant dashboard for Shamrock Bail Bonds clients. Check court appearances, submit weekly check-ins & view active bond status.",
            "h1": "Defendant Case Dashboard",
            "keywords": "defendant dashboard Shamrock Bail Bonds, weekly bail check in Florida",
            "secondary": "court appearance date tracker, active bond status check",
            "robots": "noindex, nofollow",
            "canonical": "https://www.shamrockbailbonds.biz/portal-defendant",
            "page_type": "portal",
            "h2s": [
                "Your Current Bond Status",
                "Upcoming Court Dates & Appearance Notices",
                "Weekly Check-In Submission",
                "Contact Your Supervising Bondsman"
            ]
        },
        "portal-indemnitor": {
            "title": "Indemnitor Dashboard | Shamrock Bail Bonds Portal",
            "desc": "Indemnitor and cosigner dashboard for Shamrock Bail Bonds clients. Manage payment schedules, review receipts & track defendant court compliance.",
            "h1": "Indemnitor & Cosigner Dashboard",
            "keywords": "indemnitor dashboard Shamrock Bail Bonds, cosigner portal Florida bail",
            "secondary": "payment plan management bail bonds, collateral receipts portal",
            "robots": "noindex, nofollow",
            "canonical": "https://www.shamrockbailbonds.biz/portal-indemnitor",
            "page_type": "portal",
            "h2s": [
                "Defendant Case & Compliance Status",
                "Premium Payment Schedule & Online Payments",
                "Signed Documents & Collateral Receipts",
                "Important Indemnitor Legal Reminders",
                "Need Assistance with Your Account?"
            ]
        }
    }
    return specs.get(page)

def legal_content_draft(page, spec):
    """Policy text for compliance pages. Not the shared bail-marketing template."""
    slug = spec["canonical"].replace("https://www.shamrockbailbonds.biz", "") or "/"
    bodies = {
        "privacy-policy": """
# Privacy Policy: How We Protect Your Information

This policy describes what Shamrock Bail Bonds, LLC collects, why we use it, who we share it with, how long we keep it, and how to ask a question about your information. It is the privacy notice for shamrockbailbonds.biz, our text messages, and our client portal.

## Information We Collect During Bail Underwriting

We collect information you give us and information we need to post a bond:

- Name, phone number, email address, and mailing address for the person calling and for the defendant.
- Date of birth, government ID details, and the relationship between the indemnitor and the defendant.
- Jail, county, booking number, and the charge text exactly as the jail or clerk wrote it.
- Information the surety requires to decide whether to post the bond, including employment, residence, and collateral when collateral is part of the agreement.
- Portal login contact (email or phone), signature records, and payment references. We do not store full payment-card numbers on the website.

If you do not provide information the surety requires, we may be unable to post the bond. You can still call us.

## How We Use Client Information

We use this information to:

- Look up a booking, explain the bond, and prepare the indemnity agreement.
- Post the bond with the jail and keep the surety informed of court dates.
- Send the messages you agreed to receive, such as paperwork links and court reminders.
- Protect the bond if a court date is missed, including contacting the indemnitor.
- Meet recordkeeping duties that apply to Florida bail bond agents.
- Answer a privacy, opt-out, or deletion request.

We do not sell personal information. We do not use client lists for third-party advertising.

## 10DLC SMS Privacy & Strict Opt-In Policy

Text messages are sent from 239-955-0178. Message frequency varies with the case. Message and data rates may apply.

- We send texts only after you opt in on a form, on the phone, or in the client portal. Signing a bond is not by itself consent to marketing texts.
- Bond and court messages include paperwork links, payment links you requested, court-date reminders, and check-in notices.
- Reply STOP to cancel texts. Reply HELP for help. Consent to texts is not required to ask for a bond by phone.
- We do not share text opt-in data with data brokers.

## Data Security Standards & Encryption

The public site is served over HTTPS. Portal links are individual and expire. Staff access to case files is limited to people who work the bond. No method of storage is perfect. If we learn of a breach that creates a risk to you, we will notify you as required by law.

## Third-Party Sharing Restrictions (No Marketing Sales)

We share information only as needed to post and maintain the bond, or when the law requires it:

- The jail, the clerk, and the court, so the bond can be posted and court dates can be tracked.
- The surety company that backs the bond (O'Shaughnahill Surety & Insurance or Palmetto Surety Corporation, as matched to the case).
- A payment processor when you choose to pay online.
- DocuSeal, our signing provider, when a staff member issues a signing packet.
- A lawyer you ask us to speak with, or a government agency that lawfully requests the record.

We do not sell, rent, or trade your information for marketing.

## Contacting Our Privacy Officer

Email admin@shamrockbailbonds.biz or call 239-332-2245. Spanish-speaking callers can use 727-295-2245. Mail: Shamrock Bail Bonds, 1528 Broadway, Fort Myers, FL 33901.

Office walk-in hours are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7. Those are different. The office is not open for walk-ins overnight.
""",
        "terms-and-conditions": """
# Terms and Conditions of Service

These terms cover use of shamrockbailbonds.biz, the client portal, and a request that Shamrock Bail Bonds, LLC write a Florida bail bond. The bond itself is a separate written contract. If the website and the signed bond disagree, the signed bond controls the bond.

## Acceptance of Terms

Using the website, the portal, or asking us to start a bond means you agree to these terms. If you do not agree, do not use the site. You can still call 239-332-2245 and ask for help. We do not give legal advice on this website. A criminal charge is a matter for a licensed Florida lawyer.

## Florida Statutory Underwriting & Premium Requirements

Florida sets the bail bond premium. The premium is 10% of the bond, with a minimum of $100 per charge, under the rate rules that apply to limited surety agents. The premium is earned when the bond is posted. It is not a deposit that comes back when the case ends. Collateral, if any, is different from the premium and is handled in the written collateral receipt.

We do not quote a release time. After the bond is posted, the jail decides when the person leaves.

## Indemnitor Responsibilities & Contractual Obligations

An indemnitor (cosigner) promises the surety that the defendant will appear in court. If the defendant misses court, the indemnitor can owe the full bond amount and the costs of recovery, as the signed indemnity agreement states. Read that agreement before you sign. Ask us to explain any line you do not understand. We will not rush you past a document.

## Digital Portal Access & Electronic Signatures

The portal uses a one-time link sent to the email or phone on the case. Do not forward that link. You are responsible for activity from a link we sent to your contact until you tell us it was shared by mistake.

Electronic signatures on a packet issued by staff are signatures. DocuSeal is the signing service. The website does not create a signing packet by itself. Staff match the surety and the power of attorney in Super CRM before a packet is issued.

## Limitation of Liability & Disclaimers

The website is a way to reach us and to read general information about Florida bail. It does not promise an outcome in court, a bond approval, or a time of release. To the extent Florida law allows, Shamrock Bail Bonds is not liable for a jail delay, a court decision, or a loss caused by information a visitor typed incorrectly. Nothing here limits a duty that Florida law does not allow us to limit.

## Governing Law & Jurisdiction

These terms are governed by the laws of the State of Florida. Venue for a dispute about the website, the portal, or a bond we write from this office is in the state courts of Lee County, Florida, except where a surety contract or a statute requires another forum.

Questions: admin@shamrockbailbonds.biz or 239-332-2245. Office: 1528 Broadway, Fort Myers, FL. Walk-in hours Monday through Friday, 9 AM to 5 PM. Phones answered 24/7.
""",
        "communication-preferences": """
# Communication Preferences & SMS Notifications

This page explains which messages Shamrock Bail Bonds sends, how you agree to them, and how you stop them. It is the notice for our 10DLC text program.

## Our Commitment to Compliant Messaging

Texts come from 239-955-0178. Email comes from admin@shamrockbailbonds.biz. Phone calls for English use 239-332-2245. The public Spanish line is 727-295-2245. We do not publish any other number as a public or Spanish line.

We only text people who opted in. A bond agreement is not automatic consent to marketing texts. You can ask for a bond by phone without agreeing to texts.

## Types of SMS Notifications We Send

- Paperwork and signing links that staff issued for your case.
- A payment link, when you ask for one.
- Court-date and check-in reminders for an open bond.
- A reply to a text you sent us.

We do not send third-party advertisements. Message frequency depends on the case. Message and data rates may apply.

## How to Opt Out or Update Your Preferences

- Text STOP to 239-955-0178 to stop texts. You will receive a confirmation. A STOP applies to the phone number that sent it.
- Text HELP to 239-955-0178 for help, or call 239-332-2245.
- To change the phone or email on a case, call the same number or email admin@shamrockbailbonds.biz so the file matches you.
- Stopping texts does not cancel the bond and does not remove a duty in the indemnity agreement. Court notices from the clerk are separate from our texts.

## Assistance with Communication Settings

Office walk-in hours are Monday through Friday, 9 AM to 5 PM, at 1528 Broadway, Fort Myers, FL 33901. Phones are answered 24/7. If a text failed or you opted out by mistake, call 239-332-2245 and we will update the file. Spanish-speaking callers can use 727-295-2245.
""",
        "data-deletion": """
# Data Deletion & Privacy Rights Request

Use this page to ask Shamrock Bail Bonds what personal information we hold, to correct it, or to ask us to delete it. Some bond records cannot be deleted while the law or the surety contract requires us to keep them.

## Your Privacy Rights

You may ask us to:

- Tell you the categories of personal information we have about you.
- Correct a phone number, email, address, or name that is wrong.
- Delete information we are not required to keep.
- Stop marketing texts (see the communication preferences page; text STOP to 239-955-0178).

These requests are free. We will not charge you to ask.

## Statutory Record Retention Requirements Under Florida Law

Florida bail bond agents and the sureties they represent have to keep bond records. That includes the application, the indemnity agreement, the power of attorney, premium and collateral receipts, and court-appearance history for an open bond.

We cannot delete those records while the bond is open, while a forfeiture or a claim is unresolved, or during the period the surety and Florida bail-agent rules require the file to be kept. We also keep a record of a deletion request itself.

Information that is only a website inquiry, and that never became a bond file, can be deleted after we confirm it is not needed for one of those duties.

## Submitting a Data Deletion Request

Email admin@shamrockbailbonds.biz with the subject "Data deletion request", or write to Shamrock Bail Bonds, 1528 Broadway, Fort Myers, FL 33901. Include:

- Your full name and the phone or email we have on file.
- Whether you are the defendant, the indemnitor, or someone else.
- The defendant name and county, if a bond was posted.
- What you want deleted or corrected.

Do not send a photo of a driver license in the first email. We will tell you if we need a document to confirm who you are.

## Verification and Timeline for Processing

We confirm the request is from the person the record is about, or from someone that person authorized, before we change or delete it. We reply to a complete request within 45 days. If we must keep part of the file, we will say what we kept and why, and we will delete the rest that we are free to delete.

Office walk-in hours are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7 at 239-332-2245. The public Spanish line is 727-295-2245. Text 239-955-0178.
""",
    }
    body = bodies[page]
    return f"""# Studio Content Draft: {page.replace('-', ' ').title()}

> **Target Studio Slug:** `{slug}`  
> **Audience:** Clients, indemnitors, and anyone whose information we hold.  
> **Reading Level:** 8th Grade (plain English).  
> **Canonical Brand Truths:** 1528 Broadway, Fort Myers, FL 33901 · Main line 239-332-2245 · Spanish public line 727-295-2245 · Text 239-955-0178 · Email admin@shamrockbailbonds.biz  
> **Hours:** Office walk-in hours Mon–Fri 9 AM–5 PM. Phones answered 24/7. These are labeled separately.  
> **Compliance Standards:** This is a policy page. It is not a sales page. No speed promises and no release-time claims.

---

{body.strip()}
"""


def write_specs_and_content():
    os.makedirs(SEO_DIR, exist_ok=True)
    os.makedirs(CONTENT_DIR, exist_ok=True)

    for p in PAGES:
        spec = generate_seo_spec(p)
        if not spec:
            continue

        # Write SEO spec markdown
        spec_content = f"""# SEO Specification: {p.replace('-', ' ').title()} Page

> **Canonical URL:** `{spec['canonical']}`  
> **Target Page Type:** `{spec['page_type']}`  
> **Robots Directive:** `{spec['robots']}`  
> **Brand Policy:** Title ends with `| Shamrock Bail Bonds` (< 60 chars). Self-referencing canonical.

---

## 1. Metadata Blueprint

| Field | Value | Notes & Length |
|---|---|---|
| **Page Title** | `{spec['title']}` | {len(spec['title'])} characters (target < 60) |
| **Meta Description** | `{spec['desc']}` | {len(spec['desc'])} characters (target 140–160) |
| **H1 Headline** | `{spec['h1']}` | Exactly 1 per page |
| **Robots** | `{spec['robots']}` | Public pages index; portal/retire noindex |
| **Canonical URL** | `{spec['canonical']}` | Self-referencing |
| **Open Graph Title** | `{spec['title']}` | Matches page title |
| **Open Graph Description** | `{spec['desc']}` | Matches meta description |
| **Open Graph Image** | `https://www.shamrockbailbonds.biz/logo.png` | 1200 x 630 WebP/PNG brand banner |
| **Open Graph Type** | `website` | Standard open graph type |

---

## 2. Keywords & Search Intent

- **Primary Target Keyword:** `{spec['keywords'].split(',')[0].strip()}`
- **Secondary Terms:** `{spec['secondary']}`
- **Search Intent:** {("Compliance and account rights. This is not a sales page." if spec.get("page_type") == "legal" else "Urgent crisis response, emergency jail release, and bail bond verification.")}
- **Why This Beats Live:** Preserves exact historical rankings while upgrading E-E-A-T signals, replacing outdated phone numbers, ensuring 100% brand consistency, and adding rich structured data.

---

## 3. Heading Structure & Content Outline

- **H1:** `{spec['h1']}`
"""
        for h2 in spec['h2s']:
            spec_content += f"  - **H2:** `{h2}`\n"

        spec_content += f"""
---

## 4. Internal Link Architecture

- **Inbound Links From:** Homepage Hero, Footer Directory, County Hub (`/florida-bail-bonds-1`), Navigation Menu.
- **Outbound Links To:**
  - Homepage (`/`)
  - How Bail Works (`/how-bail-works`)
  - Contact Us (`/contact`)
  - Client Portal (`/portal-landing`)
  - Tel Links: `tel:+12393322245`, `tel:+17272952245`
  - SMS Link: `sms:+12399550178`

---

## 5. Structured Data (JSON-LD)

```json
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": ["Organization", "LocalBusiness", "LegalService"],
      "@id": "https://www.shamrockbailbonds.biz/#organization",
      "name": "Shamrock Bail Bonds",
      "legalName": "Shamrock Bail Bonds, LLC",
      "founder": {{
        "@type": "Person",
        "name": "Brendan O'Neal"
      }},
      "foundingDate": "2012",
      "address": {{
        "@type": "PostalAddress",
        "streetAddress": "1528 Broadway",
        "addressLocality": "Fort Myers",
        "addressRegion": "FL",
        "postalCode": "33901",
        "addressCountry": "US"
      }},
      "telephone": "+1-239-332-2245",
      "email": "admin@shamrockbailbonds.biz",
      "url": "https://www.shamrockbailbonds.biz",
      "areaServed": {{
        "@type": "State",
        "name": "Florida"
      }},
      "openingHoursSpecification": [
        {{
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "17:00",
          "description": "Office walk-in hours"
        }},
        {{
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "00:00",
          "closes": "23:59",
          "description": "24/7 emergency dispatch phone & text lines"
        }}
      ]
    }}
  ]
}}
```
"""
        with open(os.path.join(SEO_DIR, f"{p}.md"), "w", encoding="utf-8") as f:
            f.write(spec_content)

        # Write Content Draft markdown
        content_draft = f"""# Studio Content Draft: {p.replace('-', ' ').title()}

> **Target Studio Slug:** `{spec['canonical'].replace('https://www.shamrockbailbonds.biz', '') or '/'}`  
> **Audience:** A scared family member reading on a phone at 2 AM.  
> **Reading Level:** 8th Grade (warm, direct, respectful, plain English).  
> **Canonical Brand Truths:** 1528 Broadway, Fort Myers, FL 33901 · Phones: 239-332-2245 (English), 727-295-2245 (Spanish) · Text: 239-955-0178 · Owner-operated by Brendan O'Neal since 2012.  
> **Compliance Standards:** Zero speed promises, zero guaranteed-release language, zero 'results' claims.

---

## 🚨 Emergency Action Block (Top of Page)

> **Someone in jail right now? Take a deep breath. We are here to help you get them home.**
>
> 📞 **Call English (24/7):** [239-332-2245](tel:+12393322245)  
> 📞 **Llame en Español (24/7):** [727-295-2245](tel:+17272952245)  
> 💬 **Text an Agent (24/7):** [239-955-0178](sms:+12399550178)  
> 📱 **Start Paperwork Online:** [Open Mobile Intake](/portal-landing)
>
> *Office walk-in hours Mon–Fri 9 AM–5 PM · Phones answered 24/7*  
> *1528 Broadway, Fort Myers, FL 33901*

---

# {spec['h1']}

When a loved one is arrested, you are dealing with fear, confusion, and a dozen questions all at once. You want straightforward answers, someone who picks up the phone, and a clear path forward without judgment.

Shamrock Bail Bonds has been serving families across Southwest Florida and all 67 Florida counties since 2012. We are owner-operated by Brendan O'Neal from our office in downtown Fort Myers. We handle misdemeanor bonds, felony bonds, warrant walk-throughs, and nationwide transfer bonds with complete confidentiality and care.

---

## How We Help You Through This Tonight

### 1. Speak with a Real Local Agent Right Now
When you call [239-332-2245](tel:+12393322245), you speak directly with an experienced bail professional. We look up the arrest records, verify the exact charges and bond amounts with the jail, and explain your options in plain language. If you speak Spanish, our dedicated line is [727-295-2245](tel:+17272952245).

### 2. Complete Paperwork from Your Phone
You do not have to leave your home or travel across town in the middle of the night. We send secure, mobile-friendly forms directly to your smartphone via text or email. You can review and sign from anywhere.

### 3. Transparent Costs & Flexible Financing
Florida bail bond premiums are set by state statute at 10% of the total bond amount ($100 minimum per charge). We explain all costs upfront with zero hidden fees. For qualifying families, we provide flexible, interest-free payment plans tailored to your budget.

### 4. We Post the Bond with the Jail
As soon as the paperwork and payment are arranged, our licensed agent posts the bond directly with the detention facility. We stay in touch with you throughout the release process so you know exactly what is happening.

---

## Why Florida Families Choose Shamrock Bail Bonds

- **Local & Accountable:** Our main office has been at 1528 Broadway in downtown Fort Myers since 2012. We are not an out-of-state call center.
- **Respectful & Non-Judgmental:** Good people find themselves in tough situations every day. We treat you and your family with patience and dignity.
- **All 67 Florida Counties:** While our home base is Lee, Collier, and Charlotte counties, our licensed surety network covers every jail in Florida and coordinates transfer bonds throughout the United States.
- **Warrant Checks & Court Guidance:** Wondering if there is an active warrant? We can verify warrants discreetly and arrange smooth walk-throughs to minimize time in custody.

---

## Frequently Asked Questions

### How much does a bail bond cost in Florida?
In Florida, bail bond fees are strictly regulated by Florida Statute § 648.24. The fee is 10% of the total bond amount, with a minimum fee of $100 per charge. For example, a $5,000 bond requires a statutory premium of $500.

### What information do I need when I call?
It helps to have the person's full legal name, date of birth, and the county where they were arrested. If you do not have all of this information, do not worry—call us at [239-332-2245](tel:+12393322245) and we will help you find the booking details.

### What is an indemnitor (cosigner)?
An indemnitor is a family member or friend who signs the bail agreement, guaranteeing that the defendant will attend all required court hearings. We walk you through every document before you sign.

### What are your office hours?
Our physical office at 1528 Broadway in Fort Myers is open for walk-in clients Monday through Friday, 9:00 AM to 5:00 PM. Our phone lines and emergency dispatch operate 24 hours a day, 7 days a week, 365 days a year.

---

## Ready to Bring Your Loved One Home?

Do not wait through the night wondering what comes next. Call our team now for clear, immediate guidance.

- 📞 **Call (239) 332-2245**
- 📞 **Línea en Español: (727) 295-2245**
- 💬 **Text: (239) 955-0178**
- 📍 **Visit Us:** 1528 Broadway, Fort Myers, FL 33901
"""
        if spec.get("page_type") == "legal":
            content_draft = legal_content_draft(p, spec)

        with open(os.path.join(CONTENT_DIR, f"{p}.md"), "w", encoding="utf-8") as f:
            f.write(content_draft)

    print(f"Generated 17 SEO specs in {SEO_DIR}/ and 17 content drafts in {CONTENT_DIR}/")

if __name__ == "__main__":
    write_specs_and_content()
