/**
 * pollinationEngine.js – Rule-based pollination score calculation.
 */

/**
 * Calculates pollination suitability from weather conditions.
 * @param {Object} conditions - { temperature, windKmh, humidity }
 * @param {Object} rules - pollinationRules from Firebase
 * @returns {Object} { score, bestWindow, conditions, pollinators }
 */
export function calculatePollinationScore(conditions, rules) {
    const { temperature, windKmh, humidity } = conditions;
    const {
        tempMin = 15,
        tempMax = 30,
        windMaxKmh = 20,
        humidityMin = 40,
        humidityMax = 70,
        bestTimeStart = 6,
        bestTimeEnd = 10,
    } = rules;

    // Temperature score (0–100)
    let tempScore = 100;
    if (temperature < tempMin || temperature > tempMax) {
        const optimal = (tempMin + tempMax) / 2;
        const diff = Math.abs(temperature - optimal);
        const range = (tempMax - tempMin) / 2;
        tempScore = Math.max(0, 100 - (diff / range) * 70);
    }

    // Wind score – lower is better
    let windScore = 100;
    if (windKmh > windMaxKmh) {
        windScore = Math.max(0, 100 - ((windKmh - windMaxKmh) / windMaxKmh) * 100);
    }

    // Humidity score
    let humScore = 100;
    if (humidity < humidityMin) {
        humScore = Math.max(0, (humidity / humidityMin) * 100);
    } else if (humidity > humidityMax) {
        humScore = Math.max(0, 100 - ((humidity - humidityMax) / 30) * 100);
    }

    // Weighted total
    const score = Math.round(tempScore * 0.4 + windScore * 0.35 + humScore * 0.25);

    // Determine active pollinators
    const pollinators = [];
    const pr = rules.pollinatorActivity || {};
    if (
        temperature >= (pr.bees?.tempMin || 16) &&
        temperature <= (pr.bees?.tempMax || 32) &&
        windKmh <= (pr.bees?.windMax || 15)
    ) pollinators.push({ name: "Bees 🐝", active: true });
    else pollinators.push({ name: "Bees 🐝", active: false });

    if (
        temperature >= (pr.butterflies?.tempMin || 20) &&
        temperature <= (pr.butterflies?.tempMax || 35) &&
        windKmh <= (pr.butterflies?.windMax || 20)
    ) pollinators.push({ name: "Butterflies 🦋", active: true });
    else pollinators.push({ name: "Butterflies 🦋", active: false });

    if (
        windKmh >= (pr.wind?.windMin || 5) &&
        windKmh <= (pr.wind?.windMax || 25) &&
        humidity <= (pr.wind?.humidityMax || 60)
    ) pollinators.push({ name: "Wind 🌬️", active: true });
    else pollinators.push({ name: "Wind 🌬️", active: false });

    // Best pollination window
    const bestWindow = `${bestTimeStart}:00 AM – ${bestTimeEnd}:00 AM`;

    let recommendation = "";
    if (score >= 75) recommendation = "Excellent conditions for pollination! Best window: morning hours.";
    else if (score >= 50) recommendation = "Moderate conditions. Consider manual pollination assistance.";
    else if (windKmh > windMaxKmh) recommendation = "Wind too strong – pollinators inactive. Wait for calmer conditions.";
    else recommendation = "Poor conditions. Delay field activities and supplement with hand pollination.";

    return { score, bestWindow, pollinators, recommendation, breakdown: { tempScore: Math.round(tempScore), windScore: Math.round(windScore), humScore: Math.round(humScore) } };
}
