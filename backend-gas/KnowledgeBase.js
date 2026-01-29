/**
 * KnowledgeBase.gs
 * 
 * "The Brain" of the RAG System.
 * Contains structured protocols for each county.
 * 
 * Format:
 * KEY: County Slug (lowercase, hyphenated)
 * VALUE: Object with 'processed', 'jails', 'courts', 'tips'
 */

const RAG_KNOWLEDGE_BASE = {
    'lee': {
        name: "Lee County",
        process: "In Lee County, the cosigner (Indemnitor) must come to our office first. We then digitally sign the bond and physically deliver it to the jail.",
        jail_location: "2501 Ortiz Ave, Fort Myers, FL 33905",
        court_location: "1700 Monroe St, Fort Myers, FL 33901",
        tips: [
            "Wait times at Ortiz can be 2-4 hours after bond is posted.",
            "Parking is free at the jail but paid at the court."
        ]
    },
    'collier': {
        name: "Collier County",
        process: "Collier County accepts 'Remote Posting'. We can email the bond directly to the booking desk. You do not need to come to the jail.",
        jail_location: "3315 Tamiami Trail E, Naples, FL 34112",
        court_location: "3315 Tamiami Trail E, Naples, FL 34112 (Same Complex)",
        tips: [
            "Collier usually processes releases very quickly (1-2 hours).",
            "Ensure the Defendant has a ride, Taxis are scarce at night."
        ]
    },
    'charlotte': {
        name: "Charlotte County",
        process: "Charlotte requires original signatures. We will meet you at the jail lobby to sign.",
        jail_location: "26601 Airport Rd, Punta Gorda, FL 33982",
        court_location: "350 E Marion Ave, Punta Gorda, FL 33950",
        tips: [
            "The jail lobby closes at 10 PM, but the bond window is 24/7."
        ]
    },
    'hendry': {
        name: "Hendry County",
        process: "Hendry (LaBelle) is old school. Paper bonds only. Allow extra travel time for the agent.",
        jail_location: "101 S Main St, LaBelle, FL 33935",
        court_location: "25 E Hickpochee Ave, LaBelle, FL 33935",
        tips: [
            "Call ahead to confirm the magistrate has set the bond amount."
        ]
    },
    'glades': {
        name: "Glades County",
        process: "Glades detainees are often housed in neighboring counties due to facility limits. Verify location first.",
        jail_location: "1297 FL-78, Moore Haven, FL 33471",
        court_location: "500 Ave J, Moore Haven, FL 33471",
        tips: []
    },
    'default': {
        name: "General Inquiry",
        process: "For this county, we typically need to physically post the bond. Please fill out the online form to start the process.",
        jail_location: "Varies by county.",
        court_location: "Varies by county.",
        tips: [
            "Always bring a valid ID.",
            "Do not bring weapons or contraband to the jail property."
        ]
    }
};

function RAG_getKnowledge() {
    return RAG_KNOWLEDGE_BASE;
}
