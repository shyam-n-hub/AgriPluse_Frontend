// PollinationEngine – Rule-based pollination scoring and best window finder
import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase/config";
import { calculatePollinationScore } from "../utils/pollinationEngine";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "react-toastify";

export default function PollinationEngine() {
    const [rules, setRules] = useState(null);
    const [conditions, setConditions] = useState({ temperature: 24, windKmh: 10, humidity: 55 });
    const [result, setResult] = useState(null);
    const [autoWeather, setAutoWeather] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        get(ref(db, "pollinationRules")).then((snap) => {
            if (snap.exists()) setRules(snap.val());
        });
    }, []);

    function handleChange(e) {
        setConditions((c) => ({ ...c, [e.target.name]: Number(e.target.value) }));
    }

    async function fetchLiveWeather() {
        setFetching(true);
        try {
            const pos = await new Promise((res, rej) =>
                navigator.geolocation?.getCurrentPosition(res, rej)
            );
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&hourly=temperature_2m,windspeed_10m,relativehumidity_2m&timezone=auto&forecast_days=1`;
            const data = await (await fetch(url)).json();
            const h = new Date().getHours();
            setConditions({
                temperature: Math.round(data.hourly?.temperature_2m?.[h] ?? 24),
                windKmh: Math.round(data.hourly?.windspeed_10m?.[h] ?? 10),
                humidity: Math.round(data.hourly?.relativehumidity_2m?.[h] ?? 55),
            });
            setAutoWeather(true);
            toast.success("Live weather loaded!");
        } catch {
            toast.info("Using manual inputs (geolocation unavailable)");
        } finally {
            setFetching(false);
        }
    }

    function analyze() {
        if (!rules) return toast.warning("Rules not loaded");
        const res = calculatePollinationScore(conditions, rules);
        setResult(res);
    }

    const radarData = result ? [
        { subject: "Temperature", A: result.breakdown.tempScore },
        { subject: "Wind", A: result.breakdown.windScore },
        { subject: "Humidity", A: result.breakdown.humScore },
        { subject: "Overall", A: result.score },
    ] : [];

    const scoreColor = result?.score >= 75 ? "var(--primary)" : result?.score >= 50 ? "var(--warning)" : "var(--danger)";

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🐝 Pollination Intelligence Engine</h1>
                <p className="page-desc">Calculate pollination suitability and find the best window for field activities</p>
            </div>

            <div className="grid-2" style={{ gap: 24 }}>
                {/* Inputs */}
                <div className="card">
                    <div className="card-title">🌤️ Weather Conditions</div>
                    <div className="card-subtitle">Enter current field conditions or fetch live data</div>

                    <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginBottom: 16 }}
                        onClick={fetchLiveWeather}
                        disabled={fetching}
                    >
                        {fetching ? "⌛ Fetching…" : "📡 Auto-fetch Live Weather"}
                    </button>
                    {autoWeather && <div className="alert alert-success" style={{ marginBottom: 14, fontSize: "0.78rem" }}>✅ Using live weather data</div>}

                    {/* Temperature slider */}
                    <div className="form-group">
                        <label className="form-label">Temperature: <strong style={{ color: "var(--primary-light)" }}>{conditions.temperature}°C</strong></label>
                        <input type="range" name="temperature" min={0} max={45} value={conditions.temperature} onChange={handleChange}
                            style={{ width: "100%", accentColor: "var(--primary)" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                            <span>0°C</span><span style={{ color: "var(--primary-light)" }}>Ideal: {rules?.tempMin}–{rules?.tempMax}°C</span><span>45°C</span>
                        </div>
                    </div>

                    {/* Wind slider */}
                    <div className="form-group">
                        <label className="form-label">Wind Speed: <strong style={{ color: conditions.windKmh > (rules?.windMaxKmh || 20) ? "var(--danger)" : "var(--primary-light)" }}>{conditions.windKmh} km/h</strong></label>
                        <input type="range" name="windKmh" min={0} max={60} value={conditions.windKmh} onChange={handleChange}
                            style={{ width: "100%", accentColor: "var(--primary)" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                            <span>0</span><span style={{ color: "var(--warning)" }}>Max: {rules?.windMaxKmh || 20} km/h</span><span>60 km/h</span>
                        </div>
                    </div>

                    {/* Humidity slider */}
                    <div className="form-group">
                        <label className="form-label">Humidity: <strong style={{ color: "var(--primary-light)" }}>{conditions.humidity}%</strong></label>
                        <input type="range" name="humidity" min={10} max={100} value={conditions.humidity} onChange={handleChange}
                            style={{ width: "100%", accentColor: "var(--primary)" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                            <span>10%</span><span style={{ color: "var(--primary-light)" }}>Ideal: {rules?.humidityMin}–{rules?.humidityMax}%</span><span>100%</span>
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={analyze} disabled={!rules}>
                        🐝 Calculate Pollination Score
                    </button>
                </div>

                {/* Results */}
                <div className="card">
                    <div className="card-title">📊 Analysis Results</div>
                    <div className="card-subtitle">Rule-based pollination suitability</div>

                    {!result ? (
                        <div className="loading-center" style={{ minHeight: 280 }}>
                            <div style={{ fontSize: "3rem" }}>🌸</div>
                            <p style={{ color: "var(--text-muted)" }}>Set conditions and click Calculate</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            {/* Score */}
                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                <div className="score-circle" style={{ borderColor: scoreColor, background: `${scoreColor}18`, marginBottom: 10 }}>
                                    <span className="score-num" style={{ color: scoreColor }}>{result.score}</span>
                                    <span className="score-unit">/ 100</span>
                                </div>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                    {result.score >= 75 ? "Excellent Conditions 🌸" : result.score >= 50 ? "Moderate Conditions ⚠️" : "Poor Conditions 🚫"}
                                </div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Best Window: <strong style={{ color: "var(--primary-light)" }}>{result.bestWindow}</strong></div>
                            </div>

                            {/* Pollinator activity */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Pollinator Activity:</div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {result.pollinators.map((p) => (
                                        <span key={p.name} className={`score-badge ${p.active ? "badge-low" : "badge-high"}`}>
                                            {p.active ? "✅" : "❌"} {p.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className={`alert alert-${result.score >= 75 ? "success" : result.score >= 50 ? "warning" : "danger"}`} style={{ fontSize: "0.82rem" }}>
                                {result.recommendation}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Radar Chart */}
            {result && (
                <div className="card fade-in" style={{ marginTop: 24 }}>
                    <div className="card-title">📡 Pollination Conditions Radar</div>
                    <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                            <Radar name="Score" dataKey="A" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} />
                            <Tooltip
                                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
