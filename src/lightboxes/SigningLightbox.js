import wixWindow from 'wix-window';
import { PAPERWORK_APP_URL } from 'public/portal-config';

/**
 * Paperwork popup — hosts the Netlify paperwork mini-app.
 * The iframe starts a client-owned intake when no packet exists. It opens
 * DocuSeal only after staff has issued a validated final packet.
 */
function buildPaperworkUrl(ctx) {
    const params = new URLSearchParams({ embed: '1' });
    const member = (ctx && ctx.memberData) || {};
    const phone = member.phone || ctx.phone || '';
    // The embedded paperwork app owns its own verified PIN session. Do not pass
    // the separate Wix portal token as `st`, because it is not a CRM PIN token.
    const token = ctx.paperworkSessionToken || ctx.portalSessionToken || '';
    const packet = ctx.packetId || ctx.caseId || '';
    if (phone) params.set('phone', String(phone).replace(/\D/g, ''));
    if (token) params.set('st', token);
    if (packet) params.set('case', String(packet));
    if (ctx.role) params.set('role', String(ctx.role));
    if (ctx.signUrl) params.set('link', ctx.signUrl);
    return `${PAPERWORK_APP_URL}?${params.toString()}`;
}

$w.onReady(() => {
    const ctx = wixWindow.lightbox.getContext() || {};
    const url = buildPaperworkUrl(ctx);

    try {
        $w('#loadingIndicator').hide();
        $w('#errorMessage').hide();
        $w('#signingTitle').text = 'Bond Paperwork';
        $w('#signingInstructions').text = (
            'Choose your role, unlock with a PIN, scan your ID, and review your own information. Shamrock staff will match the case and complete final paperwork when needed.'
        );
        $w('#signingInstructions').show();

        const frame = $w('#signingFrame');
        if (frame) {
            const member = ctx.memberData || {};
            const payload = {
                type: 'shamrock-paperwork-open',
                url,
                phone: member.phone || ctx.phone || '',
                paperworkSessionToken: ctx.paperworkSessionToken || ctx.portalSessionToken || '',
                role: ctx.role || '',
                signUrl: ctx.signUrl || '',
                caseId: ctx.packetId || ctx.caseId || ''
            };
            try { frame.src = url; } catch (_) { /* Code-mode HTML iframe ignores src */ }
            if (typeof frame.postMessage === 'function') {
                frame.postMessage(payload);
                setTimeout(() => frame.postMessage(payload), 400);
            }
            frame.show();
            if (typeof frame.onMessage === 'function') {
                frame.onMessage((event) => {
                    const msg = event && event.data;
                    if (msg && msg.type === 'shamrock-paperwork-ready') {
                        if (typeof frame.postMessage === 'function') frame.postMessage(payload);
                    }
                    if (msg && (msg.type === 'shamrock-paperwork-complete' || msg.type === 'shamrock-paperwork-close')) {
                        wixWindow.lightbox.close({ success: msg.type === 'shamrock-paperwork-complete' });
                    }
                });
            }
        }

        if ($w('#cancelBtn')) {
            $w('#cancelBtn').onClick(() => wixWindow.lightbox.close({ cancelled: true }));
        }
        if ($w('#helpBtn')) {
            $w('#helpBtn').onClick(() => {
                $w('#signingInstructions').text = 'Need help? Call Shamrock Bail Bonds at (239) 332-2245.';
            });
        }
    } catch (error) {
        console.warn('Paperwork popup could not mount the Netlify app.');
        try {
            $w('#signingInstructions').text = (
                'Open this secure paperwork link on your phone: ' + url
            );
        } catch (_) { /* ignore */ }
    }
});
