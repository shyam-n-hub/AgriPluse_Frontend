// Signup Page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Signup() {
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    function handleChange(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) return toast.warning("Please fill all fields");
        if (form.password !== form.confirm) return toast.error("Passwords do not match");
        if (form.password.length < 6) return toast.error("Password must be at least 6 characters");

        setLoading(true);
        try {
            await signup(form.email, form.password, form.name);
            toast.success("Account created! Welcome to Plantiq 🌱");
            navigate("/dashboard");
        } catch (err) {
            const msg =
                err.code === "auth/email-already-in-use"
                    ? "Email already in use. Try logging in."
                    : err.message;
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <h1>🌿 Agri Pulse</h1>
                    <p>Create your farming intelligence account</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            id="signup-name"
                            name="name"
                            type="text"
                            className="form-control"
                            placeholder="Your full name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            id="signup-email"
                            name="email"
                            type="email"
                            className="form-control"
                            placeholder="farmer@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                id="signup-password"
                                name="password"
                                type="password"
                                className="form-control"
                                placeholder="Min 6 characters"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input
                                id="signup-confirm"
                                name="confirm"
                                type="password"
                                className="form-control"
                                placeholder="Repeat password"
                                value={form.confirm}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button
                        id="signup-btn"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                    >
                        {loading ? "Creating Account…" : "🌱 Create Account"}
                    </button>
                </form>

                <div className="auth-divider">or</div>

                <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "var(--primary-light)", fontWeight: 600 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
