import { fetchBookingData } from 'backend/bailCalculator.jsw';

$w.onReady(function () {
    // Listen for messages from the HTML component
    $w('#htmlComponent').onMessage((event) => {
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
            $w('#htmlComponent').postMessage({ type: 'error', message: result.error });
        } else {
            const totalPremium = result.totalPremium;
            $w('#htmlComponent').postMessage({ type: 'result', totalPremium });
        }
    } catch (error) {
        console.error('Error calculating premium:', error);
        $w('#htmlComponent').postMessage({ type: 'error', message: 'An error occurred while calculating the premium.' });
    }
}