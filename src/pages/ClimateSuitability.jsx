// ClimateSuitability – Rule-based crop suitability analyzer
import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase/config";
import { calculateSuitability } from "../utils/climateEngine";
import { toast } from "react-toastify";

const SOIL_TYPES = ["loam", "clay", "sandy loam", "silt loam", "clay loam", "sandy", "silty clay", "loamy sand"];
const CROP_LIST = ["wheat", "rice", "corn", "soybean", "cotton", "tomato", "potato", "sugarcane"];

export default function ClimateSuitability() {
    const [cropRules, setCropRules] = useState({});
    const [inputs, setInputs] = useState({ temperature: 25, rainfall: 600, soil: "loam" });
    const [selectedCrop, setSelectedCrop] = useState("wheat");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        get(ref(db, "cropRules")).then((snap) => {
            if (snap.exists()) setCropRules(snap.val());
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setInputs((f) => ({ ...f, [name]: name === "soil" ? value : Number(value) }));
    }

    function analyze() {
        if (!cropRules || Object.keys(cropRules).length === 0) {
            toast.warning("Crop rules not loaded yet. Please wait.");
            return;
        }
        const res = calculateSuitability(inputs, cropRules, selectedCrop);
        setResult(res);
    }

    const riskColor = (r) => r === "Low" ? "var(--primary)" : r === "Medium" ? "var(--warning)" : "var(--danger)";
    const scoreColor = (s) => s >= 70 ? "low" : s >= 40 ? "medium" : "high";

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🌡️ Climate Suitability</h1>
                <p className="page-desc">Analyze if your selected crop is suitable for current climate conditions</p>
            </div>

            <div className="grid-2" style={{ gap: 24 }}>
                {/* Input Panel */}
                <div className="card">
                    <div className="card-title">📊 Input Parameters</div>
                    <div className="card-subtitle">Enter current climate conditions</div>

                    <div className="form-group">
                        <label className="form-label">Crop to Analyze</label>
                        <select className="form-control" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                            {CROP_LIST.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Temperature: <strong style={{ color: "var(--primary-light)" }}>{inputs.temperature}°C</strong></label>
                        <input
                            type="range" name="temperature" min={-5} max={50}
                            value={inputs.temperature} onChange={handleChange}
                            style={{ width: "100%", accentColor: "var(--primary)" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                            <span>-5°C</span><span>50°C</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Annual Rainfall: <strong style={{ color: "var(--primary-light)" }}>{inputs.rainfall} mm</strong></label>
                        <input
                            type="range" name="rainfall" min={0} max={2500}
                            value={inputs.rainfall} onChange={handleChange}
                            style={{ width: "100%", accentColor: "var(--primary)" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                            <span>0 mm</span><span>2500 mm</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Soil Type</label>
                        <select name="soil" className="form-control" value={inputs.soil} onChange={handleChange}>
                            {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={analyze} disabled={loading}>
                        {loading ? "Loading rules…" : "🔍 Analyze Suitability"}
                    </button>

                    {/* Rules reference */}
                    {cropRules[selectedCrop] && (
                        <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.8rem" }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>📋 Ideal Range for {selectedCrop}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, color: "var(--text-muted)" }}>
                                <div>Temp: {cropRules[selectedCrop].tempMin}–{cropRules[selectedCrop].tempMax}°C</div>
                                <div>Rain: {cropRules[selectedCrop].rainfallMin}–{cropRules[selectedCrop].rainfallMax} mm</div>
                                <div style={{ gridColumn: "1/-1" }}>Soils: {cropRules[selectedCrop].soils?.join(", ")}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Result Panel */}
                <div className="card">
                    <div className="card-title">📈 Suitability Analysis</div>
                    <div className="card-subtitle">Rule-based evaluation results</div>

                    {!result ? (
                        <div className="loading-center" style={{ minHeight: 280 }}>
                            <div style={{ fontSize: "3rem" }}>🌱</div>
                            <p style={{ color: "var(--text-muted)" }}>Configure inputs and click Analyze to see results</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            {/* Score circle */}
                            <div style={{ textAlign: "center", marginBottom: 24 }}>
                                <div className={`score-circle ${scoreColor(result.score)}`} style={{ marginBottom: 12 }}>
                                    <span className="score-num" style={{ color: riskColor(result.riskLevel) }}>{result.score}%</span>
                                    <span className="score-unit">suitability</span>
                                </div>
                                <span className={`score-badge badge-${result.riskLevel.toLowerCase()}`}>
                                    {result.riskLevel === "Low" ? "✅" : result.riskLevel === "Medium" ? "⚠️" : "🚨"} {result.riskLevel} Risk
                                </span>
                            </div>

                            {/* Score breakdown */}
                            <div style={{ marginBottom: 20 }}>
                                {[
                                    { label: "Temperature Score", val: result.breakdown.temperatureScore, icon: "🌡️" },
                                    { label: "Rainfall Score", val: result.breakdown.rainfallScore, icon: "🌧️" },
                                    { label: "Soil Compatibility", val: result.breakdown.soilScore, icon: "🪨" },
                                ].map((item) => (
                                    <div key={item.label} style={{ marginBottom: 12 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                                            <span>{item.icon} {item.label}</span>
                                            <strong style={{ color: item.val >= 70 ? "var(--primary-light)" : item.val >= 40 ? "#fbbf24" : "#f87171" }}>{item.val}%</strong>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${item.val}%`, background: item.val >= 70 ? "var(--gradient-success)" : item.val >= 40 ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "linear-gradient(135deg,#ef4444,#f87171)" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recommendation */}
                            <div className={`alert alert-${result.riskLevel === "Low" ? "success" : result.riskLevel === "Medium" ? "warning" : "danger"}`}>
                                {result.score >= 70
                                    ? `✅ ${selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)} is well-suited for these conditions!`
                                    : `⚠️ Consider switching to: `}
                                {result.score < 70 && <strong> {result.recommendedCrop}</strong>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* All crops comparison */}
            {cropRules && Object.keys(cropRules).length > 0 && (
                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-title">🌍 All Crops Suitability Comparison</div>
                    <div className="card-subtitle">Based on current inputs, ranked by suitability</div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: 12,
                            marginTop: 12,
                        }}
                    >
                        {CROP_LIST.map((crop) => {
                            if (!cropRules[crop]) return null;
                            const r = calculateSuitability(inputs, cropRules, crop);
                            return (
                                <div
                                    key={crop}
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: `1px solid ${r.score >= 70 ? "rgba(22,163,74,0.3)" : r.score >= 40 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.2)"}`,
                                        borderRadius: "var(--radius-sm)",
                                        padding: "12px 14px",
                                    }}
                                >
                                    <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 6 }}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</div>
                                    <div className="progress-bar" style={{ height: 6 }}>
                                        <div className="progress-fill" style={{ width: `${r.score}%`, background: r.score >= 70 ? "var(--gradient-success)" : r.score >= 40 ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "linear-gradient(135deg,#ef4444,#f87171)" }} />
                                    </div>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>{r.score}% – {r.riskLevel} risk</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
