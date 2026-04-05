/**
 * irrigationEngine.js – Rule-based irrigation scheduling logic.
 */

/**
 * Determines next irrigation schedule based on weather + farm + rules.
 * @param {Object} weather - { rainProbability, temperature }
 * @param {Object} farm - { irrigationType, soilType }
 * @param {Object} rules - irrigationRules from Firebase
 * @returns {Object} { shouldDelay, nextIrrigationHours, volumeLitres, reason, weeklySchedule }
 */
export function calculateIrrigationPlan(weather, farm, rules) {
    const { rainProbability = 30, temperature = 25 } = weather;
    const { irrigationType = "drip", soilType = "loam" } = farm;

    const scheduleRule = rules.scheduleByType?.[irrigationType] || {
        frequencyDays: 3,
        volumeMultiplier: 1.0,
    };

    // Check if rain will make irrigation unnecessary
    const shouldDelay = rainProbability > (rules.rainThreshold || 60);

    // Determine soil retention category
    const isLowRetention = rules.soilRetentionLow?.includes(soilType);
    const isHighRetention = rules.soilRetentionHigh?.includes(soilType);

    // Base volume calculation
    let baseVolume = rules.defaultVolumeL || 25;
    baseVolume *= scheduleRule.volumeMultiplier;
    if (isLowRetention) baseVolume *= rules.lowRetentionMultiplier || 1.5;
    if (isHighRetention) baseVolume *= rules.highRetentionMultiplier || 0.75;

    // Adjust for high temperatures
    if (temperature > 35) baseVolume *= 1.2;

    // Hours until next irrigation
    const frequencyHours = scheduleRule.frequencyDays * 24;
    const nextIrrigationHours = shouldDelay ? frequencyHours + 24 : frequencyHours;

    // Build weekly schedule
    const weeklySchedule = buildWeeklySchedule(
        scheduleRule.frequencyDays,
        Math.round(baseVolume),
        shouldDelay
    );

    let reason = "";
    if (shouldDelay) reason = `Rain probability is ${rainProbability}% – irrigation delayed by 24h`;
    else if (isLowRetention) reason = `Sandy soil detected – increased water frequency and volume`;
    else if (isHighRetention) reason = `Clay-rich soil – reduced water volume needed`;
    else reason = `Standard ${irrigationType} irrigation schedule applied`;

    return {
        shouldDelay,
        nextIrrigationHours: Math.round(nextIrrigationHours),
        volumeLitres: Math.round(baseVolume),
        reason,
        weeklySchedule,
        irrigationType,
    };
}

/**
 * Builds a 7-day irrigation schedule array for the chart.
 */
function buildWeeklySchedule(frequencyDays, volume, delayed) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, i) => {
        const irrigate = i % frequencyDays === 0;
        const actualVolume = irrigate ? (delayed && i === 0 ? 0 : volume) : 0;
        return { day, volume: actualVolume };
    });
}
