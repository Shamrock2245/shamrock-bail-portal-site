/**
 * GeofenceService.js
 * 
 * "The Eye in the Sky"
 * 
 * Defines geofence zones for defendants on bail and checks compliance.
 * Integrates with LocationMetadataService for GPS data and AI_FlightRisk
 * for risk score adjustments.
 * 
 * Zones:
 *   - Home address radius (default 50 miles)
 *   - County boundary (must stay within assigned county)
 *   - Courthouse proximity (expected near court dates)
 *   - Restricted areas: airports, bus stations, state borders (alerts)
 * 
 * POI Alert Triggers:
 *   - Within 2 miles of airport
 *   - Within 1 mile of Greyhound station
 *   - Within 5 miles of FL state border
 *   - Outside of assigned county
 */

// =============================================================================
// 1. GEOFENCE DEFINITIONS
// =============================================================================

/**
 * Florida county bounding boxes (approximate).
 * Used for "in-county" geofence checks.
 */
var FL_COUNTY_BOUNDS = {
    'lee': { north: 26.78, south: 26.31, east: -81.56, west: -82.27 },
    'charlotte': { north: 27.03, south: 26.78, east: -81.77, west: -82.38 },
    'collier': { north: 26.31, south: 25.75, east: -80.87, west: -81.82 },
    'hendry': { north: 26.78, south: 26.31, east: -80.87, west: -81.56 },
    'glades': { north: 27.03, south: 26.78, east: -80.87, west: -81.56 }
};

/**
 * Points of Interest that trigger FLIGHT RISK alerts.
 * Airports, bus stations, and border crossing points near SW Florida.
 */
var ALERT_POIS = [
    // Airports
    { name: 'Southwest Florida International (RSW)', lat: 26.5362, lng: -81.7552, type: 'airport', radiusMiles: 2 },
    { name: 'Punta Gorda Airport (PGD)', lat: 26.9198, lng: -81.9901, type: 'airport', radiusMiles: 2 },
    { name: 'Naples Airport (APF)', lat: 26.1525, lng: -81.7753, type: 'airport', radiusMiles: 2 },
    { name: 'Miami International (MIA)', lat: 25.7959, lng: -80.2870, type: 'airport', radiusMiles: 3 },
    { name: 'Fort Lauderdale (FLL)', lat: 26.0726, lng: -80.1527, type: 'airport', radiusMiles: 3 },
    { name: 'Tampa International (TPA)', lat: 27.9755, lng: -82.5332, type: 'airport', radiusMiles: 3 },

    // Bus Stations
    { name: 'Greyhound Fort Myers', lat: 26.6370, lng: -81.8549, type: 'bus_station', radiusMiles: 1 },
    { name: 'Greyhound Naples', lat: 26.1420, lng: -81.7948, type: 'bus_station', radiusMiles: 1 },

    // State Border Crossings (major highways)
    { name: 'FL/GA Border I-75', lat: 30.7093, lng: -83.5913, type: 'state_border', radiusMiles: 5 },
    { name: 'FL/GA Border I-95', lat: 30.7272, lng: -81.5945, type: 'state_border', radiusMiles: 5 },
    { name: 'FL/AL Border I-10', lat: 30.6332, lng: -87.4529, type: 'state_border', radiusMiles: 5 }
];

// =============================================================================
// 2. COMPLIANCE CHECKS
// =============================================================================

/**
 * Checks a defendant's location against all geofence zones.
 * Returns a compliance report with any violations.
 * 
 * @param {number} lat - Current latitude
 * @param {number} lng - Current longitude
 * @param {Object} defendant - { id, name, county, homeAddress: { lat, lng }, courtDates: [] }
 * @returns {Object} { compliant, violations: [], alerts: [], riskDelta: number }
 */
function checkGeofenceCompliance(lat, lng, defendant) {
    var violations = [];
    var alerts = [];
    var riskDelta = 0;

    // 1. County check
    var county = (defendant.county || '').toLowerCase();
    if (county && FL_COUNTY_BOUNDS[county]) {
        var bounds = FL_COUNTY_BOUNDS[county];
        if (lat > bounds.north || lat < bounds.south || lng > bounds.east || lng < bounds.west) {
            violations.push({
                type: 'OUT_OF_COUNTY',
                severity: 'HIGH',
                message: defendant.name + ' is outside ' + county.charAt(0).toUpperCase() + county.slice(1) + ' County.',
                details: { lat: lat, lng: lng, expected: county }
            });
            riskDelta += 25;
        }
    }

    // 2. Florida check
    if (typeof isLocationInFlorida === 'function' && !isLocationInFlorida(lat, lng)) {
        violations.push({
            type: 'OUT_OF_STATE',
            severity: 'CRITICAL',
            message: defendant.name + ' appears to be OUTSIDE FLORIDA.',
            details: { lat: lat, lng: lng }
        });
        riskDelta += 50;
    }

    // 3. Home distance check (if home address available)
    if (defendant.homeAddress && defendant.homeAddress.lat && defendant.homeAddress.lng) {
        var distFromHome = calculateDistance(lat, lng, defendant.homeAddress.lat, defendant.homeAddress.lng);
        if (distFromHome > 100) {
            violations.push({
                type: 'FAR_FROM_HOME',
                severity: 'HIGH',
                message: defendant.name + ' is ' + Math.round(distFromHome) + ' miles from home.',
                details: { distance: distFromHome }
            });
            riskDelta += 20;
        } else if (distFromHome > 50) {
            alerts.push({
                type: 'DISTANCE_WARNING',
                severity: 'MEDIUM',
                message: defendant.name + ' is ' + Math.round(distFromHome) + ' miles from home.',
                details: { distance: distFromHome }
            });
            riskDelta += 10;
        }
    }

    // 4. POI proximity check (airports, bus stations, state borders)
    for (var i = 0; i < ALERT_POIS.length; i++) {
        var poi = ALERT_POIS[i];
        var distToPoi = calculateDistance(lat, lng, poi.lat, poi.lng);

        if (distToPoi <= poi.radiusMiles) {
            var severity = poi.type === 'state_border' ? 'CRITICAL' : 'HIGH';
            alerts.push({
                type: 'POI_PROXIMITY',
                severity: severity,
                poiType: poi.type,
                message: defendant.name + ' is within ' + distToPoi.toFixed(1) + ' miles of ' + poi.name + '.',
                details: { poi: poi.name, type: poi.type, distance: distToPoi }
            });
            riskDelta += poi.type === 'state_border' ? 30 : 15;
        }
    }

    // 5. Time-of-day anomaly (checks between 11 PM - 5 AM = suspicious if far from home)
    var hour = new Date().getHours();
    if ((hour >= 23 || hour < 5) && defendant.homeAddress) {
        var nightDist = calculateDistance(lat, lng, defendant.homeAddress.lat, defendant.homeAddress.lng);
        if (nightDist > 20) {
            alerts.push({
                type: 'NIGHT_MOVEMENT',
                severity: 'MEDIUM',
                message: defendant.name + ' is ' + Math.round(nightDist) + ' miles from home at ' + hour + ':00.',
                details: { distance: nightDist, hour: hour }
            });
            riskDelta += 10;
        }
    }

    var compliant = violations.length === 0;

    // Auto-alert if critical
    if (violations.some(function (v) { return v.severity === 'CRITICAL'; })) {
        sendGeofenceAlert_(defendant, violations, alerts);
    }

    return {
        compliant: compliant,
        violations: violations,
        alerts: alerts,
        riskDelta: riskDelta,
        timestamp: new Date().toISOString()
    };
}

// =============================================================================
// 3. MOVEMENT PATTERN ANALYSIS
// =============================================================================

/**
 * Analyzes a defendant's location history for flight risk patterns.
 * 
 * @param {Array} locationHistory - Array of { lat, lng, timestamp } sorted chronologically
 * @param {Object} defendant - Defendant data
 * @returns {Object} { pattern, riskLevel, summary }
 */
function analyzeMovementPattern(locationHistory, defendant) {
    if (!locationHistory || locationHistory.length < 3) {
        return { pattern: 'INSUFFICIENT_DATA', riskLevel: 'UNKNOWN', summary: 'Not enough location data for pattern analysis.' };
    }

    // Calculate progressive distance from home
    var homeDistances = [];
    if (defendant.homeAddress && defendant.homeAddress.lat) {
        for (var i = 0; i < locationHistory.length; i++) {
            var loc = locationHistory[i];
            homeDistances.push({
                distance: calculateDistance(loc.lat, loc.lng, defendant.homeAddress.lat, defendant.homeAddress.lng),
                time: new Date(loc.timestamp)
            });
        }
    }

    // Detect "moving away" pattern (3+ consecutive increases in distance)
    var consecutiveIncreases = 0;
    var maxConsecutive = 0;
    for (var j = 1; j < homeDistances.length; j++) {
        if (homeDistances[j].distance > homeDistances[j - 1].distance + 2) { // +2 mile margin
            consecutiveIncreases++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveIncreases);
        } else {
            consecutiveIncreases = 0;
        }
    }

    // Calculate total movement (sum of distances between consecutive points)
    var totalMovement = 0;
    for (var k = 1; k < locationHistory.length; k++) {
        totalMovement += calculateDistance(
            locationHistory[k].lat, locationHistory[k].lng,
            locationHistory[k - 1].lat, locationHistory[k - 1].lng
        );
    }

    // Check-in cadence (are they checking in regularly?)
    var avgHoursBetween = 0;
    if (locationHistory.length >= 2) {
        var totalHours = (new Date(locationHistory[locationHistory.length - 1].timestamp) - new Date(locationHistory[0].timestamp)) / (1000 * 60 * 60);
        avgHoursBetween = totalHours / (locationHistory.length - 1);
    }

    // Risk assessment
    var pattern, riskLevel, summary;

    if (maxConsecutive >= 3 && homeDistances.length > 0 && homeDistances[homeDistances.length - 1].distance > 50) {
        pattern = 'FLIGHT_TRAJECTORY';
        riskLevel = 'CRITICAL';
        summary = 'Defendant is progressively moving away from home (' + maxConsecutive + ' consecutive distance increases). Current distance: ' + Math.round(homeDistances[homeDistances.length - 1].distance) + ' miles.';
    } else if (totalMovement > 200) {
        pattern = 'HIGH_MOBILITY';
        riskLevel = 'HIGH';
        summary = 'Defendant has traveled ' + Math.round(totalMovement) + ' miles in the tracking period. This is abnormally high.';
    } else if (avgHoursBetween > 48) {
        pattern = 'LOW_COMPLIANCE';
        riskLevel = 'HIGH';
        summary = 'Defendant is checking in only every ' + Math.round(avgHoursBetween) + ' hours. Expected: every 12 hours.';
    } else {
        pattern = 'NORMAL';
        riskLevel = 'LOW';
        summary = 'Movement patterns are within normal bounds. Avg distance from home: ' +
            (homeDistances.length > 0 ? Math.round(homeDistances.reduce(function (sum, d) { return sum + d.distance; }, 0) / homeDistances.length) : 'N/A') + ' miles.';
    }

    return {
        pattern: pattern,
        riskLevel: riskLevel,
        summary: summary,
        stats: {
            totalLocations: locationHistory.length,
            totalMovementMiles: Math.round(totalMovement),
            avgHoursBetweenCheckIns: Math.round(avgHoursBetween * 10) / 10,
            maxConsecutiveDistanceIncreases: maxConsecutive,
            latestDistance: homeDistances.length > 0 ? Math.round(homeDistances[homeDistances.length - 1].distance) : null
        }
    };
}

// =============================================================================
// 4. ALERTS
// =============================================================================

/**
 * Send geofence violation alert via Slack + SMS to agent.
 */
function sendGeofenceAlert_(defendant, violations, alerts) {
    var msg = '🚨 *GEOFENCE VIOLATION*\n━━━━━━━━━━━━━━━━━━\n';
    msg += '*Defendant:* ' + (defendant.name || 'Unknown') + '\n';
    msg += '*County:* ' + (defendant.county || 'Unknown') + '\n\n';

    msg += '*Violations:*\n';
    violations.forEach(function (v) {
        msg += '🔴 [' + v.severity + '] ' + v.message + '\n';
    });

    if (alerts.length > 0) {
        msg += '\n*Alerts:*\n';
        alerts.forEach(function (a) {
            msg += '🟡 [' + a.severity + '] ' + a.message + '\n';
        });
    }

    msg += '\n_Immediate follow-up recommended._';

    try {
        if (typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#alerts', msg);
        }
    } catch (e) {
        console.error('Geofence Alert Failed: ' + e.message);
    }
}

// =============================================================================
// 5. COURT DATE PROXIMITY ALERTS
// =============================================================================

/**
 * Checks for upcoming court dates and sends reminder + location request.
 * Run daily at 8 AM ET.
 */
function checkCourtDateProximity() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('IntakeQueue') || ss.getSheetByName('Intake_Queue');
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var now = new Date();

    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        // Look for court date column (may vary by sheet schema)
        var courtDate = findCourtDateInRow_(row);
        if (!courtDate) continue;

        var hoursUntilCourt = (courtDate - now) / (1000 * 60 * 60);

        if (hoursUntilCourt > 0 && hoursUntilCourt <= 72) {
            var phone = findPhoneInRow_(row);
            var name = findNameInRow_(row);
            var timeLabel = hoursUntilCourt <= 4 ? '⏰ IN ' + Math.round(hoursUntilCourt) + ' HOURS' :
                hoursUntilCourt <= 24 ? '⏰ TOMORROW' : '📅 IN ' + Math.round(hoursUntilCourt / 24) + ' DAYS';

            // Send reminder via available channels
            var reminderMsg = 'Hi ' + (name || '') + ', this is Shamrock Bail Bonds. Your court date is ' + timeLabel +
                '. Please reply "HERE" with your current location to confirm. Failure to appear may result in bond revocation.';

            if (phone && typeof NotificationService !== 'undefined' && NotificationService.sendSMS) {
                try { NotificationService.sendSMS(phone, reminderMsg); } catch (e) { /* continue */ }
            }

            // Staff alert for 4-hour window
            if (hoursUntilCourt <= 4) {
                if (typeof NotificationService !== 'undefined') {
                    NotificationService.sendSlack('#court-dates', '⏰ *Court Date < 4 Hours*\n*Defendant:* ' + name + '\n*Time:* ' + courtDate.toLocaleString() + '\n_Verify location compliance._');
                }
            }
        }
    }
}

/**
 * Helper: find court date in row (flexible column matching).
 */
function findCourtDateInRow_(row) {
    for (var i = 0; i < row.length; i++) {
        var val = row[i];
        if (val instanceof Date && val > new Date()) return val;
    }
    return null;
}

function findPhoneInRow_(row) {
    for (var i = 0; i < row.length; i++) {
        var val = String(row[i] || '');
        if (val.match(/^\+?[\d\s\-\(\)]{10,}/)) return val.replace(/[^\d+]/g, '');
    }
    return null;
}

function findNameInRow_(row) {
    // Typically column 2-3 for name fields
    return row[2] || row[1] || null;
}

// =============================================================================
// 6. TRIGGER INSTALLER
// =============================================================================

/**
 * Install geofence and court date triggers.
 */
function setupGeofenceTriggers() {
    var allTriggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < allTriggers.length; i++) {
        if (allTriggers[i].getHandlerFunction() === 'checkCourtDateProximity') {
            ScriptApp.deleteTrigger(allTriggers[i]);
        }
    }

    // Daily at 8 AM ET
    ScriptApp.newTrigger('checkCourtDateProximity')
        .timeBased()
        .atHour(13) // 8 AM ET = 1 PM UTC
        .everyDays(1)
        .inTimezone('America/New_York')
        .create();

    console.log('✅ Installed: checkCourtDateProximity (daily 8 AM ET)');
    return '✅ Geofence Triggers Installed.';
}
