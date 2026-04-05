// Sidebar Navigation Component
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const navItems = [
    { path: "/dashboard", icon: "🏠", label: "Dashboard", section: "OVERVIEW" },
    { path: "/farm", icon: "🌾", label: "Farm Manager", section: "FARM" },
    { path: "/climate", icon: "🌡️", label: "Climate Suitability", section: "INTELLIGENCE" },
    { path: "/irrigation", icon: "💧", label: "Irrigation Scheduler", section: "INTELLIGENCE" },
    { path: "/pollination", icon: "🐝", label: "Pollination Engine", section: "INTELLIGENCE" },
    { path: "/crop-recommendations", icon: "🌱", label: "Crop Recommendations", section: "INTELLIGENCE" },
    { path: "/crop-checker", icon: "📸", label: "Crop Checker", section: "TOOLS" },
    { path: "/risk-radar", icon: "📡", label: "Risk Radar", section: "TOOLS" },
    { path: "/sustainability", icon: "♻️", label: "Sustainability", section: "TOOLS" },

];

export default function Sidebar() {
    const { currentUser, userProfile, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate("/login");
            toast.success("Logged out successfully");
        } catch {
            toast.error("Failed to logout");
        }
    }

    // Group nav items by section
    const sections = [...new Set(navItems.map((i) => i.section))];

    const displayName = userProfile?.displayName || currentUser?.email || "Farmer";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            {/* Mobile toggle button */}
            <button
                className="sidebar-toggle"
                onClick={() => setOpen(!open)}
                aria-label="Toggle sidebar"
            >
                {open ? "✕" : "☰"}
            </button>

            {/* Overlay for mobile */}
            {open && (
                <div
                    className="sidebar-overlay"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 999,
                    }}
                    onClick={() => setOpen(false)}
                />
            )}

            <aside className={`sidebar ${open ? "open" : ""}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-text">🌿 Agri Pulse</div>
                    <div className="logo-sub">Intelligent Agriculture Platform</div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {sections.map((section) => (
                        <div key={section}>
                            <div className="sidebar-section-label">{section}</div>
                            {navItems
                                .filter((i) => i.section === section)
                                .map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) => (isActive ? "active" : "")}
                                        onClick={() => setOpen(false)}
                                    >
                                        <span className="nav-icon">{item.icon}</span>
                                        {item.label}
                                    </NavLink>
                                ))}
                        </div>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
                        <div className="user-avatar">{initials}</div>
                        <div>
                            <div className="user-name">{displayName}</div>
                            <div className="user-role">Logout →</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
