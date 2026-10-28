import React from "react";

function Sidebar({
    activeTab,
    setActiveTab,
    user,
    onOpenAuth,
    onLogout,
    theme,
    toggleTheme,
    stats,
    isOpen,
    onClose
}) {
    const total = stats?.total || 0;
    const pending = stats?.pending || 0;
    const completed = stats?.completed || 0;

    return (
        <aside className={`app-sidebar ${isOpen ? "open" : ""}`} aria-label="Sidebar Navigation">
            {/* Sidebar Brand Header */}
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <div className="brand-logo-icon">🚀</div>
                    <div className="brand-text">
                        <span className="brand-title">AWDF TaskFlow</span>
                        <span className="brand-subtitle">Student Productivity</span>
                    </div>
                </div>
                <button
                    type="button"
                    className="sidebar-close-mobile-btn"
                    onClick={onClose}
                    aria-label="Close sidebar"
                >
                    ✕
                </button>
            </div>

            {/* User Profile Card */}
            <div className="sidebar-user-card">
                {user ? (
                    <div className="user-profile-info">
                        <div className="user-avatar-circle">
                            {(user.name || user.email || "S")[0].toUpperCase()}
                        </div>
                        <div className="user-text-details">
                            <span className="user-name">{user.name || "Student User"}</span>
                            <span className="user-email" title={user.email}>{user.email}</span>
                            <span className="user-badge">Authenticated</span>
                        </div>
                    </div>
                ) : (
                    <div className="guest-login-prompt">
                        <div className="guest-text">
                            <span className="user-name">Guest Mode</span>
                            <span className="user-email">Login to sync personal tasks</span>
                        </div>
                        <button
                            type="button"
                            className="sidebar-signin-btn"
                            onClick={onOpenAuth}
                        >
                            Sign In / Register
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="sidebar-nav">
                <div className="nav-section-title">MAIN NAVIGATION</div>

                <button
                    type="button"
                    className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => { setActiveTab("dashboard"); onClose(); }}
                >
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">Dashboard</span>
                </button>

                <button
                    type="button"
                    className={`nav-item ${activeTab === "tasks" ? "active" : ""}`}
                    onClick={() => { setActiveTab("tasks"); onClose(); }}
                >
                    <span className="nav-icon">📋</span>
                    <span className="nav-label">Task Management</span>
                    {total > 0 && <span className="nav-counter">{total}</span>}
                </button>

                <button
                    type="button"
                    className={`nav-item ${activeTab === "ai" ? "active" : ""}`}
                    onClick={() => { setActiveTab("ai"); onClose(); }}
                >
                    <span className="nav-icon">✨</span>
                    <span className="nav-label">AI Study Assistant</span>
                    <span className="nav-pill new">Smart</span>
                </button>

                <button
                    type="button"
                    className={`nav-item ${activeTab === "eda" ? "active" : ""}`}
                    onClick={() => { setActiveTab("eda"); onClose(); }}
                >
                    <span className="nav-icon">📡</span>
                    <span className="nav-label">EDA & Telemetry</span>
                    <span className="nav-pill live">SSE</span>
                </button>
            </nav>

            {/* Sidebar Footer Controls */}
            <div className="sidebar-footer">
                <div className="footer-controls-row">
                    <button
                        type="button"
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
                    >
                        <span>{theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}</span>
                    </button>

                    {user && (
                        <button
                            type="button"
                            className="logout-btn"
                            onClick={onLogout}
                            title="Sign out of account"
                        >
                            🚪 Sign Out
                        </button>
                    )}
                </div>

                <div className="sidebar-course-tag">
                    <span>AWDF Term Work — Practical 6</span>
                </div>
            </div>
        </aside>
    );
}

export default React.memo(Sidebar);
