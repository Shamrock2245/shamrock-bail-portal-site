import wixWindow from 'wix-window';

/**
 * Paperwork Review Lightbox
 *
 * Client paperwork is initiated only after a staff member validates the Match,
 * BondCase, surety, POA, and recipient records in Super CRM. This lightbox
 * intentionally never creates a signing link or embeds a third-party signer.
 */
$w.onReady(() => {
    try {
        $w('#signingFrame').hide();
        $w('#loadingIndicator').hide();
        $w('#signingTitle').text = 'Paperwork Review in Progress';
        $w('#signingInstructions').text = (
            'Your case details are being reviewed. A verified DocuSeal link will be sent '
            + 'only after staff confirms the required case and recipient information.'
        );
        $w('#signingInstructions').show();
        $w('#errorMessage').hide();

        $w('#cancelBtn').onClick(() => wixWindow.lightbox.close({ cancelled: true }));
        if ($w('#helpBtn')) {
            $w('#helpBtn').onClick(() => {
                $w('#signingInstructions').text = (
                    'For help with paperwork, contact Shamrock Bail Bonds. Staff must review '
                    + 'the case before any signing request can be issued.'
                );
            });
        }
    } catch (error) {
        console.warn('Paperwork review notice could not be fully displayed.');
    }
});
