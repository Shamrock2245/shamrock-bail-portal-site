/**
 * StaffPromptLightbox.js
 *
 * Wix Editor lightbox for staff input / select / confirm.
 * Create a lightbox named **StaffPromptLightbox** and bind this file.
 *
 * Required Editor IDs:
 *   #promptTitle        text
 *   #promptHint         text
 *   #promptInput        input (hidden in select mode)
 *   #promptSelect       dropdown (hidden in input mode)
 *   #promptConfirmBtn   button (≥44px)
 *   #promptCancelBtn    button (≥44px)
 *
 * Context:
 *   { mode: 'input'|'select', title, placeholder, hint, options: string[] }
 * Closes with { value, cancelled }.
 */
import wixWindow from 'wix-window';

function hasEl(id) {
    try {
        return $w(id) && $w(id).length;
    } catch (e) {
        return false;
    }
}

function setText(id, value) {
    if (hasEl(id)) $w(id).text = value || '';
}

$w.onReady(function () {
    const ctx = wixWindow.lightbox.getContext() || {};
    const mode = ctx.mode === 'select' ? 'select' : 'input';
    const options = Array.isArray(ctx.options) ? ctx.options : [];

    setText('#promptTitle', ctx.title || 'Staff prompt');
    setText('#promptHint', ctx.hint || ctx.placeholder || '');

    if (mode === 'select') {
        if (hasEl('#promptInput')) $w('#promptInput').collapse();
        if (hasEl('#promptSelect')) {
            $w('#promptSelect').expand();
            $w('#promptSelect').options = options.map((o) => ({
                label: String(o).replace(/_/g, ' '),
                value: o
            }));
            if (options.length) $w('#promptSelect').value = options[0];
        }
    } else if (hasEl('#promptInput')) {
        $w('#promptInput').expand();
        $w('#promptInput').value = '';
        try { $w('#promptInput').placeholder = ctx.placeholder || ''; } catch (e) { /* optional */ }
        if (hasEl('#promptSelect')) $w('#promptSelect').collapse();
    }

    if (hasEl('#promptCancelBtn')) {
        $w('#promptCancelBtn').onClick(() => {
            wixWindow.lightbox.close({ value: null, cancelled: true });
        });
    }

    if (hasEl('#promptConfirmBtn')) {
        $w('#promptConfirmBtn').onClick(() => {
            let value = null;
            if (mode === 'select' && hasEl('#promptSelect')) {
                value = $w('#promptSelect').value || null;
            } else if (hasEl('#promptInput')) {
                value = String($w('#promptInput').value || '').trim() || null;
            }
            wixWindow.lightbox.close({ value: value, cancelled: false });
        });
    }
});
