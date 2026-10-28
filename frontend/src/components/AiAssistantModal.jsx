import React, { useState } from "react";
import { aiBreakdownTask } from "../api";

function AiAssistantModal({ isOpen, onClose, onTaskCreated }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("High");
    const [loading, setLoading] = useState(false);
    const [subtasks, setSubtasks] = useState([]);
    const [source, setSource] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Please enter a task or assignment title");
            return;
        }

        try {
            setLoading(true);
            setError("");
            const res = await aiBreakdownTask({
                title: title.trim(),
                description: description.trim(),
                priority
            });

            if (res && Array.isArray(res.subtasks)) {
                setSubtasks(res.subtasks);
                setSource(res.source || "smart-engine");
            }
        } catch (err) {
            setError(err.message || "Failed to generate breakdown");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!title.trim()) return;

        try {
            await onTaskCreated({
                title: title.trim(),
                description: description.trim() || `Breakdown generated via ${source}`,
                priority,
                status: "Pending",
                subtasks
            });
            onClose();
        } catch (err) {
            setError(err.message || "Failed to create task");
        }
    };

    const handleToggleSubtask = (index) => {
        setSubtasks((prev) =>
            prev.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s))
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
            <div className="modal-card ai-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="ai-modal-title-group">
                        <span className="ai-icon-large">✨</span>
                        <div>
                            <h2 id="ai-modal-title" className="modal-title">AI Task-Breakdown Assistant</h2>
                            <p className="modal-subtitle">
                                Transform complex student assignments and projects into clear, bite-sized steps
                            </p>
                        </div>
                    </div>
                    <button type="button" className="close-button" onClick={onClose} aria-label="Close modal">
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="form-error-alert" role="alert">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleGenerate} noValidate>
                    <div className="form-group">
                        <label htmlFor="ai-task-title">What assignment or topic do you need to break down?</label>
                        <input
                            id="ai-task-title"
                            type="text"
                            placeholder="e.g. Implement Docker & CI/CD pipeline for AWDF Practical 6"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-row-two">
                        <div className="form-group">
                            <label htmlFor="ai-task-priority">Target Priority</label>
                            <select
                                id="ai-task-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                disabled={loading}
                            >
                                <option value="Low">🟢 Low Priority</option>
                                <option value="Medium">🟠 Medium Priority</option>
                                <option value="High">🔴 High Priority</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="ai-task-notes">Extra Context (Optional)</label>
                            <input
                                id="ai-task-notes"
                                type="text"
                                placeholder="e.g. Due next Monday, requires viva explanation"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="primary-button ai-generate-btn"
                        disabled={loading || !title.trim()}
                    >
                        {loading ? "⚡ Generating Breakdown..." : "✨ Generate Actionable Subtasks"}
                    </button>
                </form>

                {/* Breakdown Results */}
                {subtasks.length > 0 && (
                    <div className="ai-results-section">
                        <div className="ai-results-header">
                            <span className="results-label">
                                Suggested Steps ({subtasks.length})
                            </span>
                            <span className="results-engine-tag">
                                Engine: {source === "gemini-ai" ? "🤖 Google Gemini" : "🧠 Heuristic Engine"}
                            </span>
                        </div>

                        <ul className="ai-subtasks-preview">
                            {subtasks.map((step, idx) => (
                                <li key={idx} className="ai-subtask-row">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(step.completed)}
                                        onChange={() => handleToggleSubtask(idx)}
                                        id={`step-${idx}`}
                                    />
                                    <label htmlFor={`step-${idx}`}>{step.title}</label>
                                </li>
                            ))}
                        </ul>

                        <div className="modal-actions">
                            <button type="button" className="secondary-button" onClick={onClose}>
                                Close
                            </button>
                            <button
                                type="button"
                                className="primary-button"
                                onClick={handleCreateTask}
                            >
                                🚀 Create Task with these Subtasks
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(AiAssistantModal);
