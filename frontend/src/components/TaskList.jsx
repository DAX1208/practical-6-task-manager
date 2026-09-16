import React, { useState, useMemo } from "react";
import TaskItem from "./TaskItem";

function TaskList({ tasks, onUpdate, onDelete, onRefresh, loading }) {
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesFilter =
                filter === "all" ||
                (filter === "completed" && task.completed) ||
                (filter === "pending" && !task.completed);

            const matchesSearch =
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesFilter && matchesSearch;
        });
    }, [tasks, filter, searchQuery]);

    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        const pending = total - completed;
        return { total, completed, pending };
    }, [tasks]);

    return (
        <section className="card" aria-labelledby="tasks-heading">
            <div className="task-header">
                <div className="task-header-title">
                    <h2 id="tasks-heading">Tasks</h2>
                    <span className="task-badge" aria-label={`${stats.total} total tasks`}>
                        {stats.total} total
                    </span>
                </div>
                <button
                    className="refresh-button"
                    onClick={onRefresh}
                    disabled={loading}
                    type="button"
                    aria-label="Refresh task list"
                >
                    {loading ? "Refreshing..." : "↻ Refresh"}
                </button>
            </div>

            {/* Quick stats pills */}
            <div className="stats-container" role="region" aria-label="Task statistics">
                <button
                    type="button"
                    className={`filter-chip ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                    aria-pressed={filter === "all"}
                >
                    All ({stats.total})
                </button>
                <button
                    type="button"
                    className={`filter-chip ${filter === "pending" ? "active" : ""}`}
                    onClick={() => setFilter("pending")}
                    aria-pressed={filter === "pending"}
                >
                    Pending ({stats.pending})
                </button>
                <button
                    type="button"
                    className={`filter-chip ${filter === "completed" ? "active" : ""}`}
                    onClick={() => setFilter("completed")}
                    aria-pressed={filter === "completed"}
                >
                    Completed ({stats.completed})
                </button>
            </div>

            {/* Search filter input */}
            {tasks.length > 0 && (
                <div className="search-group">
                    <label htmlFor="task-search-input" className="sr-only">
                        Search Tasks
                    </label>
                    <input
                        id="task-search-input"
                        type="search"
                        className="search-input"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search tasks by title or description"
                    />
                </div>
            )}

            {/* Loading state */}
            {loading && tasks.length === 0 && (
                <p className="loading" role="status">
                    Loading tasks...
                </p>
            )}

            {/* Empty state */}
            {!loading && tasks.length === 0 && (
                <div className="empty" role="status">
                    <h3>No tasks found</h3>
                    <p>Create your first task above to get started.</p>
                </div>
            )}

            {/* Filtered empty state */}
            {!loading && tasks.length > 0 && filteredTasks.length === 0 && (
                <div className="empty" role="status">
                    <p>No tasks match your current filter or search.</p>
                </div>
            )}

            {/* Task Items */}
            <div className="task-list" role="feed" aria-label="List of tasks">
                {filteredTasks.map((task) => (
                    <TaskItem
                        key={task._id}
                        task={task}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        loading={loading}
                    />
                ))}
            </div>
        </section>
    );
}

export default React.memo(TaskList);
