// CropRecommendations – Rule-based crop matching by temperature, humidity, and soil moisture
import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase/config";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from "recharts";

// Crop emoji map
const CROP_EMOJI = {
    Wheat: "🌾", Rice: "🍚", Maize: "🌽", Barley: "🌾", Sorghum: "🌿",
    Millet: "🌾", Soybean: "🫘", Groundnut: "🥜", Cotton: "🏵️",
    Sugarcane: "🎋", Sunflower: "🌻", Mustard: "🌼", Lentil: "🫘",
    Chickpea: "🫘", Pea: "🫛",
};

// Water needs badge color
const WATER_COLOR = { High: "badge-high", Moderate: "badge-medium", Low: "badge-low" };

/**
 * Score how well a sensor value fits within [min, max].
 * Returns 0-100.
 */
function rangeMatch(value, min, max) {
    if (value >= min && value <= max) return 100;
    if (value < min) return Math.max(0, 100 - ((min - value) / (max - min || 1)) * 100);
    return Math.max(0, 100 - ((value - max) / (max - min || 1)) * 100);
}

/**
 * Given user inputs and the full crop dataset from Firebase,
 * returns each crop with a match score (0-100) sorted descending.
 */
function rankCrops(inputs, crops) {
    const { temperature, humidity, soilMoisture } = inputs;

    // Normalize Firebase array-to-object quirk
    const toArr = (v) => (Array.isArray(v) ? v : v ? Object.values(v) : [0, 100]);

    return crops
        .map((crop) => {
            const tArr = toArr(crop.temperatureRange);
            const hArr = toArr(crop.humidityRange);
            const sArr = toArr(crop.soilMoistureRange);

            const tScore = rangeMatch(temperature, tArr[0], tArr[1]);
            const hScore = rangeMatch(humidity, hArr[0], hArr[1]);
            const sScore = rangeMatch(soilMoisture, sArr[0], sArr[1]);

            // Weighted: temp 40%, humidity 30%, soil moisture 30%
            const score = Math.round(tScore * 0.4 + hScore * 0.3 + sScore * 0.3);
            const isMatch = temperature >= tArr[0] && temperature <= tArr[1] &&
                humidity >= hArr[0] && humidity <= hArr[1] &&
                soilMoisture >= sArr[0] && soilMoisture <= sArr[1];

            return { ...crop, score, isMatch, tScore, hScore, sScore };
        })
        .sort((a, b) => b.score - a.score);
}

export default function CropRecommendations() {
    const [allCrops, setAllCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputs, setInputs] = useState({ temperature: 25, humidity: 55, soilMoisture: 500 });
    const [ranked, setRanked] = useState([]);
    const [analyzed, setAnalyzed] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState(null);

    // Load cropRecommendations from Firebase
    useEffect(() => {
        get(ref(db, "cropRecommendations")).then((snap) => {
            if (snap.exists()) {
                const raw = snap.val();
                // Firebase may store array as object — normalize
                const crops = Array.isArray(raw) ? raw : Object.values(raw);
                setAllCrops(crops);
            }
            setLoading(false);
        });
    }, []);

    function handleChange(e) {
        setInputs((f) => ({ ...f, [e.target.name]: Number(e.target.value) }));
        setAnalyzed(false);
    }

    function analyze() {
        if (!allCrops.length) return;
        const results = rankCrops(inputs, allCrops);
        setRanked(results);
        setAnalyzed(true);
        setSelectedCrop(null);
    }

    const matched = ranked.filter((c) => c.isMatch);
    const unmatched = ranked.filter((c) => !c.isMatch);
    const displayed = showAll ? ranked : (analyzed ? ranked.slice(0, 6) : []);

    // Top 5 for bar chart
    const chartData = ranked.slice(0, 5).map((c) => ({
        name: c.crop,
        score: c.score,
        fill: c.isMatch ? "#16a34a" : "#0ea5e9",
    }));

    // Fertilizers normalizer
    const getFertilizers = (f) => {
        if (!f) return [];
        return Array.isArray(f) ? f : Object.values(f);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🌱 Crop Recommendations</h1>
                <p className="page-desc">
                    Enter your current field conditions — the rule engine matches the best crops from 15 varieties
                </p>
            </div>

            {/* Input panel */}
            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
                <div className="card">
                    <div className="card-title">📊 Field Conditions</div>
                    <div className="card-subtitle">Adjust sliders to match your current environment</div>

                    {/* Temperature */}
                    <div className="form-group">
                        <label className="form-label">
                            🌡️ Temperature:&nbsp;
                            <strong style={{ color: "var(--primary-light)" }}>{inputs.temperature}°C</strong>
                        </label>
                        <input type="range" name="temperature" min={0} max={45}
                            value={inputs.temperature} onChange={handleChange}
                            style={{ width: "100%", accentColor: "var(--primary)" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 3 }}>
                            <span>0°C (Freezing)</span><span>22°C (Ideal)</span><span>45°C (Extreme)</span>
                        </div>
                    </div>

                    {/* Humidity */}
                    <div className="form-group">
                        <label className="form-label">
                            💧 Humidity:&nbsp;
                            <strong style={{ color: "var(--primary-light)" }}>{inputs.humidity}%</strong>
                        </label>
                        <input type="range" name="humidity" min={10} max={100}
                            value={inputs.humidity} onChange={handleChange}
                            style={{ width: "100%", accentColor: "var(--primary)" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 3 }}>
                            <span>10% (Dry)</span><span>55% (Moderate)</span><span>100% (Saturated)</span>
                        </div>
                    </div>

                    {/* Soil Moisture */}
                    <div className="form-group">
                        <label className="form-label">
                            🌿 Soil Moisture:&nbsp;
                            <strong style={{ color: "var(--primary-light)" }}>{inputs.soilMoisture} mm</strong>
                        </label>
                        <input type="range" name="soilMoisture" min={100} max={1500}
                            value={inputs.soilMoisture} onChange={handleChange}
                            style={{ width: "100%", accentColor: "var(--primary)" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 3 }}>
                            <span>100 mm</span><span>800 mm</span><span>1500 mm</span>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={analyze}
                        disabled={loading}
                    >
                        {loading ? "⌛ Loading crop data…" : "🌱 Find Best Crops"}
                    </button>

                    {analyzed && (
                        <div className={`alert alert-${matched.length > 0 ? "success" : "warning"}`} style={{ marginTop: 12, fontSize: "0.83rem" }}>
                            {matched.length > 0
                                ? `✅ ${matched.length} crop${matched.length > 1 ? "s" : ""} perfectly match your conditions!`
                                : "⚠️ No exact matches — showing closest alternatives below."}
                        </div>
                    )}
                </div>

                {/* Live readings summary card */}
                <div className="card">
                    <div className="card-title">📋 Current Readings</div>
                    <div className="card-subtitle">Your entered field parameters</div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, margin: "20px 0" }}>
                        {[
                            { label: "Temperature", value: `${inputs.temperature}°C`, icon: "🌡️", color: "amber" },
                            { label: "Humidity", value: `${inputs.humidity}%`, icon: "💧", color: "blue" },
                            { label: "Soil Moisture", value: `${inputs.soilMoisture}mm`, icon: "🌿", color: "green" },
                        ].map((s) => (
                            <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: "var(--radius-sm)", padding: "16px 8px", border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: "1.6rem", marginBottom: 4 }}>{s.icon}</div>
                                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{s.value}</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Top 5 bar chart */}
                    {analyzed && chartData.length > 0 && (
                        <>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                                Top 5 Match Scores
                            </div>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                                    <Tooltip
                                        formatter={(v) => [`${v}%`, "Match Score"]}
                                        contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }}
                                    />
                                    <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} opacity={0.85} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div style={{ display: "flex", gap: 12, fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }}>
                                <span><span style={{ color: "#16a34a" }}>■</span> Exact match</span>
                                <span><span style={{ color: "#0ea5e9" }}>■</span> Closest alternative</span>
                            </div>
                        </>
                    )}

                    {!analyzed && (
                        <div className="loading-center" style={{ minHeight: 180 }}>
                            <div style={{ fontSize: "2.5rem" }}>🌱</div>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Set conditions and click Find Best Crops</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Results grid */}
            {analyzed && (
                <div className="fade-in">
                    {/* Matched crops */}
                    {matched.length > 0 && (
                        <>
                            <div className="page-header" style={{ marginBottom: 16 }}>
                                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary-light)" }}>
                                    ✅ Perfect Matches ({matched.length})
                                </h2>
                            </div>
                            <div className="grid-auto" style={{ marginBottom: 28 }}>
                                {matched.map((crop, i) => (
                                    <CropCard
                                        key={crop.crop + i}
                                        crop={crop}
                                        isMatch
                                        selected={selectedCrop === crop.crop}
                                        onSelect={() => setSelectedCrop(selectedCrop === crop.crop ? null : crop.crop)}
                                        getFertilizers={getFertilizers}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Unmatched / alternatives */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                            {matched.length > 0 ? `🔵 Closest Alternatives (${unmatched.length})` : `📋 All Crops Ranked by Match (${unmatched.length})`}
                        </h2>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowAll(!showAll)}>
                            {showAll ? "🔼 Show Less" : "🔽 Show All " + allCrops.length + " Crops"}
                        </button>
                    </div>

                    <div className="grid-auto">
                        {(showAll ? unmatched : unmatched.slice(0, 6)).map((crop, i) => (
                            <CropCard
                                key={crop.crop + i}
                                crop={crop}
                                isMatch={false}
                                selected={selectedCrop === crop.crop}
                                onSelect={() => setSelectedCrop(selectedCrop === crop.crop ? null : crop.crop)}
                                getFertilizers={getFertilizers}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* All crops reference table */}
            {!analyzed && allCrops.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                    <div className="card-title">📖 Crop Database ({allCrops.length} varieties)</div>
                    <div className="card-subtitle">All crops with their ideal growing conditions</div>
                    <div style={{ overflowX: "auto", marginTop: 12 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                                    {["Crop", "Temp (°C)", "Humidity (%)", "Soil Moisture (mm)", "Water Needs", "Yield Period", "Cost/Acre"].map((h) => (
                                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allCrops.map((crop, i) => {
                                    const tArr = Array.isArray(crop.temperatureRange) ? crop.temperatureRange : Object.values(crop.temperatureRange || {});
                                    const hArr = Array.isArray(crop.humidityRange) ? crop.humidityRange : Object.values(crop.humidityRange || {});
                                    const sArr = Array.isArray(crop.soilMoistureRange) ? crop.soilMoistureRange : Object.values(crop.soilMoistureRange || {});
                                    return (
                                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                            <td style={{ padding: "9px 10px", fontWeight: 600 }}>{CROP_EMOJI[crop.crop] || "🌾"} {crop.crop}</td>
                                            <td style={{ padding: "9px 10px", color: "var(--text-secondary)" }}>{tArr[0]}–{tArr[1]}</td>
                                            <td style={{ padding: "9px 10px", color: "var(--text-secondary)" }}>{hArr[0]}–{hArr[1]}</td>
                                            <td style={{ padding: "9px 10px", color: "var(--text-secondary)" }}>{sArr[0]}–{sArr[1]}</td>
                                            <td style={{ padding: "9px 10px" }}>
                                                <span className={`score-badge ${WATER_COLOR[crop.waterNeeds] || "badge-medium"}`} style={{ fontSize: "0.68rem" }}>
                                                    {crop.waterNeeds}
                                                </span>
                                            </td>
                                            <td style={{ padding: "9px 10px", color: "var(--text-secondary)" }}>{crop.yieldPeriod}</td>
                                            <td style={{ padding: "9px 10px", color: "var(--primary-light)", fontWeight: 600 }}>{crop.costEstimate}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Crop Card sub-component ──────────────────────────────── */
function CropCard({ crop, isMatch, selected, onSelect, getFertilizers }) {
    const emoji = CROP_EMOJI[crop.crop] || "🌾";
    const tArr = Array.isArray(crop.temperatureRange) ? crop.temperatureRange : Object.values(crop.temperatureRange || {});
    const hArr = Array.isArray(crop.humidityRange) ? crop.humidityRange : Object.values(crop.humidityRange || {});
    const sArr = Array.isArray(crop.soilMoistureRange) ? crop.soilMoistureRange : Object.values(crop.soilMoistureRange || {});
    const fertilizers = getFertilizers(crop.fertilizers);

    return (
        <div
            onClick={onSelect}
            style={{
                background: selected
                    ? "rgba(22,163,74,0.12)"
                    : isMatch
                        ? "linear-gradient(145deg, #1a2e1a 0%, #162032 100%)"
                        : "var(--gradient-card)",
                border: `1px solid ${selected ? "var(--primary)" : isMatch ? "rgba(22,163,74,0.35)" : "var(--border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: 20,
                cursor: "pointer",
                transition: "all var(--transition)",
                opacity: isMatch ? 1 : 0.82,
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontWeight: 800, fontSize: "1rem" }}>{crop.crop}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{
                        fontSize: "1.5rem",
                        fontWeight: 900,
                        color: isMatch ? "var(--primary-light)" : crop.score >= 60 ? "var(--secondary)" : "var(--text-secondary)"
                    }}>
                        {crop.score}%
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>match</div>
                </div>
            </div>

            {/* Match bar */}
            <div className="progress-bar" style={{ height: 5, marginBottom: 12 }}>
                <div className="progress-fill" style={{
                    width: `${crop.score}%`,
                    background: isMatch ? "var(--gradient-success)" : crop.score >= 60
                        ? "var(--gradient-blue)"
                        : "linear-gradient(135deg,#f59e0b,#fbbf24)"
                }} />
            </div>

            {/* Details */}
            <div style={{ fontSize: "0.79rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <div>🌡️ <span style={{ color: "var(--text-muted)" }}>Temp:</span> {tArr[0]}–{tArr[1]}°C
                    <span style={{ marginLeft: 6, color: crop.tScore === 100 ? "var(--primary-light)" : "#fbbf24", fontSize: "0.72rem" }}>({crop.tScore}%)</span>
                </div>
                <div>💧 <span style={{ color: "var(--text-muted)" }}>Humidity:</span> {hArr[0]}–{hArr[1]}%
                    <span style={{ marginLeft: 6, color: crop.hScore === 100 ? "var(--primary-light)" : "#fbbf24", fontSize: "0.72rem" }}>({crop.hScore}%)</span>
                </div>
                <div>🌿 <span style={{ color: "var(--text-muted)" }}>Soil:</span> {sArr[0]}–{sArr[1]}mm
                    <span style={{ marginLeft: 6, color: crop.sScore === 100 ? "var(--primary-light)" : "#fbbf24", fontSize: "0.72rem" }}>({crop.sScore}%)</span>
                </div>
            </div>

            {/* Show extra details when selected */}
            {selected && (
                <div className="fade-in" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.78rem", marginBottom: 10 }}>
                        <div>🚿 <strong>{crop.waterNeeds}</strong> water</div>
                        <div>🕒 {crop.yieldPeriod}</div>
                        <div style={{ gridColumn: "1/-1" }}>💰 <strong style={{ color: "var(--primary-light)" }}>{crop.costEstimate}</strong></div>
                    </div>
                    {fertilizers.length > 0 && (
                        <div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 5, fontWeight: 600 }}>FERTILIZERS</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {fertilizers.map((f, fi) => (
                                    <span key={fi} style={{
                                        background: "rgba(22,163,74,0.12)",
                                        border: "1px solid rgba(22,163,74,0.25)",
                                        borderRadius: 6,
                                        padding: "2px 8px",
                                        fontSize: "0.72rem",
                                        color: "var(--primary-light)"
                                    }}>{f}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className={`score-badge ${WATER_COLOR[crop.waterNeeds] || "badge-medium"}`} style={{ marginTop: 8, fontSize: "0.68rem" }}>
                        {crop.waterNeeds} water needs
                    </div>
                </div>
            )}

            {!selected && (
                <div style={{ marginTop: 10, fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "right" }}>
                    Click for details →
                </div>
            )}
        </div>
    );
}
