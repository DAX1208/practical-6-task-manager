import React from "react";

function DashboardStats({ stats, loading, onNewTask, onOpenAi, onRefresh }) {
    const total = stats?.total || 0;
    const completed = stats?.completed || 0;
    const inProgress = stats?.inProgress || 0;
    const pending = stats?.pending || 0;
    const highPriority = stats?.highPriority || 0;
    const overdue = stats?.overdue || 0;
    const productivityScore = stats?.productivityScore || 100;
    const completionRate = stats?.completionRate || (total > 0 ? Math.round((completed / total) * 100) : 0);
    const isCached = Boolean(stats?.cached);

    return (
        <section className="dashboard-stats-section" aria-label="Productivity Overview">
            <div className="section-header-row">
                <div>
                    <h2 className="section-title">Academic Productivity Dashboard</h2>
                    <p className="section-subtitle">Real-time task analytics, priority tracking & study metrics</p>
                </div>
                <div className="header-actions-group">
                    <span className={`cache-indicator-pill ${isCached ? "cached" : "fresh"}`}>
                        {isCached ? "⚡ Memory Cache (HIT)" : "🔄 Fresh DB Data"}
                    </span>
                    <button
                        type="button"
                        className="refresh-icon-btn"
                        onClick={onRefresh}
                        disabled={loading}
                        title="Refresh statistics"
                        aria-label="Refresh statistics"
                    >
                        {loading ? "..." : "↻"}
                    </button>
                    <button
                        type="button"
                        className="secondary-button ai-trigger-btn"
                        onClick={onOpenAi}
                    >
                        ✨ AI Assistant
                    </button>
                    <button
                        type="button"
                        className="primary-button add-task-top-btn"
                        onClick={onNewTask}
                    >
                        + Create Task
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-cards-grid">
                {/* Total Tasks Card */}
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Tasks</span>
                        <span className="stat-card-icon icon-total">📋</span>
                    </div>
                    <div className="stat-card-value">{total}</div>
                    <div className="stat-progress-bar-bg">
                        <div
                            className="stat-progress-bar-fill"
                            style={{ width: `${completionRate}%` }}
                        ></div>
                    </div>
                    <span className="stat-card-meta">{completionRate}% Completed</span>
                </div>

                {/* In Progress Card */}
                <div className="stat-card in-progress">
                    <div className="stat-card-header">
                        <span className="stat-card-label">In Progress</span>
                        <span className="stat-card-icon icon-progress">⚡</span>
                    </div>
                    <div className="stat-card-value">{inProgress}</div>
                    <span className="stat-card-meta">Active assignments</span>
                </div>

                {/* Pending Card */}
                <div className="stat-card pending">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Pending</span>
                        <span className="stat-card-icon icon-pending">⏳</span>
                    </div>
                    <div className="stat-card-value">{pending}</div>
                    <span className="stat-card-meta">Awaiting start</span>
                </div>

                {/* Completed Card */}
                <div className="stat-card completed">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Completed</span>
                        <span className="stat-card-icon icon-completed">✅</span>
                    </div>
                    <div className="stat-card-value">{completed}</div>
                    <span className="stat-card-meta">Tasks finished</span>
                </div>

                {/* High Priority Card */}
                <div className="stat-card high-priority">
                    <div className="stat-card-header">
                        <span className="stat-card-label">High Priority</span>
                        <span className="stat-card-icon icon-high">🔥</span>
                    </div>
                    <div className="stat-card-value">{highPriority}</div>
                    <span className="stat-card-meta">Urgent attention</span>
                </div>

                {/* Overdue Card */}
                <div className={`stat-card overdue ${overdue > 0 ? "has-overdue" : ""}`}>
                    <div className="stat-card-header">
                        <span className="stat-card-label">Overdue</span>
                        <span className="stat-card-icon icon-overdue">⚠️</span>
                    </div>
                    <div className="stat-card-value">{overdue}</div>
                    <span className="stat-card-meta">
                        {overdue > 0 ? "Past due date!" : "All on schedule"}
                    </span>
                </div>
            </div>

            {/* Productivity & Motivation Banner */}
            <div className="productivity-banner">
                <div className="productivity-info">
                    <div className="score-badge">
                        <span className="score-number">{productivityScore}</span>
                        <span className="score-label">PTS</span>
                    </div>
                    <div>
                        <h4 className="productivity-title">Student Productivity Score</h4>
                        <p className="productivity-desc">
                            Earn 10 points for every completed task! Keep up your study streak.
                        </p>
                    </div>
                </div>
                <div className="productivity-actions">
                    <span className="eda-badge-pill">
                        ⚡ Event-Driven Asynchronous Updates
                    </span>
                </div>
            </div>
        </section>
    );
}

export default React.memo(DashboardStats);
