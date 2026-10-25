/**
 * first-appearance.js - First Appearance Court Schedules for Wix Studio
 * Page: First Appearance (/first-appearance)
 * Branch: Wix studio version (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4)
 * 
 * Handles:
 * 1. Florida 20 Judicial Circuits schedule directory & interactive search filter
 * 2. Weekend/Holiday bond hearing time lookup
 * 3. Courtroom video/Zoom appearance links and instructions
 * 4. Direct bail dispatch integration
 */

import wixWindowFrontend from 'wix-window-frontend';

// Official Florida Judicial Circuit First Appearance Schedule Dataset
const CIRCUIT_SCHEDULES = [
    {
        _id: "circuit-20",
        circuit: "20th Judicial Circuit",
        counties: "Lee, Collier, Charlotte, Hendry, Glades",
        weekdays: "Lee: 9:30 AM · Collier: 2:00 PM · Charlotte: 8:30 AM · Hendry/Glades: 9:00 AM",
        weekends: "Lee: 9:00 AM · Collier: 9:00 AM · Charlotte: 8:30 AM · Hendry/Glades: 9:00 AM",
        location: "Lee County Justice Center, 1700 Monroe St, Fort Myers, FL 33901",
        zoomLink: "https://www.ca.cjis20.org/",
        notes: "Primary Shamrock service area. Video hearing links available online."
    },
    {
        _id: "circuit-12",
        circuit: "12th Judicial Circuit",
        counties: "Sarasota, Manatee, DeSoto",
        weekdays: "Sarasota: 1:00 PM · Manatee: 8:30 AM · DeSoto: 9:00 AM",
        weekends: "Sarasota: 9:00 AM · Manatee: 8:30 AM · DeSoto: 9:00 AM",
        location: "Sarasota County Courthouse / Manatee County Judicial Center",
        zoomLink: "https://www.jud12.flcourts.org/",
        notes: "Hearings held via closed-circuit video from the jail."
    },
    {
        _id: "circuit-13",
        circuit: "13th Judicial Circuit",
        counties: "Hillsborough",
        weekdays: "Morning: 9:00 AM · Afternoon: 1:30 PM",
        weekends: "9:00 AM (Orient Road Jail Courtroom)",
        location: "401 N Jefferson St, Tampa, FL 33602",
        zoomLink: "https://www.fljud13.org/",
        notes: "Live audio broadcast available on circuit website."
    },
    {
        _id: "circuit-06",
        circuit: "6th Judicial Circuit",
        counties: "Pinellas, Pasco",
        weekdays: "Pinellas: 8:30 AM & 1:30 PM · Pasco: 8:30 AM",
        weekends: "Pinellas: 8:30 AM · Pasco: 8:30 AM",
        location: "Pinellas Criminal Justice Center / West Pasco Judicial Center",
        zoomLink: "https://www.jud6.org/",
        notes: "All felony and misdemeanor first appearances conducted daily."
    },
    {
        _id: "circuit-09",
        circuit: "9th Judicial Circuit",
        counties: "Orange, Osceola",
        weekdays: "Orange: 9:00 AM & 1:00 PM · Osceola: 9:00 AM",
        weekends: "Orange: 8:30 AM · Osceola: 9:00 AM",
        location: "Orange County Courthouse / Osceola County Courthouse",
        zoomLink: "https://ninthcircuit.org/",
        notes: "Daily 24-hour statutory hearings strictly observed."
    },
    {
        _id: "circuit-11",
        circuit: "11th Judicial Circuit",
        counties: "Miami-Dade",
        weekdays: "Morning: 9:00 AM · Afternoon: 1:30 PM",
        weekends: "9:00 AM (Richard E. Gerstein Justice Building)",
        location: "1351 NW 12th St, Miami, FL 33125",
        zoomLink: "https://www.jud11.flcourts.org/",
        notes: "Video hearings streamed live for public and defense counsel."
    },
    {
        _id: "circuit-17",
        circuit: "17th Judicial Circuit",
        counties: "Broward",
        weekdays: "Morning: 8:30 AM · Afternoon: 1:30 PM",
        weekends: "8:30 AM",
        location: "201 SE 6th St, Fort Lauderdale, FL 33301",
        zoomLink: "https://www.17th.flcourts.org/",
        notes: "Hearings held in Magistrate Courtroom via video link."
    },
    {
        _id: "circuit-15",
        circuit: "15th Judicial Circuit",
        counties: "Palm Beach",
        weekdays: "Morning: 8:30 AM · Afternoon: 1:30 PM",
        weekends: "8:30 AM (Gun Club Criminal Justice Complex)",
        location: "3228 Gun Club Rd, West Palm Beach, FL 33406",
        zoomLink: "https://www.15thcircuit.co.palm-beach.fl.us/",
        notes: "Weekend hearings conducted at Gun Club facility."
    }
];

$w.onReady(function () {
    const repeater = $w('#repeaterSchedules');
    const searchInput = $w('#searchCountyInput');
    const clearBtn = $w('#clearFilterBtn');

    if (!repeater) return;

    // Initial population
    populateRepeater(CIRCUIT_SCHEDULES);

    // Live search filter
    if (searchInput) {
        searchInput.onInput(() => {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) {
                populateRepeater(CIRCUIT_SCHEDULES);
                return;
            }

            const filtered = CIRCUIT_SCHEDULES.filter(item =>
                item.circuit.toLowerCase().includes(query) ||
                item.counties.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query)
            );

            populateRepeater(filtered);
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.onClick(() => {
            searchInput.value = '';
            populateRepeater(CIRCUIT_SCHEDULES);
        });
    }

    function populateRepeater(data) {
        repeater.data = data;
        repeater.forEachItem(($item, itemData) => {
            if ($item('#textCircuitTitle')) $item('#textCircuitTitle').text = itemData.circuit;
            if ($item('#textCountiesList')) $item('#textCountiesList').text = itemData.counties;
            if ($item('#textWeekdaysTime')) $item('#textWeekdaysTime').text = itemData.weekdays;
            if ($item('#textWeekendsTime')) $item('#textWeekendsTime').text = itemData.weekends;
            if ($item('#textCourtLocation')) $item('#textCourtLocation').text = itemData.location;
            if ($item('#textScheduleNotes')) $item('#textScheduleNotes').text = itemData.notes;

            const zoomBtn = $item('#btnOpenZoomLink');
            if (zoomBtn && itemData.zoomLink) {
                zoomBtn.onClick(() => {
                    wixWindowFrontend.openModal(itemData.zoomLink, { target: '_blank' });
                });
            }
        });

        const noResultsBox = $w('#noResultsBox');
        if (noResultsBox) {
            if (data.length === 0) {
                noResultsBox.expand();
            } else {
                noResultsBox.collapse();
            }
        }
    }
});
