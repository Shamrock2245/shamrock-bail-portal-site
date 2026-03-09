const check = async () => {
    const url = 'https://script.google.com/macros/s/AKfycbwe-uOTzOWhqFvXn0O3t2B0V5Xo41W1n1-P13kHqH5TItn33rB6A9C5kQ17t5gA6C9t/exec';
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'installPaymentPlanRecon' })
        });
        console.log(await res.text());
    } catch (e) { console.error(e); }
};
check();
