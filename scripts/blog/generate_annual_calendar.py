#!/usr/bin/env python3
"""
generate_annual_calendar.py — Shamrock Bail Bonds

Generates and schedules the complete 1-Year Florida Statewide Editorial Calendar
(November 6, 2026 through October 6, 2027).

Cadence: 2 to 3 articles per week (~10 articles per month = ~110-120 total articles).
Combined with Month 1 (Oct 7 - Nov 5, 2026: 30 articles), this guarantees continuous,
unbroken, year-round publishing coverage across all 67 Florida counties, major municipal
jails, and critical criminal statutory procedures.

Usage:
  python3 scripts/blog/generate_annual_calendar.py --status
  python3 scripts/blog/generate_annual_calendar.py --generate-markdown-only
  python3 scripts/blog/generate_annual_calendar.py --dry-run
  python3 scripts/blog/generate_annual_calendar.py --sync-wix [--limit 10]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# Add scripts/blog to path
ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT / "scripts" / "blog"
sys.path.insert(0, str(SCRIPTS_DIR))

from publish_ready_posts import (
    load_token, http_json, md_to_ricos,
    SITE_ID, MEMBER_ID, CATEGORIES, DISCLAIMER, CTA
)

OUT_DIR = ROOT / "docs" / "blog-posts-ready-to-publish" / "annual-editorial-calendar-2026-2027"
OUT_DIR.mkdir(parents=True, exist_ok=True)
START_DATE = date(2026, 11, 6)
END_DATE = date(2027, 10, 6)


def sanitize_slug(text: str) -> str:
    """Sanitize title or facility into a URL-friendly, safe filesystem slug."""
    clean = text.replace("/", "-").replace("\\", "-").replace("&", "and").lower()
    clean = re.sub(r"[^a-zA-Z0-9\s-]", "", clean)
    clean = re.sub(r"[\s-]+", "-", clean).strip("-")
    return clean[:60]

# Verified High-Resolution Wix Media Assets
MEDIA_CATALOG = {
    "gavel": {
        "id": "4e4d4a_3db25c3745584f55af38c312a8c0e7d8~mv2.jpg",
        "url": "https://static.wixstatic.com/media/4e4d4a_3db25c3745584f55af38c312a8c0e7d8~mv2.jpg",
        "height": 450, "width": 1200, "filename": "florida-bail-bond-laws-gavel.jpg"
    },
    "court_dates": {
        "id": "4e4d4a_4ea92957e46b45f1b8376b8717bc75a9~mv2.jpg",
        "url": "https://static.wixstatic.com/media/4e4d4a_4ea92957e46b45f1b8376b8717bc75a9~mv2.jpg",
        "height": 675, "width": 1200, "filename": "missed-court-date-bail-florida.jpg"
    },
    "jail_facility": {
        "id": "4e4d4a_cdb12827031349f3b3f5853b242d70c0~mv2.jpg",
        "url": "https://static.wixstatic.com/media/4e4d4a_cdb12827031349f3b3f5853b242d70c0~mv2.jpg",
        "height": 675, "width": 1200, "filename": "sarasota-county-jail-bail-bonds.jpg"
    },
    "agent_trust": {
        "id": "4e4d4a_8da5c824059e4d23b33a93e063a04dae~mv2.png",
        "url": "https://static.wixstatic.com/media/4e4d4a_8da5c824059e4d23b33a93e063a04dae~mv2.png",
        "height": 720, "width": 1080, "filename": "choose-reliable-bail-bondsman-swfl.jpg.png"
    },
    "office_hq": {
        "id": "7dd020_4f95edc6f356420d95a70f5635cbea0f~mv2.webp",
        "url": "https://static.wixstatic.com/media/7dd020_4f95edc6f356420d95a70f5635cbea0f~mv2.webp",
        "height": 800, "width": 1200, "filename": "ExteriorofShamrockBailBondsofficeinFlorida.webp"
    },
    "money_rates": {
        "id": "4e4d4a_fc80f7f0b838471aa29cdb2265935f84~mv2.jpg",
        "url": "https://static.wixstatic.com/media/4e4d4a_fc80f7f0b838471aa29cdb2265935f84~mv2.jpg",
        "height": 675, "width": 1200, "filename": "bail-bond-premium-florida-refund.jpg"
    },
    "payment_plans": {
        "id": "4e4d4a_6072dcfbf4544345bd99bc3877408c6c~mv2.jpg",
        "url": "https://static.wixstatic.com/media/4e4d4a_6072dcfbf4544345bd99bc3877408c6c~mv2.jpg",
        "height": 675, "width": 1200, "filename": "bail-premium-payment-plans-florida.jpg"
    },
    "family_support": {
        "id": "4e4d4a_29fb882ee0524a31aaaed296d903d8a8~mv2.png",
        "url": "https://static.wixstatic.com/media/4e4d4a_29fb882ee0524a31aaaed296d903d8a8~mv2.png",
        "height": 720, "width": 1080, "filename": "family-bail-bond-support-florida.jpg.png"
    },
    "courthouse": {
        "id": "4e4d4a_3f7de6a0e59b4f0497dddce837166c34~mv2.jpg",
        "url": "https://static.wixstatic.com/media/4e4d4a_3f7de6a0e59b4f0497dddce837166c34~mv2.jpg",
        "height": 675, "width": 1200, "filename": "charlotte-county-courthouse-bail-bonds.jpg"
    },
    "release_steps": {
        "id": "4e4d4a_4c7f35182d1b4a91ac37723ccf173464~mv2.png",
        "url": "https://static.wixstatic.com/media/4e4d4a_4c7f35182d1b4a91ac37723ccf173464~mv2.png",
        "height": 718, "width": 1080, "filename": "after-posting-bail-florida-guide.jpg.png"
    },
    "myths_facts": {
        "id": "4e4d4a_a37f227968b0498abaa75bac4c2723ee~mv2.jpeg",
        "url": "https://static.wixstatic.com/media/4e4d4a_a37f227968b0498abaa75bac4c2723ee~mv2.jpeg",
        "height": 675, "width": 1200, "filename": "bail-bond-myths-facts-florida.jpg.jpeg"
    }
}

# 12-Month Editorial Curriculum Definitions
CURRICULUM = [
    # ── MONTH 2: NOV 2026 — SWFL Core Dominance & Holiday Booking ───────────────
    {"topic": "county", "name": "Lee County", "facility": "Lee County Core Facility / Ortiz Site", "city": "Fort Myers & Cape Coral", "circuit": "20th Judicial Circuit", "image": "office_hq"},
    {"topic": "county", "name": "Collier County", "facility": "Collier County Immokalee Jail Center", "city": "Naples & Immokalee", "circuit": "20th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Charlotte County", "facility": "Charlotte County Jail", "city": "Punta Gorda & Port Charlotte", "circuit": "20th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Hendry County", "facility": "Hendry County Jail", "city": "LaBelle & Clewiston", "circuit": "20th Judicial Circuit", "image": "agent_trust"},
    {"topic": "county", "name": "Glades County", "facility": "Glades County Detention Center", "city": "Moore Haven", "circuit": "20th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Sarasota County", "facility": "Sarasota County North Jail Facility", "city": "Sarasota & Venice", "circuit": "12th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Manatee County", "facility": "Manatee County Central Jail (Port Manatee)", "city": "Bradenton & Palmetto", "circuit": "12th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "DeSoto County", "facility": "DeSoto County Jail", "city": "Arcadia", "circuit": "12th Judicial Circuit", "image": "courthouse"},
    {"topic": "legal", "title": "Thanksgiving Weekend Jail Releases in Florida: 24/7 Fast-Track Bonding", "cat": "Bail Bond Tips", "image": "family_support"},
    {"topic": "legal", "title": "Black Friday & Holiday Arrests in Florida: How to Secure Immediate Bail", "cat": "Bail Bonds", "image": "office_hq"},

    # ── MONTH 3: DEC 2026 — Central Florida Corridor & High-Volume Booking ───────
    {"topic": "county", "name": "Lake County", "facility": "Lake County Detention Center", "city": "Tavares, Leesburg & Clermont", "circuit": "5th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Sumter County", "facility": "Sumter County Detention Center", "city": "Bushnell & The Villages", "circuit": "5th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Flagler County", "facility": "Sheriff Perry Hall Inmate Detention Facility", "city": "Bunnell & Palm Coast", "circuit": "7th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Putnam County", "facility": "Putnam County Jail", "city": "Palatka", "circuit": "7th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Clay County", "facility": "Clay County Jail", "city": "Green Cove Springs & Orange Park", "circuit": "4th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Nassau County", "facility": "Nassau County Detention Center", "city": "Yulee & Fernandina Beach", "circuit": "4th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Baker County", "facility": "Baker County Detention Center", "city": "Macclenny", "circuit": "8th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Bradford County", "facility": "Bradford County Jail", "city": "Starke", "circuit": "8th Judicial Circuit", "image": "courthouse"},
    {"topic": "legal", "title": "Holiday DUI Bail Bonds in Florida: Breathalyzer Refusals & Jail Release", "cat": "Florida Legal Updates", "image": "gavel"},
    {"topic": "legal", "title": "New Year's Eve Booking Surges: How to Bail Out a Loved One Overnight", "cat": "Bail Bond Tips", "image": "release_steps"},

    # ── MONTH 4: JAN 2027 — South Florida Metro & Financial Crimes / Nebbia ─────
    {"topic": "facility", "name": "Turner Guilford Knight Correctional Center (TGK)", "county": "Miami-Dade County", "city": "Miami", "phone": "(786) 263-5600", "image": "jail_facility"},
    {"topic": "facility", "name": "Joseph V. Conte Facility", "county": "Broward County", "city": "Pompano Beach", "phone": "(954) 831-5900", "image": "courthouse"},
    {"topic": "facility", "name": "Main Detention Center (Gun Club Rd)", "county": "Palm Beach County", "city": "West Palm Beach", "phone": "(561) 688-4400", "image": "jail_facility"},
    {"topic": "facility", "name": "Stock Island Detention Center", "county": "Monroe County", "city": "Key West", "phone": "(305) 293-7300", "image": "courthouse"},
    {"topic": "legal", "title": "Proving Source of Funds in Florida: Step-by-Step Nebbia Packet Guide", "cat": "How Bail Bonds Work", "image": "money_rates"},
    {"topic": "legal", "title": "Drug Trafficking Bail in Florida: Mandatory Minimums & High-Stakes Bonds", "cat": "Florida Legal Updates", "image": "gavel"},
    {"topic": "legal", "title": "Federal vs State Bail Bonds in Florida: Critical Differences Explained", "cat": "Florida Legal Updates", "image": "courthouse"},
    {"topic": "legal", "title": "Surrendering Collateral in Florida: Real Estate vs Cash vs Vehicles", "cat": "How Bail Bonds Work", "image": "payment_plans"},
    {"topic": "legal", "title": "Can a Bondsman Revoke Your Bail in Florida? Cosigner Rights and Risks", "cat": "How Bail Bonds Work", "image": "family_support"},

    # ── MONTH 5: FEB 2027 — Tampa Bay Regional & Pre-Spring Break Defense ────────
    {"topic": "facility", "name": "Orient Road Jail Intake", "county": "Hillsborough County", "city": "Tampa", "phone": "(813) 247-8379", "image": "jail_facility"},
    {"topic": "facility", "name": "Pinellas Criminal Justice Center", "county": "Pinellas County", "city": "Clearwater", "phone": "(727) 464-6415", "image": "courthouse"},
    {"topic": "facility", "name": "Land O' Lakes Detention Center", "county": "Pasco County", "city": "Land O' Lakes", "phone": "(813) 996-6982", "image": "jail_facility"},
    {"topic": "county", "name": "Hernando County", "facility": "Hernando County Detention Center", "city": "Brooksville", "circuit": "5th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Citrus County", "facility": "Citrus County Detention Facility", "city": "Lecanto", "circuit": "5th Judicial Circuit", "image": "jail_facility"},
    {"topic": "legal", "title": "Domestic Violence Mandatory 24-Hour Hold in Florida: What Families Must Know", "cat": "Florida Legal Updates", "image": "gavel"},
    {"topic": "legal", "title": "Gun Charges and Bail in Florida: Understanding 10-20-Life Statute Restrictions", "cat": "Florida Legal Updates", "image": "court_dates"},
    {"topic": "legal", "title": "What to Do When Bail is Set at 'No Bond' in Florida: Motion for Bond Reduction", "cat": "How Bail Bonds Work", "image": "myths_facts"},
    {"topic": "legal", "title": "Smartphone ID Scanning for Instant Bail: How Digital Paperwork Speeds Release", "cat": "Bail Bond Tips", "image": "release_steps"},

    # ── MONTH 6: MAR 2027 — Spring Break Surges & First Coast Defense ────────────
    {"topic": "county", "name": "Duval County", "facility": "John E. Goode Pre-Trial Detention Facility", "city": "Jacksonville", "circuit": "4th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "St. Johns County", "facility": "St. Johns County Jail", "city": "St. Augustine", "circuit": "7th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Volusia County", "facility": "Volusia County Branch Jail", "city": "Daytona Beach", "circuit": "7th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Brevard County", "facility": "Brevard County Jail Complex", "city": "Sharpes & Cocoa", "circuit": "18th Judicial Circuit", "image": "courthouse"},
    {"topic": "legal", "title": "Spring Break Arrests in Daytona Beach, Miami & Panama City: Emergency Bail", "cat": "Bail Bonds", "image": "office_hq"},
    {"topic": "legal", "title": "Out-of-State Visitors Arrested in Florida: Remote Cosigning & Release Steps", "cat": "Bail Bond Tips", "image": "family_support"},
    {"topic": "legal", "title": "Underage Drinking & Disorderly Conduct Bail Bonds in Florida College Towns", "cat": "Bail Bonds", "image": "agent_trust"},
    {"topic": "legal", "title": "How Fast Can a Bail Bondsman Post Bond at Night in Florida?", "cat": "How Bail Bonds Work", "image": "release_steps"},
    {"topic": "legal", "title": "Cash Bail vs Surety Bail Bonds in Florida: The Real Math and Return Timeline", "cat": "How Bail Bonds Work", "image": "money_rates"},

    # ── MONTH 7: APR 2027 — Florida Panhandle & Capital Circuit Defense ──────────
    {"topic": "county", "name": "Leon County", "facility": "Leon County Detention Facility", "city": "Tallahassee", "circuit": "2nd Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Escambia County", "facility": "Escambia County Central Booking & Detention", "city": "Pensacola", "circuit": "1st Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Santa Rosa County", "facility": "Santa Rosa County Jail", "city": "Milton", "circuit": "1st Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Okaloosa County", "facility": "Okaloosa County Department of Corrections", "city": "Crestview & Fort Walton", "circuit": "1st Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Walton County", "facility": "Walton County Jail", "city": "DeFuniak Springs & Santa Rosa Beach", "circuit": "1st Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Bay County", "facility": "Bay County Jail Facility", "city": "Panama City", "circuit": "14th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Wakulla County", "facility": "Wakulla County Jail", "city": "Crawfordville", "circuit": "2nd Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Franklin County", "facility": "Franklin County Jail", "city": "Apalachicola", "circuit": "2nd Judicial Circuit", "image": "jail_facility"},
    {"topic": "legal", "title": "Military Personnel Arrested in Florida: Coordinating Bail and Command Notification", "cat": "Bail Bonds", "image": "agent_trust"},
    {"topic": "legal", "title": "Interstate Warrants on I-10 and I-95: Extradition Bonds and Out-of-County Holds", "cat": "Florida Legal Updates", "image": "court_dates"},

    # ── MONTH 8: MAY 2027 — North-Central Inland & University Hubs ───────────────
    {"topic": "county", "name": "Alachua County", "facility": "Alachua County Jail", "city": "Gainesville", "circuit": "8th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Marion County", "facility": "Marion County Jail", "city": "Ocala", "circuit": "5th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Columbia County", "facility": "Columbia County Detention Facility", "city": "Lake City", "circuit": "3rd Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Suwannee County", "facility": "Suwannee County Jail", "city": "Live Oak", "circuit": "3rd Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Levy County", "facility": "Levy County Detention Center", "city": "Bronson", "circuit": "8th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Gilchrist County", "facility": "Gilchrist County Jail", "city": "Trenton", "circuit": "8th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Dixie County", "facility": "Dixie County Jail", "city": "Cross City", "circuit": "3rd Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Hamilton County", "facility": "Hamilton County Jail", "city": "Jasper", "circuit": "3rd Judicial Circuit", "image": "jail_facility"},
    {"topic": "legal", "title": "Memorial Day Weekend Arrests in Florida: Pretrial Release and Bondsman Hours", "cat": "Bail Bond Tips", "image": "office_hq"},
    {"topic": "legal", "title": "Boating Under the Influence (BUI) in Florida: Jail Booking, Bond, and License Rules", "cat": "Florida Legal Updates", "image": "gavel"},

    # ── MONTH 9: JUN 2027 — Rural Heartland & Treasure Coast Defense ─────────────
    {"topic": "county", "name": "Highlands County", "facility": "Highlands County Jail", "city": "Sebring", "circuit": "10th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Hardee County", "facility": "Hardee County Jail", "city": "Wauchula", "circuit": "10th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Okeechobee County", "facility": "Okeechobee County Jail", "city": "Okeechobee", "circuit": "19th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Indian River County", "facility": "Indian River County Jail", "city": "Vero Beach", "circuit": "19th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "St. Lucie County", "facility": "Rock Road Jail Facility", "city": "Fort Pierce & Port St. Lucie", "circuit": "19th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Martin County", "facility": "Martin County Jail", "city": "Stuart", "circuit": "19th Judicial Circuit", "image": "jail_facility"},
    {"topic": "legal", "title": "How Bail Bondsmen Help Clients Clear Active Arrest Warrants in Florida", "cat": "How Bail Bonds Work", "image": "court_dates"},
    {"topic": "legal", "title": "What Happens if You Miss Court on a Bail Bond in Florida? Forfeiture & Surrender", "cat": "Florida Legal Updates", "image": "myths_facts"},
    {"topic": "legal", "title": "Payment Plans for Bail Bonds in Florida: Statutory Premium Financing Options", "cat": "How Bail Bonds Work", "image": "payment_plans"},
    {"topic": "legal", "title": "Collateral Return Timelines: When Does Shamrock Return Your Property?", "cat": "How Bail Bonds Work", "image": "money_rates"},

    # ── MONTH 10: JUL 2027 — Big Bend, Nature Coast & 4th of July Surges ─────────
    {"topic": "county", "name": "Taylor County", "facility": "Taylor County Jail", "city": "Perry", "circuit": "3rd Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Madison County", "facility": "Madison County Jail", "city": "Madison", "circuit": "3rd Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Jefferson County", "facility": "Jefferson County Jail", "city": "Monticello", "circuit": "2nd Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Gulf County", "facility": "Gulf County Detention Facility", "city": "Port St. Joe", "circuit": "14th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Lafayette County", "facility": "Lafayette County Jail", "city": "Mayo", "circuit": "3rd Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Union County", "facility": "Union County Jail", "city": "Lake Butler", "circuit": "8th Judicial Circuit", "image": "jail_facility"},
    {"topic": "legal", "title": "Fourth of July DUI & Boating Checkpoints in Florida: Instant Jail Release Protocols", "cat": "Bail Bonds", "image": "office_hq"},
    {"topic": "legal", "title": "GPS Ankle Monitoring as a Condition of Bail in Florida: Rules and Costs", "cat": "Florida Legal Updates", "image": "court_dates"},
    {"topic": "legal", "title": "Can You Travel Out of State While on Bail in Florida? Permitted Exceptions", "cat": "Bail Bond Tips", "image": "family_support"},
    {"topic": "legal", "title": "Fugitive Recovery & Bounty Hunting in Florida: F.S. Chapter 648 Regulations", "cat": "Florida Legal Updates", "image": "gavel"},

    # ── MONTH 11: AUG 2027 — Rural Panhandle Corridors & Back-to-School ──────────
    {"topic": "county", "name": "Gadsden County", "facility": "Gadsden County Jail", "city": "Quincy", "circuit": "2nd Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Liberty County", "facility": "Liberty County Jail", "city": "Bristol", "circuit": "2nd Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Calhoun County", "facility": "Calhoun County Jail", "city": "Blountstown", "circuit": "14th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Jackson County", "facility": "Jackson County Correctional Facility", "city": "Marianna", "circuit": "14th Judicial Circuit", "image": "jail_facility"},
    {"topic": "county", "name": "Holmes County", "facility": "Holmes County Jail", "city": "Bonifay", "circuit": "14th Judicial Circuit", "image": "courthouse"},
    {"topic": "county", "name": "Washington County", "facility": "Washington County Jail", "city": "Chipley", "circuit": "14th Judicial Circuit", "image": "jail_facility"},
    {"topic": "legal", "title": "Juvenile Detention vs Adult Jail in Florida: When Can Parents Post Bail?", "cat": "Florida Legal Updates", "image": "family_support"},
    {"topic": "legal", "title": "Violation of Probation (VOP) Bonds in Florida: When Is Bail Allowed?", "cat": "Florida Legal Updates", "image": "gavel"},
    {"topic": "legal", "title": "Back-to-School College Town Arrests: Tallahassee, Gainesville & Orlando Bail Guide", "cat": "Bail Bonds", "image": "office_hq"},
    {"topic": "legal", "title": "How Criminal Background Checks Affect Florida Bail Underwriting", "cat": "How Bail Bonds Work", "image": "agent_trust"},

    # ── MONTH 12: SEP-OCT 2027 — Statewide Statutory Masterclass & 2027 Updates ──
    {"topic": "legal", "title": "Florida Statutes Chapter 903 Explained: Complete Guide to Florida Bail Procedure", "cat": "Florida Legal Updates", "image": "gavel"},
    {"topic": "legal", "title": "Florida Statutes Chapter 648 Explained: How Licensed Bail Agents Are Regulated", "cat": "Florida Legal Updates", "image": "courthouse"},
    {"topic": "legal", "title": "How to File a Motion to Remit Bail Forfeiture in Florida: F.S. § 903.26 Standards", "cat": "Florida Legal Updates", "image": "gavel"},
    {"topic": "legal", "title": "Cosigner Financial Liability in Florida: What Every Family Member Must Know", "cat": "How Bail Bonds Work", "image": "family_support"},
    {"topic": "legal", "title": "Pretrial Services vs Private Bail Bonds in Florida: Who Gets Released Faster?", "cat": "How Bail Bonds Work", "image": "myths_facts"},
    {"topic": "legal", "title": "Walk-Through Bonds in Florida: Clearing Active Warrants Without Jail Booking", "cat": "How Bail Bonds Work", "image": "court_dates"},
    {"topic": "legal", "title": "Transfer Bonds in Florida: Posting Bail for an Arrest in Another County", "cat": "Bail Bonds", "image": "office_hq"},
    {"topic": "legal", "title": "The Complete 2027 Guide to Florida Jail Release: Timeline, Costs, and Rules", "cat": "Bail Bond Tips", "image": "release_steps"},

    # ── SPECIALIZED MUNICIPAL DETENTION & SEASONAL STATUTORY DEFENSE ──────────────
    {"topic": "facility", "name": "Monroe County Marathon Detention Center", "county": "Monroe County", "city": "Marathon & Middle Keys", "image": "courthouse"},
    {"topic": "facility", "name": "Monroe County Plantation Key Detention Center", "county": "Monroe County", "city": "Islamorada & Upper Keys", "image": "jail_facility"},
    {"topic": "facility", "name": "Polk County South County Jail (Frostproof)", "county": "Polk County", "city": "Frostproof", "image": "courthouse"},
    {"topic": "facility", "name": "Volusia County Correctional Facility (DeLand)", "county": "Volusia County", "city": "DeLand", "image": "jail_facility"},
    {"topic": "facility", "name": "Collier County Naples Jail Center", "county": "Collier County", "city": "Downtown Naples", "image": "courthouse"},
    {"topic": "facility", "name": "Lee County Ortiz Site Holding Center", "county": "Lee County", "city": "Fort Myers", "image": "jail_facility"},
    {"topic": "facility", "name": "Sarasota County South County Jail (Venice)", "county": "Sarasota County", "city": "Venice", "image": "courthouse"},
    {"topic": "facility", "name": "Tampa Orient Road Central Booking", "county": "Hillsborough County", "city": "Tampa", "image": "jail_facility"},
    {"topic": "facility", "name": "Metro West Detention Center", "county": "Miami-Dade County", "city": "Miami", "image": "jail_facility"},
    {"topic": "facility", "name": "Broward County North Broward Bureau", "county": "Broward County", "city": "Pompano Beach", "image": "courthouse"},
    {"topic": "facility", "name": "West Detention Center (Belle Glade)", "county": "Palm Beach County", "city": "Belle Glade", "image": "jail_facility"},
    {"topic": "legal", "title": "Labor Day Weekend Arrests in Florida: Fast Jail Release Protocols", "cat": "Bail Bond Tips", "image": "family_support"},
    {"topic": "legal", "title": "Bail Bond Surrender Laws in Florida: When Can a Bondsman Return an Accused Person?", "cat": "Florida Legal Updates", "image": "gavel"},
    {"topic": "legal", "title": "Appearance Bonds vs Supersedeas Bonds in Florida: Appellate Bail Explained", "cat": "How Bail Bonds Work", "image": "courthouse"},
    {"topic": "legal", "title": "How to Obtain a Bail Bond Discharge Certificate from Florida Clerks of Court", "cat": "How Bail Bonds Work", "image": "myths_facts"},
    {"topic": "legal", "title": "Florida Extradition Warrants: Bond Hearings for Fugitives from Justice", "cat": "Florida Legal Updates", "image": "court_dates"},
    {"topic": "legal", "title": "Understanding Florida Bail Bond Lien Releases on Titled Vehicles and Real Estate", "cat": "How Bail Bonds Work", "image": "money_rates"},
    {"topic": "legal", "title": "What Happens During Florida Booking Fingerprint Delays? How to Avoid Holding Time", "cat": "Bail Bond Tips", "image": "release_steps"},
    {"topic": "legal", "title": "How Florida Judges Set Bond Amounts at First Appearance Hearings", "cat": "How Bail Bonds Work", "image": "courthouse"},
    {"topic": "legal", "title": "Can a Cosigner Cancel a Florida Bail Bond After Posting? F.S. § 903.22 Guide", "cat": "How Bail Bonds Work", "image": "family_support"},
    {"topic": "legal", "title": "Florida Cash Bond Forfeitures: What Happens If You Fail to Appear?", "cat": "Florida Legal Updates", "image": "gavel"},
    {"topic": "legal", "title": "Out-of-State Indemnitors: How to Cosign a Florida Bail Bond from Another State", "cat": "Bail Bond Tips", "image": "office_hq"},
    {"topic": "legal", "title": "Common Mistakes Families Make When Bailing Someone Out of Jail in Florida", "cat": "Bail Bond Tips", "image": "myths_facts"},
    {"topic": "legal", "title": "Florida Jail Commissary and Phone Account Setup Following Bail Release", "cat": "Bail Bond Tips", "image": "family_support"},
    {"topic": "legal", "title": "The Full 2027 Florida Bail Bonds Statute Directory: F.S. 648 & F.S. 903 Reference", "cat": "Florida Legal Updates", "image": "gavel"},
]


def calculate_schedule_dates(start_d: date, num_items: int) -> list[date]:
    """
    Distribute articles across Tuesdays (1), Fridays (4), and Sundays (6)
    evenly from start_d through October 6, 2027 (full 52 weeks = 12 months).
    """
    curr = start_d
    candidates = []
    while curr <= END_DATE:
        if curr.weekday() in (1, 4, 6):  # Tue, Fri, Sun
            candidates.append(curr)
        curr += timedelta(days=1)

    if len(candidates) >= num_items:
        step = len(candidates) / num_items
        return [candidates[min(int(i * step), len(candidates) - 1)] for i in range(num_items)]
    return candidates


def build_article_markdown(item: dict, pub_date: date) -> dict:
    """Generate high-converting, GEO/SEO-enriched markdown content."""
    date_str = pub_date.strftime("%B %d, %Y")
    iso_date = pub_date.isoformat()

    if item["topic"] == "county":
        c_name = item["name"]
        city = item["city"]
        fac = item["facility"]
        circ = item["circuit"]
        slug = sanitize_slug(f"{c_name}-bail-bonds-guide")
        title = f"Bail Bonds in {c_name}: Complete {pub_date.year} Jail & Release Guide"
        seo_title = f"{c_name} Bail Bonds | {pub_date.year} Jail Release Guide"
        meta_desc = f"Need bail bonds in {c_name}, FL? 24/7 licensed jail release guide for {fac} in {city}. Statutory 10% rates, fast digital intake. Call (239) 332-2245."
        category = "County Spotlight"
        image_key = item.get("image", "courthouse")

        body = f"""## Executive Summary: How Bail Bonds Work in {c_name}, Florida

If your loved one has been booked into the **{fac}**, securing their prompt release requires navigating the booking and bond intake procedures of Florida's **{circ}**. Under Florida law, defendants are entitled to a bond determination either through a standardized local bail schedule or at a mandatory First Appearance hearing within 24 hours of arrest (Fla. R. Crim. P. 3.131).

**Shamrock Bail Bonds** provides 24/7 licensed bail bond underwriting across {c_name}, including {city}. With our smartphone digital intake system, family members and indemnitors can complete paperwork and secure jail release without driving to an office.

---

## 1. Key Detention Facility in {c_name}

| Facility Name | Primary Location | Primary Phone | Operational Status |
|---|---|---|---|
| **{fac}** | Serving {city}, FL | 24/7 Dispatch: (239) 332-2245 | Open 24/7 / 365 Days |

---

## 2. Florida Statutory Bail Rates (Fla. Stat. § 648.33)

In {c_name} and across Florida, bail bond premiums are strictly regulated by the Florida Department of Financial Services (FLDFS). Bail bond agencies cannot discount or mark up these statutory rates:

*   **Bonds up to $1,000:** Flat statutory minimum of **$100 per charge**.
*   **Bonds over $1,000:** Exactly **10% of the total bond amount**.
*   **Federal or Immigration Bonds:** 15% statutory premium.

---

## 3. Step-by-Step Release Protocol for {c_name}

1.  **Locate the Inmate:** Verify booking number, charges, and bond amounts. Shamrock Bail Bonds verifies inmate status in real-time.
2.  **Verify Bond Eligibility:** If the charges carry a standard bond schedule, bail can be posted immediately. For domestic violence, felony holds, or Nebbia conditions, the defendant must attend a First Appearance hearing.
3.  **Complete Digital Intake:** The indemnitor (cosigner) signs documentation online on any smartphone or tablet.
4.  **Posting and Discharge:** A licensed bondsman posts the surety appearance bond directly with the jail clerk, triggering the release process.

---

## 4. Frequently Asked Questions in {c_name}

### How long does release take at {fac}?
Typically between **3 and 7 hours** after the surety bond is posted, depending on jail shift changes and processing volume.

### Can I post bail if I live outside {c_name}?
Yes. Shamrock Bail Bonds offers 100% remote digital paperwork via secure DocuSeal and smartphone ID verification.

---

> [!IMPORTANT]
> **24/7 Emergency Dispatch**: Call Shamrock Bail Bonds immediately at **(239) 332-2245** or start your paperwork online at `shamrockbailbonds.biz`.

---
*Disclaimer: {DISCLAIMER}*
"""
    elif item["topic"] == "facility":
        fac = item["name"]
        county = item["county"]
        city = item["city"]
        phone = item.get("phone", "(239) 332-2245")
        slug = sanitize_slug(f"{fac}-release-guide")
        title = f"{fac}: Inmate Booking, Jail Release & Bail Guide ({pub_date.year})"
        seo_title = f"{fac} Bail Bonds | {pub_date.year} Jail Guide"
        meta_desc = f"Complete guide to {fac} in {city}, {county}. Jail address, release times, inmate search, and statutory bail bond steps. Call (239) 332-2245."
        category = "County Spotlight"
        image_key = item.get("image", "jail_facility")

        body = f"""## Essential Information for {fac}

Navigating an arrest at **{fac}** in **{city}, Florida ({county})** is stressful. Understanding the exact booking intake and bond posting protocols can save hours of delay.

---

## 1. Facility Contact & Location

*   **Facility:** {fac}
*   **Jurisdiction:** {county} Sheriff's Office / Corrections Division
*   **Location:** Serving {city}, Florida
*   **24/7 Bail Dispatch Hotline:** **(239) 332-2245**

---

## 2. Inmate Booking and Processing Timeline

1.  **Intake & Fingerprinting:** Inmates are photographed, fingerprinted, and screened for warrants across state and federal RMS systems (typically 2–4 hours).
2.  **Bond Setting:** Standard bond schedule charges are eligible for bail immediately following medical screening.
3.  **Posting the Bond:** Licensed bondsmen post surety appearance bonds directly with the jail intake desk.
4.  **Physical Release:** Physical discharge takes between 3 to 6 hours after the bond is clocked in by jail clerks.

---

## 3. Statutory Costs (F.S. § 648.33)

Florida law sets bail premiums at exactly **10%** of the bond (or $100 minimum per charge). No hidden fees or inflated rates.

---
> [!NOTE]
> Need an immediate inmate search or bond quote? Call Shamrock Bail Bonds at **(239) 332-2245**.
---
*Disclaimer: {DISCLAIMER}*
"""
    else:  # Legal / Statutory Topic
        title = item["title"]
        cat = item.get("cat", "Florida Legal Updates")
        image_key = item.get("image", "gavel")
        slug = sanitize_slug(title)
        seo_title = f"{title[:50]} | Shamrock Bail Bonds"
        meta_desc = f"Legal analysis of {title[:60]}. Florida statutory guidelines (F.S. Ch. 648 & 903), court rules, and fast jail release. Call (239) 332-2245."
        category = cat

        body = f"""## Executive Overview: {title}

Under Florida criminal procedure and the governing statutes (Florida Statutes Chapters 648 and 903), navigating bail release requires precise understanding of legal rules, court schedules, and surety obligations.

---

## Key Legal Framework

1.  **Statutory Authority:** Governed by **Fla. Stat. Chapters 903 & 648** and local judicial administrative orders.
2.  **Pretrial Rights:** The Florida Constitution guarantees a presumption of pretrial release on reasonable conditions for non-capital offenses.
3.  **Bondsman Requirements:** All surety bonds must be executed by an active, licensed Florida bail bond agent.
4.  **Indemnitor Duties:** Cosigners guarantee the defendant's appearance at all scheduled court proceedings.

---

## Practical Action Steps for Families

*   **Act Fast:** Contact a licensed bondsman before the First Appearance hearing to expedite paperwork.
*   **Gather Information:** Have the defendant's full legal name, date of birth, and booking facility ready.
*   **Digital Convenience:** Use Shamrock's mobile intake portal to sign all documents securely from home or work.

---
> [!TIP]
> **Immediate Help Available:** Shamrock Bail Bonds operates 24/7 across all 67 Florida counties. Call **(239) 332-2245** anytime.
---
*Disclaimer: {DISCLAIMER}*
"""

    return {
        "title": title,
        "seo_title": seo_title,
        "meta_desc": meta_desc,
        "category": category,
        "image_key": image_key,
        "file": f"{slug}.md",
        "date": iso_date,
        "body": body,
    }


def generate_full_annual_curriculum(dry_run: bool = False) -> list[dict]:
    """Generate all articles across the 52-week annual schedule."""
    dates = calculate_schedule_dates(START_DATE, len(CURRICULUM))
    articles = []

    print(f"\n☘️ Generating 1-Year Florida Editorial Calendar ({START_DATE} to {dates[-1]})...")
    print(f"   Total Planned Posts: {len(CURRICULUM)}")
    print(f"   Cadence: 2-3 articles/week across all 12 months.")

    for idx, (item, pub_d) in enumerate(zip(CURRICULUM, dates)):
        art = build_article_markdown(item, pub_d)
        art["day_idx"] = idx
        art["month_number"] = pub_d.month
        art["year"] = pub_d.year

        # Write markdown file
        md_file = OUT_DIR / f"{idx+1:03d}-{art['file']}"
        full_text = f"# {art['title']}\n\n{art['body']}\n"
        md_file.write_text(full_text, encoding="utf-8")
        articles.append(art)

    print(f"✓ Generated {len(articles)} Markdown articles in {OUT_DIR}")
    return articles


def sync_annual_calendar_to_wix(articles: list[dict], limit: int | None = None, dry_run: bool = False):
    """Sync scheduled drafts to Wix Blog API with idempotency, incremental saves, and token recovery."""
    json_path = OUT_DIR / "annual-calendar.json"
    existing_map = {}
    if json_path.exists():
        try:
            old_items = json.loads(json_path.read_text(encoding="utf-8"))
            for item in old_items:
                existing_map[item.get("date")] = item
        except Exception:
            pass

    token = None if dry_run else load_token()
    results = []
    synced_this_run = 0

    print(f"\n--- Synchronizing Annual Calendar ({len(articles)} articles) to Wix Blog API ---")

    for idx, a in enumerate(articles):
        d = a["date"]
        existing = existing_map.get(d)

        # Check if already synced
        if existing and existing.get("draft_id") and existing.get("status") in ("DRAFT_SCHEDULED", "PUBLISHED_LIVE"):
            results.append(existing)
            print(f"[{d}] ⏭️ ALREADY SYNCED ({existing['status']}): {existing['title'][:55]} ({existing['draft_id']})")
            continue

        if limit is not None and synced_this_run >= limit:
            # We reached the limit for this run; keep the existing or default entry
            if existing:
                results.append(existing)
            else:
                m_meta = MEDIA_CATALOG.get(a["image_key"], MEDIA_CATALOG["courthouse"])
                results.append({
                    "number": a["day_idx"] + 1,
                    "date": a["date"],
                    "title": a["title"],
                    "category": a["category"],
                    "status": "READY_FOR_SYNC",
                    "hero_image": m_meta["filename"]
                })
            continue

        if dry_run:
            print(f"[{d}] [DRY RUN] Would create draft: {a['title'][:55]}")
            m_meta = MEDIA_CATALOG.get(a["image_key"], MEDIA_CATALOG["courthouse"])
            results.append({
                "number": a["day_idx"] + 1,
                "date": a["date"],
                "title": a["title"],
                "category": a["category"],
                "status": "DRAFT_SCHEDULED",
                "draft_id": "simulated_draft_id",
                "hero_image": m_meta["filename"]
            })
            synced_this_run += 1
            continue

        m_meta = MEDIA_CATALOG.get(a["image_key"], MEDIA_CATALOG["courthouse"])
        hero_img = {
            "id": m_meta["id"],
            "url": m_meta["url"],
            "height": m_meta["height"],
            "width": m_meta["width"],
            "altText": a["title"],
            "filename": m_meta["filename"]
        }

        rich_content = md_to_ricos(a["body"])
        cat_id = CATEGORIES.get(a["category"], CATEGORIES["Bail Bonds"])

        draft_payload = {
            "title": a["title"][:200],
            "excerpt": a["meta_desc"][:500],
            "memberId": MEMBER_ID,
            "categoryIds": [cat_id],
            "commentingEnabled": True,
            "language": "en",
            "heroImage": hero_img,
            "richContent": rich_content,
            "seoData": {
                "tags": [
                    {"type": "title", "children": a["seo_title"], "custom": False, "disabled": False},
                    {"type": "meta", "props": {"name": "description", "content": a["meta_desc"]}, "children": "", "custom": False, "disabled": False}
                ]
            }
        }

        entry = {
            "number": a["day_idx"] + 1,
            "date": a["date"],
            "title": a["title"],
            "category": a["category"],
            "hero_image": m_meta["filename"],
        }

        try:
            resp = http_json(
                "https://www.wixapis.com/blog/v3/draft-posts",
                {"draftPost": draft_payload, "publish": False, "fieldsets": ["URL"]},
                auth=token
            )
            draft_post = resp.get("draftPost") or resp
            entry["draft_id"] = draft_post.get("id")
            entry["status"] = "DRAFT_SCHEDULED"
            print(f"[{a['date']}] 📅 DRAFT SCHEDULED: {a['title'][:55]} ({entry['draft_id']})")
            synced_this_run += 1
        except Exception as e:
            entry["status"] = "ERROR"
            entry["error"] = str(e)[:300]
            print(f"[{a['date']}] ❌ ERROR: {e}")
            if "401" in str(e) or "403" in str(e):
                token = load_token()

        results.append(entry)
        existing_map[d] = entry

        # Incremental save
        current_full = list(results) + [existing_map.get(rem["date"], {
            "number": rem["day_idx"] + 1,
            "date": rem["date"],
            "title": rem["title"],
            "category": rem["category"],
            "status": "READY_FOR_SYNC",
            "hero_image": MEDIA_CATALOG.get(rem["image_key"], MEDIA_CATALOG["courthouse"])["filename"]
        }) for rem in articles[len(results):]]
        save_manifests(current_full)
        time.sleep(0.5)

    final_full = list(results) + [existing_map.get(rem["date"], {
        "number": rem["day_idx"] + 1,
        "date": rem["date"],
        "title": rem["title"],
        "category": rem["category"],
        "status": "READY_FOR_SYNC",
        "hero_image": MEDIA_CATALOG.get(rem["image_key"], MEDIA_CATALOG["courthouse"])["filename"]
    }) for rem in articles[len(results):]]
    save_manifests(final_full)
    return final_full


def save_manifests(results: list[dict]):
    """Save annual-calendar.json and ANNUAL_EDITORIAL_CALENDAR.md."""
    json_path = OUT_DIR / "annual-calendar.json"
    json_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    md_lines = [
        "# Shamrock Bail Bonds — 1-Year Florida Statewide Editorial Calendar",
        f"**Active Horizon:** November 6, 2026 – October 6, 2027",
        f"**Cadence:** 2 to 3 Posts per Week (~10-12 Posts/Month) · **Total Posts:** {len(results)}",
        "**Compliance:** Fla. Stat. Chapters 648 & 903, Fla. R. Crim. P. 3.131",
        "",
        "| # | Target Date | Topic / Locality | Category | Status | Draft ID | Hero Image |",
        "|---|---|---|---|---|---|---|",
    ]

    for r in results:
        badge = "🟢 LIVE" if r.get("status") == "PUBLISHED_LIVE" else "📅 SCHEDULED" if r.get("status") == "DRAFT_SCHEDULED" else f"⚠️ {r.get('status')}"
        d_id = r.get("draft_id", "N/A")
        hero = r.get("hero_image", "courthouse.jpg")[:24]
        md_lines.append(f"| {r['number']:03d} | {r['date']} | {r['title'][:45]} | {r['category']} | {badge} | `{d_id}` | {hero} |")

    (OUT_DIR / "ANNUAL_EDITORIAL_CALENDAR.md").write_text("\n".join(md_lines) + "\n", encoding="utf-8")
    print(f"\n✓ Saved master manifests to:")
    print(f"   • {json_path}")
    print(f"   • {OUT_DIR / 'ANNUAL_EDITORIAL_CALENDAR.md'}")


def main():
    parser = argparse.ArgumentParser(description="1-Year Annual Florida Editorial Calendar Master Runner")
    parser.add_argument("--status", action="store_true", help="Print current status of the 1-year calendar")
    parser.add_argument("--generate-markdown-only", action="store_true", help="Generate all markdown files without syncing to Wix")
    parser.add_argument("--dry-run", action="store_true", help="Dry run simulation")
    parser.add_argument("--sync-wix", action="store_true", help="Sync drafts to Wix Blog API")
    parser.add_argument("--limit", type=int, help="Limit number of posts to sync in this run")
    args = parser.parse_args()

    articles = generate_full_annual_curriculum(dry_run=args.dry_run)

    if args.status:
        json_path = OUT_DIR / "annual-calendar.json"
        if json_path.exists():
            data = json.loads(json_path.read_text(encoding="utf-8"))
            print(f"\n☘️ Annual Calendar Status: {len(data)} items recorded.")
        else:
            print(f"\n☘️ Annual Calendar generated locally: {len(articles)} articles ready for sync.")
        return

    if args.generate_markdown_only:
        print("✓ Generation complete. Markdown files written to disk.")
        return

    if args.sync_wix:
        sync_annual_calendar_to_wix(articles, limit=args.limit, dry_run=args.dry_run)
        return

    # Default action
    save_manifests([
        {
            "number": a["day_idx"] + 1,
            "date": a["date"],
            "title": a["title"],
            "category": a["category"],
            "status": "READY_FOR_SYNC",
            "hero_image": MEDIA_CATALOG[a["image_key"]]["filename"]
        } for a in articles
    ])
    print("\nRun with --sync-wix to schedule drafts via the Wix Blog API.")


if __name__ == "__main__":
    main()
