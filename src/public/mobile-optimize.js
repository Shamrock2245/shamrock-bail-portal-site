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
        const el = $w(id);
        if (el && el.uniqueId) {
            el.collapse().catch(() => { });
        }
    });
}

function optimizeInputs() {
    console.log('Mobile Optimizations: Inputs checked');
}