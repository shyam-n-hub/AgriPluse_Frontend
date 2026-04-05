/**
 * climateEngine.js – Rule-based climate suitability evaluation.
 * Takes user inputs and crop rules from Firebase, returns score + analysis.
 */

/**
 * Calculates how well a value fits within a [min, max] range.
 * Returns 0–100 score.
 */
function rangeScore(value, min, max) {
    if (value < min) {
        // Below range: penalize proportionally
        const diff = min - value;
        const range = max - min;
        return Math.max(0, 100 - (diff / range) * 100);
    } else if (value > max) {
        // Above range: penalize proportionally
        const diff = value - max;
        const range = max - min;
        return Math.max(0, 100 - (diff / range) * 100);
    }
    return 100; // within ideal range
}

/**
 * Checks if the selected soil type is in the crop's compatible soils list.
 * Returns 100 if compatible, 20 otherwise.
 *
 * Firebase Realtime DB converts arrays to objects with numeric keys, e.g.:
 *   ["loam", "clay"] → { "0": "loam", "1": "clay" }
 * So we normalize to a real array before calling .some().
 */
function soilScore(selectedSoil, compatibleSoils) {
    if (!compatibleSoils) return 20;
    const soilsArray = Array.isArray(compatibleSoils)
        ? compatibleSoils
        : Object.values(compatibleSoils);
    const norm = (s) => s.toLowerCase().trim();
    return soilsArray.some((s) => norm(s) === norm(selectedSoil)) ? 100 : 20;
}

/**
 * Main climate suitability engine.
 * @param {Object} inputs - { temperature, rainfall, soil }
 * @param {Object} cropRules - rules object from Firebase
 * @param {string} selectedCrop - crop key (e.g., "wheat")
 * @returns {Object} { score, riskLevel, recommendedCrop, breakdown }
 */
export function calculateSuitability(inputs, cropRules, selectedCrop) {
    const rule = cropRules[selectedCrop];
    if (!rule) return { score: 0, riskLevel: "High", recommendedCrop: "N/A", breakdown: {} };

    const { temperature, rainfall, soil } = inputs;

    // Weighted scores
    const tempS = rangeScore(temperature, rule.tempMin, rule.tempMax);
    const rainS = rangeScore(rainfall, rule.rainfallMin, rule.rainfallMax);
    const soilS = soilScore(soil, rule.soils);

    // Weighted average (temperature 40%, rainfall 35%, soil 25%)
    const score = Math.round(tempS * 0.4 + rainS * 0.35 + soilS * 0.25);

    // Risk level
    let riskLevel;
    if (score >= 70) riskLevel = "Low";
    else if (score >= 40) riskLevel = "Medium";
    else riskLevel = "High";

    // Recommend alternative crop if score is poor
    const recommendedCrop =
        score >= 70
            ? selectedCrop
            : rule.alternative || findBestAlternative(inputs, cropRules, selectedCrop);

    return {
        score,
        riskLevel,
        recommendedCrop,
        breakdown: {
            temperatureScore: Math.round(tempS),
            rainfallScore: Math.round(rainS),
            soilScore: Math.round(soilS),
        },
    };
}

/**
 * Finds the best alternative crop for given inputs.
 */
function findBestAlternative(inputs, cropRules, excludeCrop) {
    let bestCrop = null;
    let bestScore = -1;

    for (const [key, rule] of Object.entries(cropRules)) {
        if (key === excludeCrop) continue;
        const { temperature, rainfall, soil } = inputs;
        const tempS = rangeScore(temperature, rule.tempMin, rule.tempMax);
        const rainS = rangeScore(rainfall, rule.rainfallMin, rule.rainfallMax);
        const soilS = soilScore(soil, rule.soils);
        const score = tempS * 0.4 + rainS * 0.35 + soilS * 0.25;
        if (score > bestScore) {
            bestScore = score;
            bestCrop = rule.name || key;
        }
    }

    return bestCrop || "Consult agronomist";
}
