import wixWindow from 'wix-window';
import { PAPERWORK_APP_URL } from 'public/portal-config';

function buildPaperworkUrl(ctx) {
    const params = new URLSearchParams({ embed: '1' });
    const member = (ctx && ctx.memberData) || {};
    const phone = member.phone || ctx.phone || '';
    const token = ctx.sessionToken || ctx.st || '';
    const packet = ctx.packetId || ctx.caseId || '';
    if (phone) params.set('phone', String(phone).replace(/\D/g, ''));
    if (token) params.set('st', token);
    if (packet) params.set('case', String(packet));
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
            'Unlock with the PIN we text you, scan your ID, confirm remaining fields, then sign.'
        );
        $w('#signingInstructions').show();

        const frame = $w('#signingFrame');
        if (frame) {
            const member = ctx.memberData || {};
            const payload = {
                type: 'shamrock-paperwork-open',
                url,
                phone: member.phone || ctx.phone || '',
                sessionToken: ctx.sessionToken || ctx.st || '',
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
    } catch (error) {
        console.warn('Paperwork popup could not mount the Netlify app.');
    }
});
