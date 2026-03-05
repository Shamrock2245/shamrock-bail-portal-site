import wixWindow from 'wix-window';

export function validateStickyFooter(footerId = '#boxStickyFooter') {
    if (wixWindow.formFactor !== 'Mobile') return;
    $w.onReady(() => {
        const footer = $w(footerId);
        if (!footer) {
            console.error('[X] UI Validator: Sticky Footer ' + footerId + ' NOT FOUND.');
            return;
        }
        if (footer.collapsed) {
            console.error('[X] UI Validator: Sticky Footer ' + footerId + ' is COLLAPSED.');
            return;
        }
        if (footer.hidden) {
            console.error('[X] UI Validator: Sticky Footer ' + footerId + ' is HIDDEN.');
            return;
        }
        console.log('[OK] UI Validator: Sticky Footer ' + footerId + ' is present and visible.');
    });
}
