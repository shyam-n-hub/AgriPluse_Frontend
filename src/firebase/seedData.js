// Seed Firebase Realtime Database with rule-based JSON data
import { ref, set, get } from "firebase/database";
import { db } from "./config";

const seedData = {
    cropRules: {
        wheat: {
            name: "Wheat",
            tempMin: 10,
            tempMax: 25,
            rainfallMin: 400,
            rainfallMax: 900,
            soils: ["loam", "clay loam", "silt loam", "silty clay"],
            alternative: "barley",
            description: "Cool-season cereal crop",
        },
        rice: {
            name: "Rice",
            tempMin: 20,
            tempMax: 38,
            rainfallMin: 1000,
            rainfallMax: 2000,
            soils: ["clay", "silty clay", "clay loam"],
            alternative: "sorghum",
            description: "Tropical staple grain crop",
        },
        corn: {
            name: "Corn (Maize)",
            tempMin: 15,
            tempMax: 35,
            rainfallMin: 500,
            rainfallMax: 800,
            soils: ["loam", "sandy loam", "silt loam"],
            alternative: "sorghum",
            description: "Warm-season cereal crop",
        },
        soybean: {
            name: "Soybean",
            tempMin: 20,
            tempMax: 35,
            rainfallMin: 600,
            rainfallMax: 1000,
            soils: ["loam", "clay loam", "sandy loam"],
            alternative: "groundnut",
            description: "Warm-season legume crop",
        },
        cotton: {
            name: "Cotton",
            tempMin: 20,
            tempMax: 40,
            rainfallMin: 500,
            rainfallMax: 1200,
            soils: ["sandy loam", "loam", "clay loam"],
            alternative: "sunflower",
            description: "Tropical fiber crop",
        },
        tomato: {
            name: "Tomato",
            tempMin: 15,
            tempMax: 30,
            rainfallMin: 400,
            rainfallMax: 700,
            soils: ["sandy loam", "loam", "silt loam"],
            alternative: "capsicum",
            description: "Warm-season vegetable",
        },
        potato: {
            name: "Potato",
            tempMin: 7,
            tempMax: 22,
            rainfallMin: 400,
            rainfallMax: 700,
            soils: ["sandy loam", "loam", "silty loam"],
            alternative: "sweet potato",
            description: "Cool-season tuber crop",
        },
        sugarcane: {
            name: "Sugarcane",
            tempMin: 20,
            tempMax: 38,
            rainfallMin: 1000,
            rainfallMax: 1500,
            soils: ["loam", "clay loam", "sandy loam"],
            alternative: "sugar beet",
            description: "Tropical sugar crop",
        },
    },

    irrigationRules: {
        rainThreshold: 60,
        soilRetentionLow: ["sandy", "loamy sand", "sandy loam"],
        soilRetentionMedium: ["loam", "silt loam", "silty loam"],
        soilRetentionHigh: ["clay", "clay loam", "silty clay"],
        defaultVolumeL: 25,
        lowRetentionMultiplier: 1.5,
        highRetentionMultiplier: 0.75,
        scheduleByType: {
            drip: { frequencyDays: 2, volumeMultiplier: 0.7 },
            sprinkler: { frequencyDays: 3, volumeMultiplier: 1.0 },
            flood: { frequencyDays: 7, volumeMultiplier: 2.5 },
            furrow: { frequencyDays: 5, volumeMultiplier: 1.8 },
        },
    },

    pollinationRules: {
        tempMin: 15,
        tempMax: 30,
        windMaxKmh: 20,
        humidityMin: 40,
        humidityMax: 70,
        bestTimeStart: 6,
        bestTimeEnd: 10,
        pollinatorActivity: {
            bees: { tempMin: 16, tempMax: 32, windMax: 15 },
            butterflies: { tempMin: 20, tempMax: 35, windMax: 20 },
            wind: { humidityMax: 60, windMin: 5, windMax: 25 },
        },
    },

    issueCategories: {
        leaf_yellowing: {
            name: "Leaf Yellowing",
            causes: ["Nitrogen deficiency", "Iron deficiency", "Overwatering", "Root rot"],
            possibleIssue: "Nutrient Deficiency or Root Disease",
            suggestedTreatment: "Apply balanced NPK fertilizer. Check drainage and reduce watering frequency. Test soil pH.",
            severity: "Medium",
            icon: "🍂",
        },
        brown_spots: {
            name: "Brown / Dark Spots",
            causes: ["Fungal infection", "Bacterial blight", "Sunscald"],
            possibleIssue: "Fungal or Bacterial Disease",
            suggestedTreatment: "Apply copper-based fungicide. Remove infected leaves. Improve air circulation around plants.",
            severity: "High",
            icon: "🔴",
        },
        wilting: {
            name: "Wilting / Drooping",
            causes: ["Water stress", "Root rot", "Fusarium wilt", "Heat stress"],
            possibleIssue: "Water Stress or Fungal Wilt Disease",
            suggestedTreatment: "Ensure adequate watering. Check soil drainage. Apply systemic fungicide if wilt persists.",
            severity: "High",
            icon: "🥀",
        },
        white_powder: {
            name: "White Powdery Coating",
            causes: ["Powdery mildew", "Downy mildew"],
            possibleIssue: "Powdery Mildew Infection",
            suggestedTreatment: "Apply sulfur-based fungicide or neem oil. Ensure good air circulation. Avoid overhead watering.",
            severity: "Medium",
            icon: "⚪",
        },
        holes_leaves: {
            name: "Holes in Leaves",
            causes: ["Chewing insects", "Caterpillars", "Aphids", "Snails"],
            possibleIssue: "Pest Damage – Insect Infestation",
            suggestedTreatment: "Apply neem oil or insecticidal soap. Use sticky traps. Introduce beneficial insects.",
            severity: "Medium",
            icon: "🐛",
        },
        stunted_growth: {
            name: "Stunted Growth",
            causes: ["Soil compaction", "Nutrient deficiency", "Nematodes", "Viral infection"],
            possibleIssue: "Soil or Viral Issue",
            suggestedTreatment: "Aerate soil, add compost. Apply micronutrient fertilizer. Test for nematodes.",
            severity: "Low",
            icon: "📉",
        },
        root_discolor: {
            name: "Root Discoloration or Rot",
            causes: ["Overwatering", "Phytophthora root rot", "Poor drainage"],
            possibleIssue: "Root Rot Disease",
            suggestedTreatment: "Reduce irrigation immediately. Improve drainage. Apply phosphonate-based fungicide.",
            severity: "High",
            icon: "🌑",
        },
        fruit_cracking: {
            name: "Fruit Cracking or Splitting",
            causes: ["Inconsistent watering", "Calcium deficiency", "High temperature"],
            possibleIssue: "Physiological Disorder",
            suggestedTreatment: "Maintain consistent moisture levels. Apply foliar calcium spray. Mulch to regulate soil moisture.",
            severity: "Low",
            icon: "🍅",
        },
    },

    riskWeights: {
        climateRisk: {
            tempVarianceWeight: 0.4,
            rainfallVarianceWeight: 0.3,
            extremeEventWeight: 0.3,
        },
        pestRisk: {
            humidityWeight: 0.4,
            tempWeight: 0.3,
            seasonWeight: 0.3,
        },
        waterStress: {
            irrigationFrequencyWeight: 0.5,
            soilTypeWeight: 0.3,
            rainProbWeight: 0.2,
        },
        pollinationRisk: {
            tempWeight: 0.35,
            windWeight: 0.35,
            humidityWeight: 0.3,
        },
        marketRisk: {
            priceVolatilityBase: 30,
            supplyDemandFactor: 20,
            exportRiskFactor: 15,
        },
    },

    // 15-crop recommendation dataset (matched by temp, humidity, soil moisture)
    cropRecommendations: [
        {
            crop: "Wheat",
            temperatureRange: [15, 25],
            humidityRange: [50, 70],
            soilMoistureRange: [300, 700],
            waterNeeds: "Moderate",
            yieldPeriod: "120-150 days",
            costEstimate: "₹15,000 per acre",
            fertilizers: ["Urea", "DAP"],
        },
        {
            crop: "Rice",
            temperatureRange: [20, 35],
            humidityRange: [60, 80],
            soilMoistureRange: [600, 1000],
            waterNeeds: "High",
            yieldPeriod: "90-150 days",
            costEstimate: "₹18,000 per acre",
            fertilizers: ["NPK", "Potash"],
        },
        {
            crop: "Maize",
            temperatureRange: [18, 27],
            humidityRange: [50, 70],
            soilMoistureRange: [400, 800],
            waterNeeds: "Moderate",
            yieldPeriod: "125-180 days",
            costEstimate: "₹14,000 per acre",
            fertilizers: ["Urea", "DAP"],
        },
        {
            crop: "Barley",
            temperatureRange: [12, 25],
            humidityRange: [40, 60],
            soilMoistureRange: [300, 600],
            waterNeeds: "Low",
            yieldPeriod: "120-150 days",
            costEstimate: "₹13,000 per acre",
            fertilizers: ["Urea", "MOP"],
        },
        {
            crop: "Sorghum",
            temperatureRange: [25, 35],
            humidityRange: [30, 50],
            soilMoistureRange: [300, 600],
            waterNeeds: "Low",
            yieldPeriod: "120-130 days",
            costEstimate: "₹12,000 per acre",
            fertilizers: ["NPK", "Zinc Sulphate"],
        },
        {
            crop: "Millet",
            temperatureRange: [25, 35],
            humidityRange: [30, 50],
            soilMoistureRange: [250, 500],
            waterNeeds: "Low",
            yieldPeriod: "105-140 days",
            costEstimate: "₹10,000 per acre",
            fertilizers: ["Urea", "DAP"],
        },
        {
            crop: "Soybean",
            temperatureRange: [20, 30],
            humidityRange: [50, 70],
            soilMoistureRange: [400, 700],
            waterNeeds: "Moderate",
            yieldPeriod: "135-150 days",
            costEstimate: "₹16,000 per acre",
            fertilizers: ["NPK", "Rhizobium"],
        },
        {
            crop: "Groundnut",
            temperatureRange: [25, 30],
            humidityRange: [60, 70],
            soilMoistureRange: [400, 700],
            waterNeeds: "Moderate",
            yieldPeriod: "130-140 days",
            costEstimate: "₹17,000 per acre",
            fertilizers: ["Gypsum", "Potash"],
        },
        {
            crop: "Cotton",
            temperatureRange: [21, 30],
            humidityRange: [50, 60],
            soilMoistureRange: [500, 800],
            waterNeeds: "Moderate",
            yieldPeriod: "180-195 days",
            costEstimate: "₹20,000 per acre",
            fertilizers: ["Urea", "MOP"],
        },
        {
            crop: "Sugarcane",
            temperatureRange: [20, 35],
            humidityRange: [60, 80],
            soilMoistureRange: [800, 1200],
            waterNeeds: "High",
            yieldPeriod: "270-365 days",
            costEstimate: "₹25,000 per acre",
            fertilizers: ["NPK", "Micronutrients"],
        },
        {
            crop: "Sunflower",
            temperatureRange: [20, 30],
            humidityRange: [40, 60],
            soilMoistureRange: [400, 700],
            waterNeeds: "Moderate",
            yieldPeriod: "125-130 days",
            costEstimate: "₹14,000 per acre",
            fertilizers: ["Urea", "Potash"],
        },
        {
            crop: "Mustard",
            temperatureRange: [10, 25],
            humidityRange: [30, 50],
            soilMoistureRange: [300, 600],
            waterNeeds: "Low",
            yieldPeriod: "110-140 days",
            costEstimate: "₹12,000 per acre",
            fertilizers: ["Urea", "Sulphur"],
        },
        {
            crop: "Lentil",
            temperatureRange: [15, 25],
            humidityRange: [40, 60],
            soilMoistureRange: [300, 500],
            waterNeeds: "Low",
            yieldPeriod: "150-170 days",
            costEstimate: "₹11,000 per acre",
            fertilizers: ["DAP", "Zinc Sulphate"],
        },
        {
            crop: "Chickpea",
            temperatureRange: [10, 25],
            humidityRange: [30, 50],
            soilMoistureRange: [300, 500],
            waterNeeds: "Low",
            yieldPeriod: "100-110 days",
            costEstimate: "₹10,000 per acre",
            fertilizers: ["Urea", "DAP"],
        },
        {
            crop: "Pea",
            temperatureRange: [13, 18],
            humidityRange: [50, 70],
            soilMoistureRange: [300, 500],
            waterNeeds: "Moderate",
            yieldPeriod: "90-100 days",
            costEstimate: "₹9,000 per acre",
            fertilizers: ["Urea", "DAP"],
        },
    ],
};

/**
 * Seeds the Firebase database with initial rule data if not already present.
 * Safe to call on every app load — only writes if the key is missing.
 */
export async function seedFirebaseData() {
    try {
        for (const [key, value] of Object.entries(seedData)) {
            const nodeRef = ref(db, key);
            const snapshot = await get(nodeRef);
            if (!snapshot.exists()) {
                await set(nodeRef, value);
                console.log(`✅ Seeded: ${key}`);
            } else {
                console.log(`ℹ️ Already exists: ${key}`);
            }
        }
    } catch (err) {
        console.error("Seed error:", err);
    }
}

export default seedData;
