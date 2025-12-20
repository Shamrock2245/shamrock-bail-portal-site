/**
 * Shamrock Bail Bonds - County Utilities
 * 
 * Public module for county-related utility functions.
 * Used by county pages and directory.
 * 
 * File: public/countyUtils.js
 */

// Complete Florida county data with all 67 counties
const floridaCountiesData = {
    "alachua": {
        name: "Alachua",
        slug: "alachua",
        region: "north",
        bookingUrl: "https://acso.us/inmate-search/",
        bookingPhone: "(352) 367-4000",
        clerkUrl: "https://www.alachuacounty.us/Depts/Clerk/Pages/Clerk.aspx",
        recordsUrl: "https://www.alachuaclerk.org/court_records/index.cfm?section=login&r=331568",
        clerkPhone: "(352) 374-3636",
        nearby: ["bradford", "columbia", "dixie", "gilchrist", "levy", "marion", "putnam", "union"]
    },
    "baker": {
        name: "Baker",
        slug: "baker",
        region: "north",
        bookingUrl: "https://www.bakercountysheriffsoffice.com/",
        bookingPhone: "(904) 259-2231",
        clerkUrl: "http://www.bakerclerk.com/",
        recordsUrl: "https://www.civitekflorida.com/ocrs/app/search.xhtml",
        clerkPhone: "(904) 259-8113",
        nearby: ["columbia", "duval", "nassau", "union"]
    },
    "bay": {
        name: "Bay",
        slug: "bay",
        region: "panhandle",
        bookingUrl: "https://www.baysomobile.org/is/",
        bookingPhone: "(850) 785-5245",
        clerkUrl: "https://www.baycoclerk.com/",
        recordsUrl: "https://records2.baycoclerk.com/",
        clerkPhone: "(850) 763-9061",
        nearby: ["calhoun", "gulf", "jackson", "walton", "washington"]
    },
    "bradford": {
        name: "Bradford",
        slug: "bradford",
        region: "north",
        bookingUrl: "http://smartweb.bradfordsheriff.org/smartwebclient/Jail.aspx",
        bookingPhone: "(904) 966-2276",
        clerkUrl: "https://www.bradfordcountyclerk.com/",
        recordsUrl: "https://www.bradfordcountyclerk.com/search.aspx",
        clerkPhone: "(904) 966-6280",
        nearby: ["alachua", "clay", "putnam", "union"]
    },
    "brevard": {
        name: "Brevard",
        slug: "brevard",
        region: "central",
        bookingUrl: "https://www.brevardsheriff.com/bookings/",
        bookingPhone: "(321) 690-1500",
        clerkUrl: "https://www.brevardclerk.us/",
        recordsUrl: "https://vweb1.brevardclerk.us/",
        clerkPhone: "(321) 637-5413",
        nearby: ["indian-river", "orange", "osceola", "seminole", "volusia"]
    },
    "broward": {
        name: "Broward",
        slug: "broward",
        region: "south",
        bookingUrl: "https://www.sheriff.org/DOD/Pages/ArrestSearch.aspx",
        bookingPhone: "(954) 831-5900",
        clerkUrl: "https://www.browardclerk.org/",
        recordsUrl: "https://www.browardclerk.org/Web2",
        clerkPhone: "(954) 831-6565",
        nearby: ["collier", "miami-dade", "palm-beach"]
    },
    "calhoun": {
        name: "Calhoun",
        slug: "calhoun",
        region: "panhandle",
        bookingUrl: "https://mws-hrs.com/calhounsheriff/calhounsheriff/JailRosterReport.pdf",
        bookingPhone: "(850) 674-5049",
        clerkUrl: "https://www.calhounclerk.com/",
        recordsUrl: "https://calhounclerk.com/official-records/",
        clerkPhone: "(850) 674-4545",
        nearby: ["bay", "gulf", "jackson", "liberty"]
    },
    "charlotte": {
        name: "Charlotte",
        slug: "charlotte",
        region: "southwest",
        bookingUrl: "https://www.ccso.org/forms/arrestdb.cfm",
        bookingPhone: "(941) 833-6356",
        clerkUrl: "https://www.charlotteclerk.com/",
        recordsUrl: "https://records.charlotteclerk.com/records/",
        clerkPhone: "(941) 637-2199",
        nearby: ["desoto", "glades", "lee", "sarasota"]
    },
    "citrus": {
        name: "Citrus",
        slug: "citrus",
        region: "central",
        bookingUrl: "https://www.sheriffcitrus.org/public_info/recent_arrest.php",
        bookingPhone: "(352) 527-3332",
        clerkUrl: "https://www.citrusclerk.org/",
        recordsUrl: "https://officialrecords.citrusclerk.org/recordsearch/",
        clerkPhone: "(352) 341-6424",
        nearby: ["hernando", "levy", "marion", "sumter"]
    },
    "clay": {
        name: "Clay",
        slug: "clay",
        region: "north",
        bookingUrl: "https://claysheriff.policetocitizen.com/DailyBulletin",
        bookingPhone: "(904) 529-5905",
        clerkUrl: "https://www.clayclerk.com/",
        recordsUrl: "https://records.clayclerk.com/",
        clerkPhone: "(904) 269-6302",
        nearby: ["bradford", "duval", "putnam", "st-johns"]
    },
    "collier": {
        name: "Collier",
        slug: "collier",
        region: "southwest",
        bookingUrl: "https://www2.colliersheriff.org/arrestsearch/",
        bookingPhone: "(239)252-9543",
        clerkUrl: "https://www.collierclerk.com/",
        recordsUrl: "https://collierclerk.com/records-search/",
        clerkPhone: "(239) 252-2646",
        nearby: ["broward", "hendry", "lee", "miami-dade", "monroe"]
    },
    "columbia": {
        name: "Columbia",
        slug: "columbia",
        region: "north",
        bookingUrl: "http://50.204.15.10/smartwebclient/jail.aspx",
        bookingPhone: "(386) 752-9512",
        clerkUrl: "https://www.columbiaclerk.com/",
        recordsUrl: "https://columbiaclerk.com/official-records/",
        clerkPhone: "(386) 758-1342",
        nearby: ["alachua", "baker", "hamilton", "suwannee", "union"]
    },
    "desoto": {
        name: "DeSoto",
        slug: "desoto",
        region: "southwest",
        bookingUrl: "https://jail.desotosheriff.org/DCN/",
        bookingPhone: "(863) 993-4710",
        clerkUrl: "https://www.desotoclerk.com/",
        recordsUrl: "https://desotoclerk.com/official-records/",
        clerkPhone: "(863) 993-4876",
        nearby: ["charlotte", "glades", "hardee", "highlands", "manatee", "sarasota"]
    },
    "dixie": {
        name: "Dixie",
        slug: "dixie",
        region: "north",
        bookingUrl: "https://dixiesheriff.org/detention-facility/",
        bookingPhone: "(352) 498-1462",
        clerkUrl: "https://www.dixieclerk.com/",
        recordsUrl: "https://officialrecords.dixieclerk.com/",
        clerkPhone: "(352) 498-1200",
        nearby: ["alachua", "gilchrist", "lafayette", "levy", "taylor"]
    },
    "duval": {
        name: "Duval",
        slug: "duval",
        region: "north",
        bookingUrl: "https://inmatesearch.jaxsheriff.org/login",
        bookingPhone: "(904)630-5760",
        clerkUrl: "https://www.duvalclerk.com/",
        recordsUrl: "https://core.duvalclerk.com/",
        clerkPhone: "(904) 255-2000",
        nearby: ["baker", "clay", "nassau", "st-johns"]
    },
    "escambia": {
        name: "Escambia",
        slug: "escambia",
        region: "panhandle",
        bookingUrl: "https://inmatelookup.myescambia.com/smartwebclient/jail.aspx",
        bookingPhone: "(850) 436-9830",
        clerkUrl: "https://www.escambiaclerk.com/",
        recordsUrl: "https://officialrecords.escambiaclerk.com/",
        clerkPhone: "(850) 595-4310",
        nearby: ["okaloosa", "santa-rosa"]
    },
    "flagler": {
        name: "Flagler",
        slug: "flagler",
        region: "north",
        bookingUrl: "https://nwwebcad.fcpsn.org/NewWorld.InmateInquiry/FL0180000",
        bookingPhone: "(386)437-4116",
        clerkUrl: "https://www.flaglerclerk.com/",
        recordsUrl: "https://officialrecords.flaglerclerk.com/",
        clerkPhone: "(386) 313-4360",
        nearby: ["putnam", "st-johns", "volusia"]
    },
    "franklin": {
        name: "Franklin",
        slug: "franklin",
        region: "panhandle",
        bookingUrl: "https://www.franklinsheriff.com/arrest-log/",
        bookingPhone: "(850) 697-8500",
        clerkUrl: "https://www.franklinclerk.com/",
        recordsUrl: "https://officialrecords.franklinclerk.com/",
        clerkPhone: "(850) 653-8861",
        nearby: ["gulf", "liberty", "wakulla"]
    },
    "gadsden": {
        name: "Gadsden",
        slug: "gadsden",
        region: "panhandle",
        bookingUrl: "http://69.21.72.195/smartwebclient/",
        bookingPhone: "(850) 627-9233",
        clerkUrl: "https://www.gadsdenclerk.com/",
        recordsUrl: "https://officialrecords.gadsdenclerk.com/",
        clerkPhone: "(850) 875-8601",
        nearby: ["jackson", "leon", "liberty", "wakulla"]
    },
    "gilchrist": {
        name: "Gilchrist",
        slug: "gilchrist",
        region: "north",
        bookingUrl: "https://www.gcso.us/contact-us/",
        bookingPhone: "(352) 463-3490",
        clerkUrl: "https://www.gilchristclerk.com/",
        recordsUrl: "https://gilchristclerk.com/official-records/",
        clerkPhone: "(352) 463-3170",
        nearby: ["alachua", "dixie", "lafayette", "levy"]
    },
    "glades": {
        name: "Glades",
        slug: "glades",
        region: "southwest",
        bookingUrl: "https://smartweb.gladessheriff.org/smartwebclient/Jail.aspx",
        bookingPhone: "(863) 946-1600",
        clerkUrl: "https://www.gladesclerk.com/",
        recordsUrl: "https://officialrecords.gladesclerk.com/",
        clerkPhone: "(863) 946-6010",
        nearby: ["charlotte", "collier", "hendry", "highlands", "lee", "palm-beach"]
    },
    "gulf": {
        name: "Gulf",
        slug: "gulf",
        region: "panhandle",
        bookingUrl: "http://www.gulfsheriff.com/arrest-log.cfm",
        bookingPhone: "(850) 227-1115",
        clerkUrl: "https://www.gulfclerk.com/",
        recordsUrl: "https://officialrecords.gulfclerk.com/",
        clerkPhone: "(850) 229-6112",
        nearby: ["bay", "calhoun", "franklin", "liberty"]
    },
    "hamilton": {
        name: "Hamilton",
        slug: "hamilton",
        region: "north",
        bookingUrl: "http://inmate.hamiltonsheriff.com/smartwebclient/jail.aspx",
        bookingPhone: "(386) 792-7131",
        clerkUrl: "https://www.hamiltonclerk.com/",
        recordsUrl: "https://officialrecords.hamiltonclerk.com/",
        clerkPhone: "(386) 792-1288",
        nearby: ["columbia", "madison", "suwannee"]
    },
    "hardee": {
        name: "Hardee",
        slug: "hardee",
        region: "central",
        bookingUrl: "https://www.hardeeso.com/bureaus/inmate_search.php",
        bookingPhone: "(863) 773-0304",
        clerkUrl: "https://www.hardeecountyclerk.com/",
        recordsUrl: "https://officialrecords.hardeecountyclerk.com/",
        clerkPhone: "(863) 773-4174",
        nearby: ["desoto", "highlands", "manatee", "polk"]
    },
    "hendry": {
        name: "Hendry",
        slug: "hendry",
        region: "southwest",
        bookingUrl: "http://www.hendrysheriff.org/arrests_and_jail_info/arrest_and_inmate_search.php",
        bookingPhone: "(863)674-5600",
        clerkUrl: "https://www.hendryclerk.org/",
        recordsUrl: "https://officialrecords.hendryclerk.org/",
        clerkPhone: "(863) 675-5217",
        nearby: ["collier", "glades", "lee", "palm-beach"]
    },
    "hernando": {
        name: "Hernando",
        slug: "hernando",
        region: "central",
        bookingUrl: "https://www.hernandosheriff.org/applications/records/default.aspx",
        bookingPhone: "(352)797-3635",
        clerkUrl: "https://www.hernandoclerk.com/",
        recordsUrl: "https://officialrecords.hernandoclerk.com/",
        clerkPhone: "(352) 754-4201",
        nearby: ["citrus", "pasco", "sumter"]
    },
    "highlands": {
        name: "Highlands",
        slug: "highlands",
        region: "central",
        bookingUrl: "https://www.highlandssheriff.org/inmateSearch",
        bookingPhone: "(863)402-7201",
        clerkUrl: "https://www.highlandsclerk.org/",
        recordsUrl: "https://officialrecords.highlandsclerk.org/",
        clerkPhone: "(863) 402-6565",
        nearby: ["desoto", "glades", "hardee", "okeechobee", "polk"]
    },
    "hillsborough": {
        name: "Hillsborough",
        slug: "hillsborough",
        region: "central",
        bookingUrl: "https://webapps.hcso.tampa.fl.us/ArrestInquiry",
        bookingPhone: "(813) 247-8300",
        clerkUrl: "https://www.hillsclerk.com/",
        recordsUrl: "https://hover.hillsclerk.com/",
        clerkPhone: "(813) 276-8100",
        nearby: ["manatee", "pasco", "pinellas", "polk"]
    },
    "holmes": {
        name: "Holmes",
        slug: "holmes",
        region: "panhandle",
        bookingUrl: "https://holmescosheriff.org/jail-division.html",
        bookingPhone: "(850)547-3681",
        clerkUrl: "https://www.holmesclerk.com/",
        recordsUrl: "https://officialrecords.holmesclerk.com/",
        clerkPhone: "(850) 547-1100",
        nearby: ["jackson", "walton", "washington"]
    },
    "indian-river": {
        name: "Indian River",
        slug: "indian-river",
        region: "central",
        bookingUrl: "https://www.ircsheriff.org/inmate-search",
        bookingPhone: "(772)569-6700",
        clerkUrl: "https://www.clerk.indian-river.org/",
        recordsUrl: "https://ori.indian-river.org/",
        clerkPhone: "(772) 770-5185",
        nearby: ["brevard", "okeechobee", "osceola", "st-lucie"]
    },
    "jackson": {
        name: "Jackson",
        slug: "jackson",
        region: "panhandle",
        bookingUrl: "https://jacksoncountyfl.gov/services/correctional-facility/",
        bookingPhone: "(850)482-9651",
        clerkUrl: "https://www.jacksonclerk.com/",
        recordsUrl: "https://www.jacksonclerk.com/officialrecords/",
        clerkPhone: "(850) 482-9552",
        nearby: ["bay", "calhoun", "gadsden", "holmes", "washington"]
    },
    "jefferson": {
        name: "Jefferson",
        slug: "jefferson",
        region: "panhandle",
        bookingUrl: "https://www.jcso-fl.org/",
        bookingPhone: "(850)997-2523",
        clerkUrl: "https://www.jeffersonclerk.com/",
        recordsUrl: "https://officialrecords.jeffersonclerk.com/",
        clerkPhone: "(850) 342-0218",
        nearby: ["leon", "madison", "taylor", "wakulla"]
    },
    "lafayette": {
        name: "Lafayette",
        slug: "lafayette",
        region: "north",
        bookingUrl: "https://www.lafayetteso.org/index.html",
        bookingPhone: "(386) 294-4381",
        clerkUrl: "https://www.lafayetteclerk.com/",
        recordsUrl: "https://officialrecords.lafayetteclerk.com/",
        clerkPhone: "(386) 294-1600",
        nearby: ["dixie", "gilchrist", "madison", "suwannee", "taylor"]
    },
    "lake": {
        name: "Lake",
        slug: "lake",
        region: "central",
        bookingUrl: "https://www.lcso.org/inmates/",
        bookingPhone: "(352) 742-4024",
        clerkUrl: "https://www.lakecountyclerk.org/",
        recordsUrl: "https://officialrecords.lakecountyclerk.org/",
        clerkPhone: "(352) 742-4100",
        nearby: ["marion", "orange", "polk", "seminole", "sumter", "volusia"]
    },
    "lee": {
        name: "Lee",
        slug: "lee",
        region: "southwest",
        bookingUrl: "https://www.sheriffleefl.org/booking-search/",
        bookingPhone: "(239) 477-1500",
        clerkUrl: "https://www.leeclerk.org/",
        recordsUrl: "https://matrix.leeclerk.org/",
        clerkPhone: "(239) 533-5000",
        nearby: ["charlotte", "collier", "glades", "hendry"]
    },
    "leon": {
        name: "Leon",
        slug: "leon",
        region: "panhandle",
        bookingUrl: "https://www.leoncountyso.com/departments/detention-facility/inmate-search",
        bookingPhone: "(850) 606-3500",
        clerkUrl: "https://www.clerk.leon.fl.us/",
        recordsUrl: "https://oncore.leonclerk.com/",
        clerkPhone: "(850) 606-4000",
        nearby: ["gadsden", "jefferson", "liberty", "wakulla"]
    },
    "levy": {
        name: "Levy",
        slug: "levy",
        region: "north",
        bookingUrl: "https://levyso.com/detention-bureau/",
        bookingPhone: "(352)486-5111",
        clerkUrl: "https://www.levyclerk.com/",
        recordsUrl: "https://officialrecords.levyclerk.com/",
        clerkPhone: "(352) 486-5266",
        nearby: ["alachua", "citrus", "dixie", "gilchrist", "marion"]
    },
    "liberty": {
        name: "Liberty",
        slug: "liberty",
        region: "panhandle",
        bookingUrl: "https://libertycountysheriff.org/jail/",
        bookingPhone: "(850) 643-2235",
        clerkUrl: "https://www.libertyclerk.com/",
        recordsUrl: "https://officialrecords.libertyclerk.com/",
        clerkPhone: "(850) 643-2215",
        nearby: ["calhoun", "franklin", "gadsden", "gulf", "leon", "wakulla"]
    },
    "madison": {
        name: "Madison",
        slug: "madison",
        region: "north",
        bookingUrl: "https://madisonjail.org/",
        bookingPhone: "(850) 973-4002",
        clerkUrl: "https://www.madisonclerk.com/",
        recordsUrl: "https://officialrecords.madisonclerk.com/",
        clerkPhone: "(850) 973-1500",
        nearby: ["hamilton", "jefferson", "lafayette", "suwannee", "taylor"]
    },
    "manatee": {
        name: "Manatee",
        slug: "manatee",
        region: "central",
        bookingUrl: "https://www.manateesheriff.com/arrest_inquiries/",
        bookingPhone: "(941) 723-5132",
        clerkUrl: "https://www.manateeclerk.com/",
        recordsUrl: "https://records.manateeclerk.com/",
        clerkPhone: "(941) 749-1800",
        nearby: ["desoto", "hardee", "hillsborough", "sarasota"]
    },
    "marion": {
        name: "Marion",
        slug: "marion",
        region: "central",
        bookingUrl: "http://jail.marionso.com/",
        bookingPhone: "(352) 732-8181",
        clerkUrl: "https://www.marioncountyclerk.org/",
        recordsUrl: "https://officialrecords.marioncountyclerk.org/",
        clerkPhone: "(352) 671-5604",
        nearby: ["alachua", "citrus", "lake", "levy", "putnam", "sumter", "volusia"]
    },
    "martin": {
        name: "Martin",
        slug: "martin",
        region: "south",
        bookingUrl: "https://www.mcsofl.org/224/Recent-Bookings",
        bookingPhone: "(772) 220-7200",
        clerkUrl: "https://www.martinclerk.com/",
        recordsUrl: "https://ori.martinclerk.com/",
        clerkPhone: "(772) 288-5576",
        nearby: ["okeechobee", "palm-beach", "st-lucie"]
    },
    "miami-dade": {
        name: "Miami-Dade",
        slug: "miami-dade",
        region: "south",
        bookingUrl: "https://www.miamidade.gov/Apps/mdcr/inmateSearch/",
        bookingPhone: "(786) 263-7000",
        clerkUrl: "https://www.miami-dadeclerk.com/",
        recordsUrl: "https://www2.miami-dadeclerk.com/public-records/",
        clerkPhone: "(305) 275-1155",
        nearby: ["broward", "collier", "monroe"]
    },
    "monroe": {
        name: "Monroe",
        slug: "monroe",
        region: "south",
        bookingUrl: "https://www.keysso.net/arrests",
        bookingPhone: "(305) 289-2361",
        clerkUrl: "https://www.monroe-clerk.com/",
        recordsUrl: "https://gov.kofiletech.us/FL-Monroe/",
        clerkPhone: "(305) 292-3550",
        nearby: ["collier", "miami-dade"]
    },
    "nassau": {
        name: "Nassau",
        slug: "nassau",
        region: "north",
        bookingUrl: "https://dssinmate.nassauso.com/NewWorld.InmateInquiry/nassau",
        bookingPhone: "(904) 225-5174",
        clerkUrl: "https://www.nassauclerk.com/",
        recordsUrl: "https://officialrecords.nassauclerk.com/",
        clerkPhone: "(904) 548-4600",
        nearby: ["baker", "duval"]
    },
    "okaloosa": {
        name: "Okaloosa",
        slug: "okaloosa",
        region: "panhandle",
        bookingUrl: "https://www.sheriff-okaloosa.org/news/arrest-information/",
        bookingPhone: "(850) 651-7430",
        clerkUrl: "https://www.okaloosaclerk.com/",
        recordsUrl: "https://officialrecords.okaloosaclerk.com/",
        clerkPhone: "(850) 651-7200",
        nearby: ["escambia", "santa-rosa", "walton"]
    },
    "okeechobee": {
        name: "Okeechobee",
        slug: "okeechobee",
        region: "central",
        bookingUrl: "https://www.okeesheriff.org/inmate-search",
        bookingPhone: "(863) 763-3117",
        clerkUrl: "https://www.clerk.co.okeechobee.fl.us/",
        recordsUrl: "https://ori.clerk.co.okeechobee.fl.us/",
        clerkPhone: "(863) 763-2131",
        nearby: ["glades", "highlands", "indian-river", "martin", "osceola", "palm-beach", "st-lucie"]
    },
    "orange": {
        name: "Orange",
        slug: "orange",
        region: "central",
        bookingUrl: "https://netapps.ocfl.net/BestJail/Home/Inmates",
        bookingPhone: "(407) 836-3400",
        clerkUrl: "https://www.myorangeclerk.com/",
        recordsUrl: "https://myeclerk.myorangeclerk.com/",
        clerkPhone: "(407) 836-2000",
        nearby: ["brevard", "lake", "osceola", "polk", "seminole", "volusia"]
    },
    "osceola": {
        name: "Osceola",
        slug: "osceola",
        region: "central",
        bookingUrl: "https://www.osceola.org/agencies-departments/corrections/corrections-reports.stml",
        bookingPhone: "(407) 742-4444",
        clerkUrl: "https://www.osceolaclerk.com/",
        recordsUrl: "https://ori.osceolaclerk.com/",
        clerkPhone: "(407) 742-3500",
        nearby: ["brevard", "indian-river", "okeechobee", "orange", "polk"]
    },
    "palm-beach": {
        name: "Palm Beach",
        slug: "palm-beach",
        region: "south",
        bookingUrl: "https://www.pbso.org/arrest-jail_menu",
        bookingPhone: "(561) 688-3000",
        clerkUrl: "https://www.mypalmbeachclerk.com/",
        recordsUrl: "https://appsgp.mypalmbeachclerk.com/eCaseView/",
        clerkPhone: "(561) 355-2996",
        nearby: ["broward", "glades", "hendry", "martin", "okeechobee"]
    },
    "pasco": {
        name: "Pasco",
        slug: "pasco",
        region: "central",
        bookingUrl: "https://jailinfo.pascocorrections.net/JMC/#/inCustody",
        bookingPhone: "(813) 996-6982",
        clerkUrl: "https://www.pascoclerk.com/",
        recordsUrl: "https://www.pascoclerk.com/172/Search-Court-Records",
        clerkPhone: "(727) 847-8962",
        nearby: ["hernando", "hillsborough", "pinellas", "polk", "sumter"]
    },
    "pinellas": {
        name: "Pinellas",
        slug: "pinellas",
        region: "central",
        bookingUrl: "https://pcsoweb.com/InmateBooking",
        bookingPhone: "(727)464-6415",
        clerkUrl: "https://www.mypinellasclerk.gov/",
        recordsUrl: "https://ccmspa.pinellascounty.org/PublicAccess/default.aspx",
        clerkPhone: "(727) 464-7000",
        nearby: ["hillsborough", "pasco"]
    },
    "polk": {
        name: "Polk",
        slug: "polk",
        region: "central",
        bookingUrl: "https://www.polksheriff.org/detention/jail-inquiry",
        bookingPhone: "(863)292-3400",
        clerkUrl: "https://www.polkcountyclerk.net/",
        recordsUrl: "https://pro.polkcountyclerk.net/PRO",
        clerkPhone: "(863)534-4000",
        nearby: ["hardee", "highlands", "hillsborough", "lake", "orange", "osceola", "pasco", "sumter"]
    },
    "putnam": {
        name: "Putnam",
        slug: "putnam",
        region: "north",
        bookingUrl: "http://smartweb.pcso.us/smartwebclient/jail.aspx",
        bookingPhone: "(386) 329-0800",
        clerkUrl: "https://putnamclerk.com/",
        recordsUrl: "https://www.civitekflorida.com/ocrs/county/54/",
        clerkPhone: "(386) 326-7630",
        nearby: ["alachua", "bradford", "clay", "flagler", "marion", "st-johns", "volusia"]
    },
    "santa-rosa": {
        name: "Santa Rosa",
        slug: "santa-rosa",
        region: "panhandle",
        bookingUrl: "https://santarosasheriff.org/jail-view/",
        bookingPhone: "(850) 983-1120",
        clerkUrl: "http://oncoreweb.srccol.com/srccol/formspage1.html",
        recordsUrl: "https://www.civitekflorida.com/ocrs/county/57/",
        clerkPhone: "(850)981-5554",
        nearby: ["escambia", "okaloosa"]
    },
    "sarasota": {
        name: "Sarasota",
        slug: "sarasota",
        region: "southwest",
        bookingUrl: "https://www.sarasotasheriff.org/arrest-reports/index.php",
        bookingPhone: "(941) 861-4601",
        clerkUrl: "https://www.sarasotaclerk.com/",
        recordsUrl: "https://secure.sarasotaclerk.com/Login.aspx?session=0",
        clerkPhone: "(941) 861-7400",
        nearby: ["charlotte", "desoto", "manatee"]
    },
    "seminole": {
        name: "Seminole",
        slug: "seminole",
        region: "central",
        bookingUrl: "https://www.seminolesheriff.org/WebBond/Inmates.aspx",
        bookingPhone: "(407) 665-1200",
        clerkUrl: "https://www.seminoleclerk.org/",
        recordsUrl: "https://courtrecords.seminoleclerk.org/criminal/default.aspx",
        clerkPhone: "(407) 665-4300",
        nearby: ["brevard", "lake", "orange", "volusia"]
    },
    "st-johns": {
        name: "St. Johns",
        slug: "st-johns",
        region: "north",
        bookingUrl: "https://www.sjso.org/detention-center/sj-inmate-search/",
        bookingPhone: "(904) 209-3125",
        clerkUrl: "https://stjohnsclerk.com/",
        recordsUrl: "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search",
        clerkPhone: "(904) 819-3600",
        nearby: ["clay", "duval", "flagler", "putnam"]
    },
    "st-lucie": {
        name: "St. Lucie",
        slug: "st-lucie",
        region: "central",
        bookingUrl: "https://www.stluciesheriff.com/215/Inmate-Lookup",
        bookingPhone: "(772)462-3450",
        clerkUrl: "https://stlucieclerk.gov/",
        recordsUrl: "https://stlucieclerk.gov/public-search-gen/search-court-cases",
        clerkPhone: "(772) 462-6900",
        nearby: ["indian-river", "martin", "okeechobee"]
    },
    "sumter": {
        name: "Sumter",
        slug: "sumter",
        region: "central",
        bookingUrl: "https://portal.sumtercountysheriff.org/smartwebclient/jail.aspx",
        bookingPhone: "(352) 793-2621",
        clerkUrl: "https://www.sumterclerk.com/",
        recordsUrl: "https://www.civitekflorida.com/ocrs/county/60/",
        clerkPhone: "(352) 569-6600",
        nearby: ["citrus", "hernando", "lake", "marion", "pasco", "polk"]
    },
    "suwannee": {
        name: "Suwannee",
        slug: "suwannee",
        region: "north",
        bookingUrl: "https://smartcop.suwanneesheriff.com/smartwebclient/jail.aspx",
        bookingPhone: "(386) 364-3776",
        clerkUrl: "https://www.suwgov.org/",
        recordsUrl: "https://www.suwgov.org/county-recorder/",
        clerkPhone: "(386) 362-0520",
        nearby: ["columbia", "hamilton", "lafayette", "madison"]
    },
    "taylor": {
        name: "Taylor",
        slug: "taylor",
        region: "north",
        bookingUrl: "http://smartcop.taylorsheriff.org:8989/SmartWEBClient/Jail.aspx",
        bookingPhone: "(850) 584-4333",
        clerkUrl: "https://taylorclerk.com/",
        recordsUrl: "http://pubrecs.taylorclerk.com/PublicInquiry/Search.aspx?Type=Name",
        clerkPhone: "(850) 838-3506",
        nearby: ["dixie", "jefferson", "lafayette", "madison"]
    },
    "union": {
        name: "Union",
        slug: "union",
        region: "north",
        bookingUrl: "http://www.unionsheriff.us/county-jail.php",
        bookingPhone: "(386) 496-2501",
        clerkUrl: "https://unionclerk.com/",
        recordsUrl: "https://www.civitekflorida.com/ocrs/county/63/",
        clerkPhone: "(386) 496-3711",
        nearby: ["alachua", "baker", "bradford", "columbia"]
    },
    "volusia": {
        name: "Volusia",
        slug: "volusia",
        region: "central",
        bookingUrl: "https://volusiamug.vcgov.org/",
        bookingPhone: "(386) 254-1555",
        clerkUrl: "https://www.clerk.org/",
        recordsUrl: "https://ccms.clerk.org/",
        clerkPhone: "(386) 736-5915",
        nearby: ["brevard", "flagler", "lake", "marion", "orange", "putnam", "seminole"]
    },
    "wakulla": {
        name: "Wakulla",
        slug: "wakulla",
        region: "panhandle",
        bookingUrl: "https://www.wcso.org/",
        bookingPhone: "(850) 745-7100",
        clerkUrl: "https://www.wakullaclerk.com/",
        recordsUrl: "https://www.civitekflorida.com/ocrs/county/65/",
        clerkPhone: "(850) 926-0905",
        nearby: ["franklin", "gadsden", "jefferson", "leon", "liberty"]
    },
    "walton": {
        name: "Walton",
        slug: "walton",
        region: "panhandle",
        bookingUrl: "https://nwscorrections.waltonso.org/NewWorld.InMateInquiry/WaltonCounty",
        bookingPhone: "(850) 892-8196",
        clerkUrl: "https://waltonclerk.com/",
        recordsUrl: "https://waltonclerk.com/courtrecords",
        clerkPhone: "(850) 892 - 8115",
        nearby: ["bay", "holmes", "okaloosa", "washington"]
    },
    "washington": {
        name: "Washington",
        slug: "washington",
        region: "panhandle",
        bookingUrl: "https://www.wcso.us/inmateRoster",
        bookingPhone: "(850) 638-6111",
        clerkUrl: "https://www.washingtonclerk.com/",
        recordsUrl: "https://www.civitekflorida.com/ocrs/county/67/",
        clerkPhone: "(850) 638-6285",
        nearby: ["bay", "holmes", "jackson", "walton"]
    }
};

/**
 * Get county data by slug
 * 
 * @param {string} slug - County slug (e.g., "lee", "miami-dade")
 * @returns {Object|null} - County data or null if not found
 */
export function getCountyData(slug) {
    return floridaCountiesData[slug] || null;
}

/**
 * Get all counties
 * 
 * @returns {Array} - Array of all county objects
 */
export function getAllCounties() {
    return Object.values(floridaCountiesData);
}

/**
 * Get counties by region
 * 
 * @param {string} region - Region name (panhandle, north, central, southwest, south)
 * @returns {Array} - Array of counties in the region
 */
export function getCountiesByRegion(region) {
    return Object.values(floridaCountiesData).filter(county => county.region === region);
}

/**
 * Get nearby counties
 * 
 * @param {string} slug - County slug
 * @returns {Array} - Array of nearby county objects
 */
export function getNearbyCounties(slug) {
    const county = floridaCountiesData[slug];
    if (!county || !county.nearby) {
        return [];
    }
    
    return county.nearby
        .map(nearbySlug => floridaCountiesData[nearbySlug])
        .filter(Boolean);
}

/**
 * Search counties by name
 * 
 * @param {string} query - Search query
 * @returns {Array} - Array of matching counties
 */
export function searchCounties(query) {
    const lowerQuery = query.toLowerCase();
    return Object.values(floridaCountiesData).filter(county => 
        county.name.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get county count
 * 
 * @returns {number} - Total number of counties (67)
 */
export function getCountyCount() {
    return Object.keys(floridaCountiesData).length;
}

/**
 * Validate county slug
 * 
 * @param {string} slug - County slug to validate
 * @returns {boolean} - Whether the slug is valid
 */
export function isValidCountySlug(slug) {
    return slug in floridaCountiesData;
}
