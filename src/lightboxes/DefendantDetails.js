import wixWindow from 'wix-window';
import wixData from 'wix-data';

$w.onReady(function () {
    // 1. Get the data sent from the Staff Portal
    const data = wixWindow.lightbox.getContext();

    // 2. If no data, stop (safety check)
    if (!data) return;

    // 3. Map the data to your new elements
    $w('#detailsNameText').text = data.defendantName || "No Name";
    $w('#detailsCaseNumberText').text = data.caseNumber || "No Case";
    $w('#detailsBondText').text = data.bondAmount || "$0.00";
    $w('#detailsStatusText').text = data.status || "Unknown";

    // 4. Wire the Close Button
    $w('#closeBtn').onClick(() => wixWindow.lightbox.close());

    // 5. Wire the Save Notes Button (Mock)
    $w('#saveNotesBtn').onClick(() => {
        $w('#saveNotesBtn').label = "Saving...";
        setTimeout(() => {
            $w('#saveNotesBtn').label = "Saved!";
        }, 1000);
    });
});
