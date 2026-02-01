/**
 * KnowledgeBase.gs
 * 
 * "The Brain" of the RAG System.
 * Contains structured protocols for each county.
 * 
 * Format:
 * KEY: County Slug (lowercase, hyphenated)
 * VALUE: Object with 'name', 'process', 'jail_location', 'court_location', 'tips'
 */

const RAG_KNOWLEDGE_BASE = {
    // --- SOUTHWEST FLORIDA (CORE) ---
    'lee': {
        name: "Lee County",
        process: "In Lee County, the cosigner (Indemnitor) must come to our office first to sign. We then digitally sign the bond and physically deliver the power to the jail. First Appearance court is held daily at 9:00 AM.",
        jail_location: "2501 Ortiz Ave, Fort Myers, FL 33905",
        court_location: "1700 Monroe St, Fort Myers, FL 33901",
        tips: [
            "Wait times at Ortiz can be 2-4 hours after bond is posted.",
            "Parking is free at the jail but paid at the court.",
            "Inmates are released 24/7, but shift change is 6PM-7PM (expect delays)."
        ],
        resources: {
            fallback_search: "https://www.sheriffleefl.org/booking-search/"
        }
    },
    'collier': {
        name: "Collier County",
        process: "Collier County accepts 'Remote Posting' (E-Bond). We can email the bond paperwork directly to the booking desk. You do not need to come to the jail physically.",
        jail_location: "3315 Tamiami Trail E, Naples, FL 34112",
        court_location: "3315 Tamiami Trail E, Naples, FL 34112 (Same Complex)",
        tips: [
            "Collier usually processes releases very quickly (1-2 hours).",
            "Ensure the Defendant has a ride; taxis are scarce at night.",
            "Video visitation is available in the lobby."
        ],
        resources: {
            fallback_search: "https://www2.colliersheriff.org/arrestsearch/"
        }
    },
    'charlotte': {
        name: "Charlotte County",
        process: "Charlotte requires original wet signatures. An agent will meet you at the jail lobby to sign the paperwork. First Appearance is at 1:30 PM.",
        jail_location: "26601 Airport Rd, Punta Gorda, FL 33982",
        court_location: "350 E Marion Ave, Punta Gorda, FL 33950",
        tips: [
            "The jail lobby closes at 10 PM, but the bond window is 24/7.",
            "Do not park in the 'Official Use Only' spots."
        ],
        resources: {
            fallback_search: "https://www.ccso.org/forms/arrestdb.cfm"
        }
    },
    'hendry': {
        name: "Hendry County",
        process: "Hendry (LaBelle) is physically processed. Paper bonds only. Please allow extra travel time for the agent to drive to LaBelle.",
        jail_location: "101 S Main St, LaBelle, FL 33935",
        court_location: "25 E Hickpochee Ave, LaBelle, FL 33935",
        tips: [
            "Call ahead to confirm the magistrate has set the bond amount.",
            "Releases often happen out the side door, not the main lobby."
        ]
    },
    'glades': {
        name: "Glades County",
        process: "Glades County detainees are often housed in neighboring counties (Hendry/Okeechobee) due to facility limits. We must verify the physical location before posting.",
        jail_location: "1297 FL-78, Moore Haven, FL 33471",
        court_location: "500 Ave J, Moore Haven, FL 33471",
        tips: [
            "Verify booking number carefully; they often share systems."
        ]
    },

    // --- REGIONAL EXPANSION ---
    'sarasota': {
        name: "Sarasota County",
        process: "Sarasota has two facilities (Downtown & South County). We usually post at the Main Jail downtown. E-Bonds are accepted for low-level offenses.",
        jail_location: "2020 Main St, Sarasota, FL 34237",
        court_location: "2000 Main St, Sarasota, FL 34237",
        tips: [
            "Parking garage is adjacent to the jail.",
            "Releases take longer (4-6 hours) due to medical screening."
        ]
    },
    'desoto': {
        name: "Desoto County",
        process: "Desoto (Arcadia) is a rural county. Physical bonds only. The process is straightforward but requires an agent on-site.",
        jail_location: "208 E Cypress St, Arcadia, FL 34266",
        court_location: "115 E Oak St, Arcadia, FL 34266",
        tips: [
            "Office closes for lunch 12:00-1:00 PM."
        ]
    },
    'miami-dade': {
        name: "Miami-Dade County",
        process: "Miami-Dade (TGK) is a high-volume facility. We use the 'Surety bond' electronic system. 'Nebbia' holds (proof of funds) are common for drug trafficking cases.",
        jail_location: "7000 NW 41st St, Miami, FL 33166 (TGK)",
        court_location: "1351 NW 12th St, Miami, FL 33125",
        tips: [
            "Expect long release times (8-12 hours).",
            "Parking at TGK is strictly enforced.",
            "Check for 'Magistrate Hold' before posting."
        ],
        resources: {
            fallback_search: "https://www.miamidade.gov/global/service.page?Mduid_service=ser1491494549439906"
        }
    },
    'broward': {
        name: "Broward County",
        process: "Broward Main Jail accepts e-affidavits. First Appearance is held twice daily. We can process most paperwork digitally.",
        jail_location: "555 SE 1st Ave, Fort Lauderdale, FL 33301",
        court_location: "201 SE 6th St, Fort Lauderdale, FL 33301",
        tips: [
            "Inmates are released through the 'Release Center' on the side.",
            "Dress code enforced for court (No shorts)."
        ],
        resources: {
            fallback_search: "https://www.sheriff.org/DOD/Pages/ArrestSearch.aspx"
        }
    },
    'palm-beach': {
        name: "Palm Beach County",
        process: "Palm Beach (Gun Club) requires all indemnitors to be approved via the PBSO visual verification system (Zoom or In-Person).",
        jail_location: "3228 Gun Club Rd, West Palm Beach, FL 33406",
        court_location: "205 N Dixie Hwy, West Palm Beach, FL 33401",
        tips: [
            "Gun Club Rd facility has ample parking.",
            "Strict scrutiny on ID validity."
        ]
    },
    'hillsborough': {
        name: "Hillsborough County",
        process: "Hillsborough (Orient Road) is the central booking. We use the 'Fast Release' digital portal. Signatures can be done via mobile.",
        jail_location: "1201 Orient Rd, Tampa, FL 33619",
        court_location: "800 E Twiggs St, Tampa, FL 33602",
        tips: [
            "Orient Rd is busy; advise client to wait in the designated cell phone lot.",
            "Video court is available for viewing online."
        ]
    },
    'manatee': {
        name: "Manatee County",
        process: "Manatee (Bradenton) requires physical posting at the bond window. We have a local agent on call. Process time is average.",
        jail_location: "600 301 Blvd W, Bradenton, FL 34205",
        court_location: "1051 Manatee Ave W, Bradenton, FL 34205",
        tips: [
            "The bond window is located at the Port Manatee facility.",
            "Shift change occurs at 6:00 AM/PM."
        ]
    },
    'pinellas': {
        name: "Pinellas County",
        process: "Pinellas (49th St) is strictly digital for agents. We upload the bond via the deeper system. No physical signature required at the jail.",
        jail_location: "14400 49th St N, Clearwater, FL 33762",
        court_location: "14250 49th St N, Clearwater, FL 33762",
        tips: [
            "Wait in the visitor lot; do not idle in the release lane.",
            "Releases are processed in batches."
        ],
        resources: {
            fallback_search: "https://www.pcsoweb.com/whos-in-jail/"
        }
    },
    'pasco': {
        name: "Pasco County",
        process: "Pasco (Land O' Lakes) accepts e-mail bonds. We verify the amount online and submit. Releases are efficient.",
        jail_location: "20101 Central Blvd, Land O' Lakes, FL 34637",
        court_location: "7530 Little Rd, New Port Richey, FL 34654",
        tips: [
            "Facility is remote; advise indemnitor to bring water/snacks while waiting."
        ]
    },
    'polk': {
        name: "Polk County",
        process: "Polk (Bartow) has two facilities (Central & South). Most bookings go to Central. Paper bonds are standard here.",
        jail_location: "2390 Bob Phillips Rd, Bartow, FL 33830",
        court_location: "255 N Broadway Ave, Bartow, FL 33830",
        tips: [
            "Sheriff Grady Judd's policies are strict; ensure all ID info matches perfectly.",
            "Video visitation must be scheduled in advance."
        ],
        resources: {
            fallback_search: "https://www.polksheriff.org/detention/jail-inquiry"
        }
    },
    'orange': {
        name: "Orange County",
        process: "Orange County (33rd St) has a centralized bond room. We must present the 'Power of Attorney' physically at the window.",
        jail_location: "3723 Vision Blvd, Orlando, FL 32839",
        court_location: "425 N Orange Ave, Orlando, FL 32801",
        tips: [
            "Release process is very slow (6-10 hours).",
            "Do not park in the tow-away zones across the street."
        ]
    },

    // --- FALLBACK ---
    'default': {
        name: "Florida Jail",
        process: "We cover this county via our statewide network. We will locate the nearest agent to physically post the bond.",
        jail_location: "Please verify with the Agent.",
        court_location: "Please verify with the Agent.",
        tips: [
            "Always bring a valid government-issued ID.",
            "Do not bring weapons, drugs, or contraband to the jail property.",
            "Wait in your vehicle until instructed."
        ]
    }
};

function RAG_getKnowledge() {
    return RAG_KNOWLEDGE_BASE;
}
