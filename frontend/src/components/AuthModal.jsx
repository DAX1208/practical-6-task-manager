import React, { useState } from "react";
import { loginUser, registerUser } from "../api";

function AuthModal({ isOpen, onClose, onAuthSuccess }) {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Email and password are required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            let response;
            if (isRegister) {
                response = await registerUser(name, email, password);
            } else {
                response = await loginUser(email, password);
            }

            onAuthSuccess(response.user, response.token);
            onClose();
        } catch (err) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    // Quick demo student login for quick evaluation/viva presentation
    const handleDemoLogin = async () => {
        setError("");
        setLoading(true);
        const demoEmail = "student@college.edu";
        const demoPassword = "Password123!";

        try {
            // Attempt login first
            try {
                const response = await loginUser(demoEmail, demoPassword);
                onAuthSuccess(response.user, response.token);
                onClose();
                return;
            } catch (loginErr) {
                // If account doesn't exist yet, auto-register demo user
                const regRes = await registerUser("Alex Student", demoEmail, demoPassword);
                onAuthSuccess(regRes.user, regRes.token);
                onClose();
            }
        } catch (err) {
            setError(err.message || "Failed to log in as demo student");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 id="auth-modal-title" className="modal-title">
                            {isRegister ? "Create Student Account" : "Welcome Back"}
                        </h2>
                        <p className="modal-subtitle">
                            {isRegister
                                ? "Register to manage and protect your personal tasks"
                                : "Sign in to access your student productivity dashboard"}
                        </p>
                    </div>
                    <button type="button" className="close-button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="auth-tab-group">
                    <button
                        type="button"
                        className={`auth-tab ${!isRegister ? "active" : ""}`}
                        onClick={() => { setIsRegister(false); setError(""); }}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className={`auth-tab ${isRegister ? "active" : ""}`}
                        onClick={() => { setIsRegister(true); setError(""); }}
                    >
                        Register
                    </button>
                </div>

                {error && (
                    <div className="form-error-alert" role="alert">
                        ⚠️ {error}
                    </div>
                )}

                {/* Instant 1-Click Demo Button */}
                <button
                    type="button"
                    className="demo-student-button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                >
                    🚀 One-Click Demo Student Sign In
                </button>

                <div className="divider-text">
                    <span>or continue with email</span>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {isRegister && (
                        <div className="form-group">
                            <label htmlFor="auth-name-input">Student Name</label>
                            <input
                                id="auth-name-input"
                                type="text"
                                placeholder="e.g. Alex Student"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="auth-email-input">College / Personal Email</label>
                        <input
                            id="auth-email-input"
                            type="email"
                            placeholder="student@college.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="auth-password-input">Password (min 6 characters)</label>
                        <input
                            id="auth-password-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-button" disabled={loading}>
                            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default React.memo(AuthModal);
