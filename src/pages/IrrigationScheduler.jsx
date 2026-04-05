// IrrigationScheduler – Smart irrigation planning with weather API + rule engine
import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase/config";
import { calculateIrrigationPlan } from "../utils/irrigationEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { toast } from "react-toastify";

const IRRIG_TYPES = ["drip", "sprinkler", "flood", "furrow"];
const SOIL_TYPES = ["loam", "clay", "sandy loam", "silt loam", "clay loam", "sandy", "silty clay"];

// Custom Recharts tooltip
function CustomTooltip({ active, payload, label }) {
    if (active && payload?.length) {
        return (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
                <p style={{ color: "var(--secondary)", fontSize: "0.85rem" }}>{payload[0].value}L water</p>
            </div>
        );
    }
    return null;
}

export default function IrrigationScheduler() {
    const [rules, setRules] = useState(null);
    const [weather, setWeather] = useState({ rainProbability: null, temperature: null });
    const [fetchingWeather, setFetchingWeather] = useState(true);
    const [farm, setFarm] = useState({ irrigationType: "drip", soilType: "loam" });
    const [plan, setPlan] = useState(null);

    // Load irrigation rules
    useEffect(() => {
        get(ref(db, "irrigationRules")).then((snap) => {
            if (snap.exists()) setRules(snap.val());
        });
    }, []);

    // Fetch live weather from Open-Meteo (free, no API key)
    useEffect(() => {
        setFetchingWeather(true);
        navigator.geolocation?.getCurrentPosition(
            (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            () => fetchWeather(20.5937, 78.9629) // Default: India center
        );
    }, []);

    async function fetchWeather(lat, lon) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,temperature_2m&timezone=auto&forecast_days=1`;
            const res = await fetch(url);
            const data = await res.json();
            const hourIndex = new Date().getHours();
            const rainProb = data.hourly?.precipitation_probability?.[hourIndex] ?? 30;
            const temp = data.hourly?.temperature_2m?.[hourIndex] ?? 25;
            setWeather({ rainProbability: Math.round(rainProb), temperature: Math.round(temp) });
        } catch {
            setWeather({ rainProbability: 30, temperature: 28 });
            toast.info("Using default weather data (geolocation unavailable)");
        } finally {
            setFetchingWeather(false);
        }
    }

    function generatePlan() {
        if (!rules) return toast.warning("Rules not loaded yet");
        const result = calculateIrrigationPlan(weather, farm, rules);
        setPlan(result);
        toast.success("Irrigation plan generated! 💧");
    }

    const barColors = plan?.weeklySchedule?.map((d) => d.volume > 0 ? "#0ea5e9" : "#1e293b") || [];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">💧 Irrigation Scheduler</h1>
                <p className="page-desc">Smart watering schedule based on live weather + rule-based logic</p>
            </div>

            <div className="grid-2" style={{ gap: 24 }}>
                {/* Config Panel */}
                <div className="card">
                    <div className="card-title">⚙️ Farm Configuration</div>
                    <div className="card-subtitle">Select your farm settings</div>

                    <div className="form-group">
                        <label className="form-label">Irrigation Method</label>
                        <select className="form-control" value={farm.irrigationType} onChange={(e) => setFarm((f) => ({ ...f, irrigationType: e.target.value }))}>
                            {IRRIG_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Soil Type</label>
                        <select className="form-control" value={farm.soilType} onChange={(e) => setFarm((f) => ({ ...f, soilType: e.target.value }))}>
                            {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Live weather card */}
                    <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 10, color: "var(--secondary)" }}>
                            🌤️ Live Weather Data {fetchingWeather && "(fetching…)"}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{fetchingWeather ? "–" : `${weather.temperature}°C`}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Temperature</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: weather.rainProbability > 60 ? "#06b6d4" : "var(--text-primary)" }}>
                                    {fetchingWeather ? "–" : `${weather.rainProbability}%`}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Rain Probability</div>
                            </div>
                        </div>
                        {weather.rainProbability > 60 && (
                            <div className="alert alert-info" style={{ marginTop: 10, fontSize: "0.78rem" }}>
                                🌧️ High rain probability – irrigation may be delayed
                            </div>
                        )}
                    </div>

                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={generatePlan} disabled={fetchingWeather || !rules}>
                        {fetchingWeather ? "⌛ Fetching weather…" : "💧 Generate Irrigation Plan"}
                    </button>
                </div>

                {/* Result Panel */}
                <div className="card">
                    <div className="card-title">📋 Irrigation Plan</div>
                    <div className="card-subtitle">Your personalized watering schedule</div>

                    {!plan ? (
                        <div className="loading-center" style={{ minHeight: 280 }}>
                            <div style={{ fontSize: "3rem" }}>💧</div>
                            <p style={{ color: "var(--text-muted)" }}>Configure settings and generate your plan</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            {/* Key metrics */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                <div style={{ textAlign: "center", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "var(--radius-sm)", padding: 16 }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>NEXT IRRIGATION</div>
                                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary-light)" }}>
                                        {plan.nextIrrigationHours}h
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                        {plan.shouldDelay ? "⏱️ Delayed" : "✅ On schedule"}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: "var(--radius-sm)", padding: 16 }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>WATER VOLUME</div>
                                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--secondary)" }}>
                                        {plan.volumeLitres}L
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>per session</div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className={`alert alert-${plan.shouldDelay ? "info" : "success"}`} style={{ marginBottom: 16, fontSize: "0.82rem" }}>
                                {plan.shouldDelay ? "🌧️" : "✅"} {plan.reason}
                            </div>

                            {/* Method badge */}
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 4 }}>
                                Method: <strong style={{ color: "var(--text-primary)" }}>{plan.irrigationType?.toUpperCase()}</strong>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Chart */}
            {plan && (
                <div className="card fade-in" style={{ marginTop: 24 }}>
                    <div className="card-title">📅 Weekly Irrigation Schedule</div>
                    <div className="card-subtitle">Recommended water volume per day (liters)</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={plan.weeklySchedule} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} unit="L" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="volume" name="Water (L)" radius={[6, 6, 0, 0]}>
                                {plan.weeklySchedule.map((entry, index) => (
                                    <Cell key={index} fill={entry.volume > 0 ? "#0ea5e9" : "#1e293b"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Rules summary */}
            {rules && (
                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-title">📜 Active Irrigation Rules</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginTop: 12, fontSize: "0.82rem" }}>
                        <div className="alert alert-info">🌧️ Rain threshold: &gt;{rules.rainThreshold}% → delay</div>
                        <div className="alert alert-warning">🏜️ Sandy soils: ×{rules.lowRetentionMultiplier} volume</div>
                        <div className="alert alert-success">🪨 Clay soils: ×{rules.highRetentionMultiplier} volume</div>
                        <div className="alert alert-info">🌡️ Temp &gt;35°C: ×1.2 volume</div>
                    </div>
                </div>
            )}
        </div>
    );
}
