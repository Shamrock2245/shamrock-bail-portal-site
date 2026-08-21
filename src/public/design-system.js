/**
 * public/design-system.js
 * 
 * Centralized Design System Constants for Shamrock Bail Bonds
 * Dark, Premium, High-Contrast Emergency UI
 */

export const COLORS = {
    // Brand & Emergency Colors
    CANVAS: '#0B1118',
    SURFACE: '#0E1724',
    CARD_BG: '#131F2E',
    SHAMROCK_GREEN: '#00A86B',
    SHAMROCK_DEEP: '#006644',
    EMERGENCY_GOLD: '#FDB913',
    ACTION_BLUE: '#0066CC',

    // Status Colors
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#38BDF8',

    // High-Contrast Text & Neutrals
    WHITE: '#FFFFFF',
    TEXT_SECONDARY: '#F1F5F9',
    TEXT_MUTED: '#94A3B8',
    TEXT_DIM: '#64748B',
    BORDER_SUBTLE: 'rgba(255, 255, 255, 0.12)',
    BORDER_GREEN: 'rgba(0, 168, 107, 0.4)'
};

export const TYPOGRAPHY = {
    HEADING_FONT: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    BODY_FONT: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
};

export const STYLES = {
    BOX_SHADOW_EMERGENCY: '0 0 24px rgba(0, 168, 107, 0.25)',
    BOX_SHADOW_GOLD: '0 0 20px rgba(253, 185, 19, 0.25)',
    BOX_SHADOW_CARD: '0 10px 30px -5px rgba(0, 0, 0, 0.6)',
    BORDER_RADIUS: '10px',
    TAP_TARGET_MIN: '44px',
    TAP_TARGET_STANDARD: '52px'
};

/**
 * Apply high-contrast status styling to a box and text element
 * @param {object} $w_box - Container box element
 * @param {object} $w_text - Text label element
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {string} message 
 */
export function applyStatusStyle($w_box, $w_text, type, message) {
    if (!$w_box || !$w_text) return;

    let bgColor = 'rgba(56, 189, 248, 0.15)';
    let textColor = COLORS.INFO;

    switch (type) {
        case 'success':
            bgColor = 'rgba(16, 185, 129, 0.15)';
            textColor = COLORS.SUCCESS;
            break;
        case 'error':
            bgColor = 'rgba(239, 68, 68, 0.2)';
            textColor = COLORS.ERROR;
            break;
        case 'warning':
            bgColor = 'rgba(245, 158, 11, 0.18)';
            textColor = COLORS.WARNING;
            break;
    }

    try {
        if ($w_box.style) {
            $w_box.style.backgroundColor = bgColor;
            $w_box.style.borderColor = textColor;
        }
    } catch (e) { /* non-fatal */ }

    $w_text.text = message;
}

export default {
    COLORS,
    TYPOGRAPHY,
    STYLES,
    applyStatusStyle
};
