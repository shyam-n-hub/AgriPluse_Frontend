// FarmManager – Create farms with Leaflet + Geoman polygon drawing + zone management
import { useState, useEffect } from "react";
import { ref, get, remove, set } from "firebase/database";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from "react-leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

const SOIL_TYPES = ["loam", "clay", "sandy loam", "silt loam", "clay loam", "sandy", "silty clay", "loamy sand"];
const CROP_TYPES = ["wheat", "rice", "corn", "soybean", "cotton", "tomato", "potato", "sugarcane"];
const IRRIG_TYPES = ["drip", "sprinkler", "flood", "furrow"];

// Inner component to attach Geoman controls to the Leaflet map
function GeomanControl({ onPolygonCreated }) {
    const map = useMap();

    useEffect(() => {
        map.pm.addControls({
            position: "topright",
            drawMarker: false,
            drawCircle: false,
            drawCircleMarker: false,
            drawPolyline: false,
            drawRectangle: false,
            drawPolygon: true,
            editMode: true,
            dragMode: false,
            cutPolygon: false,
            removalMode: true,
        });

        map.on("pm:create", (e) => {
            const latlngs = e.layer.getLatLngs()[0].map((ll) => [ll.lat, ll.lng]);
            onPolygonCreated(latlngs);
        });

        return () => {
            map.pm.removeControls();
            map.off("pm:create");
        };
    }, [map, onPolygonCreated]);

    return null;
}

export default function FarmManager() {
    const { currentUser } = useAuth();
    const [farms, setFarms] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [drawnPolygon, setDrawnPolygon] = useState(null);
    const [form, setForm] = useState({
        name: "", cropType: "wheat", soilType: "loam", irrigationType: "drip",
    });
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [zoneForm, setZoneForm] = useState({ name: "" });
    const [zonePolygon, setZonePolygon] = useState(null);

    async function loadFarms() {
        const snap = await get(ref(db, `farms/${currentUser.uid}`));
        if (snap.exists()) {
            setFarms(Object.entries(snap.val()).map(([id, val]) => ({ id, ...val })));
        } else {
            setFarms([]);
        }
    }

    useEffect(() => {
        if (!currentUser) return;
        loadFarms().finally(() => setLoading(false));
    }, [currentUser]);

    function handleFormChange(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function saveFarm(e) {
        e.preventDefault();
        if (!form.name) return toast.warning("Farm name is required");
        if (!drawnPolygon) return toast.warning("Please draw the farm boundary on the map first");
        setSaving(true);
        try {
            const farmId = uuidv4();
            await set(ref(db, `farms/${currentUser.uid}/${farmId}`), {
                ...form,
                polygon: drawnPolygon,
                createdAt: Date.now(),
                uid: currentUser.uid,
            });
            toast.success("Farm created successfully! 🌾");
            setShowForm(false);
            setDrawnPolygon(null);
            setForm({ name: "", cropType: "wheat", soilType: "loam", irrigationType: "drip" });
            await loadFarms();
        } catch (err) {
            toast.error("Failed to save farm: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteFarm(farmId) {
        if (!window.confirm("Delete this farm and all its data?")) return;
        await remove(ref(db, `farms/${currentUser.uid}/${farmId}`));
        setFarms((f) => f.filter((x) => x.id !== farmId));
        if (selectedFarm?.id === farmId) setSelectedFarm(null);
        toast.success("Farm deleted");
    }

    async function saveZone(e) {
        e.preventDefault();
        if (!zoneForm.name) return toast.warning("Zone name required");
        if (!zonePolygon) return toast.warning("Draw zone boundary on the map");
        if (!selectedFarm) return;
        try {
            const zoneId = uuidv4();
            await set(ref(db, `zones/${currentUser.uid}/${selectedFarm.id}/${zoneId}`), {
                name: zoneForm.name,
                polygon: zonePolygon,
                createdAt: Date.now(),
            });
            toast.success("Zone added!");
            setZoneForm({ name: "" });
            setZonePolygon(null);
        } catch {
            toast.error("Failed to save zone");
        }
    }

    const center = [20.5937, 78.9629]; // India center

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🌾 Farm Manager</h1>
                <p className="page-desc">Digitize your farms with map boundaries, zones, and crop configurations</p>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <button
                    id="create-farm-btn"
                    className="btn btn-primary"
                    onClick={() => { setShowForm(!showForm); setDrawnPolygon(null); }}
                >
                    {showForm ? "✕ Cancel" : "➕ Create New Farm"}
                </button>
            </div>

            {/* Create Farm Form */}
            {showForm && (
                <div className="card fade-in" style={{ marginBottom: 24 }}>
                    <div className="card-title">🗺️ New Farm Setup</div>
                    <div className="card-subtitle">Fill in details and draw the farm boundary on the map using the draw tool (✏️ polygon icon)</div>

                    <form onSubmit={saveFarm}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Farm Name *</label>
                                <input name="name" className="form-control" placeholder="e.g. North Field" value={form.name} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Crop Type</label>
                                <select name="cropType" className="form-control" value={form.cropType} onChange={handleFormChange}>
                                    {CROP_TYPES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Soil Type</label>
                                <select name="soilType" className="form-control" value={form.soilType} onChange={handleFormChange}>
                                    {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Irrigation Type</label>
                                <select name="irrigationType" className="form-control" value={form.irrigationType} onChange={handleFormChange}>
                                    {IRRIG_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Draw Farm Boundary on Map</label>
                            <div className="map-container">
                                <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
                                    <GeomanControl onPolygonCreated={setDrawnPolygon} />
                                </MapContainer>
                            </div>
                            {drawnPolygon ? (
                                <div className="alert alert-success" style={{ marginTop: 8 }}>
                                    ✅ Boundary captured — {drawnPolygon.length} coordinate points
                                </div>
                            ) : (
                                <div className="alert alert-info" style={{ marginTop: 8 }}>
                                    ℹ️ Click the polygon icon (top-right of map) → click map points → click first point to close shape
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "Saving…" : "💾 Save Farm"}
                        </button>
                    </form>
                </div>
            )}

            {/* Farm List */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /><span>Loading farms…</span></div>
            ) : farms.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: "3rem", marginBottom: 12 }}>🌱</div>
                    <div className="card-title" style={{ justifyContent: "center" }}>No farms yet</div>
                    <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Create your first farm above to get started.</p>
                </div>
            ) : (
                <div className="grid-auto">
                    {farms.map((farm) => (
                        <div key={farm.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <div className="card-title">🌾 {farm.name}</div>
                                    <div className="card-subtitle">Created {new Date(farm.createdAt).toLocaleDateString()}</div>
                                </div>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteFarm(farm.id)}>🗑️</button>
                            </div>
                            <hr className="divider" />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.82rem" }}>
                                <div><span style={{ color: "var(--text-muted)" }}>Crop:</span> <strong>{farm.cropType}</strong></div>
                                <div><span style={{ color: "var(--text-muted)" }}>Soil:</span> <strong>{farm.soilType}</strong></div>
                                <div><span style={{ color: "var(--text-muted)" }}>Irrigation:</span> <strong>{farm.irrigationType}</strong></div>
                                <div><span style={{ color: "var(--text-muted)" }}>Boundary:</span> <strong>{farm.polygon?.length || 0} pts</strong></div>
                            </div>

                            {/* Map Preview */}
                            {farm.polygon && farm.polygon.length > 0 && (
                                <div className="map-container" style={{ height: 180, marginTop: 12 }}>
                                    <MapContainer
                                        center={farm.polygon[0]}
                                        zoom={13}
                                        style={{ height: "100%", width: "100%" }}
                                        zoomControl={false}
                                        dragging={false}
                                        scrollWheelZoom={false}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
                                        <Polygon positions={farm.polygon} pathOptions={{ color: "#16a34a", fillOpacity: 0.25, weight: 2 }}>
                                            <Tooltip permanent direction="center" className="farm-label">{farm.name}</Tooltip>
                                        </Polygon>
                                    </MapContainer>
                                </div>
                            )}

                            <button
                                className="btn btn-outline btn-sm"
                                style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                                onClick={() => setSelectedFarm(selectedFarm?.id === farm.id ? null : farm)}
                            >
                                {selectedFarm?.id === farm.id ? "▲ Close Zones" : "📍 Manage Zones"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Zone Management */}
            {selectedFarm && (
                <div className="card fade-in" style={{ marginTop: 24 }}>
                    <div className="card-title">📍 Manage Zones — {selectedFarm.name}</div>
                    <div className="card-subtitle">Draw zone boundaries within your farm (shown in green)</div>

                    <div className="form-group" style={{ maxWidth: 360 }}>
                        <label className="form-label">Zone Name</label>
                        <input
                            className="form-control"
                            placeholder="e.g. Zone A – Wheat Beds"
                            value={zoneForm.name}
                            onChange={(e) => setZoneForm({ name: e.target.value })}
                        />
                    </div>

                    <div className="map-container" style={{ marginBottom: 12 }}>
                        <MapContainer
                            center={selectedFarm.polygon?.[0] || center}
                            zoom={14}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                            <Polygon positions={selectedFarm.polygon} pathOptions={{ color: "#16a34a", fillOpacity: 0.12, weight: 2 }} />
                            <GeomanControl onPolygonCreated={setZonePolygon} />
                        </MapContainer>
                    </div>

                    {zonePolygon && (
                        <div className="alert alert-success" style={{ marginBottom: 12, fontSize: "0.82rem" }}>
                            ✅ Zone boundary captured — {zonePolygon.length} points
                        </div>
                    )}

                    <form onSubmit={saveZone}>
                        <button type="submit" className="btn btn-secondary">📌 Save Zone</button>
                    </form>
                </div>
            )}
        </div>
    );
}
