/**
 * Shamrock Bail Suite - Lead Scorer
 * Implements the "Secret Sauce" qualification logic.
 * 
 * Rules:
 * - Threshold: ≥ 70 is "Qualified" (Hot).
 * - Bond Amount ≥ $500: +30 points
 * - Bond Amount ≥ $1,500: +20 points (cumulative, total +50)
 * - Recent Arrest (≤ 1 day): +10 points
 * - Recent Arrest (≤ 2 days): +20 points (Note: Usually more recent is more points, 
 *   but following exact rules provided in system prompt)
 * - Serious Charge Keywords (Battery, DUI, Theft, Domestic): +20 points
 * 
 * Disqualifiers:
 * - Status = "Released"
 * - Bond = $0 (No Bond/Held)
 */

/**
 * Calculates lead score and status for an arrest record.
 * @param {Object} record - The 34-column arrest record.
 * @returns {Object} - { score: number, status: string }
 */
export function calculateLeadScore(record) {
    let score = 0;
    let status = 'Cold';

    // 1. Disqualifiers (Hard check)
    if (record.Status === 'Released' || record.Bond_Amount === 0 || record.Bond_Amount === '0') {
        return { score: 0, status: 'Disqualified' };
    }

    // 2. Bond Amount Scoring
    const bond = parseFloat(record.Bond_Amount) || 0;
    if (bond >= 500) score += 30;
    if (bond >= 1500) score += 20;

    // 3. Recency Scoring
    const bookingDate = new Date(record.Booking_Date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - bookingDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
        score += 10;
    } else if (diffDays <= 2) {
        score += 20;
    }

    // 4. Charge Scoring
    const seriousKeywords = ['battery', 'dui', 'theft', 'domestic'];
    const charges = (record.Charges || '').toLowerCase();

    const hasSeriousCharge = seriousKeywords.some(keyword => charges.includes(keyword));
    if (hasSeriousCharge) {
        score += 20;
    }

    // 5. Final Status
    if (score >= 70) {
        status = 'Hot';
    } else if (score >= 40) {
        status = 'Warm';
    }

    return { score, status };
}
