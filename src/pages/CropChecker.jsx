import React, { useState, useRef } from "react";

// FastAPI backend URL (Deployed on Render)
const API_URL = "https://agripulse-backend-holp.onrender.com/api/predict";

export default function CropChecker() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResults(null);
            setError(null);
        }
    };

    const handleTriggerFile = () => fileInputRef.current?.click();

    const analyzeLeaf = async () => {
        if (!selectedFile) {
            setError("Please select a leaf image first.");
            return;
        }

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch(API_URL, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Server responded with status ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.predictions && data.predictions.length > 0) {
                setResults(data.predictions);
            } else {
                setError("Could not identify the leaf. Please try a clearer image.");
            }
        } catch (err) {
            console.error(err);
            if (err.message.includes("Failed to fetch")) {
                setError("Cannot connect to AI backend. Make sure the FastAPI server is running (python main.py in the backend folder).");
            } else {
                setError(err.message || "An error occurred during analysis.");
            }
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (score) => {
        const pct = score * 100;
        if (pct > 70) return "#22c55e";
        if (pct >= 40) return "#f59e0b";
        return "#ef4444";
    };

    const getSeverityStyle = (severity) => {
        const colors = {
            "Severe": { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
            "Moderate": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
            "None": { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)" },
        };
        return colors[severity] || colors["Moderate"];
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            <div className="page-header">
                <h1 className="page-title">🔬 AI Leaf Disease Detection</h1>
                <p className="page-desc">
                    Upload a leaf photo for instant AI-powered disease identification with treatment &amp; care suggestions.
                </p>
            </div>

            <div className="grid-2" style={{ gap: 24, marginTop: 24 }}>
                {/* ─── UPLOAD SECTION ─── */}
                <div className="card fade-in">
                    <div className="card-title">📸 Upload Leaf Image</div>
                    <div className="card-subtitle">Take a clear photo of the affected leaf surface</div>

                    <div
                        onClick={handleTriggerFile}
                        style={{
                            border: "2px dashed var(--border)",
                            borderRadius: "var(--radius-lg)",
                            padding: previewUrl ? "16px" : "48px 20px",
                            textAlign: "center",
                            marginTop: 16,
                            marginBottom: 16,
                            background: "rgba(255,255,255,0.02)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="Leaf Preview" style={{ maxWidth: "100%", maxHeight: 280, borderRadius: "var(--radius-sm)", objectFit: "contain" }} />
                        ) : (
                            <div style={{ color: "var(--text-muted)" }}>
                                <div style={{ fontSize: "3rem", marginBottom: 8 }}>🌿</div>
                                <div style={{ fontWeight: 500 }}>Click to upload leaf image</div>
                                <div style={{ fontSize: "0.75rem", marginTop: 4, opacity: 0.6 }}>JPG, PNG, WEBP supported</div>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: "none" }} />
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        {previewUrl && (
                            <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={handleTriggerFile}>
                                Change Photo
                            </button>
                        )}
                        <button
                            className="btn btn-primary"
                            style={{ flex: 2, justifyContent: "center", padding: "12px 20px" }}
                            onClick={analyzeLeaf}
                            disabled={!selectedFile || loading}
                        >
                            {loading ? (
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                                    Analyzing...
                                </span>
                            ) : "🔬 Analyze Leaf"}
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-danger" style={{ marginTop: 16 }}>⚠️ {error}</div>
                    )}
                </div>

                {/* ─── QUICK RESULT PANEL ─── */}
                <div className="card fade-in" style={{ animationDelay: "0.05s" }}>
                    <div className="card-title">📋 Quick Result</div>
                    <div className="card-subtitle">Primary detection from the AI model</div>

                    {loading && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 240, color: "var(--text-muted)" }}>
                            <div style={{ fontSize: "3rem", animation: "pulse 1.5s infinite" }}>🧬</div>
                            <div style={{ marginTop: 12, fontWeight: 500 }}>AI model is analyzing the leaf...</div>
                            <div style={{ fontSize: "0.78rem", marginTop: 4, opacity: 0.6 }}>This may take a few seconds on first run</div>
                        </div>
                    )}

                    {!loading && !results && !error && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 240, color: "var(--text-muted)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: 8, opacity: 0.4 }}>🔍</div>
                            <div>Upload a leaf image to begin analysis</div>
                        </div>
                    )}

                    {!loading && results && results[0] && (() => {
                        const top = results[0];
                        const sevStyle = getSeverityStyle(top.severity);
                        const confColor = getConfidenceColor(top.confidence);
                        return (
                            <div style={{ marginTop: 16 }}>
                                {/* Status Badge */}
                                <div style={{
                                    textAlign: "center",
                                    padding: "20px 16px",
                                    borderRadius: "var(--radius-md)",
                                    background: top.is_healthy
                                        ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03))"
                                        : "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03))",
                                    border: `1px solid ${top.is_healthy ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                                    marginBottom: 16,
                                }}>
                                    <div style={{ fontSize: "2.5rem" }}>{top.is_healthy ? "✅" : "⚠️"}</div>
                                    <div style={{ fontWeight: 800, fontSize: "1.3rem", marginTop: 8, color: "var(--text-primary)" }}>
                                        {top.disease}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
                                        Crop: {top.crop}
                                    </div>
                                </div>

                                {/* Confidence + Severity */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", padding: 12, border: "1px solid var(--border)" }}>
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Confidence</div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: confColor, marginTop: 4 }}>{top.confidence_percent}%</div>
                                    </div>
                                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", padding: 12, border: "1px solid var(--border)" }}>
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Severity</div>
                                        <div style={{
                                            display: "inline-block", marginTop: 6,
                                            padding: "3px 12px", borderRadius: 12,
                                            background: sevStyle.bg, color: sevStyle.color,
                                            fontWeight: 700, fontSize: "0.85rem",
                                            border: `1px solid ${sevStyle.border}`,
                                        }}>{top.severity}</div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div style={{ marginTop: 14, fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.6, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                                    {top.description}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* ─── DETAILED SUGGESTIONS ─── */}
            {!loading && results && results[0] && !results[0].is_healthy && (
                <div className="card fade-in" style={{ marginTop: 24, animationDelay: "0.1s" }}>
                    <div className="card-title">💡 Care Recommendations</div>
                    <div className="card-subtitle">Actionable suggestions for treating <strong>{results[0].disease}</strong> on {results[0].crop}</div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
                        {/* Treatment */}
                        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-md)", padding: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: "1.3rem" }}>💊</span>
                                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.5 }}>Treatment</span>
                            </div>
                            <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{results[0].treatment}</div>
                        </div>

                        {/* Fertilizer */}
                        <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "var(--radius-md)", padding: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: "1.3rem" }}>🧪</span>
                                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: 0.5 }}>Fertilizer</span>
                            </div>
                            <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{results[0].fertilizer}</div>
                        </div>

                        {/* Water */}
                        <div style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: "var(--radius-md)", padding: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: "1.3rem" }}>💧</span>
                                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0ea5e9", textTransform: "uppercase", letterSpacing: 0.5 }}>Water Management</span>
                            </div>
                            <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{results[0].water}</div>
                        </div>

                        {/* Prevention */}
                        <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "var(--radius-md)", padding: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: "1.3rem" }}>🛡️</span>
                                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#22c55e", textTransform: "uppercase", letterSpacing: 0.5 }}>Prevention</span>
                            </div>
                            <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{results[0].prevention}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── ALL PREDICTIONS LIST ─── */}
            {!loading && results && results.length > 1 && (
                <div className="card fade-in" style={{ marginTop: 24, animationDelay: "0.15s" }}>
                    <div className="card-title">📊 All Predictions</div>
                    <div className="card-subtitle">Top {results.length} matches from the AI model</div>

                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                        {results.map((pred, index) => {
                            const confColor = getConfidenceColor(pred.confidence);
                            return (
                                <div
                                    key={index}
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: `1px solid ${index === 0 ? "var(--primary)" : "var(--border)"}`,
                                        borderLeft: `4px solid ${confColor}`,
                                        borderRadius: "var(--radius-md)",
                                        padding: "12px 16px",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                        <div>
                                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                                {index === 0 && "🏆 "}{pred.disease}
                                            </span>
                                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: 8 }}>({pred.crop})</span>
                                        </div>
                                        <div style={{ fontWeight: 800, color: confColor, fontSize: "0.9rem" }}>
                                            {pred.confidence_percent}%
                                        </div>
                                    </div>
                                    <div style={{ width: "100%", background: "var(--border)", height: 4, borderRadius: 2, marginTop: 8 }}>
                                        <div style={{ width: `${pred.confidence_percent}%`, height: "100%", background: confColor, borderRadius: 2, transition: "width 1s ease" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Animations */}
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
            `}</style>
        </div>
    );
}
