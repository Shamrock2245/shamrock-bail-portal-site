/**
 * Co-signer invite presentation. No network and no texts.
 * The page shows invite_url and offers copy plus navigator.share.
 */

export const COSIGNER_FAIL = "We couldn't create that co-signer link. Please call (239) 332-2245.";
export const COSIGNER_READY = 'Share this link with the co-signer. This page does not send a text.';
export const COSIGNER_COPIED = 'Link copied. This page does not send a text.';
export const COSIGNER_COPY_MANUAL = 'Select the link to copy it, or call (239) 332-2245.';
export const COSIGNER_SHARE_UNAVAILABLE = 'Sharing is not available on this device. Copy the link, or call (239) 332-2245.';

export function invitePresentation(result) {
    const url = result && result.ok === true && typeof result.invite_url === 'string' ? result.invite_url : '';
    if (!url) {
        return { ok: false, message: COSIGNER_FAIL, inviteUrl: '', showLink: false };
    }
    return { ok: true, message: COSIGNER_READY, inviteUrl: url, showLink: true };
}

export function shareData(inviteUrl) {
    return { title: 'Shamrock Bail Bonds co-signer link', url: inviteUrl };
}

export function canShare(nav) {
    return !!(nav && typeof nav.share === 'function');
}
