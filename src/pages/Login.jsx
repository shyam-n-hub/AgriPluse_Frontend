// Login Page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !password) return toast.warning("Please fill all fields");
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Welcome back! 🌿");
            navigate("/dashboard");
        } catch (err) {
            const msg =
                err.code === "auth/invalid-credential"
                    ? "Invalid email or password"
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
                    <p>Intelligent Virtual Agriculture Platform</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            className="form-control"
                            placeholder="farmer@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        id="login-btn"
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                    >
                        {loading ? "Signing in…" : "Sign In →"}
                    </button>
                </form>

                <div className="auth-divider">or</div>

                <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Don't have an account?{" "}
                    <Link to="/signup" style={{ color: "var(--primary-light)", fontWeight: 600 }}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
