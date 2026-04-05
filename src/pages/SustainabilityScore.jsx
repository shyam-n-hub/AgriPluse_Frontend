// SustainabilityScore – Water efficiency, fertilizer usage, pollination safety → Bronze/Silver/Gold badge
import { useState, useEffect } from "react";
import { ref, set, get } from "firebase/database";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import {
    RadialBarChart, RadialBar, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { toast } from "react-toastify";

function computeSustainabilityScore(inputs) {
    const { waterEfficiency, fertilizerUsage, pollinationSafety, renewableEnergy, wasteManagement } = inputs;

    // Water efficiency: higher is better (0–100)
    const waterScore = Math.min(100, waterEfficiency);

    // Fertilizer usage: lower chemical = better; score inversely (100 = organic only)
    const fertScore = Math.min(100, fertilizerUsage);

    // Pollination safety: pesticide-free score
    const pollScore = Math.min(100, pollinationSafety);

    // Renewable energy use
    const energyScore = Math.min(100, renewableEnergy);

    // Waste management
    const wasteScore = Math.min(100, wasteManagement);

    // Weighted total
    const total = Math.round(
        waterScore * 0.25 +
        fertScore * 0.25 +
        pollScore * 0.2 +
        energyScore * 0.15 +
        wasteScore * 0.15
    );

    let badge = "Bronze";
    let badgeColor = "#c2763c";
    let emoji = "🥉";
    if (total >= 71) { badge = "Gold"; badgeColor = "#d97706"; emoji = "🥇"; }
    else if (total >= 41) { badge = "Silver"; badgeColor = "#94a3b8"; emoji = "🥈"; }

    return {
        total,
        badge,
        badgeColor,
        emoji,
        breakdown: { waterScore, fertScore, pollScore, energyScore, wasteScore },
    };
}

export default function SustainabilityScore() {
    const { currentUser } = useAuth();
    const [inputs, setInputs] = useState({
        waterEfficiency: 65,
        fertilizerUsage: 50,
        pollinationSafety: 70,
        renewableEnergy: 40,
        wasteManagement: 55,
    });
    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Load previous score
    useEffect(() => {
        if (!currentUser) return;
        get(ref(db, `sustainabilityScores/${currentUser.uid}`)).then((snap) => {
            if (snap.exists()) setLastSaved(snap.val());
        });
    }, [currentUser]);

    function handleChange(e) {
        setInputs((f) => ({ ...f, [e.target.name]: Number(e.target.value) }));
    }

    function calculate() {
        const res = computeSustainabilityScore(inputs);
        setResult(res);
    }

    async function saveScore() {
        if (!result || !currentUser) return;
        setSaving(true);
        try {
            await set(ref(db, `sustainabilityScores/${currentUser.uid}`), {
                ...result,
                inputs,
                timestamp: Date.now(),
            });
            setLastSaved({ ...result, inputs, timestamp: Date.now() });
            toast.success("Sustainability score saved! ♻️");
        } catch {
            toast.error("Failed to save score");
        } finally {
            setSaving(false);
        }
    }

    const pieData = result
        ? [
            { name: "Water Efficiency", value: result.breakdown.waterScore, fill: "#0ea5e9" },
            { name: "Fertilizer Score", value: result.breakdown.fertScore, fill: "#a3e635" },
            { name: "Pollination Safety", value: result.breakdown.pollScore, fill: "#f59e0b" },
            { name: "Renewable Energy", value: result.breakdown.energyScore, fill: "#34d399" },
            { name: "Waste Management", value: result.breakdown.wasteScore, fill: "#818cf8" },
        ]
        : [];

    const metrics = [
        { name: "waterEfficiency", label: "Water Efficiency", icon: "💧", hint: "Use drip/efficient methods (0=wasteful)" },
        { name: "fertilizerUsage", label: "Organic Fertilizer Score", icon: "🌱", hint: "Higher = more organic/less chemical" },
        { name: "pollinationSafety", label: "Pollination Safety", icon: "🐝", hint: "Higher = less pesticide use near pollinators" },
        { name: "renewableEnergy", label: "Renewable Energy Usage", icon: "☀️", hint: "Solar pumps, biogas, wind score" },
        { name: "wasteManagement", label: "Waste Management", icon: "♻️", hint: "Composting, residue handling score" },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">♻️ Sustainability Score</h1>
                <p className="page-desc">Measure your farm's eco-impact and earn Bronze, Silver, or Gold certification</p>
            </div>

            {/* Last saved score */}
            {lastSaved && (
                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                    📅 Last saved score: <strong>{lastSaved.total}%</strong> – {lastSaved.emoji} <strong>{lastSaved.badge}</strong> on {new Date(lastSaved.timestamp).toLocaleDateString()}
                </div>
            )}

            <div className="grid-2" style={{ gap: 24 }}>
                {/* Input sliders */}
                <div className="card">
                    <div className="card-title">📋 Sustainability Inputs</div>
                    <div className="card-subtitle">Rate your farm practices on each dimension</div>

                    {metrics.map((m) => (
                        <div key={m.name} className="form-group">
                            <label className="form-label">
                                {m.icon} {m.label}: <strong style={{ color: "var(--primary-light)" }}>{inputs[m.name]}%</strong>
                            </label>
                            <input
                                type="range"
                                name={m.name}
                                min={0}
                                max={100}
                                value={inputs[m.name]}
                                onChange={handleChange}
                                style={{ width: "100%", accentColor: "var(--primary)" }}
                            />
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 3 }}>{m.hint}</div>
                        </div>
                    ))}

                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={calculate}>
                            ♻️ Calculate Score
                        </button>
                        {result && (
                            <button className="btn btn-secondary" onClick={saveScore} disabled={saving}>
                                {saving ? "⌛" : "💾 Save"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Score display */}
                <div className="card">
                    <div className="card-title">🏆 Sustainability Badge</div>
                    <div className="card-subtitle">Your farm's eco-performance rating</div>

                    {!result ? (
                        <div className="loading-center" style={{ minHeight: 280 }}>
                            <div style={{ fontSize: "3rem" }}>🌍</div>
                            <p style={{ color: "var(--text-muted)" }}>Enter your practices and calculate your score</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            {/* Badge */}
                            <div style={{ textAlign: "center", marginBottom: 24, padding: "24px 0" }}>
                                <div style={{ fontSize: "4rem", marginBottom: 8 }}>{result.emoji}</div>
                                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: result.badgeColor, marginBottom: 4 }}>
                                    {result.badge}
                                </div>
                                <div style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>Sustainability Certification</div>
                                <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--primary-light)", marginTop: 10 }}>
                                    {result.total}%
                                </div>

                                <div style={{ maxWidth: 280, margin: "12px auto 0" }}>
                                    <div className="progress-bar" style={{ height: 12 }}>
                                        <div className="progress-fill" style={{
                                            width: `${result.total}%`,
                                            background: result.badge === "Gold" ? "linear-gradient(135deg,#d97706,#fbbf24)" :
                                                result.badge === "Silver" ? "linear-gradient(135deg,#64748b,#94a3b8)" :
                                                    "linear-gradient(135deg,#92400e,#c2763c)"
                                        }} />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }}>
                                        <span>🥉 Bronze (0–40)</span>
                                        <span>🥈 Silver (41–70)</span>
                                        <span>🥇 Gold (71+)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown bars */}
                            <div>
                                {metrics.map((m, i) => {
                                    const val = Object.values(result.breakdown)[i];
                                    return (
                                        <div key={m.name} style={{ marginBottom: 10 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4 }}>
                                                <span>{m.icon} {m.label}</span>
                                                <strong style={{ color: val >= 70 ? "var(--primary-light)" : val >= 40 ? "#fbbf24" : "#f87171" }}>{val}%</strong>
                                            </div>
                                            <div className="progress-bar" style={{ height: 6 }}>
                                                <div className="progress-fill" style={{
                                                    width: `${val}%`,
                                                    background: val >= 70 ? "var(--gradient-success)" : val >= 40 ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "linear-gradient(135deg,#ef4444,#f87171)"
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pie Chart breakdown */}
            {result && (
                <div className="card fade-in" style={{ marginTop: 24 }}>
                    <div className="card-title">🥧 Score Distribution</div>
                    <div className="card-subtitle">Contribution of each sustainability dimension</div>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={index} fill={entry.fill} opacity={0.85} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }}
                                formatter={(val) => [`${val}%`, ""]}
                            />
                            <Legend wrapperStyle={{ fontSize: "0.78rem", color: "#94a3b8" }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Tips */}
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-title">💡 Improvement Tips</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginTop: 12 }}>
                    {[
                        { icon: "💧", tip: "Switch to drip irrigation to improve water efficiency by up to 50%" },
                        { icon: "🌱", tip: "Replace chemical fertilizers with compost and green manure" },
                        { icon: "🐝", tip: "Avoid pesticides during bloom hours (6–10 AM)" },
                        { icon: "☀️", tip: "Install solar-powered water pumps to earn renewable energy points" },
                        { icon: "♻️", tip: "Compost crop residues instead of burning to reduce waste score" },
                    ].map((t) => (
                        <div key={t.tip} className="alert alert-success" style={{ fontSize: "0.8rem" }}>
                            {t.icon} {t.tip}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
