import React from "react";

function TaskItem({ task, onUpdate, onDelete, loading }) {
    return (
        <article className={`task ${task.completed ? "task-completed" : ""}`}>
            <div className="task-content">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <span
                    className={
                        task.completed
                            ? "status completed"
                            : "status pending"
                    }
                    role="status"
                    aria-label={`Task status: ${task.completed ? "Completed" : "Pending"}`}
                >
                    {task.completed ? "Completed" : "Pending"}
                </span>
            </div>

            <div className="task-actions">
                <button
                    className={`update-button ${task.completed ? "btn-pending" : "btn-complete"}`}
                    onClick={() => onUpdate(task)}
                    disabled={loading}
                    type="button"
                    aria-label={`Mark task ${task.title} as ${task.completed ? "pending" : "completed"}`}
                >
                    {task.completed ? "Mark Pending" : "Complete"}
                </button>

                <button
                    className="delete-button"
                    onClick={() => onDelete(task._id)}
                    disabled={loading}
                    type="button"
                    aria-label={`Delete task ${task.title}`}
                >
                    Delete
                </button>
            </div>
        </article>
    );
}

export default React.memo(TaskItem);
