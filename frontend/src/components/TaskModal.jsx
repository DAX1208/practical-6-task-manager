import React, { useState, useEffect } from "react";
import { aiBreakdownTask, generateAiDescription } from "../api";

function TaskModal({ isOpen, onClose, onSave, taskToEdit = null, loading = false }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [status, setStatus] = useState("Pending");
    const [dueDate, setDueDate] = useState("");
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [descAiLoading, setDescAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);

    const handleGenerateDescription = async () => {
        if (!title.trim()) {
            setError("Please enter a task title first so the AI can generate a description.");
            return;
        }

        try {
            setDescAiLoading(true);
            setAiFeedback(null);
            const res = await generateAiDescription(title.trim());

            if (res.fallback || !res.description) {
                setAiFeedback(res.reason || "AI generation is currently unavailable. You can enter a description manually.");
            } else {
                setDescription(res.description);
                setAiFeedback("✨ AI description generated! Review and edit before saving.");
            }
        } catch (err) {
            setAiFeedback(err.message || "AI service is currently unavailable.");
        } finally {
            setDescAiLoading(false);
        }
    };
    const [error, setError] = useState("");

    useEffect(() => {
        if (taskToEdit) {
            setTitle(taskToEdit.title || "");
            setDescription(taskToEdit.description || "");
            setPriority(taskToEdit.priority || "Medium");
            setStatus(taskToEdit.status || (taskToEdit.completed ? "Completed" : "Pending"));
            setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 10) : "");
            setSubtasks(taskToEdit.subtasks || []);
        } else {
            setTitle("");
            setDescription("");
            setPriority("Medium");
            setStatus("Pending");
            setDueDate("");
            setSubtasks([]);
        }
        setError("");
    }, [taskToEdit, isOpen]);

    if (!isOpen) return null;

    const handleAiBreakdown = async () => {
        if (!title.trim()) {
            setError("Please enter a task title first so the AI can break it down.");
            return;
        }

        try {
            setAiLoading(true);
            setError("");
            const res = await aiBreakdownTask({
                title: title.trim(),
                description: description.trim(),
                priority
            });

            if (res && Array.isArray(res.subtasks)) {
                setSubtasks((prev) => [...prev, ...res.subtasks]);
            }
        } catch (err) {
            setError(err.message || "Failed to generate AI breakdown");
        } finally {
            setAiLoading(false);
        }
    };

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        setSubtasks((prev) => [...prev, { title: newSubtaskTitle.trim(), completed: false }]);
        setNewSubtaskTitle("");
    };

    const handleToggleSubtask = (index) => {
        setSubtasks((prev) =>
            prev.map((sub, i) => (i === index ? { ...sub, completed: !sub.completed } : sub))
        );
    };

    const handleRemoveSubtask = (index) => {
        setSubtasks((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Task title is required");
            return;
        }

        if (!description.trim()) {
            setError("Task description is required");
            return;
        }

        const payload = {
            title: title.trim(),
            description: description.trim(),
            priority,
            status,
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            subtasks
        };

        try {
            await onSave(payload, taskToEdit ? taskToEdit._id : null);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save task");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
            <div className="modal-card task-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 id="task-modal-title" className="modal-title">
                            {taskToEdit ? "Edit Task" : "Create New Task"}
                        </h2>
                        <p className="modal-subtitle">
                            {taskToEdit ? "Update your task details and checklist" : "Add an academic assignment or project task"}
                        </p>
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

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="modal-task-title">Task Title *</label>
                        <input
                            id="modal-task-title"
                            type="text"
                            placeholder="e.g. Complete AWDF Docker Deployment"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading || aiLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <div className="ai-desc-header">
                            <label htmlFor="modal-task-desc">Description *</label>
                            <button
                                type="button"
                                className="ai-generate-btn"
                                onClick={handleGenerateDescription}
                                disabled={loading || aiLoading || descAiLoading || !title.trim()}
                                title="Generate an AI-powered description from the title"
                                aria-label="Generate task description using AI"
                            >
                                {descAiLoading ? "✨ Generating..." : "✨ Generate Description"}
                            </button>
                        </div>
                        <p className="ai-disclaimer">
                            <em>AI-generated suggestions may be inaccurate. Review and edit before saving.</em>
                        </p>
                        {aiFeedback && (
                            <div className="ai-feedback-banner info" role="status">
                                ℹ️ {aiFeedback}
                            </div>
                        )}
                        <textarea
                            id="modal-task-desc"
                            placeholder="Provide details, assignment rubric, or notes..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={loading || aiLoading}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="form-row-three">
                        <div className="form-group">
                            <label htmlFor="modal-task-priority">Priority</label>
                            <select
                                id="modal-task-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                disabled={loading || aiLoading}
                            >
                                <option value="Low">🟢 Low</option>
                                <option value="Medium">🟠 Medium</option>
                                <option value="High">🔴 High</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="modal-task-status">Status</label>
                            <select
                                id="modal-task-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={loading || aiLoading}
                            >
                                <option value="Pending">⏳ Pending</option>
                                <option value="In Progress">⚡ In Progress</option>
                                <option value="Completed">✅ Completed</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="modal-task-due">Due Date</label>
                            <input
                                id="modal-task-due"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                disabled={loading || aiLoading}
                            />
                        </div>
                    </div>

                    {/* Subtasks / AI Breakdown Section */}
                    <div className="subtasks-section">
                        <div className="subtasks-header">
                            <label className="subtasks-label">Actionable Steps / Checklist ({subtasks.length})</label>
                            <button
                                type="button"
                                className="ai-breakdown-btn"
                                onClick={handleAiBreakdown}
                                disabled={aiLoading || !title.trim()}
                                title="Use AI / Heuristic Assistant to generate breakdown"
                            >
                                {aiLoading ? "✨ Generating..." : "✨ AI Breakdown"}
                            </button>
                        </div>

                        {subtasks.length > 0 && (
                            <ul className="subtasks-list">
                                {subtasks.map((sub, index) => (
                                    <li key={index} className={`subtask-item ${sub.completed ? "completed" : ""}`}>
                                        <label className="subtask-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(sub.completed)}
                                                onChange={() => handleToggleSubtask(index)}
                                            />
                                            <span>{sub.title}</span>
                                        </label>
                                        <button
                                            type="button"
                                            className="subtask-remove-btn"
                                            onClick={() => handleRemoveSubtask(index)}
                                            aria-label="Remove subtask"
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="add-subtask-row">
                            <input
                                type="text"
                                placeholder="Add an actionable sub-step..."
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddSubtask();
                                    }
                                }}
                            />
                            <button type="button" className="secondary-button add-sub-btn" onClick={handleAddSubtask}>
                                + Add
                            </button>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="secondary-button" onClick={onClose} disabled={loading || aiLoading}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-button" disabled={loading || aiLoading}>
                            {loading ? "Saving..." : taskToEdit ? "Update Task" : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default React.memo(TaskModal);
