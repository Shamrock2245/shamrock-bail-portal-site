import { fetchBookingData } from 'backend/bailCalculator.jsw';

function postCalc(message) {
    try {
        const html = $w('#htmlComponent');
        if (html && typeof html.postMessage === 'function') html.postMessage(message);
    } catch (e) { /* embed not on this page */ }
}

$w.onReady(function () {
    let html = null;
    try { html = $w('#htmlComponent'); } catch (e) { html = null; }
    if (!html || typeof html.onMessage !== 'function') return;
    html.onMessage((event) => {
        if (event.data.type === 'calculatePremium') {
            const bookingUrl = event.data.url;
            calculatePremium(bookingUrl);
        }
    });
});

async function calculatePremium(url) {
    try {
        const result = await fetchBookingData(url);
        if (result.error) {
            postCalc({ type: 'error', message: result.error });
        } else {
            const totalPremium = result.totalPremium;
            postCalc({ type: 'result', totalPremium });
        }
    } catch (error) {
        console.error('Error calculating premium:', error);
        postCalc({ type: 'error', message: 'An error occurred while calculating the premium.' });
    }
}