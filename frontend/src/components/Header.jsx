import React from "react";

function Header({
    onToggleSidebar,
    sseConnected,
    user,
    onOpenAuth,
    onLogout,
    theme,
    toggleTheme,
    onOpenCreateTask
}) {
    return (
        <header className="app-topbar" role="banner">
            <div className="topbar-left">
                <button
                    type="button"
                    className="sidebar-hamburger-btn"
                    onClick={onToggleSidebar}
                    aria-label="Toggle navigation menu"
                >
                    ☰
                </button>
                <div className="topbar-brand-mobile">
                    <span className="brand-logo-small">🚀</span>
                    <span className="brand-title-small">AWDF TaskFlow</span>
                </div>
            </div>

            <div className="topbar-right">
                {/* Real-Time SSE Indicator */}
                <div
                    className={`sse-status-indicator ${sseConnected ? "connected" : "disconnected"}`}
                    title={sseConnected ? "Server-Sent Events: Real-time domain stream active" : "SSE connecting..."}
                >
                    <span className="pulse-dot"></span>
                    <span className="sse-text">{sseConnected ? "EDA Live Stream" : "Connecting..."}</span>
                </div>

                {/* Theme Toggle Button */}
                <button
                    type="button"
                    className="topbar-icon-button"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
                    aria-label="Toggle dark/light theme"
                >
                    {theme === "dark" ? "☀️" : "🌙"}
                </button>

                {/* Quick Add Button */}
                <button
                    type="button"
                    className="topbar-add-btn"
                    onClick={onOpenCreateTask}
                    title="Quickly create a new task"
                >
                    + Task
                </button>

                {/* User Profile / Auth Button */}
                {user ? (
                    <div className="user-top-pill" onClick={onLogout} title="Click to Sign Out">
                        <div className="user-avatar-tiny">
                            {(user.name || user.email || "S")[0].toUpperCase()}
                        </div>
                        <span className="user-name-truncated">{user.name || user.email}</span>
                        <span className="signout-hint">Logout</span>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="topbar-login-btn"
                        onClick={onOpenAuth}
                    >
                        Sign In
                    </button>
                )}
            </div>
        </header>
    );
}

export default React.memo(Header);
