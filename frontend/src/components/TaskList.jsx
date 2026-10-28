import React, { useState, useMemo } from "react";
import TaskItem from "./TaskItem";
import LoadingSkeleton from "./LoadingSkeleton";

function TaskList({
    tasks,
    onUpdate,
    onEdit,
    onDelete,
    onSubtaskToggle,
    onRefresh,
    onOpenCreateModal,
    loading
}) {
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");

    // Client-side filtering & sorting for instant responsiveness
    const filteredTasks = useMemo(() => {
        return tasks
            .filter((task) => {
                // Status matching
                const isCompleted = task.status === "Completed" || task.completed;
                const matchesStatus =
                    statusFilter === "all" ||
                    (statusFilter === "completed" && isCompleted) ||
                    (statusFilter === "pending" && (task.status === "Pending" || (!task.status && !isCompleted))) ||
                    (statusFilter === "in-progress" && task.status === "In Progress");

                // Priority matching
                const matchesPriority =
                    priorityFilter === "all" ||
                    (task.priority || "Medium").toLowerCase() === priorityFilter.toLowerCase();

                // Search matching
                const query = searchQuery.toLowerCase().trim();
                const matchesSearch =
                    !query ||
                    task.title.toLowerCase().includes(query) ||
                    (task.description && task.description.toLowerCase().includes(query));

                return matchesStatus && matchesPriority && matchesSearch;
            })
            .sort((a, b) => {
                if (sortBy === "dueDate") {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
                if (sortBy === "priority") {
                    const weight = { High: 3, Medium: 2, Low: 1 };
                    return (weight[b.priority] || 2) - (weight[a.priority] || 2);
                }
                // default: createdAt descending
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
    }, [tasks, statusFilter, priorityFilter, searchQuery, sortBy]);

    const countAll = tasks.length;
    const countPending = tasks.filter((t) => t.status === "Pending" || (!t.status && !t.completed)).length;
    const countInProgress = tasks.filter((t) => t.status === "In Progress").length;
    const countCompleted = tasks.filter((t) => t.status === "Completed" || t.completed).length;

    return (
        <section className="tasks-board-section" aria-labelledby="tasks-board-heading">
            {/* Header with Title and Create Button */}
            <div className="tasks-board-header">
                <div>
                    <h2 id="tasks-board-heading" className="section-title">
                        Task Management
                    </h2>
                    <p className="section-subtitle">
                        Organize, filter, and track assignments across priorities and deadlines
                    </p>
                </div>
                <div className="board-top-actions">
                    <button
                        type="button"
                        className="refresh-btn"
                        onClick={onRefresh}
                        disabled={loading}
                        aria-label="Refresh tasks"
                    >
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>
                    <button
                        type="button"
                        className="primary-button"
                        onClick={onOpenCreateModal}
                    >
                        + Create Task
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar Controls */}
            <div className="filter-controls-card">
                {/* Search Bar */}
                <div className="search-bar-row">
                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="search"
                            className="search-input-styled"
                            placeholder="Search tasks by title, description, or keyword..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search tasks"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="clear-search-btn"
                                onClick={() => setSearchQuery("")}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="sort-select-wrapper">
                        <label htmlFor="tasks-sort-select">Sort by:</label>
                        <select
                            id="tasks-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="createdAt">Date Created (Newest)</option>
                            <option value="dueDate">Due Date (Soonest)</option>
                            <option value="priority">Priority (High to Low)</option>
                        </select>
                    </div>
                </div>

                {/* Filter Chips & Priority Selector */}
                <div className="filters-row">
                    <div className="status-chips-group" role="tablist" aria-label="Filter tasks by status">
                        <button
                            type="button"
                            className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
                            onClick={() => setStatusFilter("all")}
                        >
                            All ({countAll})
                        </button>
                        <button
                            type="button"
                            className={`filter-chip pending ${statusFilter === "pending" ? "active" : ""}`}
                            onClick={() => setStatusFilter("pending")}
                        >
                            ⏳ Pending ({countPending})
                        </button>
                        <button
                            type="button"
                            className={`filter-chip in-progress ${statusFilter === "in-progress" ? "active" : ""}`}
                            onClick={() => setStatusFilter("in-progress")}
                        >
                            ⚡ In Progress ({countInProgress})
                        </button>
                        <button
                            type="button"
                            className={`filter-chip completed ${statusFilter === "completed" ? "active" : ""}`}
                            onClick={() => setStatusFilter("completed")}
                        >
                            ✅ Completed ({countCompleted})
                        </button>
                    </div>

                    <div className="priority-filter-group">
                        <label htmlFor="tasks-priority-filter">Priority:</label>
                        <select
                            id="tasks-priority-filter"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">🔴 High Priority</option>
                            <option value="medium">🟠 Medium Priority</option>
                            <option value="low">🟢 Low Priority</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && tasks.length === 0 && (
                <LoadingSkeleton count={3} label="Loading your tasks..." />
            )}

            {/* Empty State: Zero total tasks */}
            {!loading && tasks.length === 0 && (
                <div className="empty-state-card" role="status">
                    <div className="empty-state-icon">📝</div>
                    <h3>No tasks found yet</h3>
                    <p>Start organizing your term work by creating your first task or using the AI assistant.</p>
                    <button
                        type="button"
                        className="primary-button"
                        onClick={onOpenCreateModal}
                    >
                        + Create First Task
                    </button>
                </div>
            )}

            {/* Empty State: No match after filtering */}
            {!loading && tasks.length > 0 && filteredTasks.length === 0 && (
                <div className="empty-state-card" role="status">
                    <div className="empty-state-icon">🔎</div>
                    <h3>No matching tasks found</h3>
                    <p>No tasks match the active filters: status "{statusFilter}", priority "{priorityFilter}" or search query.</p>
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                            setStatusFilter("all");
                            setPriorityFilter("all");
                            setSearchQuery("");
                        }}
                    >
                        Reset All Filters
                    </button>
                </div>
            )}

            {/* Task Grid Cards */}
            <div className="tasks-grid" role="feed" aria-label="Task cards">
                {filteredTasks.map((task) => (
                    <TaskItem
                        key={task._id}
                        task={task}
                        onUpdate={onUpdate}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSubtaskToggle={onSubtaskToggle}
                        loading={loading}
                    />
                ))}
            </div>
        </section>
    );
}

export default React.memo(TaskList);
