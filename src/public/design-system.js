/**
 * public/design-system.js
 * 
 * Centralized Design System for Shamrock Bail Bonds
 * Use these constants to ensure consistent styling across Velo pages.
 */

export const COLORS = {
    // Brand Colors
    SHAMROCK_GREEN: '#009B4D', // Main Brand Color
    GOLD_ACCENT: '#FFD700',    // Calls to Action / Highlights
    PRO_BLUE: '#1A5490',       // Professional/Trust (Secondary)

    // Status Colors
    SUCCESS: '#00C851',
    WARNING: '#FFBB33',
    ERROR: '#FF4444',
    INFO: '#33B5E5',

    // Neutrals
    WHITE: '#FFFFFF',
    LIGHT_GREY: '#F4F4F4',
    DARK_GREY: '#333333',
    BLACK: '#000000'
};

export const TYPOGRAPHY = {
    HEADING_FONT: 'avenir-lt-w01_85-heavy1475544, sans-serif', // Example Wix font
    BODY_FONT: 'avenir-lt-w01_35-light1475496, sans-serif',
};

export const STYLES = {
    BOX_SHADOW: '0px 4px 8px rgba(0,0,0,0.1)',
    BORDER_RADIUS: '8px',
};

/**
 * Apply status styling to a box and text element
 * @param {object} $w_box - The container box element
 * @param {object} $w_text - The text element
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {string} message 
 */
export function applyStatusStyle($w_box, $w_text, type, message) {
    if (!$w_box || !$w_text) return;

    let color = COLORS.INFO;
    switch (type) {
        case 'success': color = COLORS.SUCCESS; break;
        case 'error': color = COLORS.ERROR; break;
        case 'warning': color = COLORS.WARNING; break;
    }

    $w_box.style.backgroundColor = color;
    // Note: Velo elements like Boxes expose .style.backgroundColor (if enabled) in newer Editor X, 
    // Classic Wix editor mostly uses design properties. If not supported, this logic 
    // should be used to lookup hex codes for $w('#box').background.src or similar manually.

    $w_text.text = message;
}
