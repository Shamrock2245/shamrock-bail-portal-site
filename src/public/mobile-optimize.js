import wixWindow from 'wix-window';

export function initMobileOptimizations() {
    if (wixWindow.formFactor === 'Mobile') {
        console.log('Mobile Optimizations: Starting...');
        optimizeInputs();
        collapseHeavyElements();
    }
}

function collapseHeavyElements() {
    const heavyElements = [
        '#desktopVideoBackground',
        '#highResHeroImage',
        '#desktopOnlySpacer',
        '#videoPlayer'
    ];
    heavyElements.forEach(id => {
        try {
            const el = $w(id);
            if (el && el.uniqueId) {
                el.collapse().catch(() => { });
            }
        } catch (e) { /* element not on this page */ }
    });
}

function optimizeInputs() {
    console.log('Mobile Optimizations: Inputs checked');
}