import React, { useState, useEffect } from "react";
import { createBulkTasksAsync, getAuditLogs, getEdaMetrics } from "../api";

function EdaDashboard({ sseConnected, lastEvent, onBatchTriggered }) {
    const [isOpen, setIsOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchStatusMessage, setBatchStatusMessage] = useState("");
    const [activeTab, setActiveTab] = useState("events"); // 'events' | 'audit' | 'metrics'

    const fetchAudit = async () => {
        try {
            const data = await getAuditLogs();
            setAuditLogs(data || []);
        } catch (err) {
            console.error("Failed to load audit logs", err);
        }
    };

    const fetchMetrics = async () => {
        try {
            const data = await getEdaMetrics();
            setMetrics(data || null);
        } catch (err) {
            console.error("Failed to load metrics", err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAudit();
            fetchMetrics();
        }
    }, [isOpen, lastEvent]);

    const handleRunBatchAsync = async () => {
        try {
            setBatchLoading(true);
            setBatchStatusMessage("Submitting batch to asynchronous queue...");

            const sampleTasks = [
                {
                    title: `⚡ Async Batch Task A (${new Date().toLocaleTimeString()})`,
                    description: "Processed decoupled from HTTP response via background worker queue."
                },
                {
                    title: `⚡ Async Batch Task B (${new Date().toLocaleTimeString()})`,
                    description: "Demonstrating 202 Accepted status and event emission."
                },
                {
                    title: `⚡ Async Batch Task C (${new Date().toLocaleTimeString()})`,
                    description: "Demonstrating cache invalidation & audit trailing via EDA."
                }
            ];

            const response = await createBulkTasksAsync(sampleTasks);
            setBatchStatusMessage(
                `✅ Batch queued! Job ID: ${response.jobId} (Status: ${response.status}). Background worker is executing...`
            );

            if (onBatchTriggered) {
                onBatchTriggered(response);
            }
        } catch (err) {
            setBatchStatusMessage(`❌ Batch error: ${err.message}`);
        } finally {
            setBatchLoading(false);
            setTimeout(() => setBatchStatusMessage(""), 6000);
        }
    };

    return (
        <section className="card eda-card" aria-label="Event-Driven Architecture Controls">
            <div className="eda-header-row">
                <div className="eda-title-block">
                    <span className="eda-badge">EDA Active</span>
                    <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                        Asynchronous Processing & Event-Driven Engine
                    </h2>
                </div>

                <div className="eda-actions-row">
                    <span className={`eda-stream-indicator ${sseConnected ? "online" : "offline"}`}>
                        <span className="pulse-dot"></span>
                        {sseConnected ? "SSE Stream Connected" : "Connecting SSE..."}
                    </span>

                    <button
                        type="button"
                        className="eda-toggle-btn"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                    >
                        {isOpen ? "Hide Architecture Panel ▲" : "View Architecture Panel ▼"}
                    </button>
                </div>
            </div>

            {lastEvent && (
                <div className="eda-ticker" role="status">
                    <span className="ticker-label">⚡ Latest Real-Time Event:</span>
                    <span className="ticker-type">{lastEvent.type}</span>
                    <span className="ticker-time">
                        {new Date(lastEvent.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                    <span className="ticker-id">ID: {lastEvent.eventId || "local"}</span>
                </div>
            )}

            {batchStatusMessage && (
                <div className="eda-alert-box" role="status">
                    {batchStatusMessage}
                </div>
            )}

            {isOpen && (
                <div className="eda-expanded-panel">
                    <div className="eda-tabs">
                        <button
                            type="button"
                            className={`eda-tab ${activeTab === "events" ? "active" : ""}`}
                            onClick={() => setActiveTab("events")}
                        >
                            Queue Trigger
                        </button>
                        <button
                            type="button"
                            className={`eda-tab ${activeTab === "audit" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("audit");
                                fetchAudit();
                            }}
                        >
                            Async Audit Logs ({auditLogs.length})
                        </button>
                        <button
                            type="button"
                            className={`eda-tab ${activeTab === "metrics" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("metrics");
                                fetchMetrics();
                            }}
                        >
                            Event Bus Telemetry
                        </button>
                    </div>

                    {activeTab === "events" && (
                        <div className="eda-tab-content">
                            <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "#475569" }}>
                                Test decoupled processing: API responds immediately with <code>202 Accepted</code>,
                                while a background worker processes tasks sequentially and broadcasts completion via SSE.
                            </p>
                            <button
                                type="button"
                                className="eda-action-button"
                                onClick={handleRunBatchAsync}
                                disabled={batchLoading}
                            >
                                {batchLoading ? "Queueing Batch..." : "🚀 Trigger Async Batch Job (3 Tasks)"}
                            </button>
                        </div>
                    )}

                    {activeTab === "audit" && (
                        <div className="eda-tab-content">
                            <div className="eda-audit-table-wrapper">
                                <table className="eda-audit-table">
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Domain Action</th>
                                            <th>Entity ID</th>
                                            <th>Actor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>
                                                    No audit events captured yet. Create or mutate a task to see EDA records.
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.slice(0, 10).map((log) => (
                                                <tr key={log._id || log.eventId}>
                                                    <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                                    <td>
                                                        <span className="eda-event-tag">{log.action}</span>
                                                    </td>
                                                    <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
                                                        {String(log.entityId).substring(0, 12)}...
                                                    </td>
                                                    <td>{log.actor?.email || "guest"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "metrics" && metrics && (
                        <div className="eda-tab-content">
                            <div className="eda-metrics-grid">
                                <div className="eda-metric-card">
                                    <div className="eda-metric-val">
                                        {metrics.eventBusMetrics?.totalPublished || 0}
                                    </div>
                                    <div className="eda-metric-lbl">Total Events Emitted</div>
                                </div>
                                <div className="eda-metric-card">
                                    <div className="eda-metric-val">
                                        {metrics.eventBusMetrics?.totalDelivered || 0}
                                    </div>
                                    <div className="eda-metric-lbl">Total Consumer Deliveries</div>
                                </div>
                                <div className="eda-metric-card">
                                    <div className="eda-metric-val">{metrics.activeSseClients || 0}</div>
                                    <div className="eda-metric-lbl">Active SSE Stream Clients</div>
                                </div>
                                <div className="eda-metric-card">
                                    <div className="eda-metric-val" style={{ color: "#16a34a" }}>
                                        {metrics.eventBusMetrics?.failedDeliveries || 0}
                                    </div>
                                    <div className="eda-metric-lbl">Dead Letter Queue (DLQ)</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

export default React.memo(EdaDashboard);
