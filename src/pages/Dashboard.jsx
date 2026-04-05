// Dashboard – Overview page with key stats and quick-access cards
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const modules = [
    { path: "/farm", icon: "🌾", label: "Farm Manager", desc: "Create & manage your farms with map boundaries", color: "green" },
    { path: "/climate", icon: "🌡️", label: "Climate Suitability", desc: "Check if your crop suits current conditions", color: "blue" },
    { path: "/irrigation", icon: "💧", label: "Irrigation Scheduler", desc: "Smart watering schedule based on weather", color: "cyan" },
    { path: "/pollination", icon: "🐝", label: "Pollination Engine", desc: "Best pollination windows & conditions", color: "amber" },
    { path: "/crop-checker", icon: "📸", label: "Crop Checker", desc: "Diagnose crop issues by uploading photos", color: "purple" },
    { path: "/risk-radar", icon: "📡", label: "Risk Radar", desc: "360° farm risk assessment dashboard", color: "blue" },
    { path: "/sustainability", icon: "♻️", label: "Sustainability", desc: "Track your eco-footprint & earn badges", color: "green" },
];

export default function Dashboard() {
    const { currentUser, userProfile } = useAuth();
    const [farmCount, setFarmCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        get(ref(db, `farms/${currentUser.uid}`))
            .then((snap) => {
                if (snap.exists()) setFarmCount(Object.keys(snap.val()).length);
            })
            .finally(() => setLoading(false));
    }, [currentUser]);

    const displayName = userProfile?.displayName || currentUser?.email || "Farmer";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div>
            {/* Hero header */}
            <div
                className="card"
                style={{
                    background: "linear-gradient(135deg, #0d2e1a 0%, #0c1f35 100%)",
                    border: "1px solid var(--border)",
                    marginBottom: 28,
                    padding: "32px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <p style={{ color: "var(--primary-light)", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                            {greeting}, {displayName} 👋
                        </p>
                        <h1 style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>
                            Welcome to <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Agri Pulse</span>
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            Your intelligent virtual agriculture platform powered by rule-based AI.
                        </p>
                    </div>
                    <div style={{ fontSize: "4rem" }}>🌿</div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon green">🌾</div>
                    <div>
                        <div className="stat-value">{loading ? "–" : farmCount}</div>
                        <div className="stat-label">Active Farms</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">🌡️</div>
                    <div>
                        <div className="stat-value">8</div>
                        <div className="stat-label">Crop Rules Loaded</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber">💧</div>
                    <div>
                        <div className="stat-value">Live</div>
                        <div className="stat-label">Weather Data</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan">🛡️</div>
                    <div>
                        <div className="stat-value">7</div>
                        <div className="stat-label">Intelligence Modules</div>
                    </div>
                </div>
            </div>

            {/* Module cards */}
            <div className="page-header">
                <h2 className="page-title">Intelligence Modules</h2>
                <p className="page-desc">Click any module to begin analysis</p>
            </div>

            <div className="grid-auto">
                {modules.map((mod) => (
                    <Link to={mod.path} key={mod.path} style={{ textDecoration: "none" }}>
                        <div className="card" style={{ cursor: "pointer", height: "100%" }}>
                            <div style={{ fontSize: "2.4rem", marginBottom: 14 }}>{mod.icon}</div>
                            <div className="card-title">{mod.label}</div>
                            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.6 }}>
                                {mod.desc}
                            </p>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginTop: 16,
                                    fontSize: "0.8rem",
                                    color: "var(--primary-light)",
                                    fontWeight: 600,
                                }}
                            >
                                Open module →
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer note */}
            <div className="alert alert-info" style={{ marginTop: 28 }}>
                🌐 All intelligence is rule-based and stored in Firebase. No machine learning or external processing required.
            </div>
        </div>
    );
}
