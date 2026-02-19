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
        ],
        resources: {
            fallback_search: "http://www.hendrysheriff.org/arrests_and_jail_info/arrest_and_inmate_search.php"
        }
    },
    'glades': {
        name: "Glades County",
        process: "Glades County detainees are often housed in neighboring counties (Hendry/Okeechobee) due to facility limits. We must verify the physical location before posting.",
        jail_location: "1297 FL-78, Moore Haven, FL 33471",
        court_location: "500 Ave J, Moore Haven, FL 33471",
        tips: [
            "Verify booking number carefully; they often share systems."
        ],
        resources: {
            fallback_search: "https://smartweb.gladessheriff.org/smartwebclient/Jail.aspx"
        }
    },

    // --- STATEWIDE OPERATIONS ---
    'alachua': {
        name: "Alachua County",
        process: "Alachua County (Gainesville) generally requires physical posting. First appearance is held daily.",
        jail_location: "3333 NE 39th Ave, Gainesville, FL 32609",
        court_location: "220 South Main St, Gainesville, FL 32601",
        tips: ["Parking can be limited near the courthouse."],
        resources: { fallback_search: "https://acso.us/inmate-search/" }
    },
    'baker': {
        name: "Baker County",
        process: "Baker County shares some judicial resources with the circuit. Physical bonds are standard.",
        jail_location: "1 Sheriff Office Dr, Macclenny, FL 32063",
        court_location: "339 E Macclenny Ave, Macclenny, FL 32063",
        tips: ["Rural county procedures apply; call ahead."],
        resources: { fallback_search: "https://www.bakercountysheriffsoffice.com/" }
    },
    'bay': {
        name: "Bay County",
        process: "Bay County (Panama City) requires physical bond delivery.",
        jail_location: "5700 Star Ln, Panama City, FL 32404",
        court_location: "300 E 4th St, Panama City, FL 32401",
        tips: ["Allow extra time for travel to the panhandle."],
        resources: { fallback_search: "https://www.baysomobile.org/is/" }
    },
    'bradford': {
        name: "Bradford County",
        process: "Bradford County (Starke) requires physical bonds. Low volume facility.",
        jail_location: "945-B N Temple Ave, Starke, FL 32091",
        court_location: "945 N Temple Ave, Starke, FL 32091",
        tips: ["Jail and courthouse are adjacent."],
        resources: { fallback_search: "http://smartweb.bradfordsheriff.org/smartwebclient/Jail.aspx" }
    },
    'brevard': {
        name: "Brevard County",
        process: "Brevard (Space Coast) has a large jail complex in Cocoa (Camp Rd). Bonds are posted at the jail.",
        jail_location: "860 Camp Rd, Cocoa, FL 32927",
        court_location: "2825 Judge Fran Jamieson Way, Viera, FL 32940",
        tips: ["The 'Tent City' annex is distinct from the main jail."],
        resources: { fallback_search: "https://www.brevardsheriff.com/bookings/" }
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
    'calhoun': {
        name: "Calhoun County",
        process: "Calhoun is a small rural county. Physical posting required.",
        jail_location: "18101 NE Central Ave, Blountstown, FL 32424",
        court_location: "20859 Central Ave E, Blountstown, FL 32424",
        tips: ["Limited after-hours processing."],
        resources: { fallback_search: "https://www.calhounsheriff.com/jail-information/" }
    },
    'citrus': {
        name: "Citrus County",
        process: "Citrus County jail is in Inverness. Physical bonds required.",
        jail_location: "264 Lock St, Inverness, FL 34450",
        court_location: "110 N Apopka Ave, Inverness, FL 34450",
        tips: ["The jail is operated by CoreCivic (private)."],
        resources: { fallback_search: "https://www.sheriffcitrus.org/arrest-records-citrus-county.php" }
    },
    'clay': {
        name: "Clay County",
        process: "Clay County (Green Cove Springs) requires physical posting at the jail.",
        jail_location: "901 N Orange Ave, Green Cove Springs, FL 32043",
        court_location: "825 N Orange Ave, Green Cove Springs, FL 32043",
        tips: ["Jail and courthouse are on the same road."],
        resources: { fallback_search: "https://claysheriff.policetocitizen.com/Home" }
    },
    'columbia': {
        name: "Columbia County",
        process: "Columbia County (Lake City) requires physical posting.",
        jail_location: "353 NW Flagler Ave, Lake City, FL 32055",
        court_location: "173 NE Hernando Ave, Lake City, FL 32055",
        tips: ["Located near the I-10/I-75 interchange."],
        resources: { fallback_search: "https://columbiasheriff.org/about-ccso/detention-facility/" }
    },
    'desoto': {
        name: "Desoto County",
        process: "Desoto (Arcadia) is a rural county. Physical bonds only. The process is straightforward but requires an agent on-site.",
        jail_location: "208 E Cypress St, Arcadia, FL 34266",
        court_location: "115 E Oak St, Arcadia, FL 34266",
        tips: [
            "Office closes for lunch 12:00-1:00 PM."
        ],
        resources: { fallback_search: "https://jail.desotosheriff.org/DCN/" }
    },
    'dixie': {
        name: "Dixie County",
        process: "Dixie County (Cross City) requires physical posting.",
        jail_location: "386 NE 255th St, Cross City, FL 32628",
        court_location: "214 NE Hwy 351, Cross City, FL 32628",
        tips: ["Very rural area, verify agent availability."],
        resources: { fallback_search: "http://www.dixiecountysheriff.com/Detention.html" }
    },
    'duval': {
        name: "Duval County",
        process: "Duval (Jacksonville) is a major hub. The John E. Goode Pre-Trial Detention Facility is the main intake.",
        jail_location: "522 E Bay St, Jacksonville, FL 32202",
        court_location: "501 W Adams St, Jacksonville, FL 32202",
        tips: ["Parking downtown is difficult.", "High volume facility."],
        resources: { fallback_search: "https://inmatesearch.jaxsheriff.org/login" }
    },
    'escambia': {
        name: "Escambia County",
        process: "Escambia (Pensacola) is in the western panhandle (Central Time Zone).",
        jail_location: "221 S Palafox Pl, Pensacola, FL 32502",
        court_location: "190 Governmental Center, Pensacola, FL 32502",
        tips: ["Note the time zone difference (CST)."],
        resources: { fallback_search: "http://inmatelookup.myescambia.com/smartwebclient/jail.aspx" }
    },
    'flagler': {
        name: "Flagler County",
        process: "Flagler County (Bunnell) requires physical posting.",
        jail_location: "1001 Justice Ln, Bunnell, FL 32110",
        court_location: "1769 E Moody Blvd, Bunnell, FL 32110",
        tips: ["The Justice Lane complex is relatively new."],
        resources: { fallback_search: "http://www.flaglersheriff.com/" }
    },
    'franklin': {
        name: "Franklin County",
        process: "Franklin County (Apalachicola) is a small coastal county. Physical posting required.",
        jail_location: "270 Crawford St, Apalachicola, FL 32320",
        court_location: "33 Market St, Apalachicola, FL 32320",
        tips: ["Check office hours."],
        resources: { fallback_search: "http://www.franklinsheriff.com/arrests.aspx" }
    },
    'gadsden': {
        name: "Gadsden County",
        process: "Gadsden County (Quincy) requires physical posting.",
        jail_location: "339 E Jefferson St, Quincy, FL 32351",
        court_location: "10 E Jefferson St, Quincy, FL 32351",
        tips: ["Located west of Tallahassee."],
        resources: { fallback_search: "http://69.21.72.195/smartwebclient/" }
    },
    'gilchrist': {
        name: "Gilchrist County",
        process: "Gilchrist County (Trenton) is rural. Physical bonds only.",
        jail_location: "9239 S US 129, Trenton, FL 32693",
        court_location: "112 S Main St, Trenton, FL 32693",
        tips: ["Jail is south of the town center."],
        resources: { fallback_search: "https://gilchristcountyjailfl.org/" }
    },
    'gulf': {
        name: "Gulf County",
        process: "Gulf County (Port St. Joe) requires physical posting.",
        jail_location: "7500 County Rd 30A, Port St Joe, FL 32456",
        court_location: "1000 Cecil G Costin Sr Blvd, Port St Joe, FL 32456",
        tips: ["Two time zones in county (mostly Eastern)."],
        resources: { fallback_search: "https://www.gulfcounty-fl.gov/county_government/detention_facility" }
    },
    'hamilton': {
        name: "Hamilton County",
        process: "Hamilton County (Jasper) is rural. Physical bonds required.",
        jail_location: "1887 US-41, Jasper, FL 32052",
        court_location: "207 NE 1st St, Jasper, FL 32052",
        tips: ["Located near the Georgia border."],
        resources: { fallback_search: "http://inmate.hamiltonsheriff.com/smartwebclient/jail.aspx" }
    },
    'hardee': {
        name: "Hardee County",
        process: "Hardee County (Wauchula) requires physical bonds.",
        jail_location: "900 E Summit St, Wauchula, FL 33873",
        court_location: "417 W Main St, Wauchula, FL 33873",
        tips: ["Rural agricultural area."],
        resources: { fallback_search: "https://www.hardeeso.com/detention/inmate_search.php" }
    },
    'hernando': {
        name: "Hernando County",
        process: "Hernando County (Brooksville) usually requires physical posting.",
        jail_location: "16425 Spring Hill Dr, Brooksville, FL 34604",
        court_location: "20 N Main St, Brooksville, FL 34601",
        tips: ["Jail is distinct from the courthouse location."],
        resources: { fallback_search: "https://www.hernandosheriff.org/jail/Applications/JailSearch/" }
    },
    'highlands': {
        name: "Highlands County",
        process: "Highlands County (Sebring) requires physical bonds.",
        jail_location: "338 S Orange St, Sebring, FL 33870",
        court_location: "430 S Commerce Ave, Sebring, FL 33870",
        tips: ["Located in central Florida."],
        resources: { fallback_search: "https://www.flsheriffs.org/sheriffs/bio/highlands-county" }
    },
    'hillsborough': {
        name: "Hillsborough County",
        process: "Hillsborough (Orient Road) is the central booking. We use the 'Fast Release' digital portal. Signatures can be done via mobile.",
        jail_location: "1201 Orient Rd, Tampa, FL 33619",
        court_location: "800 E Twiggs St, Tampa, FL 33602",
        tips: [
            "Orient Rd is busy; advise client to wait in the designated cell phone lot.",
            "Video court is available for viewing online."
        ],
        resources: { fallback_search: "http://webapps.hcso.tampa.fl.us/ArrestInquiry" }
    },
    'holmes': {
        name: "Holmes County",
        process: "Holmes County (Bonifay) requires physical posting.",
        jail_location: "21183 E Ladies Walk, Bonifay, FL 32425",
        court_location: "201 N Oklahoma St, Bonifay, FL 32425",
        tips: ["Rural panhandle county."],
        resources: { fallback_search: "http://holmescosheriff.org/jail-division.html" }
    },
    'indian-river': {
        name: "Indian River County",
        process: "Indian River (Vero Beach) requires physical posting.",
        jail_location: "4055 41st Ave, Vero Beach, FL 32960",
        court_location: "2000 16th Ave, Vero Beach, FL 32960",
        tips: ["Jail is near the airport."],
        resources: { fallback_search: "https://ircsheriff.org/inmate-search" }
    },
    'jackson': {
        name: "Jackson County",
        process: "Jackson County (Marianna) requires physical posting.",
        jail_location: "2737 Penn Ave, Marianna, FL 32448",
        court_location: "4445 Lafayette St, Marianna, FL 32446",
        tips: ["Central Time Zone (mostly)."],
        resources: { fallback_search: "https://www.jacksoncountysheriff.com/" }
    },
    'jefferson': {
        name: "Jefferson County",
        process: "Jefferson County (Monticello) requires physical posting.",
        jail_location: "171 Industrial Park, Monticello, FL 32344",
        court_location: "1 Courthouse Cir, Monticello, FL 32344",
        tips: ["Famous for the historic courthouse circle."],
        resources: { fallback_search: "https://www.jcso-fl.org/" }
    },
    'lafayette': {
        name: "Lafayette County",
        process: "Lafayette County (Mayo) is Florida's second least populous county. Physical bonds only.",
        jail_location: "178 NW Crawford St, Mayo, FL 32066",
        court_location: "120 W Main St, Mayo, FL 32066",
        tips: ["Very small facility."],
        resources: { fallback_search: "http://www.lafayetteso.org/index.html" }
    },
    'lake': {
        name: "Lake County",
        process: "Lake County (Tavares) requires physical posting at the jail.",
        jail_location: "551 W Main St, Tavares, FL 32778",
        court_location: "550 W Main St, Tavares, FL 32778",
        tips: ["Jail and courthouse are very close."],
        resources: { fallback_search: "https://www.lcso.org/inmates/" }
    },
    'leon': {
        name: "Leon County",
        process: "Leon County (Tallahassee) is the state capital. Physical bonds required.",
        jail_location: "535 Appleyard Dr, Tallahassee, FL 32304",
        court_location: "301 S Monroe St, Tallahassee, FL 32301",
        tips: ["Traffic can be heavy near the universities."],
        resources: { fallback_search: "https://www.leoncountyso.com/departments/detention-facility/inmate-search" }
    },
    'levy': {
        name: "Levy County",
        process: "Levy County (Bronson) requires physical posting.",
        jail_location: "9150 NE 80th Ave, Bronson, FL 32621",
        court_location: "355 S Court St, Bronson, FL 32621",
        tips: ["Rural area."],
        resources: { fallback_search: "https://levyso.com/detention-bureau/" }
    },
    'liberty': {
        name: "Liberty County",
        process: "Liberty County (Bristol) is the least populous county. Physical bonds only.",
        jail_location: "12499 Pogo St, Bristol, FL 32321",
        court_location: "10818 NW State Rd 20, Bristol, FL 32321",
        tips: ["Very limited local bond agents."],
        resources: { fallback_search: "https://libertycountyfl.org/sheriff/" }
    },
    'madison': {
        name: "Madison County",
        process: "Madison County (Madison) requires physical posting.",
        jail_location: "823 SW Pinckney St, Madison, FL 32340",
        court_location: "125 SW Range Ave, Madison, FL 32340",
        tips: ["North Florida/Georgia border area."],
        resources: { fallback_search: "http://madisonjail.org/" }
    },
    'manatee': {
        name: "Manatee County",
        process: "Manatee (Bradenton) requires physical posting at the bond window.",
        jail_location: "600 301 Blvd W, Bradenton, FL 34205",
        court_location: "1051 Manatee Ave W, Bradenton, FL 34205",
        tips: ["Port Manatee facility is the main jail location."],
        resources: { fallback_search: "https://www.manateesheriff.com/arrest_inquiries/index.php" }
    },
    'marion': {
        name: "Marion County",
        process: "Marion County (Ocala) requires physical posting.",
        jail_location: "700 NW 30th Ave, Ocala, FL 34475",
        court_location: "110 NW 1st Ave, Ocala, FL 34475",
        tips: ["Large county geographically."],
        resources: { fallback_search: "http://jail.marionso.com/" }
    },
    'martin': {
        name: "Martin County",
        process: "Martin County (Stuart) requires physical posting.",
        jail_location: "800 SE Monterey Rd, Stuart, FL 34994",
        court_location: "100 SE Ocean Blvd, Stuart, FL 34994",
        tips: ["Strict intake procedures."],
        resources: { fallback_search: "https://www.mcsofl.org/223/Jail-Inmate-Search" }
    },
    'monroe': {
        name: "Monroe County",
        process: "Monroe County (Florida Keys) has multiple facilities but main booking is usually Key West or Marathon.",
        jail_location: "5501 College Rd, Key West, FL 33040",
        court_location: "302 Fleming St, Key West, FL 33040",
        tips: ["Travel times in the Keys can be very long."],
        resources: { fallback_search: "https://www.keysso.net/arrests" }
    },
    'nassau': {
        name: "Nassau County",
        process: "Nassau County (Yulee) requires physical posting.",
        jail_location: "76212 Nicholas Cutinha Rd, Yulee, FL 32097",
        court_location: "76347 Veterans Way, Yulee, FL 32097",
        tips: ["North of Jacksonville."],
        resources: { fallback_search: "https://nassauso.com/corrections/jail-visitation/" }
    },
    'okaloosa': {
        name: "Okaloosa County",
        process: "Okaloosa County (Crestview) requires physical posting.",
        jail_location: "1200 E James Lee Blvd, Crestview, FL 32539",
        court_location: "101 E James Lee Blvd, Crestview, FL 32536",
        tips: ["Main jail is in Crestview, not Fort Walton Beach."],
        resources: { fallback_search: "https://www.okaloosaclerk.com/contact-us/" }
    },
    'okeechobee': {
        name: "Okeechobee County",
        process: "Okeechobee County requires physical posting.",
        jail_location: "504 NW 4th St, Okeechobee, FL 34972",
        court_location: "312 NW 3rd St, Okeechobee, FL 34972",
        tips: ["Located north of Lake Okeechobee."],
        resources: { fallback_search: "https://www.okeesheriff.org/inmate-search" }
    },
    'orange': {
        name: "Orange County",
        process: "Orange County (33rd St) has a centralized bond room. We must present the 'Power of Attorney' physically at the window.",
        jail_location: "3723 Vision Blvd, Orlando, FL 32839",
        court_location: "425 N Orange Ave, Orlando, FL 32801",
        tips: [
            "Release process is very slow (6-10 hours).",
            "Do not park in the tow-away zones across the street."
        ],
        resources: { fallback_search: "https://netapps.ocfl.net/BestJail/Home/Inmates" }
    },
    'osceola': {
        name: "Osceola County",
        process: "Osceola (Kissimmee) requires physical posting.",
        jail_location: "402 Simpson Rd, Kissimmee, FL 34744",
        court_location: "2 Courthouse Sq, Kissimmee, FL 34741",
        tips: ["Rapidly growing area, traffic is heavy."],
        resources: { fallback_search: "http://www.osceola.org/agencies-departments/corrections/corrections-reports.stml" }
    },
    'palm-beach': {
        name: "Palm Beach County",
        process: "Palm Beach (Gun Club) requires all indemnitors to be approved via the PBSO visual verification system (Zoom or In-Person).",
        jail_location: "3228 Gun Club Rd, West Palm Beach, FL 33406",
        court_location: "205 N Dixie Hwy, West Palm Beach, FL 33401",
        tips: [
            "Gun Club Rd facility has ample parking.",
            "Strict scrutiny on ID validity."
        ],
        resources: { fallback_search: "https://www3.pbso.org/blotter/" }
    },
    'pasco': {
        name: "Pasco County",
        process: "Pasco (Land O' Lakes) accepts e-mail bonds. We verify the amount online and submit. Releases are efficient.",
        jail_location: "20101 Central Blvd, Land O' Lakes, FL 34637",
        court_location: "7530 Little Rd, New Port Richey, FL 34654",
        tips: ["Facility is remote; advise indemnitor to bring water/snacks while waiting."],
        resources: { fallback_search: "https://pascosheriff.com/" }
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
    'putnam': {
        name: "Putnam County",
        process: "Putnam County (Palatka) requires physical posting.",
        jail_location: "113 Putnam Crossing Rd, Palatka, FL 32177",
        court_location: "410 St Johns Ave, Palatka, FL 32177",
        tips: ["Rural area."],
        resources: { fallback_search: "http://smartweb.pcso.us/smartwebclient/jail.aspx" }
    },
    'st-johns': {
        name: "St. Johns County",
        process: "St. Johns (St. Augustine) requires physical posting.",
        jail_location: "4010 Lewis Speedway, St Augustine, FL 32084",
        court_location: "4010 Lewis Speedway, St Augustine, FL 32084",
        tips: ["Combined complex for jail and courts."],
        resources: { fallback_search: "https://www.sjso.org/detention-center/sj-inmate-search/" }
    },
    'st-lucie': {
        name: "St. Lucie County",
        process: "St. Lucie (Fort Pierce) requires physical posting.",
        jail_location: "900 N Rock Rd, Fort Pierce, FL 34945",
        court_location: "218 S 2nd St, Fort Pierce, FL 34950",
        tips: ["Located on the Treasure Coast."],
        resources: { fallback_search: "https://www.stluciesheriff.com/215/Inmate-Lookup" }
    },
    'santa-rosa': {
        name: "Santa Rosa County",
        process: "Santa Rosa (Milton) requires physical posting.",
        jail_location: "5755 E Milton Rd, Milton, FL 32583",
        court_location: "4025 Avalon Blvd, Milton, FL 32583",
        tips: ["Central Time Zone."],
        resources: { fallback_search: "https://santarosasheriff.org/jail-view/" }
    },
    'sarasota': {
        name: "Sarasota County",
        process: "Sarasota has two facilities (Downtown & South County). We usually post at the Main Jail downtown. E-Bonds are accepted for low-level offenses.",
        jail_location: "2020 Main St, Sarasota, FL 34237",
        court_location: "2000 Main St, Sarasota, FL 34237",
        tips: [
            "Parking garage is adjacent to the jail.",
            "Releases take longer (4-6 hours) due to medical screening."
        ],
        resources: { fallback_search: "https://www.sarasotasheriff.org/corrections/whos_in_jail/arrest-reports/index.php" }
    },
    'seminole': {
        name: "Seminole County",
        process: "Seminole County (Sanford) often uses the John E. Polk Correctional Facility. Physical posting required.",
        jail_location: "211 Bush Blvd, Sanford, FL 32773",
        court_location: "301 N Park Ave, Sanford, FL 32771",
        tips: ["Busy facility near Orlando."],
        resources: { fallback_search: "https://www.seminolesheriff.org/WebBond/Inmates.aspx" }
    },
    'sumter': {
        name: "Sumter County",
        process: "Sumter County (Bushnell) requires physical posting.",
        jail_location: "209 N Florida St, Bushnell, FL 33513",
        court_location: "215 E McCollum Ave, Bushnell, FL 33513",
        tips: ["Home of The Villages (large retirement community)."],
        resources: { fallback_search: "http://portal.sumtercountysheriff.org/smartwebclient/jail.aspx" }
    },
    'suwannee': {
        name: "Suwannee County",
        process: "Suwannee County (Live Oak) requires physical posting.",
        jail_location: "305 Pine Ave, Live Oak, FL 32064",
        court_location: "200 S Ohio Ave, Live Oak, FL 32064",
        tips: ["Rural north Florida."],
        resources: { fallback_search: "https://smartcop.suwanneesheriff.com/smartwebclient/jail.aspx" }
    },
    'taylor': {
        name: "Taylor County",
        process: "Taylor County (Perry) requires physical posting.",
        jail_location: "589 E US Hwy 27, Perry, FL 32347",
        court_location: "108 N Jefferson St, Perry, FL 32348",
        tips: ["Forestry industry area."],
        resources: { fallback_search: "http://taylorsheriff.org/index.php/booking/" }
    },
    'union': {
        name: "Union County",
        process: "Union County (Lake Butler) is home to several state prisons. County jail requires physical posting.",
        jail_location: "3344 Union Rd, Raiford, FL 32083",
        court_location: "55 W Main St, Lake Butler, FL 32054",
        tips: ["Do not confuse county jail with state prison facilities."],
        resources: { fallback_search: "http://www.unionsheriff.us/" }
    },
    'volusia': {
        name: "Volusia County",
        process: "Volusia County (Daytona Beach) jail is near the interstate. Physical posting required.",
        jail_location: "1354 Indian Lake Rd, Daytona Beach, FL 32124",
        court_location: "101 N Alabama Ave, DeLand, FL 32724",
        tips: ["DeLand is the county seat, though Daytona is larger."],
        resources: { fallback_search: "http://www.volusiamug.vcgov.org/" }
    },
    'wakulla': {
        name: "Wakulla County",
        process: "Wakulla County (Crawfordville) requires physical posting.",
        jail_location: "15 Oak St, Crawfordville, FL 32327",
        court_location: "3056 Crawfordville Hwy, Crawfordville, FL 32327",
        tips: ["Coastal county south of Tallahassee."],
        resources: { fallback_search: "https://www.wcso.org/corrections" }
    },
    'walton': {
        name: "Walton County",
        process: "Walton County (DeFuniak Springs) requires physical posting.",
        jail_location: "40 Sheriff Cir, DeFuniak Springs, FL 32433",
        court_location: "571 US-90 E, DeFuniak Springs, FL 32433",
        tips: ["Large county, check specific location needed."],
        resources: { fallback_search: "http://nwscorrections.waltonso.org/WaltonCounty" }
    },
    'washington': {
        name: "Washington County",
        process: "Washington County (Chipley) requires physical posting.",
        jail_location: "1100 Brickyard Rd, Chipley, FL 32428",
        court_location: "1293 W Jackson Ave, Chipley, FL 32428",
        tips: ["Rural panhandle county."],
        resources: { fallback_search: "https://www.wcso.us/inmateRoster" }
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
