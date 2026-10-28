import React, { useState } from "react";

function TaskItem({ task, onUpdate, onEdit, onDelete, onSubtaskToggle, loading }) {
    const [subtasksOpen, setSubtasksOpen] = useState(false);

    const isCompleted = task.status === "Completed" || task.completed;
    const priority = task.priority || "Medium";
    const status = task.status || (isCompleted ? "Completed" : "Pending");

    // Format and calculate relative due date status
    const formatDueInfo = (dueVal) => {
        if (!dueVal) return null;
        const due = new Date(dueVal);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDay = new Date(due);
        dueDay.setHours(0, 0, 0, 0);

        const diffTime = dueDay.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                text: `⚠️ Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`,
                isOverdue: true,
                class: "overdue"
            };
        } else if (diffDays === 0) {
            return { text: "📅 Due Today", isOverdue: false, class: "due-today" };
        } else if (diffDays === 1) {
            return { text: "📅 Due Tomorrow", isOverdue: false, class: "due-soon" };
        } else {
            return { text: `📅 Due in ${diffDays} days`, isOverdue: false, class: "due-normal" };
        }
    };

    const dueInfo = formatDueInfo(task.dueDate);

    // Subtasks summary
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const completedSubtasks = subtasks.filter((s) => s.completed).length;
    const subtaskPct = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

    const handleCycleStatus = () => {
        let nextStatus;
        if (status === "Pending") nextStatus = "In Progress";
        else if (status === "In Progress") nextStatus = "Completed";
        else nextStatus = "Pending";

        onUpdate({
            ...task,
            status: nextStatus,
            completed: nextStatus === "Completed"
        });
    };

    return (
        <article className={`task-card ${isCompleted ? "task-completed" : ""} priority-${priority.toLowerCase()}`}>
            <div className="task-top-meta">
                <div className="meta-badges">
                    <span className={`badge priority-badge priority-${priority.toLowerCase()}`}>
                        {priority === "High" ? "🔴 High" : priority === "Medium" ? "🟠 Medium" : "🟢 Low"}
                    </span>
                    <button
                        type="button"
                        className={`badge status-badge status-${status.toLowerCase().replace(" ", "-")}`}
                        onClick={handleCycleStatus}
                        title="Click to cycle status: Pending ➔ In Progress ➔ Completed"
                    >
                        {status === "Completed" ? "✅ Completed" : status === "In Progress" ? "⚡ In Progress" : "⏳ Pending"}
                    </button>
                    {dueInfo && (
                        <span className={`badge due-badge ${dueInfo.class}`}>
                            {dueInfo.text}
                        </span>
                    )}
                </div>

                <div className="task-quick-actions">
                    <button
                        type="button"
                        className="icon-action-btn edit"
                        onClick={() => onEdit(task)}
                        disabled={loading}
                        title="Edit task"
                        aria-label={`Edit ${task.title}`}
                    >
                        ✏️
                    </button>
                    <button
                        type="button"
                        className="icon-action-btn delete"
                        onClick={() => onDelete(task)}
                        disabled={loading}
                        title="Delete task"
                        aria-label={`Delete ${task.title}`}
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="task-body">
                <h3 className="task-title" title={task.title}>
                    {task.title}
                </h3>
                <p className="task-description">{task.description}</p>
            </div>

            {/* Subtasks Progress & List */}
            {subtasks.length > 0 && (
                <div className="task-subtasks-container">
                    <button
                        type="button"
                        className="subtask-toggle-btn"
                        onClick={() => setSubtasksOpen(!subtasksOpen)}
                    >
                        <span>
                            Checklist ({completedSubtasks}/{subtasks.length})
                        </span>
                        <div className="subtask-mini-progress">
                            <div className="mini-progress-fill" style={{ width: `${subtaskPct}%` }}></div>
                        </div>
                        <span className="expand-arrow">{subtasksOpen ? "▲" : "▼"}</span>
                    </button>

                    {subtasksOpen && (
                        <ul className="subtasks-item-list">
                            {subtasks.map((sub, idx) => (
                                <li key={idx} className={`subtask-row ${sub.completed ? "sub-done" : ""}`}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(sub.completed)}
                                            onChange={() => onSubtaskToggle(task, idx)}
                                            disabled={loading}
                                        />
                                        <span>{sub.title}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className="task-footer">
                <button
                    type="button"
                    className={`status-toggle-action-btn ${isCompleted ? "reopen" : "complete"}`}
                    onClick={() => {
                        onUpdate({
                            ...task,
                            status: isCompleted ? "Pending" : "Completed",
                            completed: !isCompleted
                        });
                    }}
                    disabled={loading}
                >
                    {isCompleted ? "↺ Reopen Task" : "✓ Mark Completed"}
                </button>
            </div>
        </article>
    );
}

export default React.memo(TaskItem);
