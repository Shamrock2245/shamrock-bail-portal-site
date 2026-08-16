import wixWindow from 'wix-window';

/**
 * Paperwork Review Lightbox
 *
 * This client surface never creates a signing link. Staff must first validate
 * the Match, BondCase, surety, POA, and recipient records before DocuSeal is used.
 */
$w.onReady(() => {
    try {
        $w('#signingFrame').hide();
        $w('#loadingIndicator').hide();
        $w('#signingTitle').text = 'Paperwork Review in Progress';
        $w('#signingInstructions').text = (
            'Your case details are being reviewed. Staff will send a verified DocuSeal link '
            + 'only after the required case and recipient information is confirmed.'
        );
        $w('#signingInstructions').show();
        $w('#errorMessage').hide();
        if ($w('#cancelBtn')) {
            $w('#cancelBtn').onClick(() => wixWindow.lightbox.close({ cancelled: true }));
        }
    } catch (error) {
        console.warn('Paperwork review notice could not be fully displayed.');
    }
});
