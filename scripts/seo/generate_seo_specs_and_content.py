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
            "desc": "Florida bail bond pre-licensing is pending course approval. No price is listed for the 120-hour or 20-hour course. Call 239-332-2245 to start.",
            "h1": "Florida Bail Bond Pre-Licensing Education & Career Academy",
            "keywords": "Florida bail bond school, 120-hour bail bond course Florida, bail bondsman licensing Florida, pre-licensing bail agent education",
            "secondary": "how to become a bail bondsman in Florida, Florida Statute Chapter 648 course",
            "robots": "index, follow",
            "canonical": "https://www.shamrockbailbonds.biz/bail-school",
            "page_type": "static",
            "h2s": [
                "Launch Your Career in Florida Criminal Justice",
                "120-Hour Pre-Licensing Qualification Course (Pending Course Approval)",
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
- The surety company that backs the bond (O'Shaughnahill Surety & Insurance (OSI) or Palmetto Surety Corporation, as matched to the case).
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



def draft_banner(page, spec, audience, note):
    slug = spec["canonical"].replace("https://www.shamrockbailbonds.biz", "") or "/"
    title = page.replace("-", " ").title()
    return f"""# Studio Content Draft: {title}

> **Target Studio Slug:** `{slug}`  
> **Audience:** {audience}  
> **Reading Level:** 8th Grade (plain English).  
> **Canonical Brand Truths:** 1528 Broadway, Fort Myers, FL 33901 · Main line 239-332-2245 · Spanish public line 727-295-2245 · Text 239-955-0178 · Email admin@shamrockbailbonds.biz  
> **Hours:** Office walk-in hours Mon–Fri 9 AM–5 PM. Phones answered 24/7. These are labeled separately.  
> **Compliance Standards:** {note}

---

"""

def page_content_draft(page, spec):
    """One body per page. The shared bail-intake template is not used."""
    h1 = spec["h1"]
    bodies = {
        "home": f"""# {h1}

Shamrock Bail Bonds is the Fort Myers office at 1528 Broadway. Brendan O'Neal has run it since 2012. Families in Lee, Collier, and Charlotte counties start here. The same licensed agency also posts bonds in the other Florida counties.

## Emergency Bail Help: What to Do Right Now

Call [239-332-2245](tel:+12393322245). If you speak Spanish, call [727-295-2245](tel:+17272952245). Text [239-955-0178](sms:+12399550178) if you cannot talk. Have the person's full name and the county, if you know them. If you do not, call anyway.

Office walk-in hours are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.

## How Florida Bail Works in 3 Simple Steps

1. We confirm the booking and the bond amount with the jail. The charge text stays exactly as the jail wrote it.
2. You review the premium, any collateral, and the indemnity agreement before you sign.
3. A licensed agent posts the bond with that jail after the paperwork and payment are in place.

Florida sets the premium at 10% of the bond, with a $100 minimum per charge (Florida Statute § 648.24).

## Select Your County or Jail to Begin

Use the county directory at [/florida-bail-bonds-1](/florida-bail-bonds-1). Each county page has the inmate lookup and the clerk link we have on file. Start paperwork at [/portal-landing](/portal-landing).

## Payment Plans & Flexible Collateral

We tell you the statutory premium before you sign. Some families pay the premium over time. Collateral, when the surety requires it, is explained before you pledge it. There is no extra Shamrock fee on top of the statutory premium.

## Why Southwest Florida Families Trust Shamrock

The office is in downtown Fort Myers, not an out-of-state call center. You can walk in during office hours or call any time. Spanish-speaking callers use 727-295-2245.

## Frequently Asked Questions

### How much is the premium?
Ten percent of the bond, $100 minimum per charge, under Florida Statute § 648.24.

### Where is the office?
1528 Broadway, Fort Myers, FL 33901. Walk-in hours are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
        "how-bail-works": f"""# {h1}

This page explains the Florida bail process. It is a guide, not a promise about when someone leaves the jail.

## Immediate Help When Someone Is In Jail

Call [239-332-2245](tel:+12393322245) or text [239-955-0178](sms:+12399550178). Spanish: [727-295-2245](tel:+17272952245). We look up the booking with you.

## What Happens After an Arrest in Florida?

The jail books the person and sets or holds a bond. A judge reviews the case at first appearance. See [/first-appearance](/first-appearance). If a bond is set, a licensed surety agent can post it after the premium and the indemnity agreement are in place. If the jail shows a hold or no bond, we say so.

## How Much Does a Bail Bond Cost in Florida?

The premium is 10% of the total bond, with a $100 minimum per charge (Florida Statute § 648.24). A $5,000 bond has a $500 premium. The premium is the fee for the bond. It is not a deposit that comes back when the case ends.

## What Does an Indemnitor (Cosigner) Do?

The indemnitor signs the agreement with the surety. That person agrees the defendant will go to court. We read each part of the agreement before anyone signs. The indemnitor is often a spouse, parent, or other adult the defendant trusts.

## Do You Need Collateral for a Bail Bond?

Not every bond needs collateral. When the surety does require it, we name the property or the amount before you agree. Collateral is separate from the premium.

## Common Questions About the Florida Bail Process

### Can I start from my phone?
Yes. Call, text, or open [/portal-landing](/portal-landing). Staff still match the surety and the power of attorney before a packet is issued.

### What are the office hours?
Walk-in hours at 1528 Broadway, Fort Myers, are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
        "contact": f"""# {h1}

Reach the Fort Myers desk by phone, text, or the form on this page. Email is admin@shamrockbailbonds.biz.

## 24/7 Emergency Phone & Text Lines

- English: [239-332-2245](tel:+12393322245)
- Spanish: [727-295-2245](tel:+17272952245)
- Text: [239-955-0178](sms:+12399550178)

These lines are answered 24/7. They are not the same thing as walk-in hours.

## Our Office Location in Downtown Fort Myers

1528 Broadway, Fort Myers, FL 33901. This is the only office address.

## Walk-In Hours & 24/7 Dispatch Availability

Walk-in hours are Monday through Friday, 9 AM to 5 PM. Phones and texts are answered 24/7.

## Send an Urgent Message to Our Desk

The form needs your name, a callback number, the defendant's name, the jail or county, and a checked consent box. A bondsman reviews the message. The form does not set a price.

## Service Areas: Southwest Florida & Statewide

The home office serves Lee, Collier, and Charlotte counties every day. Licensed agents also post bonds in the other Florida counties. Pick a county from [/florida-bail-bonds-1](/florida-bail-bonds-1).
""",
        "about": f"""# {h1}

## Our Mission: Dignity, Clarity, and Care

People call us on a hard day. We explain the bond, the premium, and the paperwork in plain English. We do not lecture the family.

## Local Roots in Downtown Fort Myers Since 2012

Shamrock Bail Bonds, LLC is owner-operated by Brendan O'Neal. The office has been at 1528 Broadway, Fort Myers, FL 33901 since 2012.

## Licensed & Regulated by the Florida Department of Financial Services

Florida bail agents are licensed and regulated under Florida Statutes Chapter 648. The premium rate is set by statute, not by a private price list.

## Statewide Coverage & Nationwide Transfer Bonds

Southwest Florida is home. The agency also writes bonds in the other Florida counties and coordinates transfer bonds when a person is arrested away from the county that holds the warrant.

## Meet Our Founder: Brendan O'Neal

Brendan answers to the families who call this office. To reach him or the desk on duty, call [239-332-2245](tel:+12393322245). Spanish: [727-295-2245](tel:+17272952245). Text: [239-955-0178](sms:+12399550178). Email admin@shamrockbailbonds.biz.

Walk-in hours are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
        "bail-school": f"""# {h1}

This page is for people who want a Florida limited surety (bail bond) agent license. It is not the page for posting a bond tonight. Families who need a bond should call [239-332-2245](tel:+12393322245).

## Launch Your Career in Florida Criminal Justice

Florida requires pre-licensing education before you can apply for a limited surety agent license under Chapter 648. Shamrock Bail School teaches that coursework from the Fort Myers office.

## 120-Hour Pre-Licensing Qualification Course (Pending Course Approval)

The 120-hour qualification course is pending course approval. It is a self-paced pre-licensing course for people who are not yet licensed bail agents. This page does not list a price. The provider label is FLDFS Provider #648-FL (pending course approval).

## 20-Hour Continuing Education Course (Pending Course Approval)

The 20-hour course is pending course approval. This page does not list a price. The provider label is FLDFS Provider #648-FL (pending course approval).

## Step-by-Step Path to Your Florida Limited Surety Agent License

1. Finish the required pre-licensing hours.
2. Apply to the Florida Department of Financial Services for the limited surety license.
3. Pass the state exam and complete the appointment with a surety company.
4. Call the school at [239-332-2245](tel:+12393322245) if you want to talk through the order of those steps.

## Bail School Tuition, Enrollment & Curriculum

Enroll by calling 239-332-2245 or emailing admin@shamrockbailbonds.biz. Classes and study materials are arranged from 1528 Broadway, Fort Myers, FL 33901. Walk-in hours for the office are Monday through Friday, 9 AM to 5 PM. The phone is answered 24/7.

The curriculum follows the subjects the state expects a new bail agent to know: Florida bail statutes, the surety contract, collateral, forfeitures, and recordkeeping. We do not promise a license or a job.

## Bail School Frequently Asked Questions

### Is the 120-hour course the same as a bail bond premium?
No. Course tuition is not a bail bond premium. A bail bond premium is 10% of a defendant's bond under Florida Statute § 648.24. This page does not list a course price.

### Can I get a price for the 20-hour course?
Not yet. The 20-hour course is pending course approval, so this page does not list a price.
""",
        "first-appearance": f"""# {h1}

## What Is a First Appearance Hearing in Florida?

First appearance is the defendant's first court hearing after arrest. The judge reviews the charges and decides whether to set a bond, change a bond, or hold the person. Florida Rule of Criminal Procedure 3.130 requires that hearing within 24 hours of arrest. That is the court's rule, not a Shamrock time estimate.

## When Do First Appearance Hearings Happen?

Each county sets its own courtroom time. Weekday and weekend times are on the schedule list for that county. If a time is not on the list, call [239-332-2245](tel:+12393322245) and we will read the clerk's calendar with you. Do not guess a time from another county.

## What Judges Consider When Setting Bail Amount

Judges look at the charges, ties to the community, history of court appearances, and safety. Shamrock does not set the bond amount. We explain a bond the court has already set.

## Southwest Florida County First Appearance Schedules

The page repeater loads every Florida county from the first-appearance catalog, not a short list of circuits. Search by county name. A hearing link opens only when that county publishes one.

## How to Post Bond After the Hearing

If the judge sets a bond, call [239-332-2245](tel:+12393322245) or text [239-955-0178](sms:+12399550178). Spanish: [727-295-2245](tel:+17272952245). We confirm the amount with the jail, then walk through the premium and the indemnity agreement. A licensed agent posts the bond after that paperwork and payment are in place.

## First Appearance Frequently Asked Questions

### Does Shamrock decide the release?
No. The judge and the jail decide custody. We post a bond the court allows.

### Where is the office?
1528 Broadway, Fort Myers, FL 33901. Walk-in hours are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
        "testimonials": f"""# {h1}

## Real Feedback from Families We Have Helped

We do not write fake quotes. The public story already on the site is [Customer Testimonial: How Shamrock Bail Bonds Helped Me](/single-post/customer-testimonial-how-shamrock-bail-bonds-helped-me). It describes a family who called after a relative was arrested and had the bond steps explained before they signed.

Add a new review to this page only when the family wrote it and agreed to publish it. Do not invent a name, a city, or a star rating.

## Compassionate Service During an Overnight Crisis

Families who write to us usually mention the same things: someone answered the phone, the premium was explained before they signed, and they were told which jail held the defendant. Those are the facts we will print. We will not add a story a client did not tell.

## Clear Explanations & Transparent Payment Options

The premium is 10% of the bond, $100 minimum per charge. Reviews that mention money should match that statute. They should not claim a discount off the statutory premium.

## Share Your Experience with Our Team

Email admin@shamrockbailbonds.biz or call [239-332-2245](tel:+12393322245). Spanish: [727-295-2245](tel:+17272952245). Text: [239-955-0178](sms:+12399550178). Say if we may use your first name and county. The office at 1528 Broadway is open for walk-ins Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
        "florida-bail-bonds-1": f"""# {h1}

## Southwest Florida Core Service Area

The Fort Myers office at 1528 Broadway is home for Lee, Collier, and Charlotte counties. Start with those county pages if the arrest was in Southwest Florida. Call [239-332-2245](tel:+12393322245) or text [239-955-0178](sms:+12399550178). Spanish: [727-295-2245](tel:+17272952245).

## Complete County Directory A to Z

Every Florida county has a page under `/florida-bail-bonds/` plus the county slug. The slug matches the live route, including `st-johns` and `st-lucie`. The directory data is `docs/studio-content/county-official-sources.json`. Print a street address only when that file has one. If the address is empty, show the jail phone and the inmate lookup and leave the street off the card.

## How to Bond Someone Out Anywhere in Florida

1. Open the county page and confirm the person is on that jail's roster.
2. Call the Fort Myers desk with the name and the county.
3. Review the statutory premium and the indemnity agreement.
4. A licensed agent posts the bond with that county's jail after the file is ready.

## Statewide Inmate Lookup & Clerk of Court Resources

Each county record stores the inmate lookup as `bookingWebsiteLink` and the clerk site as `countyClerkWebsitelink`. Some official sites still use http. The button opens that URL in a new tab. Walk-in hours in Fort Myers are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
        "county-template": f"""# {h1}

Use this template for `/florida-bail-bonds/[county-slug]`. Replace the bracketed county name from `county-official-sources.json`. Do not paste the same paragraph onto every county.

## 24/7 Emergency Bail Help for [County] County

Call [239-332-2245](tel:+12393322245), text [239-955-0178](sms:+12399550178), or call Spanish [727-295-2245](tel:+17272952245). Say you are calling about [County] County. The Fort Myers office answers. Walk-in hours there are Monday through Friday, 9 AM to 5 PM.

## [County] County Jail Location & Inmate Search

Show the jail name and the booking phone from the catalog. Show `jailAddress` only when it is a real street. If it is empty, write that the street address is confirmed with the jail by phone, and link the inmate lookup. Do not print a placeholder address.

## How to Bond Someone Out at [County] County Jail

We confirm the booking and the bond on that county's roster. The charge line stays in the jail's own words. The premium is 10% of the bond, $100 minimum per charge. The indemnity agreement is signed before a licensed agent posts the bond.

## [County] County Court & First Appearance Schedule

Show the courthouse name. Show `courthouseAddress` only when the catalog has a street. Link the clerk site. First appearance times come from the first-appearance catalog for this county, not from a statewide guess.

## Frequently Asked Questions for [County] County Bail

### Who do I call?
[239-332-2245](tel:+12393322245). Spanish: [727-295-2245](tel:+17272952245).

### Where is Shamrock's office?
1528 Broadway, Fort Myers, FL 33901. That is our office, not the [County] County jail.
""",
        "faq": f"""# {h1}

## General Bail & Arrest Questions

### What is a bail bond?
A bail bond is a surety contract. The surety posts the defendant's bond with the jail. A licensed agent explains the agreement before anyone signs.

### Which phone do I call?
English [239-332-2245](tel:+12393322245). Spanish [727-295-2245](tel:+17272952245). Text [239-955-0178](sms:+12399550178). Email admin@shamrockbailbonds.biz.

## Cost & Payment Plan Questions

### How much does the bond cost?
Florida Statute § 648.24 sets the premium at 10% of the bond, with a $100 minimum per charge. We explain any payment schedule before you sign. The premium is not returned when the case ends.

## Cosigner & Collateral Questions

### Who can cosign?
An adult indemnitor who agrees to the contract. We do not pick the indemnitor for the family.

### Is collateral always required?
No. If the surety requires collateral, we say what it is before you pledge it.

## Court Appearances & Bond Release Questions

### Who decides when the defendant leaves the jail?
The court and the jail. Shamrock posts a bond the court has allowed after the paperwork and premium are in place. We do not give a clock time for release.

### What if there is no bond?
We tell you. A hold or a "no bond" entry means we cannot post a bond until the court changes that.

## Still Have Questions? Speak with an Agent 24/7

Call 239-332-2245 any time. The office at 1528 Broadway, Fort Myers, FL 33901 is open for walk-ins Monday through Friday, 9 AM to 5 PM.
""",
        "portal-landing": f"""# {h1}

This page signs an existing client in. It does not take a new bond application.

## Access Your Case Information

Choose defendant or indemnitor. Enter the email or mobile number that is already on the case. We send one link to that contact. The role tabs only choose the screen you see. The link itself is the same secure login.

## How Passwordless Magic Link Login Works

`sendMagicLinkSimplified` accepts one email address or one phone number. Open the link on the same phone. It expires. If it expires, request another. Do not share the link.

## What You Can Do Inside the Client Portal

Defendants see court dates and check-in. Indemnitors see the premium schedule and receipts. Signing packets are issued by staff in Super CRM. This page does not create a DocuSeal packet.

## Need Help Accessing Your Case?

Call [239-332-2245](tel:+12393322245) or text [239-955-0178](sms:+12399550178). Spanish: [727-295-2245](tel:+17272952245). Email admin@shamrockbailbonds.biz. Walk-in hours at 1528 Broadway, Fort Myers, are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
        "portal-defendant": f"""# {h1}

You are signed in as the defendant. This screen is your case file, not a sales page.

## Your Current Bond Status

The status shown here is the status staff saved on the case. If it looks wrong, call [239-332-2245](tel:+12393322245) before you travel. Do not assume a blank field means the bond is closed.

## Upcoming Court Dates & Appearance Notices

Read the date, time, and courtroom on this dashboard. If a date is missing, call the desk. Missing court can forfeit the bond. The office cannot move a judge's date.

## Weekly Check-In Submission

If your agreement requires a check-in, submit it on this page on the day the agreement names. A check-in is a report. It does not replace a court appearance.

## Contact Your Supervising Bondsman

Call [239-332-2245](tel:+12393322245), text [239-955-0178](sms:+12399550178), or email admin@shamrockbailbonds.biz. Spanish: [727-295-2245](tel:+17272952245). The Fort Myers office at 1528 Broadway is open for walk-ins Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
        "portal-indemnitor": f"""# {h1}

You are signed in as the indemnitor or cosigner. This screen is the account you signed for. It is not a new-bond sales page.

## Defendant Case & Compliance Status

You can see whether the defendant has a court date on file and whether a required check-in was submitted. You cannot change the court's date from this page. Call [239-332-2245](tel:+12393322245) if the status does not match the paperwork you signed.

## Premium Payment Schedule & Online Payments

The schedule lists the statutory premium and any payment dates staff entered. A payment link is sent when you ask for one. Paying the premium does not end the indemnity agreement.

## Signed Documents & Collateral Receipts

Signed packets and receipts appear here after staff issue them from Super CRM. This dashboard does not create a signing link. If a document is missing, email admin@shamrockbailbonds.biz.

## Important Indemnitor Legal Reminders

You agreed the defendant will appear in court. Collateral, if you pledged it, stays in place until the surety releases it. Stopping texts (text STOP to 239-955-0178) does not cancel the agreement.

## Need Assistance with Your Account?

Call [239-332-2245](tel:+12393322245). Spanish: [727-295-2245](tel:+17272952245). Text: [239-955-0178](sms:+12399550178). Walk-in hours at 1528 Broadway, Fort Myers, FL 33901 are Monday through Friday, 9 AM to 5 PM. Phones are answered 24/7.
""",
    }
    audience = {
        "bail-school": "Someone studying for a Florida limited surety agent license.",
        "testimonials": "A reader looking for real client feedback.",
        "portal-landing": "A defendant or indemnitor who already has a case file.",
        "portal-defendant": "A signed-in defendant.",
        "portal-indemnitor": "A signed-in indemnitor or cosigner.",
        "county-template": "The Studio builder filling one county page.",
        "faq": "A person comparing bail questions before they call.",
        "contact": "A person who needs the phone, the office, or the form.",
        "about": "A person who wants to know who runs the agency.",
        "first-appearance": "A family trying to understand the first court hearing.",
        "how-bail-works": "A family learning the Florida bail process.",
        "florida-bail-bonds-1": "A person choosing the Florida county where the arrest happened.",
        "home": "A family in Southwest Florida who needs a bondsman.",
    }
    notes = {
        "bail-school": "Course facts only. No license or job promise. No price on the 120-hour or 20-hour course. Both are pending course approval.",
        "testimonials": "Do not invent quotes, names, or star ratings.",
        "portal-landing": "Login help. Not a sales page.",
        "portal-defendant": "Case dashboard. Not a sales page.",
        "portal-indemnitor": "Account dashboard. Not a sales page.",
        "county-template": "Use catalog fields. Do not invent a street address.",
        "faq": "Plain answers. No release-time claims.",
        "contact": "Canonical NAP only.",
        "about": "Office history and license. No invented biography.",
        "first-appearance": "The 24-hour rule is the court's rule, not a Shamrock time estimate.",
        "how-bail-works": "Process and statutory premium. No release-time claims.",
        "florida-bail-bonds-1": "Directory instructions. Publish only sourced streets.",
        "home": "Fort Myers office first. No release-time claims.",
    }
    body = bodies[page]
    return draft_banner(page, spec, audience[page], notes[page]) + body.strip() + "\n"

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

        if spec.get("page_type") == "legal":
            content_draft = legal_content_draft(p, spec)
        else:
            content_draft = page_content_draft(p, spec)

        with open(os.path.join(CONTENT_DIR, f"{p}.md"), "w", encoding="utf-8") as f:
            f.write(content_draft)

    print(f"Generated 17 SEO specs in {SEO_DIR}/ and 17 content drafts in {CONTENT_DIR}/")

if __name__ == "__main__":
    write_specs_and_content()
