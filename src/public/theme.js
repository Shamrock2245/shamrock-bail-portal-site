/**
 * Shamrock Bail Bonds - Design System Tokens & Emergency Theme
 * 
 * Dark, Premium, High-Contrast Emergency UI
 * Source of Truth for runtime Velo styling and theme injection.
 * 
 * Doctrine: "The Website is the Clipboard. The Backend is the Brain."
 * 
 * @module theme
 */

export const Colors = {
    // Brand & Emergency Accents
    Brand: {
        Canvas: "#0B1118",          // Deep Obsidian Black
        Surface: "#0E1724",         // Midnight Navy Surface
        Card: "#131F2E",            // Card / Container Background
        Elevated: "#1B2B3E",        // Elevated Modal / Dropdown Surface
        ShamrockGreen: "#00A86B",   // Tactical Green Accent (Not a costume)
        ShamrockDeep: "#006644",    // Deep Emerald Border
        EmergencyGold: "#FDB913",   // High-Contrast Primary CTA Gold
        ActionBlue: "#0066CC",      // Interactive Blue
        AlertRed: "#EF4444"         // Critical Alert
    },
    // Semantic & High-Legibility Text
    Semantic: {
        TextPrimary: "#FFFFFF",     // Crisp White for Emergency Readability
        TextSecondary: "#F1F5F9",   // Light Slate
        TextMuted: "#94A3B8",       // Secondary Label
        TextDim: "#64748B",         // Tertiary Subtitle
        BorderSubtle: "rgba(255, 255, 255, 0.12)",
        BorderGreen: "rgba(0, 168, 107, 0.4)",
        Success: "#10B981",
        Error: "#EF4444",
        Warning: "#F59E0B",
        Info: "#38BDF8"
    }
};

export const Typography = {
    Headings: {
        Family: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        Weight: "700"
    },
    Body: {
        Family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        Weight: "400"
    },
    Numbers: {
        Family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        Weight: "600"
    }
};

export const UI = {
    TapTargetMin: "44px",
    TapTargetStandard: "52px",
    BorderRadius: "10px",
    ShadowCard: "0 10px 30px -5px rgba(0, 0, 0, 0.6)",
    ShadowEmergency: "0 0 24px rgba(0, 168, 107, 0.25)",
    ShadowGold: "0 0 20px rgba(253, 185, 19, 0.25)",
    Transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};

/**
 * Format high-contrast styled HTML for Rich Text components
 * @param {string} text 
 * @param {'h1'|'h2'|'h3'|'p'|'status'|'phone'} type 
 * @param {string} colorKey 
 */
export function styled(text, type = 'p', colorKey = 'TextPrimary') {
    const color = Colors.Semantic[colorKey] || Colors.Brand[colorKey] || colorKey;
    const font = type.startsWith('h') ? Typography.Headings : Typography.Body;
    const size = type === 'h1' ? '32px' : type === 'h2' ? '24px' : type === 'phone' ? '22px' : '16px';
    const weight = type.startsWith('h') || type === 'phone' ? '700' : '400';

    return `<span style="font-family:${font.Family}; font-weight:${weight}; font-size:${size}; color:${color}; line-height:1.4;">${text}</span>`;
}

export default {
    Colors,
    Typography,
    UI,
    styled
};
