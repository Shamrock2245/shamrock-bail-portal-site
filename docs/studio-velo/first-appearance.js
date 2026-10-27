/**
 * first-appearance.js - First Appearance Court Schedules for Wix Studio
 * Page: First Appearance (/first-appearance)
 * Branch: Wix studio version (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4)
 *
 * Loads the statewide catalog from backend/first-appearance-api.jsw
 * (all Florida counties, not a short circuit list).
 */

import wixWindowFrontend from 'wix-window-frontend';
import { getFirstAppearanceSchedules } from 'backend/first-appearance-api.jsw';

let scheduleRows = [];

function toRepeaterRow(county) {
    const name = county.name || 'Florida county';
    const circuit = county.circuit ? `${county.circuit} · ${name}` : name;
    const schedule = county.schedule || 'Call 239-332-2245 for today’s courtroom time.';
    return {
        _id: county.slug || name,
        circuit: circuit,
        counties: name,
        weekdays: schedule,
        weekends: 'Weekend and holiday times are in the county schedule when the court publishes them. Call 239-332-2245 to confirm.',
        location: county.location || '',
        zoomLink: county.liveUrl || '',
        notes: county.notes || ''
    };
}

$w.onReady(async function () {
    const repeater = $w('#repeaterSchedules');
    const searchInput = $w('#searchCountyInput');
    const clearBtn = $w('#clearFilterBtn');

    if (!repeater) return;

    try {
        const result = await getFirstAppearanceSchedules();
        const counties = result && result.success && Array.isArray(result.counties) ? result.counties : [];
        scheduleRows = counties.map(toRepeaterRow);
    } catch (err) {
        console.error('First appearance catalog failed:', err);
        scheduleRows = [];
    }

    let repeaterReady = false;

    function bindScheduleItem($item, itemData) {
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
    }

    function populateRepeater(data) {
        // onItemReady must be registered before the first data assignment.
        // forEachItem only walks items that already exist, so a first load of
        // new statewide rows would otherwise keep the repeater template text.
        if (!repeaterReady) {
            repeater.onItemReady(($item, itemData) => bindScheduleItem($item, itemData));
            repeaterReady = true;
        }
        repeater.data = data;

        const noResultsBox = $w('#noResultsBox');
        if (noResultsBox) {
            if (data.length === 0) {
                noResultsBox.expand();
            } else {
                noResultsBox.collapse();
            }
        }
    }

    populateRepeater(scheduleRows);

    if (searchInput) {
        searchInput.onInput(() => {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) {
                populateRepeater(scheduleRows);
                return;
            }

            const filtered = scheduleRows.filter(item =>
                item.circuit.toLowerCase().includes(query) ||
                item.counties.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query) ||
                item.weekdays.toLowerCase().includes(query)
            );

            populateRepeater(filtered);
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.onClick(() => {
            searchInput.value = '';
            populateRepeater(scheduleRows);
        });
    }

});
