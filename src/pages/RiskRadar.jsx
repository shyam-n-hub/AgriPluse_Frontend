// RiskRadar – 360° farm risk assessment with Recharts RadarChart
import { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { toast } from "react-toastify";

// Rule-based risk computation formulas
function computeRisks(inputs, weights) {
    const { temperature, humidity, rainProbability, irrigationFreq, soilType, cropAge } = inputs;
    const w = weights || {};

    // Climate Risk: based on temperature extremes and rainfall variance
    const tempExtreme = temperature > 40 || temperature < 5 ? 80 : temperature > 35 || temperature < 10 ? 50 : 20;
    const rainRisk = rainProbability < 20 ? 70 : rainProbability > 80 ? 40 : 15;
    const climateRisk = Math.min(100, Math.round(tempExtreme * 0.5 + rainRisk * 0.5));

    // Pest Risk: humidity + temperature drive pest activity
    const humidityRisk = humidity > 75 ? 80 : humidity > 60 ? 55 : 25;
    const tempPestRisk = temperature > 25 && temperature < 35 ? 65 : 35;
    const pestRisk = Math.min(100, Math.round(humidityRisk * 0.5 + tempPestRisk * 0.5));

    // Water Stress: irrigation frequency vs soil type
    const isLowRetention = ["sandy", "loamy sand", "sandy loam"].includes(soilType);
    const freqRisk = isLowRetention && irrigationFreq < 3 ? 80 : !isLowRetention && irrigationFreq > 5 ? 30 : irrigationFreq < 2 ? 65 : 25;
    const waterStress = Math.min(100, Math.round(freqRisk));

    // Pollination Risk: wind + temperature + humidity affect bees
    const pollinRisk = temperature > 35 || temperature < 10 ? 80 : humidity > 80 ? 65 : 20;

    // Market Risk: fixed base + crop age adjustment
    const ageBonus = cropAge > 100 ? 20 : cropAge > 60 ? 10 : 0;
    const marketRisk = Math.min(100, 35 + ageBonus);

    return { climateRisk, pestRisk, waterStress, pollinationRisk: pollinRisk, marketRisk };
}

export default function RiskRadar() {
    const { currentUser } = useAuth();
    const [weights, setWeights] = useState(null);
    const [inputs, setInputs] = useState({
        temperature: 28, humidity: 60, rainProbability: 35,
        irrigationFreq: 3, soilType: "loam", cropAge: 45,
    });
    const [risks, setRisks] = useState(null);

    useEffect(() => {
        get(ref(db, "riskWeights")).then((snap) => snap.exists() && setWeights(snap.val()));
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setInputs((f) => ({ ...f, [name]: name === "soilType" ? value : Number(value) }));
    }

    function calculate() {
        const r = computeRisks(inputs, weights);
        setRisks(r);
        // Save to Firebase
        if (currentUser) {
            set(ref(db, `riskScores/${currentUser.uid}`), { ...r, timestamp: Date.now() });
        }
        toast.success("Risk analysis complete! 📡");
    }

    const radarData = risks
        ? [
            { subject: "Climate Risk", value: risks.climateRisk },
            { subject: "Pest Risk", value: risks.pestRisk },
            { subject: "Water Stress", value: risks.waterStress },
            { subject: "Pollination Risk", value: risks.pollinationRisk },
            { subject: "Market Risk", value: risks.marketRisk },
        ]
        : [];

    const riskItems = risks
        ? [
            { label: "Climate Risk", value: risks.climateRisk, icon: "🌡️" },
            { label: "Pest Risk", value: risks.pestRisk, icon: "🐛" },
            { label: "Water Stress", value: risks.waterStress, icon: "💧" },
            { label: "Pollination Risk", value: risks.pollinationRisk, icon: "🐝" },
            { label: "Market Risk", value: risks.marketRisk, icon: "📈" },
        ]
        : [];

    const overallRisk = risks
        ? Math.round((risks.climateRisk + risks.pestRisk + risks.waterStress + risks.pollinationRisk + risks.marketRisk) / 5)
        : null;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📡 Risk Radar Dashboard</h1>
                <p className="page-desc">360° farm risk assessment across 5 critical dimensions</p>
            </div>

            <div className="grid-2" style={{ gap: 24 }}>
                {/* Inputs */}
                <div className="card">
                    <div className="card-title">⚙️ Farm Conditions</div>
                    <div className="card-subtitle">Enter current farm parameters for risk analysis</div>

                    {[
                        { name: "temperature", label: "Temperature", unit: "°C", min: 0, max: 50 },
                        { name: "humidity", label: "Humidity", unit: "%", min: 0, max: 100 },
                        { name: "rainProbability", label: "Rain Probability", unit: "%", min: 0, max: 100 },
                        { name: "irrigationFreq", label: "Irrigation Freq (times/week)", unit: "x/wk", min: 1, max: 10 },
                        { name: "cropAge", label: "Crop Age", unit: "days", min: 0, max: 180 },
                    ].map((item) => (
                        <div className="form-group" key={item.name}>
                            <label className="form-label">{item.label}: <strong style={{ color: "var(--primary-light)" }}>{inputs[item.name]}{item.unit}</strong></label>
                            <input type="range" name={item.name} min={item.min} max={item.max}
                                value={inputs[item.name]} onChange={handleChange}
                                style={{ width: "100%", accentColor: "var(--primary)" }} />
                        </div>
                    ))}

                    <div className="form-group">
                        <label className="form-label">Soil Type</label>
                        <select name="soilType" className="form-control" value={inputs.soilType} onChange={handleChange}>
                            {["loam", "clay", "sandy loam", "silt loam", "clay loam", "sandy", "silty clay"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={calculate}>
                        📡 Compute Risk Scores
                    </button>
                </div>

                {/* Radar Chart */}
                <div className="card">
                    <div className="card-title">📊 Risk Radar</div>
                    <div className="card-subtitle">Visual 360° risk map</div>

                    {!risks ? (
                        <div className="loading-center" style={{ minHeight: 300 }}>
                            <div style={{ fontSize: "3rem" }}>📡</div>
                            <p style={{ color: "var(--text-muted)" }}>Set parameters and compute to see the radar</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            {/* Overall score */}
                            <div style={{ textAlign: "center", marginBottom: 8 }}>
                                <span className={`score-badge ${overallRisk >= 65 ? "badge-high" : overallRisk >= 40 ? "badge-medium" : "badge-low"}`}>
                                    {overallRisk >= 65 ? "🚨 High Overall Risk" : overallRisk >= 40 ? "⚠️ Moderate Risk" : "✅ Low Risk"} – {overallRisk}%
                                </span>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 10 }} />
                                    <Radar name="Risk %" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                                    <Tooltip
                                        contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: "0.8rem", color: "#94a3b8" }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Risk breakdown cards */}
            {risks && (
                <div className="fade-in" style={{ marginTop: 24 }}>
                    <div className="grid-auto">
                        {riskItems.map((item) => {
                            const low = item.value < 40;
                            const high = item.value >= 65;
                            return (
                                <div key={item.label} className="card">
                                    <div className="card-title">{item.icon} {item.label}</div>
                                    <div style={{ marginTop: 12, marginBottom: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 6 }}>
                                            <span style={{ color: "var(--text-muted)" }}>Risk Score</span>
                                            <strong style={{ color: high ? "var(--danger)" : low ? "var(--primary)" : "var(--warning)" }}>{item.value}%</strong>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{
                                                width: `${item.value}%`,
                                                background: high ? "linear-gradient(135deg,#ef4444,#f87171)" : low ? "var(--gradient-success)" : "linear-gradient(135deg,#f59e0b,#fbbf24)"
                                            }} />
                                        </div>
                                    </div>
                                    <span className={`score-badge ${high ? "badge-high" : low ? "badge-low" : "badge-medium"}`} style={{ fontSize: "0.7rem" }}>
                                        {high ? "High Risk" : low ? "Low Risk" : "Medium Risk"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
